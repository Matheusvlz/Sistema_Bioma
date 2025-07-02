import React, { useState, useEffect } from 'react';
import './css/CustomSelect.css'

export type OptionType = {
  id: number | string;
  label: string;
};

interface CustomSelectProps {
  options: OptionType[];
  onSelect: (selected: OptionType) => void;
  initialValue?: OptionType; 
  placeholder?: string;
  className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  onSelect,
  initialValue,
  placeholder = 'Selecione',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<OptionType | null>(initialValue || null);

  useEffect(() => {
    if (initialValue) {
      setSelectedOption(initialValue);
    } else if (options.length > 0) {
      setSelectedOption(options[0]);
    }
  }, [options, initialValue]);

  const toggleDropdown = () => setIsOpen(!isOpen);
  
  const handleSelect = (option: OptionType) => {
    setSelectedOption(option);
    setIsOpen(false);
    onSelect(option);
  };

  return (
    <div className={`relative w-full max-w-[400px] ${className}`}>
      <div 
        onClick={toggleDropdown}
        className="custom-select-header"
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <div className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 9L12 15L18 9" stroke="#166534" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      
      {isOpen && (
        <div className="custom-select-dropdown">
          {options.map((option) => (
            <div
              key={option.id}
              onClick={() => handleSelect(option)}
              className={`custom-select-option ${selectedOption?.id === option.id ? 'option-selected' : ''}`}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};