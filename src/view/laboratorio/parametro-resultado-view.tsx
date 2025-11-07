// parametro-resultado-view.tsx - VERSÃO CORRIGIDA
import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Calendar,
  Clock,
  FlaskConical,
  AlertCircle,
  Loader,
  Save,
  CheckCircle,
  FileText,
  Beaker,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Copy,
} from "lucide-react";
import { listen, emit } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

// Estilos inline (mantidos como no original)
const styles = {
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
  },
  addTabButton: {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: '1px dashed #cbd5e1',
    backgroundColor: '#fff',
    color: '#64748b',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  content: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '1.5rem',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },
  infoCardHeader: {
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #e2e8f0',
  },
  infoCardTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    margin: 0,
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
    letterSpacing: '0.05em',
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
    outline: 'none',
    transition: 'all 0.2s',
  },
  copyButton: {
    padding: '0.5rem',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.2s',
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
    outline: 'none',
    transition: 'all 0.2s',
  },
  formHint: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    marginTop: '0.25rem',
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
    transition: 'all 0.2s',
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
    transition: 'all 0.2s',
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
    transition: 'all 0.2s',
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
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
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
  },
  timestampInfo: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
    padding: '0.75rem',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    fontSize: '0.75rem',
    color: '#64748b',
  },
};

