import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaTimes, FaToggleOn, FaToggleOff, FaChevronDown } from 'react-icons/fa';
import './css/SearchLayout.css';

interface Cliente {
  id: number;
  fantasia?: string;
  razao?: string;
  documento?: string;
  cidade?: string;
  uf?: string;
  categoria?: string;
  consultor?: string;
}

interface SearchField {
  name: string;
  label: string;
  type: 'text' | 'select';
  options?: { value: string; label: string }[];
}

interface DropdownSearchConfig {
  enabled: boolean;
  placeholder?: string;
  onSearch?: (query: string) => Promise<Cliente[]>;
  onSelect?: (cliente: Cliente) => void;
}

interface SearchLayoutProps {
  fields?: SearchField[];
  onSearch?: (filters: Record<string, string>) => void;
  dropdownSearch?: DropdownSearchConfig;
}

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

export const SearchLayout: React.FC<SearchLayoutProps> = ({
  fields = [],
  onSearch,
  dropdownSearch = { enabled: false }
}) => {
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [mainSearchQuery, setMainSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Cliente[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const searchRef = useRef<HTMLDivElement>(null);
  const shouldShowToggle = dropdownSearch.enabled && fields.length > 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMainSearchChange = async (value: string) => {
    setMainSearchQuery(value);

    if (value.trim().length >= 2 && dropdownSearch.onSearch) {
      setIsSearching(true);
      try {
        const results = await dropdownSearch.onSearch(value);
        setSearchResults(results);
        setShowDropdown(results.length > 0);
      } catch (error) {
        console.error('Erro na busca:', error);
        setSearchResults([]);
        setShowDropdown(false);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  const handleClienteSelect = (cliente: Cliente) => {
    setMainSearchQuery(cliente.fantasia || cliente.razao || '');
    setShowDropdown(false);
    if (dropdownSearch.onSelect) {
      dropdownSearch.onSelect(cliente);
    }
  };

  const toggleAdvancedMode = () => {
    setIsAdvancedMode(!isAdvancedMode);
    if (!isAdvancedMode) {
      setMainSearchQuery('');
      setShowDropdown(false);
    } else {
      setFilters({});
    }
  };

  const handleFilterChange = (fieldName: string, value: string) => {
    setFilters(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleAdvancedSearch = () => {
    if (onSearch) onSearch(filters);
  };

  const handleClearFilters = () => {
    setFilters({});
    setMainSearchQuery('');
    setShowDropdown(false);
  };

  const formatDocument = (doc: string) => {
    if (!doc) return '';
    const numbers = doc.replace(/\D/g, '');
    if (numbers.length === 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (numbers.length === 14) {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return doc;
  };

  if (!dropdownSearch.enabled && fields.length === 0) {
    return null;
  }

  return (
    <div className="search-layout">
      {shouldShowToggle && (
        <div className="search-header">
          <div className="search-toggle">
            <button className="toggle-button" onClick={toggleAdvancedMode} title={isAdvancedMode ? "Busca simples" : "Busca avançada"}>
              {isAdvancedMode ? <FaToggleOn /> : <FaToggleOff />}
              <span>{isAdvancedMode ? "Busca Avançada" : "Busca Simples"}</span>
            </button>
          </div>
        </div>
      )}

      {dropdownSearch.enabled && (!shouldShowToggle || !isAdvancedMode) && (
        <div className="main-search-container" ref={searchRef}>
          <div className="search-input-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              className="main-search-input"
              placeholder={dropdownSearch.placeholder || "Buscar..."}
              value={mainSearchQuery}
              onChange={(e) => handleMainSearchChange(e.target.value)}
              onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
            />
            {mainSearchQuery && (
              <button className="clear-button" onClick={handleClearFilters} title="Limpar busca">
                <FaTimes />
              </button>
            )}
          </div>

          {showDropdown && (
            <div className="search-dropdown">
              {isSearching ? (
                <div className="dropdown-item loading">
                  <span>Buscando...</span>
                </div>
              ) : (
                searchResults.map((cliente) => (
                  <div key={cliente.id} className="dropdown-item" onClick={() => handleClienteSelect(cliente)}>
                    <div className="cliente-info">
                      <div className="cliente-name">
                        {cliente.fantasia || cliente.razao || 'Nome não informado'}
                      </div>
                      <div className="cliente-details">
                        {cliente.documento && (
                          <span className="documento">{formatDocument(cliente.documento)}</span>
                        )}
                        {cliente.cidade && cliente.uf && (
                          <span className="location">{cliente.cidade} / {cliente.uf}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {fields.length > 0 && (!shouldShowToggle || isAdvancedMode) && (
        <div className="advanced-search-container">
          <div className="search-fields-grid">
            {fields.map((field) => (
              <div key={field.name} className="search-field">
                <label htmlFor={field.name} className="field-label">{field.label}</label>
                {field.type === 'select' ? (
                  <CustomSelect
                    id={field.name}
                    value={filters[field.name] || ''}
                    onChange={(value) => handleFilterChange(field.name, value)}
                    options={field.options || []}
                    placeholder="Selecione..."
                  />
                ) : (
                  <input
                    id={field.name}
                    type="text"
                    className="field-input"
                    placeholder={`Digite ${field.label.toLowerCase()}...`}
                    value={filters[field.name] || ''}
                    onChange={(e) => handleFilterChange(field.name, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="search-actions">
            <button className="search-button primary" onClick={handleAdvancedSearch}>
              <FaSearch />
              Buscar
            </button>
            <button className="search-button secondary" onClick={handleClearFilters}>
              <FaTimes />
              Limpar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};