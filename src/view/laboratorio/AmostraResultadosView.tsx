import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Loader,
  AlertCircle,
  ChevronRight,
  FlaskConical,
  RefreshCw,
  Building,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  FileText,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import styles from './styles/AmostraNaoIniciada.module.css';

interface ParametroItem {
  id: number;
  nome_parametro: string;
  grupo_parametro: string;
  tecnica_nome: string;
  unidade: string;
  limite: string;
  resultado: string;
  data_inicio?: string;
  hora_inicio?: string;
  data_termino?: string;
  hora_termino?: string;
  analista?: string;
}

interface AmostraResultado {
  id_amostra: number;
  numero: string;
  identificacao: string;
  complemento: string;
  data_coleta: string;
  hora_coleta: string;
  data_entrada_lab: string;
  hora_entrada_lab: string;
  data_inicio_analise: string;
  parametros: ParametroItem[];
  status?: string; // 'em_andamento', 'finalizado', 'revisao'
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const AmostraResultadosView: React.FC = () => {
  const [amostras, setAmostras] = useState<AmostraResultado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredAmostras, setFilteredAmostras] = useState<AmostraResultado[]>([]);
  const [selectedAmostra, setSelectedAmostra] = useState<AmostraResultado | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  // Carregar amostras iniciadas
  const carregarAmostras = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("🔍 Carregando amostras iniciadas...");
      const response = await invoke("buscar_amostras_iniciadas") as ApiResponse<AmostraResultado[]>;
      
      console.log("✅ Resposta recebida:", response);

      if (response.success && response.data) {
        setAmostras(response.data);
        setFilteredAmostras(response.data);
      } else {
        setError(response.message || "Erro ao carregar amostras");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao conectar com o backend");
      console.error("Erro:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filtrar amostras por termo de busca e status
  useEffect(() => {
    let filtered = amostras;

    // Filtrar por status
    if (statusFilter !== "todos") {
      filtered = filtered.filter(a => a.status === statusFilter);
    }

    // Filtrar por termo de busca
    if (searchTerm.trim()) {
      const termo = searchTerm.toLowerCase();
      filtered = filtered.filter((amostra) => {
        const numero = amostra.numero?.toLowerCase() || "";
        const identificacao = amostra.identificacao?.toLowerCase() || "";

        return numero.includes(termo) || identificacao.includes(termo);
      });
    }

    setFilteredAmostras(filtered);
  }, [searchTerm, amostras, statusFilter]);

  // Carregar amostras ao montar o componente
  useEffect(() => {
    carregarAmostras();
  }, [carregarAmostras]);

  // Listener para evento de amostra iniciada com sucesso
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      try {
        unlisten = await listen('amostra-iniciada-sucesso', (event: any) => {
          console.log("✅ Amostra iniciada com sucesso:", event.payload);
          // Recarregar a lista de amostras
          carregarAmostras();
        });
      } catch (error) {
        console.error('Erro ao configurar listener:', error);
      }
    };

    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [carregarAmostras]);

