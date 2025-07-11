import React, { useState, useEffect, useRef } from 'react';
import { FaChevronDown } from 'react-icons/fa';

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  id: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options, placeholder, id }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="custom-select" ref={selectRef}>
      <div className={`select-trigger ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
        <span className={selectedOption ? 'selected' : 'placeholder'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <FaChevronDown className="select-arrow" />
      </div>
      {isOpen && (
        <div className="select-dropdown">
          <div className="select-option placeholder" onClick={() => { onChange(''); setIsOpen(false); }}>
            {placeholder}
          </div>
          {options.map(option => (
            <div
              key={option.value}
              className={`select-option ${value === option.value ? 'selected' : ''}`}
              onClick={() => { onChange(option.value); setIsOpen(false); }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Selects específicos para os seus dados
export const UFSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  id: string;
}> = ({ value, onChange, id }) => {
  const ESTADOS_BRASIL = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  const options = ESTADOS_BRASIL.map(estado => ({
    value: estado,
    label: estado
  }));

  return (
    <CustomSelect
      id={id}
      value={value}
      onChange={onChange}
      options={options}
      placeholder="Selecione..."
    />
  );
};

export const ConsultorSelect: React.FC<{
  value: number | null;
  onChange: (value: number | null) => void;
  consultores: Array<{
    id: number;
    nome: string;
    documento: string;
    ativo: boolean;
  }>;
  id: string;
}> = ({ value, onChange, consultores, id }) => {
  const options = consultores
    .filter(c => c.ativo)
    .map(consultor => ({
      value: consultor.id.toString(),
      label: `${consultor.nome} - ${consultor.documento}`
    }));

  return (
    <CustomSelect
      id={id}
      value={value?.toString() || ''}
      onChange={(val) => onChange(val ? Number(val) : null)}
      options={options}
      placeholder="Selecione um consultor..."
    />
  );
};

export default CustomSelect;