interface WindowData {
  idAnalise: number;
  idResultado: number;
  idUsuario: number;
  nomeParametro: string;
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

interface TabData {
  id: string; // Será 'resultado-ID'
  windowData: WindowData;
  resultado: ResultadoDetalhes | null;
  etapas: Etapa[];
  loading: boolean;
  error: string | null;
  salvando: boolean;
  valorResultado: string;
  dataTermino: string;
  horaTermino: string;
  etapasValores: Record<number, string>;
}

const ParametroResultadoView: React.FC = () => {
  const [tabs, setTabs] = useState<TabData[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>("");
  // const [nextTabNumber, setNextTabNumber] = useState<number>(1); // REMOVIDO

  // ✅ CORREÇÃO: Função 'helper' estável para CRIAR o objeto da aba.
  // Não modifica mais o estado diretamente.
  const createNewTabObject = useCallback((windowData: WindowData): { newTab: TabData, tabId: string } => {
    // Usamos o idResultado para um ID de aba único e previsível
    const tabId = `resultado-${windowData.idResultado}`; 
    
    const agora = new Date();
    const dataAtual = agora.toLocaleDateString('pt-BR');
    const horaAtual = agora.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const newTab: TabData = {
      id: tabId,
      windowData,
      resultado: null,
      etapas: [],
      loading: true, // Começa carregando
      error: null,
      salvando: false,
      valorResultado: "",
      dataTermino: dataAtual,
      horaTermino: horaAtual,
      etapasValores: {},
    };

    return { newTab, tabId };
  }, []); // Dependência vazia, função estável

  const closeTab = useCallback((tabId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);
      
      if (newTabs.length === 0) {
        getCurrentWindow().close();
        return [];
      }

      if (activeTabId === tabId) {
        const closedIndex = prev.findIndex(t => t.id === tabId);
        const newActiveIndex = closedIndex > 0 ? closedIndex - 1 : 0;
        setActiveTabId(newTabs[newActiveIndex].id);
      }

      return newTabs;
    });
  }, [activeTabId]);

  const updateTab = useCallback((tabId: string, updates: Partial<TabData>) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, ...updates } : tab
    ));
  }, []); // Dependência vazia, função estável

  const activeTab = tabs.find(t => t.id === activeTabId);

  const fecharJanela = useCallback(() => {
    getCurrentWindow().close();
  }, []);

  const validarData = (data: string): boolean => {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    return regex.test(data);
  };

  const validarHora = (hora: string): boolean => {
    const regex = /^\d{2}:\d{2}$/;
    return regex.test(hora);
  };

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

  const carregarDetalhes = useCallback(async (tabId: string, idResultado: number) => {
    updateTab(tabId, { loading: true, error: null });

    try {
      console.log("📊 Carregando detalhes do resultado ID:", idResultado);
     
      const response = await invoke("buscar_detalhes_resultado", { 
        idResultado: idResultado
      }) as TauriResponse<{
        resultado: ResultadoDetalhes;
        etapas: Etapa[];
      }>;
      
      console.log("✅ Resposta recebida:", response);

      if (response.success && response.data) {
        const etapasInit: Record<number, string> = {};
        response.data.etapas.forEach(etapa => {
          etapasInit[etapa.id] = etapa.valor || '';
        });

        updateTab(tabId, {
          resultado: response.data.resultado,
          etapas: response.data.etapas,
          loading: false,
          valorResultado: response.data.resultado.resultado || '',
          etapasValores: etapasInit,
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
  }, [updateTab]); // 'updateTab' é estável

  // ... (outros handlers: handleSalvar, handleVistar, copiarValorEtapa) ...
  // (Nenhuma mudança necessária neles)
  const handleSalvar = async () => {
    if (!activeTab || !activeTab.resultado) {
      alert("Dados não carregados.");
      return;
    }

    if (!activeTab.valorResultado.trim()) {
      updateTab(activeTab.id, { error: "Por favor, informe o resultado" });
      return;
    }

    if (!validarData(activeTab.dataTermino)) {
      updateTab(activeTab.id, { error: "Data inválida. Use formato DD/MM/YYYY" });
      return;
    }

    if (!validarHora(activeTab.horaTermino)) {
      updateTab(activeTab.id, { error: "Hora inválida. Use formato HH:MM" });
      return;
    }

    for (const etapa of activeTab.etapas) {
      if (!activeTab.etapasValores[etapa.id]?.trim()) {
        updateTab(activeTab.id, { error: `Por favor, preencha a etapa: ${etapa.descricao}` });
        return;
      }
    }

    updateTab(activeTab.id, { salvando: true, error: null });

    try {
      const response = await invoke("salvar_resultado_completo", {
        idResultado: activeTab.resultado.id,
        resultado: activeTab.valorResultado,
        dataTermino: activeTab.dataTermino,
        horaTermino: activeTab.horaTermino,
        etapas: Object.entries(activeTab.etapasValores).map(([id, valor]) => ({
          id: parseInt(id),
          valor: valor
        })),
        idUsuario: activeTab.windowData.idUsuario,
      }) as TauriResponse<any>;

      if (response.success) {
        await emit('resultado-salvo-sucesso', { 
          idAnalise: activeTab.windowData.idAnalise,
          idResultado: activeTab.resultado.id 
        });
        
        alert("Resultado salvo com sucesso!");
        await carregarDetalhes(activeTab.id, activeTab.resultado.id);
      } else {
        updateTab(activeTab.id, { 
          error: response.message || "Erro ao salvar resultado",
          salvando: false 
        });
      }
    } catch (err: any) {
      updateTab(activeTab.id, {
        error: err.message || "Erro ao conectar com o backend",
        salvando: false
      });
      console.error("Erro:", err);
    } finally {
      updateTab(activeTab.id, { salvando: false });
    }
  };

  const handleVistar = async (remover: boolean = false) => {
    if (!activeTab || !activeTab.resultado) return;

    updateTab(activeTab.id, { salvando: true, error: null });

    try {
      const comando = remover ? "remover_visto_resultado" : "vistar_resultado";
      const response = await invoke(comando, {
        idResultado: activeTab.resultado.id,
        idUsuario: activeTab.windowData.idUsuario,
      }) as TauriResponse<any>;

      if (response.success) {
        await carregarDetalhes(activeTab.id, activeTab.resultado.id);
        alert(remover ? "Visto removido!" : "Resultado vistado!");
      } else {
        updateTab(activeTab.id, { 
          error: response.message || "Erro ao processar",
          salvando: false 
        });
      }
    } catch (err: any) {
      updateTab(activeTab.id, {
        error: err.message || "Erro ao conectar com o backend",
        salvando: false
      });
    } finally {
      updateTab(activeTab.id, { salvando: false });
    }
  };

  const copiarValorEtapa = (idEtapa: number) => {
    if (!activeTab) return;

    const valor = activeTab.etapasValores[idEtapa];
    if (valor) {
      const novasEtapas = { ...activeTab.etapasValores };
      let encontrou = false;
      activeTab.etapas.forEach(etapa => {
        if (etapa.id === idEtapa) {
          encontrou = true;
        } else if (encontrou) {
          novasEtapas[etapa.id] = valor;
        }
      });
      updateTab(activeTab.id, { etapasValores: novasEtapas });
    }
  };

  const abrirNovoParametro = useCallback(() => {
    // Emite evento para a janela pai indicando que quer abrir outro parâmetro
    emit('solicitar-novo-parametro', { origem: 'parametro-resultado' });
  }, []);

  // ✅ CORREÇÃO: Listener de eventos refatorado
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    
    const setupListener = async () => {
      try {
        unlisten = await listen<WindowData>('window-data', (event) => {
          const received = event.payload;

          // Usamos a forma funcional do 'setTabs'
          // 'currentTabs' é garantidamente o estado mais recente.
          setTabs(currentTabs => {
            const tabId = `resultado-${received.idResultado}`;
            const existingTab = currentTabs.find(tab => tab.id === tabId);

            if (existingTab) {
              // Aba já existe. Apenas ativa.
              setActiveTabId(existingTab.id);
              // Retorna o estado sem modificação.
              return currentTabs;
            } else {
              // Aba não existe. Cria uma nova.
              const { newTab } = createNewTabObject(received);
              
              // Dispara o carregamento dos detalhes para a nova aba
              if (received.idResultado) {
                // Não precisa 'await', pois o 'carregarDetalhes'
                // vai atualizar o estado da aba via 'updateTab'
                carregarDetalhes(tabId, received.idResultado);
              }
              
              // Ativa a nova aba
              setActiveTabId(tabId);
              
              // Retorna o novo array de abas
              return [...currentTabs, newTab];
            }
          });
        });
        await emit('window-ready');
      } catch (error) {
        console.error('Erro ao configurar listener:', error);
        alert("Erro ao configurar listener");
      }
    };

    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [carregarDetalhes, createNewTabObject]); // Dependências estáveis


  if (tabs.length === 0) {
    return (
      <div style={styles.loadingContainer}>
        <Loader style={styles.spinningLoader} size={32} />
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
              <Beaker size={24} />
            </div>
            <div>
              <h1 style={styles.title}>Cadastro de Resultados</h1>
              <p style={styles.subtitle}>
                {tabs.length} parâmetro{tabs.length !== 1 ? 's' : ''} aberto{tabs.length !== 1 ? 's' : ''}
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

      {/* Tabs */}
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
            <Beaker size={16} />
            <span>{tab.windowData.nomeParametro}</span>
            {tabs.length > 0 && ( // Sempre permite fechar, mesmo se for a última (o closeTab trata disso)
              <button
                onClick={(e) => closeTab(tab.id, e)}
                style={styles.tabCloseBtn}
              >
                <X size={14} />
              </button>
            )}
          </button>
        ))}
        <button
          onClick={abrirNovoParametro}
          style={styles.addTabButton}
          title="Adicionar outro parâmetro"
        >
          <Plus size={16} />
          <span>Adicionar</span>
        </button>
      </div>

      {/* Content */}
      {activeTab && (
        <>
          <div style={styles.content}>
            {activeTab.loading && (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <Loader style={styles.spinningLoader} size={32} />
              </div>
            )}

            {activeTab.error && (
              <div style={styles.errorAlert}>
                <AlertCircle size={20} />
                <span>{activeTab.error}</span>
              </div>
            )}

            {activeTab.resultado && !activeTab.loading && (
              <>
                {/* Card de Informações */}
                <div style={styles.infoCard}>
                  <div style={styles.infoCardHeader}>
                    <h3 style={styles.infoCardTitle}>
                      <FileText size={20} />
                      Informações do Parâmetro
                    </h3>
                  </div>

                  <div style={styles.infoGrid}>
                    <div style={styles.infoItem}>
                      <label style={styles.infoLabel}>Parâmetro</label>
                      <p style={styles.infoValue}>{activeTab.resultado.nome_parametro}</p>
                    </div>

                    <div style={styles.infoItem}>
                      <label style={styles.infoLabel}>Grupo</label>
                      <p style={styles.infoValue}>{activeTab.resultado.grupo_parametro}</p>
                    </div>

                    <div style={styles.infoItem}>
                      <label style={styles.infoLabel}>Técnica</label>
                      <p style={styles.infoValue}>{activeTab.resultado.tecnica_nome}</p>
                    </div>

                    <div style={styles.infoItem}>
                      <label style={styles.infoLabel}>Unidade</label>
                      <p style={styles.infoValue}>{activeTab.resultado.unidade}</p>
                    </div>
                  </div>

                  <div style={styles.limiteBox}>
                    <strong>Limite:</strong> {activeTab.resultado.limite}
                  </div>
                </div>

                {/* Card de Etapas */}
                {activeTab.etapas.length > 0 && (
                  <div style={styles.etapasCard}>
                    <div style={styles.infoCardHeader}>
                      <h3 style={styles.infoCardTitle}>
                        <FlaskConical size={20} />
                        Etapas Parciais
                      </h3>
                    </div>

                    {activeTab.etapas.map((etapa) => (
                      <div key={etapa.id} style={styles.etapaItem}>
                        <label style={styles.etapaLabel}>{etapa.descricao}</label>
                        <input
                          type="text"
                          value={activeTab.etapasValores[etapa.id] || ''}
                          onChange={(e) => updateTab(activeTab.id, {
                            etapasValores: {
                              ...activeTab.etapasValores,
                              [etapa.id]: e.target.value
                            }
                          })}
                          style={styles.etapaInput}
                          disabled={!!activeTab.resultado?.analista}
                          placeholder="Informe o valor"
                        />
                        {!activeTab.resultado?.analista && (
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
                  <div style={styles.infoCardHeader}>
                    <h3 style={styles.infoCardTitle}>
                      <Beaker size={20} />
                      Resultado Final
                    </h3>
                  </div>

                  {activeTab.resultado.analista ? (
                    <div style={styles.vistaInfo}>
                      <CheckCircle size={18} />
                      <span>Resultado vistado por: {activeTab.resultado.analista}</span>
                    </div>
                  ) : null}

                  <div style={styles.formGrid}>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>
                        Resultado <span style={styles.required}>*</span>
                      </label>
                      <input
                        type="text"
                        value={activeTab.valorResultado}
                        onChange={(e) => updateTab(activeTab.id, { valorResultado: e.target.value })}
                        style={styles.formInput}
                        disabled={!!activeTab.resultado.analista}
                        placeholder="Informe o resultado"
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>
                        Data Término <span style={styles.required}>*</span>
                      </label>
                      <input
                        type="text"
                        value={activeTab.dataTermino}
                        onChange={(e) => updateTab(activeTab.id, { dataTermino: formatarData(e.target.value) })}
                        style={styles.formInput}
                        disabled={!!activeTab.resultado.analista}
                        placeholder="DD/MM/YYYY"
                        maxLength={10}
                      />
                      <span style={styles.formHint}>Ex: 15/01/2025</span>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>
                        Hora Término <span style={styles.required}>*</span>
                      </label>
                      <input
                        type="text"
                        value={activeTab.horaTermino}
                        onChange={(e) => updateTab(activeTab.id, { horaTermino: formatarHora(e.target.value) })}
                        style={styles.formInput}
                        disabled={!!activeTab.resultado.analista}
                        placeholder="HH:MM"
                        maxLength={5}
                      />
                      <span style={styles.formHint}>Ex: 14:30</span>
                    </div>
                  </div>

                  {activeTab.resultado.data_inicio && (
                    <div style={styles.timestampInfo}>
                      <span>Início: {activeTab.resultado.data_inicio} {activeTab.resultado.hora_inicio}</span>
                      {activeTab.resultado.data_termino && (
                        <span>Término: {activeTab.resultado.data_termino} {activeTab.resultado.hora_termino}</span>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {activeTab.resultado && !activeTab.loading && (
            <footer style={styles.footer}>
              <button
                onClick={fecharJanela}
                style={styles.btnCancel}
                disabled={activeTab.salvando}
              >
                Fechar
              </button>
              
              {!activeTab.resultado.analista && (
                <>
                  <button
                    onClick={handleSalvar}
                    disabled={activeTab.salvando}
                    style={styles.btnSave}
                  >
                    {activeTab.salvando ? (
                      <>
                        <Loader style={styles.spinningLoader} size={18} />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        <span>Salvar</span>
                      </>
                    )}
                  </button>

                  {activeTab.resultado.resultado && (
                    <button
                      onClick={() => handleVistar(false)}
                      disabled={activeTab.salvando}
                      style={styles.btnVistar}
                    >
                      <Eye size={18} />
                      <span>Vistar</span>
                    </button>
                  )}
                </>
              )}

              {activeTab.resultado.analista && (
                <button
                  onClick={() => handleVistar(true)}
                  disabled={activeTab.salvando}
                  style={styles.btnRemoverVisto}
                >
                  <EyeOff size={18} />
                  <span>Remover Visto</span>
                </button>
              )}
            </footer>
          )}
        </>
      )}
    </div>
  );
};

export default ParametroResultadoView;