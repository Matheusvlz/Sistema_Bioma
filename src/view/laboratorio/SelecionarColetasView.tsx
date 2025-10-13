import React, { useState, useEffect, useCallback } from 'react';
import { X, MapPin, CheckCircle, Users, Calendar, Droplets, Loader2, Info } from 'lucide-react';
import { listen, emit } from '@tauri-apps/api/event';
import { invoke } from "@tauri-apps/api/core";

// --- 1. INTERFACES DE DADOS DA API ---

interface ColetaAmostra {
  id: number;
  numero: number | null;
  hora_coleta: string | null; 
  identificacao: string | null;
  complemento: string | null;
  identificacao_frasco: string | null;
  condicoes_amb: string | null;
  ph: string | null;
  cloro: string | null;
  temperatura: string | null;
  solido_dissolvido_total: string | null;
  condutividade: string | null;
  oxigenio_dissolvido: string | null;
  idusuario: number | null;
}

interface ColetaComAmostras {
  id: number;
  numero: number | null;
  ano: string | null;
  amostras: ColetaAmostra[];
}

interface ColetasResponse {
  coletas: ColetaComAmostras[];
}

// Interfaces de Comunicação com a Janela Pai
export interface ICadastrarAmostraInstance {
  someMethod: (amostraIds: number[]) => void; // Adicionado array de IDs para ser mais útil
}

interface IWindowDataPayload {
  clientId?: number;
}


// --- 2. HELPERS DE TIPO E VALIDAÇÃO CORRIGIDOS ---

function isIWindowDataPayload(obj: unknown): obj is IWindowDataPayload {
  const data = obj as IWindowDataPayload;
  return (
    typeof obj === 'object' &&
    obj !== null &&
    ('clientId' in data ? typeof data.clientId === 'number' || data.clientId === undefined : true)
  );
}


// --- NOVO: COMPONENTE MODAL DE DETALHES ---

interface ModalProps {
    amostra: ColetaAmostra;
    coleta: ColetaComAmostras;
    onClose: () => void;
    styles: { [key: string]: React.CSSProperties }; 
}