  const toggleGrupo = (grupo: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [grupo]: !prev[grupo]
    }));
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'em_andamento':
        return (
          <span className={`${styles.statusBadge} ${styles.statusEmAndamento}`}>
            <Clock size={14} />
            Em Andamento
          </span>
        );
      case 'finalizado':
        return (
          <span className={`${styles.statusBadge} ${styles.statusFinalizado}`}>
            <CheckCircle size={14} />
            Finalizado
          </span>
        );
      case 'revisao':
        return (
          <span className={`${styles.statusBadge} ${styles.statusRevisao}`}>
            <AlertTriangle size={14} />
            Em Revisão
          </span>
        );
      default:
        return (
          <span className={`${styles.statusBadge} ${styles.statusPadrao}`}>
            Pendente
          </span>
        );
    }
  };

  const parametrosPorGrupo = selectedAmostra?.parametros.reduce((acc, param) => {
    if (!acc[param.grupo_parametro]) {
      acc[param.grupo_parametro] = [];
    }
    acc[param.grupo_parametro].push(param);
    return acc;
  }, {} as Record<string, ParametroItem[]>) || {};

  if (selectedAmostra) {
    return (
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerLeft}>
              <div className={styles.iconContainer}>
                <FlaskConical className={styles.headerIcon} />
              </div>
              <div>
                <h1 className={styles.title}>Resultados da Análise</h1>
                <p className={styles.subtitle}>
                  Amostra #{selectedAmostra.numero} - {selectedAmostra.identificacao}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedAmostra(null)}
              className={styles.closeButton}
              aria-label="Voltar"
              title="Voltar para lista"
            >
              <ChevronRight size={24} style={{ transform: 'rotate(180deg)' }} />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className={styles.content}>
          {/* Card de Informações Gerais */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardHeader}>
              <h3 className={styles.infoCardTitle}>
                <FileText size={20} className={styles.titleIcon} />
                Informações da Amostra
              </h3>
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>Número</label>
                <p className={styles.infoValue}>#{selectedAmostra.numero}</p>
              </div>

              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>Identificação</label>
                <p className={styles.infoValue}>{selectedAmostra.identificacao}</p>
              </div>

              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>Data da Coleta</label>
                <div className={styles.infoValueWithIcon}>
                  <Calendar size={18} className={styles.infoIcon} />
                  <p className={styles.infoValue}>{selectedAmostra.data_coleta}</p>
                </div>
              </div>

              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>Hora da Coleta</label>
                <div className={styles.infoValueWithIcon}>
                  <Clock size={18} className={styles.infoIcon} />
                  <p className={styles.infoValue}>{selectedAmostra.hora_coleta}</p>
                </div>
              </div>

              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>Data Entrada Lab</label>
                <div className={styles.infoValueWithIcon}>
                  <Calendar size={18} className={`${styles.infoIcon} ${styles.iconGreen}`} />
                  <p className={styles.infoValue}>{selectedAmostra.data_entrada_lab}</p>
                </div>
              </div>

              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>Hora Entrada Lab</label>
                <div className={styles.infoValueWithIcon}>
                  <Clock size={18} className={`${styles.infoIcon} ${styles.iconGreen}`} />
                  <p className={styles.infoValue}>{selectedAmostra.hora_entrada_lab}</p>
                </div>
              </div>

              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>Início da Análise</label>
                <div className={styles.infoValueWithIcon}>
                  <Clock size={18} className={`${styles.infoIcon} ${styles.iconBlue}`} />
                  <p className={styles.infoValue}>{selectedAmostra.data_inicio_analise}</p>
                </div>
              </div>
            </div>

            {selectedAmostra.complemento && (
              <div className={styles.complementoBox}>
                <strong>Complemento:</strong> {selectedAmostra.complemento}
              </div>
            )}
          </div>

          {/* Card Parâmetros e Resultados */}
          <div className={styles.parametrosCard}>
            <div className={styles.parametrosHeader}>
              <h3 className={styles.parametrosTitle}>
                Parâmetros e Resultados ({selectedAmostra.parametros?.length || 0})
              </h3>
            </div>

            {selectedAmostra.parametros && selectedAmostra.parametros.length > 0 ? (
              <div className={styles.gruposContainer}>
                {Object.entries(parametrosPorGrupo).map(([grupo, params]) => (
                  <div key={grupo} className={styles.grupoItem}>
                    <button
                      onClick={() => toggleGrupo(grupo)}
                      className={styles.grupoHeader}
                    >
                      <ChevronDown
                        size={20}
                        className={`${styles.chevron} ${
                          expandedGroups[grupo] ? styles.expanded : ""
                        }`}
                      />
                      <span className={styles.grupoNome}>{grupo}</span>
                      <span className={styles.grupoCount}>({params.length})</span>
                    </button>

                    {expandedGroups[grupo] && (
                      <div className={styles.parametrosTable}>
                        <div className={styles.tableHeader}>
                          <div className={styles.tableCell}>Parâmetro</div>
                          <div className={styles.tableCell}>Técnica</div>
                          <div className={styles.tableCell}>Unidade</div>
                          <div className={styles.tableCell}>Limite</div>
                          <div className={styles.tableCell}>Resultado</div>
                          <div className={styles.tableCell}>Analista</div>
                        </div>

                        {params.map((param, idx) => (
                          <div key={idx} className={styles.tableRow}>
                            <div className={styles.tableCell}>
                              <strong>{param.nome_parametro}</strong>
                            </div>
                            <div className={styles.tableCell}>{param.tecnica_nome}</div>
                            <div className={styles.tableCell}>{param.unidade}</div>
                            <div className={styles.tableCell}>{param.limite}</div>
                            <div className={`${styles.tableCell} ${styles.resultadoCell}`}>
                              <strong>{param.resultado || "Pendente"}</strong>
                            </div>
                            <div className={styles.tableCell}>{param.analista || "-"}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                Nenhum parâmetro encontrado
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <div className={styles.iconContainer}>
              <FlaskConical className={styles.headerIcon} />
            </div>
            <div>
              <h1 className={styles.title}>Amostras Iniciadas</h1>
              <p className={styles.subtitle}>Acompanhe o progresso das análises</p>
            </div>
          </div>
          <button
            onClick={carregarAmostras}
            disabled={loading}
            className={styles.refreshButton}
            aria-label="Atualizar"
            title="Atualizar lista"
          >
            <RefreshCw size={20} className={loading ? styles.spinning : ""} />
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div className={styles.searchContainer}>
        <div className={styles.searchInputWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por número ou identificação..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterContainer}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="todos">Todos os Status</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="finalizado">Finalizado</option>
            <option value="revisao">Em Revisão</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {loading && (
          <div className={styles.loadingCenter}>
            <Loader className={styles.spinningLoader} size={32} />
            <span>Carregando amostras...</span>
          </div>
        )}

        {error && (
          <div className={styles.errorAlert}>
            <AlertCircle className={styles.errorIcon} size={20} />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && filteredAmostras.length === 0 && (
          <div className={styles.emptyState}>
            <FlaskConical size={48} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>Nenhuma amostra encontrada</h3>
            <p className={styles.emptyText}>
              {searchTerm ? "Tente ajustar sua busca" : "Não há amostras iniciadas no momento"}
            </p>
          </div>
        )}

        {!loading && !error && filteredAmostras.length > 0 && (
          <div className={styles.listContainer}>
            <div className={styles.listHeader}>
              <span className={styles.countBadge}>{filteredAmostras.length} amostra(s)</span>
            </div>

            <div className={styles.list}>
              {filteredAmostras.map((amostra) => (
                <div
                  key={amostra.id_amostra}
                  className={styles.listItem}
                  onClick={() => setSelectedAmostra(amostra)}
                >
                  <div className={styles.listItemContent}>
                    <div className={styles.listItemHeader}>
                      <h3 className={styles.listItemTitle}>
                        Amostra #{amostra.numero}
                      </h3>
                      {getStatusBadge(amostra.status)}
                    </div>

                    <p className={styles.listItemIdentificacao}>
                      {amostra.identificacao}
                    </p>

                    <div className={styles.listItemFooter}>
                      <div className={styles.clientInfo}>
                        <Calendar size={14} className={styles.clientIcon} />
                        <span className={styles.clientName}>
                          Iniciada em: {amostra.data_inicio_analise}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.listItemAction}>
                    <ChevronRight size={20} className={styles.actionIcon} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AmostraResultadosView;

