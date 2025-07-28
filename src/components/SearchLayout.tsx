import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaTimes, FaToggleOn, FaToggleOff, FaChevronDown } from 'react-icons/fa';
import styles from './css/SearchLayout.module.css';

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

interface SearchLayoutProps {
  fields?: SearchField[];
  onSearch?: (filters: Record<string, string>) => void;
  onClear?: () => void;
  dropdownSearch?: DropdownSearchConfig;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  id: string;
}

interface Usuario {
  id: number;
  nome: string;
  usuario: string;
}

// Modifique a interface DropdownSearchConfig para aceitar ambos os tipos:
interface DropdownSearchConfig {
  enabled: boolean;
  placeholder?: string;
  type?: 'cliente' | 'usuario'; // Novo campo para definir o tipo
  onSearch?: (query: string) => Promise<Cliente[] | Usuario[]>;
  onSelect?: (item: Cliente | Usuario) => void;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options, placeholder }) => {
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
    <div className={styles["custom-select"]} ref={selectRef}>
      <div className={`${styles["select-trigger"]} ${isOpen ? `${styles["open"]}` : ''}`} onClick={() => setIsOpen(!isOpen)}>
        <span className={selectedOption ? `${styles["selected"]}` : `${styles["placeholder"]}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <FaChevronDown className={styles["select-arrow"]} />
      </div>
      {isOpen && (
        <div className={styles["select-dropdown"]}>
          <div className={`${styles["select-option"]} ${styles["placeholder"]}`} onClick={() => { onChange(''); setIsOpen(false); }}>
            {placeholder}
          </div>
          {options.map(option => (
            <div
              key={option.value}
              className={`${styles["select-option"]} ${value === option.value ? `${styles["selected"]}` : ''}`}
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
  onClear,
  dropdownSearch = { enabled: false }
}) => {
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [mainSearchQuery, setMainSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(Cliente | Usuario)[]>([]);
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

  const handleItemSelect = (item: Cliente | Usuario) => {
  let displayName = '';
  
  if (dropdownSearch.type === 'usuario') {
    displayName = (item as Usuario).nome || (item as Usuario).usuario || '';
  } else {
    displayName = (item as Cliente).fantasia || (item as Cliente).razao || '';
  }
  
  setMainSearchQuery(displayName);
  setShowDropdown(false);
  if (dropdownSearch.onSelect) {
    dropdownSearch.onSelect(item);
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
    setSearchResults([]);
    if (onClear) {
      onClear();
    }
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
    <div className={styles["search-layout"]}>
      {shouldShowToggle && (
        <div className={styles["search-header"]}>
          <div className="search-toggle">
            <button className={styles["toggle-button"]} onClick={toggleAdvancedMode} title={isAdvancedMode ? "Busca simples" : "Busca avançada"}>
              {isAdvancedMode ? <FaToggleOn /> : <FaToggleOff />}
              <span>{isAdvancedMode ? "Busca Avançada" : "Busca Simples"}</span>
            </button>
          </div>
        </div>
      )}

      {dropdownSearch.enabled && (!shouldShowToggle || !isAdvancedMode) && (
        <div className={styles["main-search-container"]} ref={searchRef}>
          <div className={styles["search-input-wrapper"]}>
            <FaSearch className={styles["search-icon"]} />
            <input
              type="text"
              className={styles["main-search-input"]}
              placeholder={dropdownSearch.placeholder || "Buscar..."}
              value={mainSearchQuery}
              onChange={(e) => handleMainSearchChange(e.target.value)}
              onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
              autoComplete="off"
            />
            {mainSearchQuery && (
              <button className={styles["clear-button"]} onClick={handleClearFilters} title="Limpar busca">
                <FaTimes />
              </button>
            )}
          </div>

          {showDropdown && (
            <div className={styles["search-dropdown"]}>
              {isSearching ? (
                <div className={`${styles["dropdown-item"]} ${styles["loading"]}`}>
                  <span>Buscando...</span>
                </div>
              ) : (
                searchResults.map((item) => (
                  <div key={item.id} className={styles["dropdown-item"]} onClick={() => handleItemSelect(item)}>
                    <div className={styles["cliente-info"]}>
                      <div className={styles["cliente-name"]}>
                        {dropdownSearch.type === 'usuario' 
                          ? (item as Usuario).nome || (item as Usuario).usuario || 'Nome não informado'
                          : (item as Cliente).fantasia || (item as Cliente).razao || 'Nome não informado'
                        }
                      </div>
                      {dropdownSearch.type === 'cliente' && (
                        <div className={styles["cliente-details"]}>
                          {(item as Cliente).documento && (
                            <span className={styles["documento"]}>{formatDocument((item as Cliente).documento!)}</span>
                          )}
                          {(item as Cliente).cidade && (item as Cliente).uf && (
                            <span className={styles["location"]}>{(item as Cliente).cidade} / {(item as Cliente).uf}</span>
                          )}
                        </div>
                      )}
                      {dropdownSearch.type === 'usuario' && (
                        <div className={styles["cliente-details"]}>
                          <span className={styles["documento"]}>{(item as Usuario).usuario}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {fields.length > 0 && (!shouldShowToggle || isAdvancedMode) && (
        <div className={styles["advanced-search-container"]}>
          <div className={styles["search-fields-grid"]}>
            {fields.map((field) => (
              <div key={field.name} className={styles["search-field"]}>
                <label htmlFor={field.name} className={styles["field-label"]}>{field.label}</label>
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
                    className={styles["field-input"]}
                    placeholder={`Digite ${field.label.toLowerCase()}...`}
                    value={filters[field.name] || ''}
                    onChange={(e) => handleFilterChange(field.name, e.target.value)}
                    autoComplete="off"
                  />
                )}
              </div>
            ))}
          </div>

          <div className={styles["search-actions"]}>
            <button className={`${styles["search-button"]} ${styles["primary"]}`} onClick={handleAdvancedSearch}>
              <FaSearch />
              Buscar
            </button>
            <button className={`${styles["search-button"]} ${styles["secondary"]}`} onClick={handleClearFilters}>
              <FaTimes />
              Limpar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};