const AmostraDetalheModal: React.FC<ModalProps> = ({ amostra, coleta, onClose, styles }) => {
    const formatValue = (value: string | number | null) => 
        value === null || value === '' ? 'N/A' : String(value);

    const detalhesAmostra = [
        { label: 'ID Amostra', value: formatValue(amostra.id) },
        { label: 'Identificação', value: formatValue(amostra.identificacao) },
        { label: 'Frasco', value: formatValue(amostra.identificacao_frasco) },
        { label: 'Complemento', value: formatValue(amostra.complemento) },
        { label: 'Hora da Coleta', value: formatValue(amostra.hora_coleta) },
        { label: 'Condições Amb.', value: formatValue(amostra.condicoes_amb) },
    ];

    const parametrosAmostra = [
        { label: 'pH', value: formatValue(amostra.ph) },
        { label: 'Cloro', value: formatValue(amostra.cloro) },
        { label: 'Temperatura', value: formatValue(amostra.temperatura) },
        { label: 'Sólido Dissolvido Total', value: formatValue(amostra.solido_dissolvido_total) },
        { label: 'Condutividade', value: formatValue(amostra.condutividade) },
        { label: 'Oxigênio Dissolvido', value: formatValue(amostra.oxigenio_dissolvido) },
    ];
    
    const detalhesColeta = [
        { label: 'ID Coleta', value: formatValue(coleta.id) },
        { label: 'Número da Coleta', value: formatValue(coleta.numero) },
        { label: 'Ano', value: formatValue(coleta.ano) },
    ];


    return (
        <div style={styles.modalBackdrop}>
            <div style={styles.modalContent}>
                <div style={styles.modalHeader}>
                    <h2 style={styles.modalTitle}>Detalhes da Amostra e Coleta</h2>
                    <button onClick={onClose} style={styles.modalCloseButton}>
                        <X size={20} />
                    </button>
                </div>
                <div style={styles.modalBody}>
                    <div style={styles.modalSection}>
                        <h3 style={styles.sectionTitle}>
                           <Droplets size={16} style={{marginRight: '0.5rem'}} /> Dados da Amostra: {amostra.identificacao ?? 'S/ID'}
                        </h3>
                        <div style={styles.detailGrid}>
                            {detalhesAmostra.map(d => (
                                <div key={d.label} style={styles.detailItem}>
                                    <span style={styles.detailLabel}>{d.label}:</span>
                                    <span style={styles.detailValue}>{d.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div style={styles.modalSection}>
                        <h3 style={styles.sectionTitle}>
                            <Info size={16} style={{marginRight: '0.5rem'}} /> Parâmetros Físicos
                        </h3>
                        <div style={styles.detailGrid}>
                            {parametrosAmostra.map(p => (
                                <div key={p.label} style={styles.detailItem}>
                                    <span style={styles.detailLabel}>{p.label}:</span>
                                    <span style={styles.detailValue}>{p.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={styles.modalSection}>
                        <h3 style={styles.sectionTitle}>
                            <Calendar size={16} style={{marginRight: '0.5rem'}} /> Detalhes da Coleta
                        </h3>
                        <div style={styles.detailGrid}>
                            {detalhesColeta.map(c => (
                                <div key={c.label} style={styles.detailItem}>
                                    <span style={styles.detailLabel}>{c.label}:</span>
                                    <span style={styles.detailValue}>{c.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};


// --- 4. COMPONENTE PRINCIPAL ---

const SelecionarColetasView: React.FC = () => {
  const [cliente, setCliente] = useState('BIOMA AMBIENTAL'); 
  const [instanciaOrigem, setInstanciaOrigem] = useState<ICadastrarAmostraInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAmostraForModal, setSelectedAmostraForModal] = useState<ColetaAmostra | null>(null);
  
  const [coletasDisponiveis, setColetasDisponiveis] = useState<ColetaComAmostras[]>([]);
  const [coletaSelecionadaId, setColetaSelecionadaId] = useState<number | null>(null);
  const [amostrasDaColetaSelecionada, setAmostrasDaColetaSelecionada] = useState<ColetaAmostra[]>([]);
  const [amostrasSelecionadas, setAmostrasSelecionadas] = useState<string[]>([]); 

  const coletaSelecionadaObj = coletasDisponiveis.find(c => c.id === coletaSelecionadaId);

  // Lógica para ABRIR MODAL e LÓGICA DE CLIQUE
  const handleAmostraClick = (amostra: ColetaAmostra) => {
    if (coletaSelecionadaObj) {
        setSelectedAmostraForModal(amostra);
        setIsModalOpen(true);
    }
  };
  
  const listarColetasRefentes = useCallback(async (cliente_id: number) => {
    if (cliente_id <= 0 || isNaN(cliente_id)) {
        console.warn("[TAURI LOGIC] Tentativa de buscar coletas com ID de cliente inválido:", cliente_id);
        setLoading(false);
        setError("ID do Cliente inválido ou não fornecido.");
        return; 
    }

    setLoading(true);
    setError(null);
    setColetasDisponiveis([]);
    setAmostrasDaColetaSelecionada([]);
    setColetaSelecionadaId(null);
    setAmostrasSelecionadas([]);

    const commandName = "buscar_coletas_e_amostras_client_command";

    try {
      const res: ColetasResponse = await invoke(commandName, {
        clienteId: cliente_id 
      });
      
      console.log('Coletas e Amostras recebidas:', res.coletas);
      setColetasDisponiveis(res.coletas);
      
      if (res.coletas.length > 0) {
        const primeiraColeta = res.coletas[0];
        setColetaSelecionadaId(primeiraColeta.id);
        setAmostrasDaColetaSelecionada(primeiraColeta.amostras);
      }
      
    } catch (err) {
      console.error(`[TAURI ERROR] Falha ao listar coletas: ${err}`);
      setError(`Erro ao carregar coletas: ${err}`);
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    let unlisten: (() => void) | undefined;
  
    const setupListener = async () => {
      try {
        unlisten = await listen('window-data', (event) => {
          if (isIWindowDataPayload(event.payload)) {
            const cliente_id = event.payload.clientId;
            
            if (typeof cliente_id === 'number' && cliente_id > 0) {
                listarColetasRefentes(cliente_id); 
            } else {
                console.error('Dados recebidos, mas ID do Cliente é inválido (null/0/undefined):', event.payload);
                setError("Dados de Cliente inválidos recebidos da janela principal.");
                setLoading(false);
            }

          } else {
            console.error('Dados recebidos não são do tipo esperado:', event.payload);
            setError(`Dados recebidos não são do tipo esperado: ${JSON.stringify(event.payload)}`);
            setLoading(false);
          }
        });
  
        await emit('window-ready');
      } catch (error) {
        console.error('Erro ao configurar listener:', error);
        setError(`Erro ao inicializar: ${error}`);
        setLoading(false);
      }
    };
  
    setupListener();
  
    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [listarColetasRefentes]); 


  const handleCloseWindow = () => {
    // Implementação real para fechar a janela Tauri
    console.log("[TAURI LOGIC] Fechando a janela de seleção.");
    // A implementação real dependeria da API window do tauri, que não está importada aqui
    // Exemplo: import { appWindow } from '@tauri-apps/api/window'; appWindow.close();
  };

  const handleSelecionarAmostras = () => {
    if (amostrasSelecionadas.length > 0) {
      // Converte os IDs selecionados de string para número
      const selectedIds = amostrasSelecionadas.map(id => parseInt(id, 10));

      if (instanciaOrigem) {
        // Envia os IDs selecionados para o método da janela de origem
        instanciaOrigem.someMethod(selectedIds); 
      }
      
      // Emite um evento para a janela principal com os dados selecionados, se necessário (Tauri)
      emit('amostras-selecionadas', {
        coletaId: coletaSelecionadaId,
        amostraIds: selectedIds
      });

      handleCloseWindow();
    }
  };

  const handleColetaChange = (coletaId: number) => {
    setColetaSelecionadaId(coletaId);
    setAmostrasSelecionadas([]); 

    const coleta = coletasDisponiveis.find(c => c.id === coletaId);
    if (coleta) {
      setAmostrasDaColetaSelecionada(coleta.amostras);
    } else {
      setAmostrasDaColetaSelecionada([]);
    }
  };

  const handleToggleAmostra = (amostraId: number) => {
    const idString = amostraId.toString();
    const amostra = amostrasDaColetaSelecionada.find(a => a.id === amostraId);
    
    // Só permite selecionar se o status for 'Disponível'
    if (!amostra || getAmostraStatus(amostra) !== 'Disponível') return; 

    setAmostrasSelecionadas(prev => 
      prev.includes(idString) 
        ? prev.filter(id => id !== idString)
        : [...prev, idString]
    );
  };

  const getAmostraStatus = (amostra: ColetaAmostra): 'Disponível' | 'Coletada' => {
      return amostra.idusuario !== null ? 'Coletada' : 'Disponível';
  }

  const getStatusStyle = (status: 'Disponível' | 'Coletada') => {
    switch (status) {
      case 'Disponível': return { ...styles.amostraStatus, ...styles.statusDisponivel };
      case 'Coletada': return { ...styles.amostraStatus, ...styles.statusColetada };
      default: return styles.amostraStatus;
    }
  };
  
  const amostrasAtual = amostrasDaColetaSelecionada;

  // --- STYLES ---
  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#f0fdf4', // Verde claro
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto', // FORÇA O SCROLL VERTICAL NO CONTAINER PRINCIPAL
    },
    header: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', // Tons de verde
      color: 'white',
      padding: '1.5rem 2rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      position: 'sticky' as const,
      top: 0,
      zIndex: 10
    },
    headerContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%'
    },
    headerTitle: {
      fontSize: 'clamp(1.5rem, 4vw, 2rem)',
      fontWeight: '700',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      margin: 0
    },
    closeButton: {
      background: 'rgba(255, 255, 255, 0.2)',
      border: 'none',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      color: 'white',
      transition: 'all 0.2s ease',
      fontSize: '20px'
    },
    main: {
      flex: 1,
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
      width: '100%',
      boxSizing: 'border-box' as const
    },
    gridContainer: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '2rem',
      marginBottom: '2rem'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 25px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb',
      overflow: 'hidden'
    },
    cardHeader: {
      padding: '1.5rem',
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb' // Branco suave
    },
    cardTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#065f46', // Verde escuro
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    cardBody: {
      padding: '1.5rem'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0.5rem',
      marginBottom: '1.5rem'
    },
    label: {
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#065f46' // Verde escuro
    },
    input: {
      width: '100%',
      padding: '0.75rem 1rem',
      border: '2px solid #a7f3d0', // Borda verde clara
      borderRadius: '8px',
      fontSize: '0.875rem',
      outline: 'none',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box' as const,
      backgroundColor: '#ecfdf5' // Verde muito claro
    },
    select: {
      width: '100%',
      padding: '0.75rem 1rem',
      border: '2px solid #a7f3d0', // Borda verde clara
      borderRadius: '8px',
      fontSize: '0.875rem',
      outline: 'none',
      backgroundColor: 'white',
      cursor: 'pointer',
      boxSizing: 'border-box' as const,
      color: '#065f46'
    },
    amostrasContainer: {
      gridColumn: 'span 2',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 25px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb',
      overflow: 'hidden'
    },
    amostrasGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '1rem',
      padding: '1.5rem'
    },
    amostraCard: {
      backgroundColor: '#f0fdf4', // Verde claro para o card
      border: '1px solid #a7f3d0', // Borda verde
      borderRadius: '10px',
      padding: '1rem',
      position: 'relative' as const,
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'space-between',
      cursor: 'pointer', // Mantido para o clique no card abrir o modal
      transition: 'all 0.2s ease',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    },
    amostraCardSelected: {
      borderColor: '#059669', // Verde mais escuro para seleção
      boxShadow: '0 0 0 3px #34d399', // Anel verde para seleção
      backgroundColor: '#dcfce7' // Fundo verde ainda mais claro
    },
    amostraHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.5rem'
    },
    amostraStatus: {
      fontSize: '0.75rem',
      fontWeight: '600',
      padding: '0.25rem 0.5rem',
      borderRadius: '4px',
      textTransform: 'uppercase' as const
    },
    statusDisponivel: {
      backgroundColor: '#dcfce7', // Verde claro
      color: '#065f46' // Verde escuro
    },
    statusColetada: {
      backgroundColor: '#e0f2fe', // Azul claro (manter para diferenciar)
      color: '#0369a1' // Azul escuro
    },
    emptyState: {
      textAlign: 'center' as const,
      color: '#6b7280',
      fontSize: '1rem',
      padding: '3rem 1.5rem',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: '1rem',
    },
    actionButtons: {
      display: 'flex',
      gap: '0.75rem',
      justifyContent: 'center',
      marginTop: '2rem',
      padding: '2rem',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb'
    },
    primaryButton: {
      backgroundColor: '#059669', // Verde principal
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '0.75rem 2rem',
      fontSize: '0.875rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    secondaryButton: {
      backgroundColor: '#f0fdf4', // Verde muito claro
      color: '#065f46', // Verde escuro
      border: '2px solid #a7f3d0', // Borda verde clara
      borderRadius: '8px',
      padding: '0.75rem 2rem',
      fontSize: '0.875rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    modalBackdrop: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // Fundo mais escuro para o modal
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '700px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
        maxHeight: '90vh',
        overflowY: 'auto',
        animation: 'fadeIn 0.3s'
    },
    modalHeader: {
        padding: '1.5rem',
        borderBottom: '1px solid #d1fae5', // Borda verde clara
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ecfdf5', // Verde muito claro
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
    },
    modalTitle: {
        fontSize: '1.5rem',
        fontWeight: '700',
        color: '#047857', // Verde escuro
        margin: 0
    },
    modalCloseButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#065f46', // Verde escuro
        transition: 'color 0.2s ease'
    },
    modalBody: {
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '1.5rem'
    },
    modalSection: {
        backgroundColor: '#f0fdf4', // Verde claro
        padding: '1rem',
        borderRadius: '8px',
        border: '1px solid #a7f3d0' // Borda verde
    },
    sectionTitle: {
        fontSize: '1.125rem',
        fontWeight: '600',
        color: '#065f46', // Verde escuro
        borderBottom: '1px solid #d1fae5', // Borda verde clara
        paddingBottom: '0.5rem',
        marginBottom: '0.5rem',
        display: 'flex',
        alignItems: 'center'
    },
    detailGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.75rem',
        marginTop: '0.75rem'
    },
    detailItem: {
        display: 'flex',
        flexDirection: 'column' as const,
        padding: '0.5rem 0'
    },
    detailLabel: {
        fontSize: '0.75rem',
        fontWeight: '500',
        color: '#16a34a', // Verde médio
        textTransform: 'uppercase' as const
    },
    detailValue: {
        fontSize: '0.9rem',
        fontWeight: '700',
        color: '#064e3b' // Verde muito escuro
    },
    detailsButton: {
        position: 'absolute' as const,
        top: '8px',
        right: '8px',
        background: 'transparent',
        border: 'none',
        color: '#10b981', // Verde
        cursor: 'pointer',
        padding: '4px',
        borderRadius: '4px',
        transition: 'color 0.2s ease, background-color 0.2s ease',
        zIndex: 5
    },
  };
    const isMobile = window.innerWidth <= 768;
    const isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;
    if (isMobile) {
        styles.gridContainer = { ...styles.gridContainer, gridTemplateColumns: '1fr', gap: '1rem' };
        styles.amostrasContainer = { ...styles.amostrasContainer, gridColumn: 'span 1' };
        styles.amostrasGrid = { ...styles.amostrasGrid, gridTemplateColumns: '1fr', padding: '1rem' };
        styles.main = { ...styles.main, padding: '1rem' };
        styles.header = { ...styles.header, padding: '1rem' };
        styles.actionButtons = { ...styles.actionButtons, flexDirection: 'column' as const, padding: '1rem' };
        styles.detailGrid = { ...styles.detailGrid, gridTemplateColumns: '1fr' };
    }
    if (isTablet) {
        styles.amostrasGrid = { ...styles.amostrasGrid, gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' };
    }


  return (
    <div style={styles.container}>
      {isModalOpen && selectedAmostraForModal && coletaSelecionadaObj && (
          <AmostraDetalheModal 
              amostra={selectedAmostraForModal}
              coleta={coletaSelecionadaObj}
              onClose={() => setIsModalOpen(false)}
              styles={styles}
          />
      )}
      
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.headerTitle}>
            <MapPin size={isMobile ? 24 : 28} />
            Seleção de Coletas para Análise
          </h1>
          <button 
            style={styles.closeButton} 
            onClick={handleCloseWindow}
          >
            <X size={20} />
          </button>
        </div>
      </header>
      
      <main style={styles.main}>
        {error && (
            <div style={{ padding: '1rem', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #fca5a5' }}>
                Erro: {error}
            </div>
        )}
        <div style={styles.gridContainer}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>
                <Users size={20} />
                Cliente
              </h2>
            </div>
            <div style={styles.cardBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nome do Cliente</label>
                <input
                  type="text"
                  style={styles.input}
                  value={cliente}
                  readOnly
                />
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>
                <Calendar size={20} />
                Seleção da Coleta
              </h2>
            </div>
            <div style={styles.cardBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Coleta Referente</label>
                {loading ? (
                    <div style={{...styles.input, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#065f46'}}>
                        <Loader2 size={16} className="animate-spin" /> Carregando coletas...
                    </div>
                ) : (
                    <select
                        style={styles.select}
                        value={coletaSelecionadaId ?? ''}
                        onChange={(e) => handleColetaChange(Number(e.target.value))}
                        disabled={coletasDisponiveis.length === 0}
                    >
                        {coletasDisponiveis.length === 0 ? (
                            <option value="">Nenhuma coleta disponível</option>
                        ) : (
                            coletasDisponiveis.map(c => (
                                <option key={c.id} value={c.id}>
                                    Coleta #{c.numero ?? 'S/Nº'} - {c.ano || 'S/Ano'} (ID: {c.id})
                                </option>
                            ))
                        )}
                    </select>
                )}
              </div>
            </div>
          </div>

          <div style={styles.amostrasContainer}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>
                <Droplets size={20} />
                Amostras Disponíveis ({amostrasAtual.length})
                {amostrasSelecionadas.length > 0 && (
                  <span style={{
                    backgroundColor: '#059669',
                    color: 'white',
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '12px',
                    marginLeft: '0.5rem'
                  }}>
                    {amostrasSelecionadas.length} selecionada(s)
                  </span>
                )}
              </h2>
            </div>
            
            {loading || amostrasAtual.length === 0 ? (
                <div style={styles.emptyState}>
                    {loading ? (
                        <>
                            <Loader2 size={32} color="#10b981" className="animate-spin" />
                            <p style={{color: '#065f46'}}>Carregando amostras...</p>
                        </>
                    ) : (
                        <>
                            <Droplets size={48} color="#a7f3d0" />
                            <p style={{color: '#065f46'}}>Nenhuma coleta ou amostra disponível para seleção.</p>
                        </>
                    )}
                </div>
            ) : (
              <div style={styles.amostrasGrid}>
                {amostrasAtual.map((amostra) => {
                  const amostraIdString = amostra.id.toString();
                  const isSelected = amostrasSelecionadas.includes(amostraIdString);
                  const status = getAmostraStatus(amostra);
                  const isAvailable = status === 'Disponível';

                  return (
                    // CLIQUE NO CARD ABRE O MODAL
                    <div
                      key={amostra.id}
                      style={{
                        ...styles.amostraCard,
                        ...(isSelected ? styles.amostraCardSelected : {}),
                        cursor: 'pointer',
                      }}
                      onClick={() => handleAmostraClick(amostra)} 
                    >

                      <div style={styles.amostraHeader}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#064e3b' }}>
                          {amostra.identificacao ?? `Amostra #${amostra.id}`}
                        </h3>
                        {/* CLIQUE AQUI GERE O TOGGLE DE SELEÇÃO */}
                        <div 
                            onClick={(e) => {
                                e.stopPropagation(); // IMPEDE QUE O CLIQUE ABRA O MODAL
                                handleToggleAmostra(amostra.id);
                            }}
                            style={{
                                cursor: 'pointer',
                                // Usa cores de check box
                                color: (isSelected ? '#059669' : '#10b981')  
                            }}
                            title={ (isSelected ? 'Remover Seleção' : 'Selecionar Amostra')}
                        >
                             <CheckCircle 
                                size={22} 
                                fill={isSelected ? '#059669' : 'transparent'} // Preenche quando selecionado
                                stroke={isSelected ? 'white' : 'currentColor'} // Borda branca ou da cor do ícone
                             />
                        </div>
                      </div>

                      <p style={{ margin: '0.5rem 0', fontSize: '0.875rem', color: '#065f46' }}>
                        Frasco: {amostra.identificacao_frasco || 'N/A'}
                      </p>
                      <div style={getStatusStyle(status)}>
                        {status}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div style={styles.actionButtons}>
          <button 
            style={styles.secondaryButton}
            onClick={handleCloseWindow}
          >
            Cancelar
          </button>
          <button 
            style={{
              ...styles.primaryButton,
              opacity: amostrasSelecionadas.length > 0 ? 1 : 0.6,
            
            }}
            onClick={handleSelecionarAmostras}

          >
            <CheckCircle size={16} />
            Selecionar {amostrasSelecionadas.length} Amostra(s)
          </button>
        </div>
      </main>
    </div>
  );
};

export default SelecionarColetasView;