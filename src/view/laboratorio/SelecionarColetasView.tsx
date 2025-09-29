import React, { useState, useEffect } from 'react';
import { X, MapPin, CheckCircle, Users, Calendar, Droplets } from 'lucide-react';
import { listen, emit } from '@tauri-apps/api/event';

// A tela filha não é um modal, então removemos as propriedades de controle de estado.
// A interface continua a mesma, pois representa a instância da tela-mãe.
export interface ICadastrarAmostraInstance {
  someMethod: () => void;
  // Adicione outras propriedades ou métodos que a tela filha precisa acessar da tela-mãe
}

// O componente agora é uma tela independente, e não um modal.
const SelecionarColetasView: React.FC = () => {
  const [cliente, setCliente] = useState('BIOMA AMBIENTAL');
  const [coleta, setColeta] = useState('');
  const [instanciaOrigem, setInstanciaOrigem] = useState<ICadastrarAmostraInstance | null>(null);

  // Mock data para as amostras (seria carregado baseado na coleta selecionada)
  const amostrasDisponiveis = {
    'coleta-001': [
      { id: '001', nome: 'Amostra A1 - Entrada', tipo: 'Água Potável', status: 'Disponível' },
      { id: '002', nome: 'Amostra A2 - Saída', tipo: 'Água Potável', status: 'Disponível' },
      { id: '003', nome: 'Amostra A3 - Reservatório', tipo: 'Água Potável', status: 'Em análise' }
    ],
    'coleta-002': [
      { id: '004', nome: 'Amostra B1 - Entrada', tipo: 'Efluente Industrial', status: 'Disponível' },
      { id: '005', nome: 'Amostra B2 - Tratamento', tipo: 'Efluente Industrial', status: 'Disponível' }
    ],
    'coleta-003': [
      { id: '006', nome: 'Amostra C1 - Poço 1', tipo: 'Água Subterrânea', status: 'Disponível' },
      { id: '007', nome: 'Amostra C2 - Poço 2', tipo: 'Água Subterrânea', status: 'Disponível' },
      { id: '008', nome: 'Amostra C3 - Poço 3', tipo: 'Água Subterrânea', status: 'Coletada' }
    ],
    'coleta-004': [
      { id: '009', nome: 'Amostra D1 - Rio Principal', tipo: 'Água Superficial', status: 'Disponível' },
      { id: '010', nome: 'Amostra D2 - Afluente Norte', tipo: 'Água Superficial', status: 'Disponível' }
    ]
  };

  const [amostrasSelecionadas, setAmostrasSelecionadas] = useState<string[]>([]);

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'auto'
    },
    header: {
      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
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
      backgroundColor: '#fafafa'
    },
    cardTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#111827',
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
      color: '#374151'
    },
    input: {
      width: '100%',
      padding: '0.75rem 1rem',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '0.875rem',
      outline: 'none',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box' as const,
      backgroundColor: '#f9fafb'
    },
    select: {
      width: '100%',
      padding: '0.75rem 1rem',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '0.875rem',
      outline: 'none',
      backgroundColor: 'white',
      cursor: 'pointer',
      boxSizing: 'border-box' as const
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
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      padding: '1rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      backgroundColor: 'white'
    },
    amostraCardSelected: {
      borderColor: '#059669',
      backgroundColor: '#f0fdf4'
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
      backgroundColor: '#dcfce7',
      color: '#166534'
    },
    statusAnalise: {
      backgroundColor: '#fef3c7',
      color: '#92400e'
    },
    statusColetada: {
      backgroundColor: '#dbeafe',
      color: '#1e40af'
    },
    emptyState: {
      textAlign: 'center' as const,
      color: '#6b7280',
      fontSize: '1rem',
      padding: '3rem 1.5rem'
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
      backgroundColor: '#3b82f6',
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
      backgroundColor: '#f3f4f6',
      color: '#374151',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      padding: '0.75rem 2rem',
      fontSize: '0.875rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }
  };

  // Media queries usando JavaScript
  const isMobile = window.innerWidth <= 768;
  const isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;

  // Ajustar estilos para mobile
  if (isMobile) {
    styles.gridContainer = {
      ...styles.gridContainer,
      gridTemplateColumns: '1fr',
      gap: '1rem'
    };
    styles.amostrasContainer = {
      ...styles.amostrasContainer,
      gridColumn: 'span 1'
    };
    styles.amostrasGrid = {
      ...styles.amostrasGrid,
      gridTemplateColumns: '1fr',
      padding: '1rem'
    };
    styles.main = {
      ...styles.main,
      padding: '1rem'
    };
    styles.header = {
      ...styles.header,
      padding: '1rem'
    };
    styles.actionButtons = {
      ...styles.actionButtons,
      flexDirection: 'column' as const,
      padding: '1rem'
    };
  }

  // Ajustar estilos para tablet
  if (isTablet) {
    styles.amostrasGrid = {
      ...styles.amostrasGrid,
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))'
    };
  }

  function isICadastrarAmostraInstance(obj: unknown): obj is ICadastrarAmostraInstance {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'someMethod' in obj &&
      typeof (obj as ICadastrarAmostraInstance).someMethod === 'function'
    );
  }

  useEffect(() => {
    let unlisten: (() => void) | undefined;
  
    const setupListener = async () => {
      try {
        unlisten = await listen('window-data', (event) => {
          if (isICadastrarAmostraInstance(event.payload)) {
            console.log('Dados recebidos da janela pai:', event.payload);
            setInstanciaOrigem(event.payload);
          } else {
            console.error('Dados recebidos não são do tipo esperado.');
          }
        });
  
        await emit('window-ready');
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
  }, []);

  // Lógica para fechar a janela, pois não há um onClose.
  const handleCloseWindow = () => {
    // Você pode usar o método close do Tauri
    // window.__TAURI__.window.getCurrent().close();
  };

  // Esta função agora pode se comunicar com a tela-mãe via a instância recebida
  const handleSelecionarAmostras = () => {
    if (instanciaOrigem && amostrasSelecionadas.length > 0) {
      instanciaOrigem.someMethod();
      // Opcional: fechar a janela após a ação
      handleCloseWindow();
    }
  };

  const handleToggleAmostra = (amostraId: string) => {
    setAmostrasSelecionadas(prev => 
      prev.includes(amostraId) 
        ? prev.filter(id => id !== amostraId)
        : [...prev, amostraId]
    );
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Disponível': return { ...styles.amostraStatus, ...styles.statusDisponivel };
      case 'Em análise': return { ...styles.amostraStatus, ...styles.statusAnalise };
      case 'Coletada': return { ...styles.amostraStatus, ...styles.statusColetada };
      default: return styles.amostraStatus;
    }
  };

  const amostrasAtual = coleta ? amostrasDisponiveis[coleta as keyof typeof amostrasDisponiveis] || [] : [];

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.headerTitle}>
            <MapPin size={isMobile ? 24 : 28} />
            Informações de Coleta
          </h1>
          <button 
            style={styles.closeButton} 
            onClick={handleCloseWindow}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            <X size={20} />
          </button>
        </div>
      </header>
      
      <main style={styles.main}>
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
                  onChange={(e) => setCliente(e.target.value)}
                  readOnly
                />
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>
                <Calendar size={20} />
                Coleta
              </h2>
            </div>
            <div style={styles.cardBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Selecionar Coleta</label>
                <select
                  style={styles.select}
                  value={coleta}
                  onChange={(e) => {
                    setColeta(e.target.value);
                    setAmostrasSelecionadas([]);
                  }}
                >
                  <option value="">Selecione uma coleta</option>
                  <option value="coleta-001">Coleta 001 - Água Potável</option>
                  <option value="coleta-002">Coleta 002 - Efluente Industrial</option>
                  <option value="coleta-003">Coleta 003 - Água Subterrânea</option>
                  <option value="coleta-004">Coleta 004 - Água Superficial</option>
                </select>
              </div>
            </div>
          </div>

          <div style={styles.amostrasContainer}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>
                <Droplets size={20} />
                Amostras Disponíveis
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
            
            {!coleta ? (
              <div style={styles.emptyState}>
                <Droplets size={48} color="#d1d5db" />
                <p>Selecione uma coleta para visualizar as amostras disponíveis</p>
              </div>
            ) : amostrasAtual.length === 0 ? (
              <div style={styles.emptyState}>
                <p>Nenhuma amostra encontrada para esta coleta</p>
              </div>
            ) : (
              <div style={styles.amostrasGrid}>
                {amostrasAtual.map((amostra) => (
                  <div
                    key={amostra.id}
                    style={{
                      ...styles.amostraCard,
                      ...(amostrasSelecionadas.includes(amostra.id) ? styles.amostraCardSelected : {})
                    }}
                    onClick={() => amostra.status === 'Disponível' && handleToggleAmostra(amostra.id)}
                  >
                    <div style={styles.amostraHeader}>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                        {amostra.nome}
                      </h3>
                      {amostrasSelecionadas.includes(amostra.id) && (
                        <CheckCircle size={20} color="#059669" />
                      )}
                    </div>
                    <p style={{ margin: '0.5rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                      {amostra.tipo}
                    </p>
                    <div style={getStatusStyle(amostra.status)}>
                      {amostra.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={styles.actionButtons}>
          <button 
            style={styles.secondaryButton}
            onClick={handleCloseWindow}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
          >
            Cancelar
          </button>
          <button 
            style={{
              ...styles.primaryButton,
              opacity: amostrasSelecionadas.length > 0 ? 1 : 0.5,
              cursor: amostrasSelecionadas.length > 0 ? 'pointer' : 'not-allowed'
            }}
            onClick={handleSelecionarAmostras}
            disabled={amostrasSelecionadas.length === 0}
            onMouseEnter={(e) => {
              if (amostrasSelecionadas.length > 0) {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (amostrasSelecionadas.length > 0) {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
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