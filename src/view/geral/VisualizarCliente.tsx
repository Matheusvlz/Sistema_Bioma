import React, { useState, useEffect, useCallback } from 'react';
import { SearchLayout } from '../../components/SearchLayout';
import { core } from "@tauri-apps/api";
import { FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaEdit, FaChevronLeft, FaChevronRight, FaFileAlt } from 'react-icons/fa';
import styles from './css/VisualizarCliente.module.css';
import { WindowManager } from '../../hooks/WindowManager';

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

interface Categoria {
  id: number;
  nome: string;
}

interface Consultor {
  id: number;
  nome: string;
  documento?: string;
  telefone?: string;
  email?: string;
  ativo: boolean;
}

interface CategoriaResponse {
  success: boolean;
  data?: Categoria[];
  message?: string;
}

interface ConsultorResponse {
  success: boolean;
  data?: Consultor[];
  message?: string;
}

export const VisualizarClientes: React.FC = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [consultores, setConsultores] = useState<Consultor[]>([]);
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
    {
      name: 'categoria',
      label: 'Categoria',
      type: 'select' as const,
      options: categorias.map(cat => ({ value: cat.id.toString(), label: cat.nome }))
    },
    {
      name: 'consultor',
      label: 'Consultor',
      type: 'select' as const,
      options: consultores.map(cons => ({ value: cons.id.toString(), label: cons.nome }))
    }
  ];

  // Configuração do dropdown de busca
  const dropdownSearchConfig = {
    enabled: true,
    placeholder: "Buscar por fantasia, razão social ou documento...",
    onSearch: buscarClientesDropdown,
    onSelect: handleClienteSelect
  };

  // Carregar clientes iniciais
  useEffect(() => {
    buscarClientes({}, 1);
    carregarCategorias();
    carregarConsultores();
  }, []);

  const carregarCategorias = async () => {
    try {
      const response: CategoriaResponse = await core.invoke('buscar_categorias');
      if (response.success && response.data) {
        setCategorias(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const carregarConsultores = async () => {
    try {
      const response: ConsultorResponse = await core.invoke('buscar_consultores');
      if (response.success && response.data) {
        setConsultores(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar consultores:', error);
    }
  };

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
  async function buscarClientesDropdown(query: string): Promise<Cliente[]> {
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
  }

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
  function handleClienteSelect(cliente: Cliente) {
    setClientes([cliente]);
    setPagination(prev => ({
      ...prev,
      currentPage: 1,
      totalPages: 1,
      totalItems: 1
    }));
    setCurrentFilters({});
  }

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

  const handleEdit = useCallback(async (cliente: Cliente) => {
    try {
      const clienteData = {
        id: cliente.id,
        origem: 'cliente_precadastro'
      };

      await WindowManager.openCadastroClientes(clienteData);
    } catch (error) {
      console.error('Erro ao abrir janela de cadastro:', error);
      localStorage.setItem('clientePreenchimento', JSON.stringify(cliente));
    }
  }, []);

  const handleView = (cliente: Cliente) => {
    console.log('Visualizar cliente:', cliente);
    // TODO: Implementar visualização detalhada
  };

  return (
    <div className={styles["visualizar-clientes-container"]}>
      <div className={styles["page-header"]}>
        <h1 className={styles["page-title"]}>Visualizar Clientes</h1>
        <div className={styles["page-stats"]}>
          {pagination.totalItems > 0 && (
            <span className={styles["stats-text"]}>
              {pagination.totalItems} cliente{pagination.totalItems !== 1 ? 's' : ''} encontrado{pagination.totalItems !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <SearchLayout
        fields={searchFields}
        onSearch={handleAdvancedSearch}
         onClear={() => { buscarClientes({}, 1) }}
        dropdownSearch={dropdownSearchConfig}
      />

      {loading ? (
        <div className={styles["loading-container"]}>
          <div className={styles["loading-spinner"]}></div>
          <span>Carregando clientes...</span>
        </div>
      ) : (
        <>
          {clientes.length > 0 ? (
            <>
              <div className={styles["clientes-grid"]}>
                {clientes.map((cliente) => (
                  <div key={cliente.id} className={styles["cliente-card"]}>
                    <div className={styles["card-header"]}>
                      <div className={styles["cliente-avatar"]}>
                        <FaUser />
                      </div>
                      <div className={styles["cliente-main-info"]}>
                        <h3 className={styles["cliente-name"]}>
                          {cliente.fantasia || cliente.razao || 'Nome não informado'}
                        </h3>
                        {cliente.documento && (
                          <span className={styles["cliente-document"]}>
                            {formatDocument(cliente.documento)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={styles["card-body"]}>
                      {cliente.telefone && (
                        <div className={styles["info-item"]}>
                          <FaPhone className={styles["info-icon"]} />
                          <span>{formatPhone(cliente.telefone)}</span>
                        </div>
                      )}

                      {cliente.email && (
                        <div className={styles["info-item"]}>
                          <FaEnvelope className={styles["info-icon"]} />
                          <span>{cliente.email}</span>
                        </div>
                      )}

                      {(cliente.cidade || cliente.uf) && (
                        <div className={styles["info-item"]}>
                          <FaMapMarkerAlt className={styles["info-icon"]} />
                          <span>
                            {cliente.cidade && cliente.uf
                              ? `${cliente.cidade} / ${cliente.uf}`
                              : cliente.cidade || cliente.uf
                            }
                          </span>
                        </div>
                      )}

                      {cliente.categoria && (
                        <div className={styles["info-item"]}>
                          <span className={styles["info-label"]}>Categoria:</span>
                          <span>{cliente.categoria}</span>
                        </div>
                      )}

                      {cliente.consultor && (
                        <div className={styles["info-item"]}>
                          <span className={styles["info-label"]}>Consultor:</span>
                          <span>{cliente.consultor}</span>
                        </div>
                      )}
                    </div>

                    <div className={styles["card-actions"]}>
                      <button
                        className={styles["action-button"] + ' ' + styles["view"]}
                        onClick={() => handleView(cliente)}
                        title="Visualizar detalhes"
                      >
                        <FaFileAlt />
                        Relatório
                      </button>
                      <button
                        className={styles["action-button"] + ' ' + styles["edit"]}
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
                <div className={styles["pagination-container"]}>
                  <div className={styles["pagination"]}>
                    <button
                      className={styles["pagination-button"]}
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                    >
                      <FaChevronLeft />
                      Anterior
                    </button>

                    <div className={styles["pagination-info"]}>
                      <div className={styles["page-group"]}>
                        <span>Página</span>
                        <input
                          type="text"
                          className={styles["page-input"]}
                          defaultValue={pagination.currentPage}
                          min="1"
                          max={pagination.totalPages}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const page = Number(e.currentTarget.value);
                              if (page >= 1 && page <= pagination.totalPages) {
                                handlePageChange(page);
                              }
                            }
                          }}
                          onBlur={(e) => {
                            const page = Number(e.target.value);
                            if (page >= 1 && page <= pagination.totalPages) {
                              handlePageChange(page);
                            } else {
                              e.target.value = pagination.currentPage.toString();
                            }
                          }}
                          onFocus={(e) => e.target.select()}
                        />
                        <span> de {pagination.totalPages}</span>
                      </div>

                      <div className={styles["items-info"]}>
                        ({pagination.itemsPerPage} itens por página)
                      </div>
                    </div>


                    <button
                      className={styles["pagination-button"]}
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
            <div className={styles["empty-state"]}>
              <FaUser className={styles["empty-icon"]} />
              <h3>Nenhum cliente encontrado</h3>
              <p>Tente ajustar os filtros de busca ou verifique se há clientes cadastrados.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};