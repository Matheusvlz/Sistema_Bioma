import React, { useState, useRef, useEffect } from 'react';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import styles from './css/CustomDatePicker.module.css';
import { YearSelect } from './SelectGeral';

interface CustomDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  placeholder = "dd/mm/aaaa",
  disabled = false,
  className = "",
  id
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarPosition, setCalendarPosition] = useState<'bottom' | 'top'>('bottom');

  const containerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Converte valor ISO para formato brasileiro
  const formatDateToBR = (isoDate: string): string => {
    if (!isoDate) return '';
    const date = new Date(isoDate + 'T00:00:00');
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('pt-BR');
  };

  // Converte formato brasileiro para ISO
  const formatDateToISO = (brDate: string): string => {
    if (!brDate) return '';
    const parts = brDate.split('/');
    if (parts.length !== 3) return '';
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const year = parseInt(parts[2]);

    if (isValidDate(day, month, year)) {
      const date = new Date(year, month - 1, day);
      return date.toISOString().split('T')[0];
    }
    return '';
  };

  // Valida se a data é válida
  const isValidDate = (day: number, month: number, year: number): boolean => {
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
      return false;
    }

    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day;
  };

  // Aplica máscara de data
  const applyDateMask = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  };

  // Inicializa o valor de exibição
  useEffect(() => {
    if (value) {
      const formattedDate = formatDateToBR(value);
      setDisplayValue(formattedDate);

      const date = new Date(value + 'T00:00:00');
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        setCurrentMonth(date.getMonth());
        setCurrentYear(date.getFullYear());
      }
    } else {
      setDisplayValue('');
      setSelectedDate(null);
    }
  }, [value]);

  // Calcula posição do calendário
  const calculateCalendarPosition = () => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const calendarHeight = 350; // altura aproximada do calendário

    if (rect.bottom + calendarHeight > windowHeight && rect.top > calendarHeight) {
      setCalendarPosition('top');
    } else {
      setCalendarPosition('bottom');
    }
  };

  // Fecha calendário ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      calculateCalendarPosition();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const maskedValue = applyDateMask(e.target.value);
    setDisplayValue(maskedValue);

    // Valida e converte para ISO se a data estiver completa
    if (maskedValue.length === 10) {
      const isoDate = formatDateToISO(maskedValue);
      if (isoDate) {
        onChange(isoDate);
        const date = new Date(isoDate + 'T00:00:00');
        setSelectedDate(date);
        setCurrentMonth(date.getMonth());
        setCurrentYear(date.getFullYear());
      }
    } else if (maskedValue === '') {
      onChange('');
      setSelectedDate(null);
    }
  };

  const handleInputBlur = () => {
    // Valida a data ao sair do campo
    if (displayValue && displayValue.length === 10) {
      const isoDate = formatDateToISO(displayValue);
      if (!isoDate) {
        // Data inválida, limpa o campo
        setDisplayValue('');
        onChange('');
        setSelectedDate(null);
      }
    }
  };

  const toggleCalendar = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    setSelectedDate(newDate);

    const isoDate = newDate.toISOString().split('T')[0];
    onChange(isoDate);
    setDisplayValue(formatDateToBR(isoDate));
    setIsOpen(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const handleYearChange = (year: number) => {
    setCurrentYear(year); // ou o que for necessário
  };


  const getDaysInMonth = (month: number, year: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number): number => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Dias vazios do início
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className={styles.calendarDay}></div>);
    }

    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = selectedDate &&
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === currentMonth &&
        selectedDate.getFullYear() === currentYear;

      const isToday = new Date().getDate() === day &&
        new Date().getMonth() === currentMonth &&
        new Date().getFullYear() === currentYear;

      days.push(
        <div
          key={day}
          className={`${styles.calendarDay} ${styles.calendarDayClickable} ${isSelected ? styles.calendarDaySelected : ''
            } ${isToday ? styles.calendarDayToday : ''}`}
          onClick={() => handleDateSelect(day)}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const yearOptions = [];
  for (let year = 1950; year <= 2050; year++) {
    yearOptions.push(
      <option key={year} value={year}>
        {year}
      </option>
    );
  }

  return (
    <div className={`${styles.datePickerContainer} ${className}`} ref={containerRef}>
      <div className={styles.inputContainer}>
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={styles.dateInput}
          maxLength={10}
        />
        <button
          type="button"
          className={styles.calendarIcon}
          onClick={toggleCalendar}
          disabled={disabled}
        >
          <FaCalendarAlt />
        </button>
      </div>

      {isOpen && (
        <div
          className={`${styles.calendarContainer} ${calendarPosition === 'top' ? styles.calendarTop : styles.calendarBottom
            }`}
          ref={calendarRef}
        >
          <div className={styles.calendarHeader}>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => navigateMonth('prev')}
            >
              <FaChevronLeft />
            </button>

            <div className={styles.monthYearContainer}>
              <span className={styles.monthName}>{monthNames[currentMonth]}</span>
              <YearSelect
                id="year-select"
                value={String(currentYear)}
                onChange={(value) => handleYearChange(Number(value))}
              />
            </div>

            <button
              type="button"
              className={styles.navButton}
              onClick={() => navigateMonth('next')}
            >
              <FaChevronRight />
            </button>
          </div>

          <div className={styles.calendarWeekdays}>
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className={styles.weekday}>
                {day}
              </div>
            ))}
          </div>

          <div className={styles.calendarGrid}>
            {renderCalendar()}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;

