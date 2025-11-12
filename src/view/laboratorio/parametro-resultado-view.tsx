// parametro-resultado-view.tsx - VERSÃO COMPLETA ATUALIZADA
import React, { useState, useEffect, useCallback, CSSProperties } from "react";
import {
  X,
  FlaskConical,
  AlertCircle,
  Loader,
  Save,
  CheckCircle,
  Beaker,
  Eye,
  EyeOff,
  Plus,
  Copy,
  ChevronDown,
  Edit,
  Filter,
  PaintRoller,
  Send,
  History
  
} from "lucide-react";
import { listen, emit } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import AdicionarAmostraModal from './AdicionarAmostraModal'; 

// ==============================================
//           NOVAS INTERFACES
// ==============================================

interface AmostraItem {
  id: number;
  numero?: string;
  identificacao?: string;
  fantasia?: string;
  razao?: string;
}

interface WindowData {
  idAnalise: number;
  idUsuario: number;
  arrayAmostras: AmostraItem[];
  focusResultadoId?: number;
}

interface ResultadoItem {
  id: number;
  id_analise: number;
  nome_parametro: string;
  grupo_parametro: string;
  tecnica_nome: string;
  unidade: string;
  limite: string;
  resultado: string | null;
  data_inicio: string | null;
  hora_inicio: string | null;
  data_termino: string | null;
  hora_termino: string | null;
  analista: string | null;
  em_campo: boolean;
  terceirizado: boolean;
  id_legislacao: number;
  id_parametro: number;
  id_legislacao_parametro: number;
  id_parametro_pop: number;
}

interface AmostraResultadoInfo {
  id_analise: number;
  numero: string;
  identificacao: string;
  complemento: string;
  data_coleta: string;
  hora_coleta: string;
  data_entrada_lab: string;
  hora_entrada_lab: string;
  data_inicio_analise: string;
}

interface AmostraResultadosResponse {
  info: AmostraResultadoInfo;
  resultados: ResultadoItem[];
}

interface ResultadoDetalhes {
  id: number;
  id_analise: number;
  nome_parametro: string;
  grupo_parametro: string;
  tecnica_nome: string;
  unidade: string;
  limite: string;
  resultado: string | null;
  data_inicio: string | null;
  hora_inicio: string | null;
  data_termino: string | null;
  hora_termino: string | null;
  analista: string | null;
  em_campo: boolean;
  terceirizado: boolean;
  has_report: boolean; // 💥 CAMPO ATUALIZADO
}

interface Etapa {
  id: number;
  descricao: string;
  valor: string | null;
}

interface TauriResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface MapaAmostraResultado {
  has_report: boolean;
  id_grupo_doble: number;
  id_analise: number;
  id_resultado: number;
  id_cliente: number;
  numero_amostra?: string;
  identificacao?: string;
  complemento?: string;
}

interface ParametroMapaInfo {
   nome_parametro?: string;
   pop_info?: string;
   lq?: string;
   incerteza?: string;
   is_calculo: boolean;
}

interface ParametroMapaResponse {
  info: ParametroMapaInfo;
  amostras: MapaAmostraResultado[];
}

// ==============================================
//             ESTRUTURA DE ABAS
// ==============================================

interface TabData {
  id: string;
  idAnalise: number;
  idUsuario: number;
  numeroAmostra: string;
  detalhes: AmostraResultadosResponse | null;
  expandedGroups: Record<string, boolean>;
  loading: boolean;
  error: string | null;
}

// ==============================================
//             COMPONENTES INTERNOS
// ==============================================

interface AmostraTabContentProps {
  tab: TabData;
  onParametroClick: (parametro: ResultadoItem, idUsuario: number) => void;
  onRefresh: (idAnalise: number) => void;
}

