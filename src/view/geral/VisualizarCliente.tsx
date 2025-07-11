import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from '../../components/Layout';
import { SearchLayout } from '../../components/SearchLayout';
import { core } from "@tauri-apps/api";
import { FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaEdit, FaEye, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './css/VisualizarClientes.css';

interface Cliente {
  id: number;
  fantasia?: string;
  razao?: string;
  documento?: string;
  cidade?: string;
  uf?: string;
  categoria?: string;
  consultor?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
}

interface ClienteResponse {
  success: boolean;
  data?: Cliente[];
  message?: string;
  total?: number;
}

interface SearchFilters {
  fantasia?: string;
  razao?: string;
  cnpj?: string;
  cpf?: string;
  cidade?: string;
  uf?: string;
  categoria?: string;
  consultor?: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export const VisualizarClientes: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 30
  });
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({});

  // Campos disponíveis para busca avançada
  const searchFields = [
    { name: 'fantasia', label: 'Fantasia', type: 'text' as const },
    { name: 'razao', label: 'Razão Social', type: 'text' as const },
    { name: 'cnpj', label: 'CNPJ', type: 'text' as const },
    { name: 'cpf', label: 'CPF', type: 'text' as const },
    { name: 'cidade', label: 'Cidade', type: 'text' as const },
    { 
      name: 'uf', 
      label: 'UF', 
      type: 'select' as const,
      options: [
        { value: 'AC', label: 'Acre' },
        { value: 'AL', label: 'Alagoas' },
        { value: 'AP', label: 'Amapá' },
        { value: 'AM', label: 'Amazonas' },
        { value: 'BA', label: 'Bahia' },
        { value: 'CE', label: 'Ceará' },
        { value: 'DF', label: 'Distrito Federal' },
        { value: 'ES', label: 'Espírito Santo' },
        { value: 'GO', label: 'Goiás' },
        { value: 'MA', label: 'Maranhão' },
        { value: 'MT', label: 'Mato Grosso' },
        { value: 'MS', label: 'Mato Grosso do Sul' },
        { value: 'MG', label: 'Minas Gerais' },
        { value: 'PA', label: 'Pará' },
        { value: 'PB', label: 'Paraíba' },
        { value: 'PR', label: 'Paraná' },
        { value: 'PE', label: 'Pernambuco' },
        { value: 'PI', label: 'Piauí' },
        { value: 'RJ', label: 'Rio de Janeiro' },
        { value: 'RN', label: 'Rio Grande do Norte' },
        { value: 'RS', label: 'Rio Grande do Sul' },
        { value: 'RO', label: 'Rondônia' },
        { value: 'RR', label: 'Roraima' },
        { value: 'SC', label: 'Santa Catarina' },
        { value: 'SP', label: 'São Paulo' },
        { value: 'SE', label: 'Sergipe' },
        { value: 'TO', label: 'Tocantins' }
      ]
    },
    { name: 'categoria', label: 'Categoria', type: 'text' as const },
    { name: 'consultor', label: 'Consultor', type: 'text' as const }
  ];

  // Carregar clientes iniciais
  useEffect(() => {
    buscarClientes({}, 1);
  }, []);

  // Buscar clientes com filtros e paginação
  const buscarClientes = async (filters: SearchFilters, page: number = 1) => {
    setLoading(true);
    try {
      const response: ClienteResponse = await core.invoke('buscar_clientes_filtros', {
        filters,
        page,
        limit: pagination.itemsPerPage
      });

      if (response.success && response.data) {
        setClientes(response.data);
        setPagination(prev => ({
          ...prev,
          currentPage: page,
          totalItems: response.total || 0,
          totalPages: Math.ceil((response.total || 0) / prev.itemsPerPage)
        }));
        setCurrentFilters(filters);
      } else {
        console.error('Erro na busca:', response.message);
        setClientes([]);
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  // Busca principal para dropdown
  const buscarClientesDropdown = async (query: string): Promise<Cliente[]> => {
    try {
      const response: ClienteResponse = await core.invoke('buscar_clientes_dropdown', {
        query: query.trim()
      });

      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Erro na busca dropdown:', error);
      return [];
    }
  };

  // Manipular busca avançada
  const handleAdvancedSearch = useCallback((filters: Record<string, string>) => {
    const searchFilters: SearchFilters = {};
    
    Object.keys(filters).forEach(key => {
      if (filters[key]?.trim()) {
        searchFilters[key as keyof SearchFilters] = filters[key].trim();
      }
    });

    buscarClientes(searchFilters, 1);
  }, []);

  // Selecionar cliente do dropdown
  const handleClienteSelect = useCallback((cliente: Cliente) => {
    setClientes([cliente]);
    setPagination(prev => ({
      ...prev,
      currentPage: 1,
      totalPages: 1,
      totalItems: 1
    }));
    setCurrentFilters({});
  }, []);

  // Navegação de páginas
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      buscarClientes(currentFilters, newPage);
    }
  };

  // Formatar documento
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

  // Formatar telefone
  const formatPhone = (phone: string) => {
    if (!phone) return '';
    
    const numbers = phone.replace(/\D/g, '');
    
    if (numbers.length === 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (numbers.length === 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    
    return phone;
  };

  // Ações dos botões (placeholder)
  const handleEdit = (cliente: Cliente) => {
    console.log('Editar cliente:', cliente);
    // TODO: Implementar edição
  };

  const handleView = (cliente: Cliente) => {
    console.log('Visualizar cliente:', cliente);
    // TODO: Implementar visualização detalhada
  };

  return (

      <div className="visualizar-clientes-container">
        <div className="page-header">
          <h1 className="page-title">Visualizar Clientes</h1>
          <div className="page-stats">
            {pagination.totalItems > 0 && (
              <span className="stats-text">
                {pagination.totalItems} cliente{pagination.totalItems !== 1 ? 's' : ''} encontrado{pagination.totalItems !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <SearchLayout
          fields={searchFields}
          onSearch={handleAdvancedSearch}
          onClienteSelect={handleClienteSelect}
          onMainSearch={buscarClientesDropdown}
          placeholder="Buscar por fantasia, razão social ou documento..."
        />

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <span>Carregando clientes...</span>
          </div>
        ) : (
          <>
            {clientes.length > 0 ? (
              <>
                <div className="clientes-grid">
                  {clientes.map((cliente) => (
                    <div key={cliente.id} className="cliente-card">
                      <div className="card-header">
                        <div className="cliente-avatar">
                          <FaUser />
                        </div>
                        <div className="cliente-main-info">
                          <h3 className="cliente-name">
                            {cliente.fantasia || cliente.razao || 'Nome não informado'}
                          </h3>
                          {cliente.documento && (
                            <span className="cliente-document">
                              {formatDocument(cliente.documento)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="card-body">
                        {cliente.telefone && (
                          <div className="info-item">
                            <FaPhone className="info-icon" />
                            <span>{formatPhone(cliente.telefone)}</span>
                          </div>
                        )}
                        
                        {cliente.email && (
                          <div className="info-item">
                            <FaEnvelope className="info-icon" />
                            <span>{cliente.email}</span>
                          </div>
                        )}
                        
                        {(cliente.cidade || cliente.uf) && (
                          <div className="info-item">
                            <FaMapMarkerAlt className="info-icon" />
                            <span>
                              {cliente.cidade && cliente.uf 
                                ? `${cliente.cidade} / ${cliente.uf}`
                                : cliente.cidade || cliente.uf
                              }
                            </span>
                          </div>
                        )}

                        {cliente.categoria && (
                          <div className="info-item">
                            <span className="info-label">Categoria:</span>
                            <span>{cliente.categoria}</span>
                          </div>
                        )}

                        {cliente.consultor && (
                          <div className="info-item">
                            <span className="info-label">Consultor:</span>
                            <span>{cliente.consultor}</span>
                          </div>
                        )}
                      </div>

                      <div className="card-actions">
                        <button
                          className="action-button view"
                          onClick={() => handleView(cliente)}
                          title="Visualizar detalhes"
                        >
                          <FaEye />
                          Visualizar
                        </button>
                        <button
                          className="action-button edit"
                          onClick={() => handleEdit(cliente)}
                          title="Editar cliente"
                        >
                          <FaEdit />
                          Editar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {pagination.totalPages > 1 && (
                  <div className="pagination-container">
                    <div className="pagination">
                      <button
                        className="pagination-button"
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                      >
                        <FaChevronLeft />
                        Anterior
                      </button>

                      <div className="pagination-info">
                        <span className="page-numbers">
                          Página {pagination.currentPage} de {pagination.totalPages}
                        </span>
                        <span className="items-info">
                          ({pagination.itemsPerPage} itens por página)
                        </span>
                      </div>

                      <button
                        className="pagination-button"
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages}
                      >
                        Próxima
                        <FaChevronRight />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <FaUser className="empty-icon" />
                <h3>Nenhum cliente encontrado</h3>
                <p>Tente ajustar os filtros de busca ou verifique se há clientes cadastrados.</p>
              </div>
            )}
          </>
        )}
      </div>

  );
};

