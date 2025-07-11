import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaTimes, FaToggleOn, FaToggleOff } from 'react-icons/fa';
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

interface SearchLayoutProps {
  fields?: SearchField[];
  onSearch: (filters: Record<string, string>) => void;
  onClienteSelect?: (cliente: Cliente) => void;
  onMainSearch?: (query: string) => Promise<Cliente[]>;
  placeholder?: string;
}

export const SearchLayout: React.FC<SearchLayoutProps> = ({
  fields = [],
  onSearch,
  onClienteSelect,
  onMainSearch,
  placeholder = "Buscar por fantasia, razão ou documento..."
}) => {
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [mainSearchQuery, setMainSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Cliente[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Busca principal com dropdown
  const handleMainSearchChange = async (value: string) => {
    setMainSearchQuery(value);
    
    if (value.trim().length >= 2 && onMainSearch) {
      setIsSearching(true);
      try {
        const results = await onMainSearch(value);
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

  // Selecionar cliente do dropdown
  const handleClienteSelect = (cliente: Cliente) => {
    setMainSearchQuery(cliente.fantasia || cliente.razao || '');
    setShowDropdown(false);
    if (onClienteSelect) {
      onClienteSelect(cliente);
    }
  };

  // Alternar modo avançado
  const toggleAdvancedMode = () => {
    setIsAdvancedMode(!isAdvancedMode);
    if (!isAdvancedMode) {
      setMainSearchQuery('');
      setShowDropdown(false);
    } else {
      setFilters({});
    }
  };

  // Atualizar filtros
  const handleFilterChange = (fieldName: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // Executar busca avançada
  const handleAdvancedSearch = () => {
    onSearch(filters);
  };

  // Limpar filtros
  const handleClearFilters = () => {
    if (isAdvancedMode) {
      setFilters({});
    } else {
      setMainSearchQuery('');
      setShowDropdown(false);
    }
  };

  // Formatar documento para exibição
  const formatDocument = (doc: string) => {
    if (!doc) return '';
    
    // Remove caracteres não numéricos
    const numbers = doc.replace(/\D/g, '');
    
    if (numbers.length === 11) {
      // CPF: 000.000.000-00
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (numbers.length === 14) {
      // CNPJ: 00.000.000/0000-00
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    return doc;
  };

  return (
    <div className="search-layout">
      <div className="search-header">
        <div className="search-toggle">
          <button
            className="toggle-button"
            onClick={toggleAdvancedMode}
            title={isAdvancedMode ? "Busca simples" : "Busca avançada"}
          >
            {isAdvancedMode ? <FaToggleOn /> : <FaToggleOff />}
            <span>{isAdvancedMode ? "Busca Avançada" : "Busca Simples"}</span>
          </button>
        </div>
      </div>

      {!isAdvancedMode ? (
        // Busca principal com dropdown
        <div className="main-search-container" ref={searchRef}>
          <div className="search-input-wrapper">
            <FaSearch className="search-icon" />
            <input
              ref={inputRef}
              type="text"
              className="main-search-input"
              placeholder={placeholder}
              value={mainSearchQuery}
              onChange={(e) => handleMainSearchChange(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) {
                  setShowDropdown(true);
                }
              }}
            />
            {mainSearchQuery && (
              <button
                className="clear-button"
                onClick={handleClearFilters}
                title="Limpar busca"
              >
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
                  <div
                    key={cliente.id}
                    className="dropdown-item"
                    onClick={() => handleClienteSelect(cliente)}
                  >
                    <div className="cliente-info">
                      <div className="cliente-name">
                        {cliente.fantasia || cliente.razao || 'Nome não informado'}
                      </div>
                      <div className="cliente-details">
                        {cliente.documento && (
                          <span className="documento">
                            {formatDocument(cliente.documento)}
                          </span>
                        )}
                        {cliente.cidade && cliente.uf && (
                          <span className="location">
                            {cliente.cidade} / {cliente.uf}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        // Busca avançada com múltiplos campos
        <div className="advanced-search-container">
          <div className="search-fields-grid">
            {fields.map((field) => (
              <div key={field.name} className="search-field">
                <label htmlFor={field.name} className="field-label">
                  {field.label}
                </label>
                {field.type === 'select' ? (
                  <select
                    id={field.name}
                    className="field-input"
                    value={filters[field.name] || ''}
                    onChange={(e) => handleFilterChange(field.name, e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
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
            <button
              className="search-button primary"
              onClick={handleAdvancedSearch}
            >
              <FaSearch />
              Buscar
            </button>
            <button
              className="search-button secondary"
              onClick={handleClearFilters}
            >
              <FaTimes />
              Limpar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

