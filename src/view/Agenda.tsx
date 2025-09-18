import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, BarChart3, Target, ChevronLeft, ChevronRight, Plus, FileText } from 'lucide-react';
import styles from './css/Agenda.module.css';

// Interfaces e tipos
interface Collection {
  id: number;
  time: string;
  type: string;
  location: string;
  status: 'agendado' | 'concluido';
}

interface DayData {
  description: string;
  collections: Collection[];
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
}

interface CollectionsData {
  [key: string]: DayData;
}

type ActiveSection = 
  | 'calendar' 
  | 'cadastrar-agendamento' 
  | 'cadastrar-feriados' 
  | 'visualizar-agendamentos' 
  | 'cadastrar-cronograma' 
  | 'visualizar-cronograma' 
  | 'relatorios-marketing' 
  | 'relatorios-coletores';

export const Agenda: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeSection, setActiveSection] = useState<ActiveSection>('calendar');

  // Dados de exemplo para coletas
  const [collections] = useState<CollectionsData>({
    '2025-09-15': {
      description: 'Início da semana de coletas especiais',
      collections: [
        { id: 1, time: '08:00', type: 'Coleta Residencial', location: 'Bairro Centro', status: 'agendado' },
        { id: 2, time: '14:00', type: 'Coleta Comercial', location: 'Shopping Center', status: 'agendado' }
      ]
    },
    '2025-09-18': {
      description: 'Coletas de meio de semana',
      collections: [
        { id: 3, time: '09:00', type: 'Coleta Hospitalar', location: 'Hospital Municipal', status: 'concluido' },
        { id: 4, time: '15:30', type: 'Coleta Industrial', location: 'Distrito Industrial', status: 'agendado' }
      ]
    },
    '2025-09-20': {
      description: 'Coletas de fim de semana',
      collections: [
        { id: 5, time: '07:00', type: 'Coleta Especial', location: 'Evento Cultural', status: 'agendado' }
      ]
    }
  });

  const monthNames: string[] = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDays: string[] = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getDaysInMonth = (date: Date): CalendarDay[] => {
    const year: number = date.getFullYear();
    const month: number = date.getMonth();
    const firstDay: Date = new Date(year, month, 1);
    const lastDay: Date = new Date(year, month + 1, 0);
    const daysInMonth: number = lastDay.getDate();
    const startingDayOfWeek: number = firstDay.getDay();

    const days: CalendarDay[] = [];
    
    // Adicionar dias do mês anterior para completar a primeira semana
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Adicionar dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      days.push({ date: dayDate, isCurrentMonth: true });
    }
    
    // Adicionar dias do próximo mês para completar a última semana
    const remainingDays: number = 42 - days.length; // 6 semanas × 7 dias
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return days;
  };

  const formatDateKey = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const hasCollections = (date: Date): boolean => {
    const dateKey: string = formatDateKey(date);
    return !!(collections[dateKey] && collections[dateKey].collections.length > 0);
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const navigateMonth = (direction: number): void => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const handleDateClick = (date: Date): void => {
    if (hasCollections(date)) {
      setSelectedDate(date);
    }
  };

  const handleSectionChange = (section: ActiveSection): void => {
    setActiveSection(section);
  };

  const renderCalendar = (): JSX.Element => {
    const days: CalendarDay[] = getDaysInMonth(currentDate);

    return (
      <div className={styles["calendar-container"]}>
        {/* Header do calendário */}
        <div className={styles["calendar-header"]}>
          <button 
            onClick={() => navigateMonth(-1)}
            className={styles["nav-button"]}
            type="button"
            aria-label="Mês anterior"
          >
            <ChevronLeft className={styles["nav-icon"]} />
          </button>
          <h3 className={styles["calendar-title"]}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button 
            onClick={() => navigateMonth(1)}
            className={styles["nav-button"]}
            type="button"
            aria-label="Próximo mês"
          >
            <ChevronRight className={styles["nav-icon"]} />
          </button>
        </div>

        {/* Grid do calendário */}
        <div className={styles["calendar-body"]}>
          {/* Cabeçalho dos dias da semana */}
          <div className={styles["weekdays-grid"]}>
            {weekDays.map((day: string) => (
              <div key={day} className={styles["weekday-header"]}>
                {day}
              </div>
            ))}
          </div>

          {/* Grid dos dias */}
          <div className={styles["days-grid"]}>
            {days.map((day: CalendarDay, index: number) => {
              const hasCollectionsToday: boolean = hasCollections(day.date);
              const isTodayDate: boolean = isToday(day.date);
              
              const dayClasses: string[] = [styles["day-cell"]];
              
              if (!day.isCurrentMonth) {
                dayClasses.push(styles["day-other-month"]);
              } else if (hasCollectionsToday) {
                dayClasses.push(styles["day-with-collections"]);
              } else {
                dayClasses.push(styles["day-current-month"]);
              }
              
              if (isTodayDate) {
                dayClasses.push(styles["day-today"]);
              }
              
              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(day.date)}
                  className={dayClasses.join(' ')}
                  disabled={!day.isCurrentMonth}
                  type="button"
                  aria-label={`Dia ${day.date.getDate()}${hasCollectionsToday ? ' - com coletas' : ''}`}
                >
                  {day.date.getDate()}
                  {hasCollectionsToday && (
                    <div className={styles["collection-indicator"]} aria-hidden="true"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legenda */}
        <div className={styles["calendar-legend"]}>
          <div className={styles["legend-item"]}>
            <div className={styles["legend-color-collections"]} aria-hidden="true"></div>
            <span>Dias com coletas</span>
          </div>
          <div className={styles["legend-item"]}>
            <div className={styles["legend-color-today"]} aria-hidden="true"></div>
            <span>Hoje</span>
          </div>
        </div>
      </div>
    );
  };

  const renderDetails = (): JSX.Element => {
    if (!selectedDate || !collections[formatDateKey(selectedDate)]) {
      return (
        <div className={styles["details-container"]}>
          <h3 className={styles["details-title"]}>Detalhes do Dia</h3>
          <div className={styles["details-empty"]}>
            <Calendar className={styles["details-empty-icon"]} aria-hidden="true" />
            <p>Selecione um dia com coletas para ver os detalhes</p>
          </div>
        </div>
      );
    }

    const selectedDateData: DayData = collections[formatDateKey(selectedDate)];

    return (
      <div className={styles["details-container"]}>
        <h3 className={styles["details-title"]}>
          {selectedDate.toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}
        </h3>
        
        <p className={styles["details-description"]}>
          {selectedDateData.description}
        </p>

        <h4 className={styles["collections-subtitle"]}>Coletas agendadas:</h4>
        <div className={styles["collections-list"]}>
          {selectedDateData.collections.map((collection: Collection) => (
            <div key={collection.id} className={styles["collection-item"]}>
              <div className={styles["collection-info"]}>
                <div className={styles["collection-type"]}>{collection.type}</div>
                <div className={styles["collection-location"]}>{collection.location}</div>
              </div>
              <div className={styles["collection-time-status"]}>
                <div className={styles["collection-time"]}>{collection.time}</div>
                <div className={`${styles["collection-status"]} ${
                  collection.status === 'concluido' 
                    ? styles["status-completed"] 
                    : styles["status-scheduled"]
                }`}>
                  {collection.status === 'concluido' ? 'Concluído' : 'Agendado'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  interface OptionButtonProps {
    section: ActiveSection;
    icon: React.ComponentType<{ className?: string }>;
    text: string;
  }

  const OptionButton: React.FC<OptionButtonProps> = ({ section, icon: Icon, text }) => (
    <button 
      onClick={() => handleSectionChange(section)}
      className={styles["option-button"]}
      type="button"
    >
      <Icon className={styles["option-icon"]} />
      <span className={styles["option-text"]}>{text}</span>
    </button>
  );

  const renderBottomOptions = (): JSX.Element => (
    <div className={styles["options-grid"]}>
      <OptionButton 
        section="cadastrar-agendamento"
        icon={Plus}
        text="Cadastrar agendamento"
      />
      <OptionButton 
        section="cadastrar-feriados"
        icon={Calendar}
        text="Cadastrar feriados"
      />
      <OptionButton 
        section="visualizar-agendamentos"
        icon={FileText}
        text="Visualizar agendamentos"
      />
      <OptionButton 
        section="cadastrar-cronograma"
        icon={Clock}
        text="Cadastrar cronograma"
      />
      <OptionButton 
        section="visualizar-cronograma"
        icon={Clock}
        text="Visualizar cronograma"
      />
      <OptionButton 
        section="relatorios-marketing"
        icon={BarChart3}
        text="Relatórios Marketing"
      />
      <OptionButton 
        section="relatorios-coletores"
        icon={Users}
        text="Relatórios Coletores"
      />
    </div>
  );

  const getSectionTitle = (section: ActiveSection): string => {
    return section.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className={styles["app-container"]}>
      <div className={styles["app-content"]}>
        {/* Header */}
        <header className={styles["app-header"]}>
          <h1 className={styles["app-title"]}>Sistema de Agendamento</h1>
          <p className={styles["app-subtitle"]}>Gerencie coletas e cronogramas</p>
        </header>

        {/* Layout principal - Calendário e Detalhes lado a lado */}
        <main className={styles["main-layout"]}>
          <section className={styles["calendar-section"]}>
            {renderCalendar()}
          </section>
          <aside className={styles["details-section"]}>
            {renderDetails()}
          </aside>
        </main>

        {/* Opções na parte inferior */}
        <section className={styles["options-section"]}>
          <h2 className={styles["options-title"]}>Opções do Sistema</h2>
          {renderBottomOptions()}
        </section>

        {/* Seção ativa (quando não é calendário) */}
        {activeSection !== 'calendar' && (
          <section className={styles["active-section"]} role="dialog" aria-labelledby="active-section-title">
            <div className={styles["active-section-content"]}>
              <Target className={styles["active-section-icon"]} aria-hidden="true" />
              <h3 id="active-section-title" className={styles["active-section-title"]}>
                {getSectionTitle(activeSection)}
              </h3>
              <p className={styles["active-section-text"]}>Esta seção está em desenvolvimento.</p>
              <button 
                onClick={() => setActiveSection('calendar')}
                className={styles["back-button"]}
                type="button"
              >
                Voltar ao Calendário
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