const AmostraTabContent: React.FC<AmostraTabContentProps> = ({ tab, onParametroClick, onRefresh }) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(tab.expandedGroups);

  const toggleGrupo = (grupo: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [grupo]: !prev[grupo]
    }));
  };

  useEffect(() => {
    setExpandedGroups(tab.expandedGroups);
  }, [tab.expandedGroups]);

  if (tab.loading) {
    return (
      <div style={styles.loadingCenter}>
        <Loader style={styles.spinningLoader} size={32} />
        <span>Carregando detalhes da amostra...</span>
      </div>
    );
  }

  if (tab.error) {
    return (
      <div style={styles.errorAlert}>
        <AlertCircle size={20} />
        <span>{tab.error}</span>
      </div>
    );
  }

  if (!tab.detalhes) {
    return (
      <div style={styles.errorAlert}>
        <AlertCircle size={20} />
        <span>Nenhum detalhe carregado para esta amostra.</span>
      </div>
    );
  }

  const { info, resultados } = tab.detalhes;

  const parametrosPorGrupo = resultados.reduce((acc, param) => {
    if (!acc[param.grupo_parametro]) {
      acc[param.grupo_parametro] = [];
    }
    acc[param.grupo_parametro].push(param);
    return acc;
  }, {} as Record<string, ResultadoItem[]>) || {};


  // Estilos (simplificados do 'AmostraDetailModal')
  const stylesParam = {
    content: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: '1.5rem',
      backgroundColor: '#f8fafc',
    },
    infoCard: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '1.5rem',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    },
    infoGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
    },
    infoItem: { display: 'flex', flexDirection: 'column' as const, gap: '0.25rem' },
    infoLabel: { fontSize: '0.75rem', fontWeight: 500, color: '#64748b' },
    infoValue: { fontSize: '0.875rem', fontWeight: 500, color: '#1e293b', margin: 0 },
    parametrosCard: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '1.5rem',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    },
    parametrosHeader: {
      fontSize: '1.1rem',
      fontWeight: 600,
      color: '#1e293b',
      paddingBottom: '1rem',
      borderBottom: '1px solid #e2e8f0',
      marginBottom: '1rem',
    },
    grupoItem: {
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      marginBottom: '0.5rem',
      overflow: 'hidden',
    },
    grupoHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1rem',
      width: '100%',
      border: 'none',
      backgroundColor: '#f8fafc',
      cursor: 'pointer',
      textAlign: 'left' as const,
    },
    grupoNome: { fontWeight: 600, color: '#334155' },
    grupoCount: { fontSize: '0.875rem', color: '#64748b' },
    chevron: { transition: 'transform 0.2s', color: '#94a3b8' },
    expanded: { transform: 'rotate(180deg)' },
    parametrosTable: {
      borderTop: '1px solid #e2e8f0',
    },
    tableHeader: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr 1fr 80px', // Adicionada coluna para botão
      padding: '0.5rem 1rem',
      backgroundColor: '#f1f5f9',
      fontSize: '0.75rem',
      fontWeight: 600,
      color: '#475569',
      textTransform: 'uppercase' as const,
    },
    tableRow: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr 1fr 80px',
      padding: '0.75rem 1rem',
      borderBottom: '1px solid #e2e8f0',
      alignItems: 'center',
    },
    tableCell: {
      fontSize: '0.875rem',
      color: '#334155',
    },
    btnEditarResultado: {
      padding: '0.375rem 0.75rem',
      border: 'none',
      borderRadius: '6px',
      backgroundColor: '#667eea',
      color: '#fff',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem',
      fontSize: '0.75rem',
    }
  };

  return (
    <div style={stylesParam.content}>
      {/* 1. Card de Informações */}
      <div style={stylesParam.infoCard}>
        <div style={stylesParam.infoGrid}>
          <div style={stylesParam.infoItem}>
            <label style={stylesParam.infoLabel}>Identificação</label>
            <p style={stylesParam.infoValue}>{info.identificacao}</p>
          </div>
          <div style={stylesParam.infoItem}>
            <label style={stylesParam.infoLabel}>Data Coleta</label>
            <p style={stylesParam.infoValue}>{info.data_coleta} {info.hora_coleta}</p>
          </div>
          <div style={stylesParam.infoItem}>
            <label style={stylesParam.infoLabel}>Entrada Lab</label>
            <p style={stylesParam.infoValue}>{info.data_entrada_lab} {info.hora_entrada_lab}</p>
          </div>
          <div style={stylesParam.infoItem}>
            <label style={stylesParam.infoLabel}>Início Análise</label>
            <p style={stylesParam.infoValue}>{info.data_inicio_analise}</p>
          </div>
        </div>
      </div>

      {/* 2. Card de Parâmetros */}
      <div style={stylesParam.parametrosCard}>
        <h3 style={stylesParam.parametrosHeader}>
          Parâmetros ({resultados?.length || 0})
        </h3>
        {resultados && resultados.length > 0 ? (
          <div>
            {Object.entries(parametrosPorGrupo).map(([grupo, params]) => (
              <div key={grupo} style={stylesParam.grupoItem}>
                <button
                  onClick={() => toggleGrupo(grupo)}
                  style={stylesParam.grupoHeader}
                >
                  <ChevronDown
                    size={20}
                    style={{
                      ...stylesParam.chevron,
                      ...(expandedGroups[grupo] ? stylesParam.expanded : {})
                    }}
                  />
                  <span style={stylesParam.grupoNome}>{grupo}</span>
                  <span style={stylesParam.grupoCount}>({params.length})</span>
                </button>

                {expandedGroups[grupo] && (
                  <div style={stylesParam.parametrosTable}>
                    <div style={stylesParam.tableHeader}>
                      <div>Parâmetro</div>
                      <div>Técnica</div>
                      <div>Resultado</div>
                      <div>Analista</div>
                      <div>Ação</div>
                    </div>

                    {params.map((param, idx) => (
                      <div key={idx} style={stylesParam.tableRow}>
                        <div style={stylesParam.tableCell}>
                          <strong>{param.nome_parametro}</strong>
                        </div>
                        <div style={stylesParam.tableCell}>{param.tecnica_nome}</div>
                        <div style={stylesParam.tableCell}>
                          {param.resultado || (
                            <span style={{ color: '#94a3b8' }}>N/A</span>
                          )}
                        </div>
                        <div style={stylesParam.tableCell}>
                          {param.analista || (
                             <span style={{ color: '#94a3b8' }}>N/A</span>
                          )}
                        </div>
                        <div style={stylesParam.tableCell}>
                          <button 
                            style={stylesParam.btnEditarResultado}
                            onClick={() => onParametroClick(param, tab.idUsuario)}
                          >
                            {param.resultado ? <Eye size={14}/> : <Edit size={14} />}
                            <span>{param.resultado ? 'Ver' : 'Lançar'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>
            Nenhum parâmetro encontrado
          </div>
        )}
      </div>
    </div>
  );
};


// ==============================================
//             VIEW PRINCIPAL
// ==============================================
const ParametroResultadoView: React.FC = () => {
  const [tabs, setTabs] = useState<TabData[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>("");
  const [idUsuarioGlobal, setIdUsuarioGlobal] = useState<number>(0);
  
  const [modalParamData, setModalParamData] = useState<{ 
    idResultado: number, 
    idUsuario: number,
    idParametroPop: number
  } | null>(null);

  const [isAdicionarModalOpen, setIsAdicionarModalOpen] = useState(false);

  const createNewTabObject = useCallback((idAnalise: number, idUsuario: number, amostraInfo: AmostraItem): { newTab: TabData, tabId: string } => {
    const tabId = `analise-${idAnalise}`; 

    const newTab: TabData = {
      id: tabId,
      idAnalise: idAnalise,
      idUsuario: idUsuario,
      numeroAmostra: amostraInfo.numero || `Amostra ${idAnalise}`,
      detalhes: null,
      expandedGroups: {},
      loading: true,
      error: null,
    };

    return { newTab, tabId };
  }, []); 

  const updateTab = useCallback((tabId: string, updates: Partial<TabData>) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, ...updates } : tab
    ));
  }, []); 

  const activeTab = tabs.find(t => t.id === activeTabId);

  const carregarDetalhesAmostra = useCallback(async (tabId: string, idAnalise: number) => {
    updateTab(tabId, { loading: true, error: null });

    try {
      console.log("📊 Carregando detalhes da AMOSTRA ID:", idAnalise);
     
      const response = await invoke("buscar_resultados_amostra", { 
        idAnalise: idAnalise
      }) as TauriResponse<AmostraResultadosResponse>;
      
      console.log("✅ Resposta recebida:", response);

      if (response.success && response.data) {
        const grupos: Record<string, boolean> = {};
        response.data.resultados.forEach(p => {
          grupos[p.grupo_parametro] = true;
        });
        
        updateTab(tabId, {
          detalhes: response.data,
          expandedGroups: grupos,
          loading: false,
        });
      } else {
        updateTab(tabId, {
          error: response.message || "Erro ao carregar detalhes",
          loading: false,
        });
      }
    } catch (err: any) {
      updateTab(tabId, {
        error: err.message || "Erro ao conectar com o backend",
        loading: false,
      });
      console.error("Erro:", err);
    }
  }, [updateTab]); 


  const closeTab = useCallback((tabId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);
      
      if (newTabs.length === 0) {
        if (!modalParamData && !isAdicionarModalOpen) {
          getCurrentWindow().close();
        }
        return [];
      }

      if (activeTabId === tabId) {
        const closedIndex = prev.findIndex(t => t.id === tabId);
        const newActiveIndex = closedIndex > 0 ? closedIndex - 1 : 0;
        setActiveTabId(newTabs[newActiveIndex].id);
      }

      return newTabs;
    });
  }, [activeTabId, modalParamData, isAdicionarModalOpen]);

  const fecharJanela = useCallback(() => {
    getCurrentWindow().close();
  }, []);

  const abrirSeletorDeAmostras = useCallback(() => {
     setIsAdicionarModalOpen(true);
  }, []);

  const handleParametroClick = useCallback((parametro: ResultadoItem, idUsuario: number) => {
    console.log("Abrindo modal para resultado ID:", parametro.id, "ParametroPop ID:", parametro.id_parametro_pop);
    setModalParamData({
      idResultado: parametro.id,
      idUsuario: idUsuario,
      idParametroPop: parametro.id_parametro_pop
    });
  }, []);
  
  const handleCloseParamModal = useCallback((refresh: boolean) => {
    setModalParamData(null);
    if (refresh && activeTab) {
      console.log("Atualizando aba após salvar resultado...");
      carregarDetalhesAmostra(activeTab.id, activeTab.idAnalise);
    }
  }, [activeTab, carregarDetalhesAmostra]);

  const handleAbrirTodasAmostrasPorParametro = useCallback(async (idParametroPop: number) => {
    if (!idParametroPop) return;

    console.log(`Buscando todas as amostras para o parâmetro (pop_id): ${idParametroPop}`);
    
    setModalParamData(null);

    try {
      const response = await invoke("buscar_parametro_mapa", { 
        idParametroPop: idParametroPop
      }) as TauriResponse<ParametroMapaResponse>;

      if (response.success && response.data && response.data.amostras) {
        const novasAmostrasMapa = response.data.amostras;
        
        if (novasAmostrasMapa.length === 0) {
          alert("Nenhuma outra amostra encontrada para este parâmetro.");
          return;
        }

        setTabs(currentTabs => {
          let newTabs = [...currentTabs];
          let newActiveTabId = activeTabId;
          let addedCount = 0;

          novasAmostrasMapa.forEach(amostraMapa => {
            const tabId = `analise-${amostraMapa.id_analise}`;
            
            if (!newTabs.some(t => t.id === tabId) && idUsuarioGlobal) {
              
              const amostraInfo: AmostraItem = {
                id: amostraMapa.id_analise,
                numero: amostraMapa.numero_amostra || `Amostra ${amostraMapa.id_analise}`,
                identificacao: amostraMapa.identificacao,
              };

              const { newTab } = createNewTabObject(
                  amostraMapa.id_analise, 
                  idUsuarioGlobal, 
                  amostraInfo 
              ); 
              
              newTabs.push(newTab);
              carregarDetalhesAmostra(tabId, amostraMapa.id_analise);
              newActiveTabId = tabId;
              addedCount++;
            }
          });
          
          if (newActiveTabId) setActiveTabId(newActiveTabId);
          
          if (addedCount > 0) {
             alert(`${addedCount} nova(s) aba(s) de amostra foram adicionadas.`);
          } else {
             alert("Todas as amostras para este parâmetro já estão abertas.");
          }
         
          return newTabs;
        });

      } else {
        alert(`Erro ao buscar amostras: ${response.message || 'Erro desconhecido.'}`);
      }
    } catch (err: any) {
      console.error("Erro ao buscar mapa de parâmetro:", err);
      alert(`Erro ao buscar amostras: ${err.message}`);
    }
  }, [idUsuarioGlobal, activeTabId, createNewTabObject, carregarDetalhesAmostra, setTabs, setActiveTabId]);

  useEffect(() => {
    let unlistenWindowData: (() => void) | undefined;
    let unlistenAddAmostras: (() => void) | undefined;
    let unlistenResultadoSalvo: (() => void) | undefined;
    
    const setupListener = async () => {
      try {
        unlistenWindowData = await listen<WindowData>('window-data', (event) => {
          const received = event.payload;
          console.log("Recebido window-data (Amostra):", received);

          if (!received.idAnalise || !received.arrayAmostras) {
             console.error("Dados de janela inválidos recebidos", received);
             return;
          }
          
          if (received.idUsuario) {
             setIdUsuarioGlobal(received.idUsuario);
          }

          setTabs(currentTabs => {
            const tabId = `analise-${received.idAnalise}`;
            const existingTab = currentTabs.find(tab => tab.id === tabId);

            if (existingTab) {
              setActiveTabId(existingTab.id);
              return currentTabs;
            } else {
              const amostraInfo = received.arrayAmostras.find(a => a.id === received.idAnalise) || { id: received.idAnalise };

              const { newTab } = createNewTabObject(
                received.idAnalise, 
                received.idUsuario, 
                amostraInfo
              );
              
              carregarDetalhesAmostra(tabId, received.idAnalise);
              setActiveTabId(tabId);
              return [...currentTabs, newTab];
            }
          });
        });

        unlistenAddAmostras = await listen<AmostraItem[]>('adicionar-amostras-a-resultado', (event) => {
            const novasAmostras = event.payload;

            setTabs(currentTabs => {
                let newTabs = [...currentTabs];
                let newActiveTabId = activeTabId;

                novasAmostras.forEach(amostra => {
                    const tabId = `analise-${amostra.id}`;
                    
                    if (!newTabs.some(t => t.id === tabId) && idUsuarioGlobal) { 
                        const { newTab } = createNewTabObject(
                            amostra.id, 
                            idUsuarioGlobal, 
                            amostra 
                        ); 
                        newTabs.push(newTab);
                        carregarDetalhesAmostra(tabId, amostra.id);
                        newActiveTabId = tabId;
                    }
                });
                
                if(newActiveTabId) setActiveTabId(newActiveTabId);
                return newTabs;
            });
        });

        unlistenResultadoSalvo = await listen<{idAnalise: number, idResultado: number}>('resultado-salvo-sucesso', (event) => {
            const idAnalise = event.payload.idAnalise;
            const tabId = `analise-${idAnalise}`;
            const tabExists = tabs.some(t => t.id === tabId);
            if(tabExists){
                carregarDetalhesAmostra(tabId, idAnalise);
            }
        });
        
        await emit('window-ready');
      } catch (error) {
        console.error('Erro ao configurar listener:', error);
        alert("Erro ao configurar listener");
      }
    };

    setupListener();

    return () => {
      if (unlistenWindowData) unlistenWindowData();
      if (unlistenAddAmostras) unlistenAddAmostras();
      if (unlistenResultadoSalvo) unlistenResultadoSalvo();
    };
  }, [carregarDetalhesAmostra, createNewTabObject, idUsuarioGlobal, activeTabId, tabs]); 


  if (tabs.length === 0) {
    return (
      <div style={styles.loadingContainer}>
        <Loader style={styles.spinningLoader} size={32} />
        <span style={{ marginTop: '1rem', color: '#64748b' }}>Aguardando dados da amostra...</span>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerLeft}>
            <div style={styles.iconContainer}>
              <Edit size={24} />
            </div>
            <div>
              <h1 style={styles.title}>Cadastro de Resultados</h1>
              <p style={styles.subtitle}>
                {tabs.length} amostra{tabs.length !== 1 ? 's' : ''} aberta{tabs.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={fecharJanela}
            style={styles.closeButton}
            aria-label="Fechar"
          >
            <X size={24} />
          </button>
        </div>
      </header>

      {/* Tabs (Abas por Amostra) */}
      <div style={styles.tabsContainer}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            style={{
              ...styles.tab,
              ...(activeTabId === tab.id ? styles.tabActive : {})
            }}
          >
            <FlaskConical size={16} />
            <span>{tab.numeroAmostra}</span>
            <button
              onClick={(e) => closeTab(tab.id, e)}
              style={styles.tabCloseBtn}
            >
              <X size={14} />
            </button>
          </button>
        ))}
        <button
          onClick={abrirSeletorDeAmostras}
          style={{...styles.tab, background: '#f0f4ff', color: '#667eea', borderColor: '#e2e8f0'}}
          title="Adicionar mais amostras"
        >
          <Plus size={16} />
          <span>Adicionar</span>
        </button>
      </div>

      {/* Content (Renderiza o conteúdo da aba ativa) */}
      {activeTab && (
        <AmostraTabContent
          tab={activeTab}
          onParametroClick={handleParametroClick}
          onRefresh={(idAnalise) => carregarDetalhesAmostra(activeTab.id, idAnalise)}
        />
      )}
      
      {modalParamData && (
        <ParametroFormModal
          idResultado={modalParamData.idResultado}
          idUsuario={modalParamData.idUsuario}
          idParametroPop={modalParamData.idParametroPop}
          onClose={handleCloseParamModal}
          onAbrirTodasAmostras={handleAbrirTodasAmostrasPorParametro}
        />
      )}

      {isAdicionarModalOpen && (
        <AdicionarAmostraModal
          amostrasExistentesIds={tabs.map(t => t.idAnalise)}
          onClose={() => setIsAdicionarModalOpen(false)}
        />
      )}
    </div>
  );
};


// ==============================================
//       MODAL DE FORMULÁRIO DE PARÂMETRO
// ==============================================

interface ParametroFormModalProps {
  idResultado: number;
  idUsuario: number;
  idParametroPop: number;
  onClose: (refresh: boolean) => void;
  onAbrirTodasAmostras: (idParametroPop: number) => void;
}

const ParametroFormModal: React.FC<ParametroFormModalProps> = ({ 
  idResultado, 
  idUsuario, 
  idParametroPop,
  onClose,
  onAbrirTodasAmostras
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  
  const [detalhes, setDetalhes] = useState<ResultadoDetalhes | null>(null);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  
  // Estados do formulário
  const [valorResultado, setValorResultado] = useState("");
  const [dataTermino, setDataTermino] = useState("");
  const [horaTermino, setHoraTermino] = useState("");
  const [etapasValores, setEtapasValores] = useState<Record<number, string>>({});
  
  const [fezAlteracao, setFezAlteracao] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  const validarData = (data: string): boolean => /^\d{2}\/\d{2}\/\d{4}$/.test(data);
  const validarHora = (hora: string): boolean => /^\d{2}:\d{2}$/.test(hora);
  
  const formatarData = (valor: string): string => {
    let limpo = valor.replace(/\D/g, "");
    if (limpo.length >= 2) limpo = limpo.slice(0, 2) + "/" + limpo.slice(2);
    if (limpo.length >= 5) limpo = limpo.slice(0, 5) + "/" + limpo.slice(5, 9);
    return limpo;
  };

  const formatarHora = (valor: string): string => {
    let limpo = valor.replace(/\D/g, "");
    if (limpo.length >= 2) limpo = limpo.slice(0, 2) + ":" + limpo.slice(2, 4);
    return limpo;
  };
  
  useEffect(() => {
    const carregarDetalhesParametro = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await invoke("buscar_detalhes_resultado", { 
          idResultado: idResultado
        }) as TauriResponse<{
          resultado: ResultadoDetalhes;
          etapas: Etapa[];
        }>;

        if (response.success && response.data) {
          const { resultado, etapas } = response.data;
          setDetalhes(resultado);
          setEtapas(etapas);

          setValorResultado(resultado.resultado || '');
          
          const agora = new Date();
          const dataAtual = agora.toLocaleDateString('pt-BR');
          const horaAtual = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          
          setDataTermino(resultado.data_termino || dataAtual);
          setHoraTermino(resultado.hora_termino || horaAtual);

          const etapasInit: Record<number, string> = {};
          etapas.forEach(etapa => {
            etapasInit[etapa.id] = etapa.valor || '';
          });
          setEtapasValores(etapasInit);
          
        } else {
          setError(response.message || "Erro ao carregar detalhes do parâmetro");
        }
      } catch (err: any) {
        setError(err.message || "Erro ao conectar com o backend");
      } finally {
        setLoading(false);
      }
    };

    carregarDetalhesParametro();
  }, [idResultado]);
  
  const handleSalvar = async () => {
    if (!detalhes) return;

    if (!valorResultado.trim()) {
      setError("Por favor, informe o resultado");
      return;
    }
    if (!validarData(dataTermino)) {
      setError("Data inválida. Use formato DD/MM/YYYY");
      return;
    }
    if (!validarHora(horaTermino)) {
      setError("Hora inválida. Use formato HH:MM");
      return;
    }
    for (const etapa of etapas) {
      if (!etapasValores[etapa.id]?.trim()) {
        setError(`Por favor, preencha a etapa: ${etapa.descricao}`);
        return;
      }
    }

    setSalvando(true);
    setError(null);

    try {
      const response = await invoke("salvar_resultado_completo", {
        idResultado: detalhes.id,
        resultado: valorResultado,
        dataTermino: dataTermino,
        horaTermino: horaTermino,
        etapas: Object.entries(etapasValores).map(([id, valor]) => ({
          id: parseInt(id),
          valor: valor
        })),
        idUsuario: idUsuario,
      }) as TauriResponse<any>;

      if (response.success) {
        await emit('resultado-salvo-sucesso', { 
          idAnalise: detalhes.id_analise,
          idResultado: detalhes.id 
        });
        alert("Resultado salvo com sucesso!");
        setFezAlteracao(true);
        onClose(true);
      } else {
        setError(response.message || "Erro ao salvar resultado");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao conectar com o backend");
    } finally {
      setSalvando(false);
    }
  };

  const handleFiltrar = useCallback(() => {
    setMostrarFiltros(!mostrarFiltros);
  }, [mostrarFiltros]);

  const handleAbrirTodas = useCallback(() => {
    if (window.confirm("Deseja exibir todas as amostras iniciadas para este parâmetro?\nQualquer alteração não salva neste modal será perdida.")) {
      onAbrirTodasAmostras(idParametroPop);
    }
  }, [idParametroPop, onAbrirTodasAmostras]);

  // 💥 NOVO HANDLER: SOLICITAR REVISÃO
  const handleSolicitarRevisao = useCallback(async () => {
    if (!detalhes) return;

    // 1. Verificar se tem visto (analista)
    if (!detalhes.analista) {
        alert("Esta amostra não foi vistada. Apenas amostras vistadas podem ter a revisão solicitada.");
        return;
    }

    // 2. Verificar se tem relatório (como no Java)
    if (detalhes.has_report) {
        alert("O relatório de ensaios desta amostra já foi gerado! Não é possível solicitar revisão.");
        return;
    }

    // 3. Pedir o motivo (como no Java)
    const motivo = window.prompt("Informe o motivo da verificação dos resultados:");
    if (!motivo || motivo.trim() === "") {
        alert("Você não informou o motivo!");
        return;
    }

    setSalvando(true);
    setError(null);
    try {
      const response = await invoke("solicitar_revisao", {
        idResultado: idResultado,
        idUsuario: idUsuario,
        motivo: motivo,
      }) as TauriResponse<any>;

      if (response.success) {
        alert("Revisão solicitada com sucesso! O visto foi removido.");
        setFezAlteracao(true);
        onClose(true); // Fechar e atualizar
      } else {
        setError(response.message || "Erro ao solicitar revisão");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao conectar com o backend");
    } finally {
      setSalvando(false);
    }
  }, [detalhes, idResultado, idUsuario, onClose]);

  // 💥 NOVO HANDLER: PUBLICAR
  const handlePublicar = useCallback(async () => {
    if (!detalhes) return;

    // 1. Confirmar (como no Java)
    if (!window.confirm("Deseja publicar o resultado desta análise?")) {
        return;
    }

    setSalvando(true);
    setError(null);
    try {
      const response = await invoke("publicar_resultado", {
        idResultado: idResultado,
      }) as TauriResponse<any>;

      if (response.success) {
        alert("Resultado publicado com sucesso!");
        // Não precisa fechar o modal, mas pode recarregar
        setFezAlteracao(true); 
        onClose(true); // Fechar e atualizar
      } else {
        setError(response.message || "Erro ao publicar resultado");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao conectar com o backend");
    } finally {
      setSalvando(false);
    }
  }, [detalhes, idResultado, onClose]);

  const handleRelatorios = useCallback(() => {
    alert("Funcionalidade de histórico de insumo em desenvolvimento");
  }, []);

  const handleVistar = async (remover: boolean = false) => {
    if (!detalhes) return;
    
    // Se for para remover, e não houver motivo, usar a lógica de "Solicitar Revisão"
    if (remover) {
        alert("Para remover um visto, utilize a função 'Solicitar Revisão' (ícone de rolo de pintura) e informe um motivo.");
        return;
    }

    setSalvando(true);
    setError(null);

    try {
      // Ação de Vistar (única permitida aqui)
      const response = await invoke("vistar_resultado", {
        idResultado: detalhes.id,
        idUsuario: idUsuario,
      }) as TauriResponse<any>;

      if (response.success) {
        alert("Resultado vistado!");
        setFezAlteracao(true);
        onClose(true);
      } else {
        setError(response.message || "Erro ao processar");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao conectar com o backend");
    } finally {
      setSalvando(false);
    }
  };

  const copiarValorEtapa = (idEtapa: number) => {
    const valor = etapasValores[idEtapa];
    if (valor) {
      const novasEtapas = { ...etapasValores };
      let encontrou = false;
      etapas.forEach(etapa => {
        if (etapa.id === idEtapa) {
          encontrou = true;
        } else if (encontrou) {
          novasEtapas[etapa.id] = valor;
        }
      });
      setEtapasValores(novasEtapas);
    }
  };

  // Renderização do Modal
 return (
    <div style={stylesModal.overlay}>
      <div style={stylesModal.modal}>
        {/* Header do Modal */}
        <header style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.headerLeft}>
              <div style={styles.iconContainer}><Beaker size={24} /></div>
              <div>
                <h1 style={styles.title}>
                  {detalhes?.analista ? 'Visualizar' : 'Cadastrar'} Resultado
                </h1>
                <p style={styles.subtitle}>{detalhes?.nome_parametro || "Carregando..."}</p>
              </div>
            </div>
            
            <div style={stylesModal.headerButtons}>
              <button
                onClick={handleFiltrar}
                style={{
                  ...stylesModal.headerButton,
                  ...(mostrarFiltros ? stylesModal.headerButtonActive : {})
                }}
                title="Filtrar"
              >
                <Filter size={20} />
                <span>Filtrar</span>
              </button>
              
              <button
                onClick={handleAbrirTodas}
                style={stylesModal.headerButton}
                title="Todas amostras"
              >
                <FlaskConical size={20} />
                <span>Todas amostras</span>
              </button>
              
              {/* 💥 BOTÃO SOLICITAR REVISÃO 💥 */}
              <button
                onClick={handleSolicitarRevisao}
                style={stylesModal.headerButton}
                title="Solicitar revisão"
                disabled={salvando || !detalhes?.analista} // Desabilitado se não estiver vistado
              >
                <PaintRoller size={20} />
                <span>Solicitar revisão</span>
              </button>
              
              {/* 💥 BOTÃO PUBLICAR 💥 */}
              <button
                onClick={handlePublicar}
                style={stylesModal.headerButton}
                title="Publicar"
                disabled={salvando}
              >
                <Send size={20} />
                <span>Publicar</span>
              </button>
              
              <button
                onClick={handleRelatorios}
                style={stylesModal.headerButton}
                title="Histórico insumo"
              >
                <History size={20} />
                <span>Histórico</span>
              </button>
            </div>

            <button
              onClick={() => onClose(fezAlteracao)}
              style={styles.closeButton}
            >
              <X size={24} />
            </button>
          </div>
        </header>

        {/* Seção de Filtros */}
        {mostrarFiltros && (
          <div style={stylesModal.filtrosSection}>
            <div style={stylesModal.filtrosContent}>
              <div style={stylesModal.filtroGroup}>
                <label style={stylesModal.filtroLabel}>Status</label>
                <select style={stylesModal.filtroSelect}>
                  <option value="">Todos</option>
                  <option value="pendente">Pendentes</option>
                  <option value="concluido">Concluídos</option>
                  <option value="vistado">Vistados</option>
                </select>
              </div>
              <div style={stylesModal.filtroGroup}>
                <label style={stylesModal.filtroLabel}>Data Início</label>
                <input type="date" style={stylesModal.filtroInput}/>
              </div>
              <div style={stylesModal.filtroGroup}>
                <label style={stylesModal.filtroLabel}>Data Término</label>
                <input type="date" style={stylesModal.filtroInput}/>
              </div>
              <div style={stylesModal.filtroGroup}>
                <label style={stylesModal.filtroLabel}>Grupo</label>
                <select style={stylesModal.filtroSelect}>
                  <option value="">Todos os grupos</option>
                  <option value="fisico">Físico</option>
                  <option value="quimico">Químico</option>
                  <option value="microbiologico">Microbiológico</option>
                </select>
              </div>
              <div style={stylesModal.filtroActions}>
                <button style={stylesModal.filtroBtnPrimary}>
                  Aplicar Filtros
                </button>
                <button 
                  style={stylesModal.filtroBtnSecondary}
                  onClick={() => setMostrarFiltros(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo do Modal */}
        <div style={stylesModal.content}>
          {loading && (
            <div style={styles.loadingCenter}>
              <Loader style={styles.spinningLoader} size={32} />
              <span>Carregando detalhes do parâmetro...</span>
            </div>
          )}

          {error && (
            <div style={styles.errorAlert}>
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {detalhes && !loading && (
            <>
              {/* Card de Informações */}
              <div style={styles.infoCard}>
                <div style={styles.infoGrid}>
                  <div style={styles.infoItem}>
                    <label style={styles.infoLabel}>Grupo</label>
                    <p style={styles.infoValue}>{detalhes.grupo_parametro}</p>
                  </div>
                  <div style={styles.infoItem}>
                    <label style={styles.infoLabel}>Técnica</label>
                    <p style={styles.infoValue}>{detalhes.tecnica_nome}</p>
                  </div>
                  <div style={styles.infoItem}>
                    <label style={styles.infoLabel}>Unidade</label>
                    <p style={styles.infoValue}>{detalhes.unidade}</p>
                  </div>
                </div>
                <div style={styles.limiteBox}>
                  <strong>Limite:</strong> {detalhes.limite}
                </div>
              </div>

              {/* Card de Etapas */}
              {etapas.length > 0 && (
                <div style={styles.etapasCard}>
                  <h3 style={styles.infoCardTitle}><FlaskConical size={20} /> Etapas Parciais</h3>
                  {etapas.map((etapa) => (
                    <div key={etapa.id} style={styles.etapaItem}>
                      <label style={styles.etapaLabel}>{etapa.descricao}</label>
                      <input
                        type="text"
                        value={etapasValores[etapa.id] || ''}
                        onChange={(e) => setEtapasValores({
                            ...etapasValores,
                            [etapa.id]: e.target.value
                        })}
                        style={styles.etapaInput}
                        disabled={!!detalhes.analista}
                        placeholder="Informe o valor"
                      />
                      {!detalhes.analista && (
                        <button
                          onClick={() => copiarValorEtapa(etapa.id)}
                          style={styles.copyButton}
                          title="Copiar para próximas etapas"
                        >
                          <Copy size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Card de Resultado */}
              <div style={styles.resultadoCard}>
                <h3 style={styles.infoCardTitle}><Beaker size={20} /> Resultado Final</h3>
                
                {detalhes.analista && (
                  <div style={styles.vistaInfo}>
                    <CheckCircle size={18} />
                    <span>Resultado vistado por: {detalhes.analista}</span>
                  </div>
                )}

                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Resultado <span style={styles.required}>*</span></label>
                    <input
                      type="text"
                      value={valorResultado}
                      onChange={(e) => setValorResultado(e.target.value)}
                      style={styles.formInput}
                      disabled={!!detalhes.analista}
                      placeholder="Informe o resultado"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Data Término <span style={styles.required}>*</span></label>
                    <input
                      type="text"
                      value={dataTermino}
                      onChange={(e) => setDataTermino(formatarData(e.target.value))}
                      style={styles.formInput}
                      disabled={!!detalhes.analista}
                      placeholder="DD/MM/YYYY"
                      maxLength={10}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Hora Término <span style={styles.required}>*</span></label>
                    <input
                      type="text"
                      value={horaTermino}
                      onChange={(e) => setHoraTermino(formatarHora(e.target.value))}
                      style={styles.formInput}
                      disabled={!!detalhes.analista}
                      placeholder="HH:MM"
                      maxLength={5}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer do Modal */}
        {detalhes && !loading && (
          <footer style={styles.footer}>
            <button
              onClick={() => onClose(fezAlteracao)}
              style={styles.btnCancel}
              disabled={salvando}
            >
              Fechar
            </button>
            
            {!detalhes.analista && (
              <>
                <button 
                  onClick={handleSalvar} 
                  disabled={salvando} 
                  style={styles.btnSave}
                >
                  {salvando ? <Loader style={styles.spinningLoader} size={18} /> : <Save size={18} />}
                  <span>Salvar</span>
                </button>
                {detalhes.resultado && (
                  <button 
                    onClick={() => handleVistar(false)} 
                    disabled={salvando} 
                    style={styles.btnVistar}
                  >
                    <Eye size={18} />
                    <span>Vistar</span>
                  </button>
                )}
              </>
            )}

            {detalhes.analista && (
              <button 
                onClick={() => handleVistar(true)} 
                disabled={salvando} 
                style={styles.btnRemoverVisto}
              >
                <EyeOff size={18} />
                <span>Remover Visto</span>
              </button>
            )}
          </footer>
        )}
      </div>
    </div>
  );
};

export default ParametroResultadoView;

// ==============================================
//             ESTILOS (CSS-in-JS)
// ==============================================

const styles: Record<string, CSSProperties> = {
  // Estilos da View Principal
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #e2e8f0',
    padding: '1rem 1.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    zIndex: 10,
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  iconContainer: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#1e293b',
    margin: 0,
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#64748b',
    margin: '0.25rem 0 0 0',
  },
  closeButton: {
    padding: '0.5rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e2e8f0',
    overflowX: 'auto' as const,
    flexShrink: 0,
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#fff',
    color: '#64748b',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap' as const,
  },
  tabActive: {
    backgroundColor: '#667eea',
    color: '#fff',
    borderColor: '#667eea',
  },
  tabCloseBtn: {
    padding: '0.25rem',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '0.5rem',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
  },
  loadingCenter: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    gap: '1rem',
    color: '#64748b',
  },
  spinningLoader: {
    animation: 'spin 1s linear infinite',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#991b1b',
    fontSize: '0.875rem',
    margin: '1.5rem',
  },

  // Estilos do Modal (Formulário)
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1rem',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
  },
  infoLabel: {
    fontSize: '0.75rem',
    fontWeight: 500,
    color: '#64748b',
    textTransform: 'uppercase' as const,
  },
  infoValue: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#1e293b',
    margin: 0,
  },
  limiteBox: {
    marginTop: '1rem',
    padding: '0.75rem',
    backgroundColor: '#f1f5f9',
    borderRadius: '8px',
    fontSize: '0.875rem',
    color: '#475569',
  },
  etapasCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },
  infoCardTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    margin: '0 0 1rem 0',
    paddingBottom: '1rem',
    borderBottom: '1px solid #e2e8f0',
  },
  etapaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    marginBottom: '0.5rem',
  },
  etapaLabel: {
    minWidth: '150px',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#475569',
  },
  etapaInput: {
    flex: 1,
    padding: '0.5rem 0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '0.875rem',
  },
  copyButton: {
    padding: '0.5rem',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    cursor: 'pointer',
  },
  resultadoCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '1rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  formLabel: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#475569',
  },
  required: {
    color: '#ef4444',
  },
  formInput: {
    padding: '0.625rem 0.875rem',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '0.875rem',
  },
  vistaInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem',
    backgroundColor: '#dcfce7',
    borderRadius: '8px',
    marginTop: '1rem',
    color: '#15803d',
    fontSize: '0.875rem',
    fontWeight: 500,
  },
  footer: {
    padding: '1rem 1.5rem',
    borderTop: '1px solid #e2e8f0',
    backgroundColor: '#fff',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    flexShrink: 0,
  },
  btnCancel: {
    padding: '0.625rem 1.25rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#fff',
    color: '#64748b',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
  },
  btnSave: {
    padding: '0.625rem 1.25rem',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  btnVistar: {
    padding: '0.625rem 1.25rem',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#fff',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  btnRemoverVisto: {
    padding: '0.625rem 1.25rem',
    borderRadius: '8px',
    border: '1px solid #f59e0b',
    backgroundColor: '#fff',
    color: '#f59e0b',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
};

// Estilos para o NOVO MODAL
const stylesModal: Record<string, CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '1000px',
    height: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '1.5rem',
  },
  
  headerButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginRight: '1rem',
  },
  headerButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#fff',
    color: '#64748b',
    fontSize: '0.75rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap' as const,
  },
  headerButtonActive: {
    backgroundColor: '#667eea',
    color: '#fff',
    borderColor: '#667eea',
  },
  
  filtrosSection: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #e2e8f0',
    padding: '1rem 1.5rem',
  },
  filtrosContent: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1rem',
    alignItems: 'end',
  },
  filtroGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
  },
  filtroLabel: {
    fontSize: '0.75rem',
    fontWeight: 500,
    color: '#64748b',
  },
  filtroSelect: {
    padding: '0.5rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '0.875rem',
  },
  filtroInput: {
    padding: '0.5rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '0.875rem',
  },
  filtroActions: {
    display: 'flex',
    gap: '0.5rem',
    gridColumn: '1 / -1',
    justifyContent: 'flex-end',
    marginTop: '0.5rem',
  },
  filtroBtnPrimary: {
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#667eea',
    color: '#fff',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
  },
  filtroBtnSecondary: {
    padding: '0.5rem 1rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    backgroundColor: '#fff',
    color: '#64748b',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
  },
};