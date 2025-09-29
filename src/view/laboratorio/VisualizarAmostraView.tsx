import React, { useState, useEffect } from 'react';
import { X, Eye, FileText, Printer, Search, Settings } from 'lucide-react';
import { listen, emit } from '@tauri-apps/api/event';

export interface ICadastrarAmostraInstance {
  someMethod: () => void;
}

const VisualizarAmostraView: React.FC = () => {
  const [cliente, setCliente] = useState('BIOMA AMBIENTAL');
  const [amostra, setAmostra] = useState('');
  const [entrada, setEntrada] = useState('');
  const [ate, setAte] = useState('');
  const [coletadoPor, setColetadoPor] = useState('');
  const [protocolo, setProtocolo] = useState('');
  const [identificacao, setIdentificacao] = useState('');
  const [relatorio, setRelatorio] = useState('');
  const [pop, setPop] = useState('');
  const [terceirizacao, setTerceirizacao] = useState('');
  const [consultor, setConsultor] = useState('');
  const [cidade, setCidade] = useState('');
  const [mostrarProtocoloCliente, setMostrarProtocoloCliente] = useState(false);
  const [primeiraVersao, setPrimeiraVersao] = useState(false);
  const [legislacao, setLegislacao] = useState('');
  const [parametro, setParametro] = useState('');
  const [laboratorio, setLaboratorio] = useState('');
  const [totalResultados, setTotalResultados] = useState('0');
  const [instanciaOrigem, setInstanciaOrigem] = useState<ICadastrarAmostraInstance | null>(null);

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

  const handleLimpar = () => {
    if (instanciaOrigem) {
      instanciaOrigem.someMethod();
    }
  };

  const handleImprimir = () => { /* ... */ };
  const handleGerarControleQualidade = () => { /* ... */ };
  const handleGerarDadosAmostragem = () => { /* ... */ };
  const handleBuscar = () => { /* ... */ };

  // Estilos responsivos
  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      width: '100vw',
      height: '100vh',
      backgroundColor: '#f8fafc',
      padding: '16px',
      boxSizing: 'border-box',
      overflow: 'auto'
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
      width: '100%',
      height: '100%',
      maxHeight: '100%',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid #e5e7eb',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 24px',
      borderBottom: '1px solid #e5e7eb',
      background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
      color: 'white',
      flexShrink: 0
    },
    headerTitle: {
      fontSize: 'clamp(18px, 2.5vw, 24px)',
      fontWeight: '700',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      margin: 0
    },
    body: {
      display: 'flex',
      flex: 1,
      overflow: 'hidden',
      flexDirection: 'row'
    },
    leftPanel: {
      flex: 1,
      padding: '24px',
      overflow: 'auto',
      minWidth: '300px'
    },
    rightPanel: {
      width: 'clamp(280px, 25vw, 350px)',
      padding: '24px',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      borderLeft: '1px solid #e5e7eb',
      overflow: 'auto'
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))',
      gap: '16px',
      marginBottom: '20px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      minWidth: '0'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '6px'
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      outline: 'none',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box'
    },
    inputReadOnly: {
      backgroundColor: '#f9fafb',
      color: '#6b7280',
      cursor: 'not-allowed'
    },
    select: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      outline: 'none',
      backgroundColor: 'white',
      cursor: 'pointer',
      boxSizing: 'border-box'
    },
    checkboxContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      margin: '16px 0',
      cursor: 'pointer'
    },
    checkbox: {
      width: '16px',
      height: '16px',
      accentColor: '#059669',
      cursor: 'pointer'
    },
    checkboxLabel: {
      fontSize: '14px',
      color: '#374151',
      cursor: 'pointer'
    },
    button: {
      width: '100%',
      padding: '12px 16px',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      whiteSpace: 'nowrap'
    },
    primaryButton: {
      backgroundColor: '#3b82f6',
      color: 'white'
    },
    successButton: {
      backgroundColor: '#059669',
      color: 'white'
    },
    warningButton: {
      backgroundColor: '#f59e0b',
      color: 'white'
    },
    infoButton: {
      backgroundColor: '#06b6d4',
      color: 'white'
    },
    dangerButton: {
      backgroundColor: '#ef4444',
      color: 'white'
    },
    totalSection: {
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '20px',
      textAlign: 'center'
    },
    totalLabel: {
      fontSize: '14px',
      color: '#6b7280',
      marginBottom: '12px'
    },
    totalValue: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1f2937'
    },
    totalInputContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    },
    totalInput: {
      width: '80px',
      padding: '8px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '20px',
      fontWeight: '700',
      textAlign: 'center'
    }
  };



  return (
    <div style={styles.container}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.headerTitle}>
            <Eye size={28} />
            Visualizar amostra
          </h2>
        </div>
        
        <div style={{...styles.body}}>
          <div style={{...styles.leftPanel}}>
            <div style={{...styles.formGrid}}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Cliente</label>
                <input
                  type="text"
                  style={{...styles.input, ...styles.inputReadOnly}}
                  value={cliente}
                  readOnly
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Amostra</label>
                <input
                  type="text"
                  style={styles.input}
                  value={amostra}
                  onChange={(e) => setAmostra(e.target.value)}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Entrada</label>
                <input
                  type="text"
                  style={styles.input}
                  value={entrada}
                  onChange={(e) => setEntrada(e.target.value)}
                  placeholder="//"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>até</label>
                <input
                  type="text"
                  style={styles.input}
                  value={ate}
                  onChange={(e) => setAte(e.target.value)}
                  placeholder="//"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Coletado por</label>
                <select
                  style={styles.select}
                  value={coletadoPor}
                  onChange={(e) => setColetadoPor(e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="cliente">Cliente</option>
                  <option value="laboratorio">Laboratório</option>
                  <option value="terceirizado">Terceirizado</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Protocolo</label>
                <input
                  type="text"
                  style={styles.input}
                  value={protocolo}
                  onChange={(e) => setProtocolo(e.target.value)}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Identificação</label>
                <input
                  type="text"
                  style={styles.input}
                  value={identificacao}
                  onChange={(e) => setIdentificacao(e.target.value)}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Consultor</label>
                <select
                  style={styles.select}
                  value={consultor}
                  onChange={(e) => setConsultor(e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="consultor1">Consultor 1</option>
                  <option value="consultor2">Consultor 2</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Cidade</label>
                <input
                  type="text"
                  style={styles.input}
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                />
              </div>
            </div>

            <div style={styles.checkboxContainer}>
              <input
                type="checkbox"
                style={styles.checkbox}
                checked={mostrarProtocoloCliente}
                onChange={(e) => setMostrarProtocoloCliente(e.target.checked)}
              />
              <span style={styles.checkboxLabel}>Mostrar protocolo do cliente</span>
            </div>

            <div style={{...styles.formGrid}}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Relatório</label>
                <select
                  style={styles.select}
                  value={relatorio}
                  onChange={(e) => setRelatorio(e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="relatorio1">Relatório 1</option>
                  <option value="relatorio2">Relatório 2</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>POP</label>
                <select
                  style={styles.select}
                  value={pop}
                  onChange={(e) => setPop(e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="pop1">POP 1</option>
                  <option value="pop2">POP 2</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Terceirização</label>
                <select
                  style={styles.select}
                  value={terceirizacao}
                  onChange={(e) => setTerceirizacao(e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="terceirizado1">Terceirizado 1</option>
                  <option value="terceirizado2">Terceirizado 2</option>
                </select>
              </div>
            </div>

            <div style={styles.checkboxContainer}>
              <input
                type="checkbox"
                style={styles.checkbox}
                checked={primeiraVersao}
                onChange={(e) => setPrimeiraVersao(e.target.checked)}
              />
              <span style={styles.checkboxLabel}>Primeira versão</span>
            </div>

            <div style={{...styles.formGrid}}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Legislação</label>
                <select
                  style={styles.select}
                  value={legislacao}
                  onChange={(e) => setLegislacao(e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="portaria-2914">Portaria 2914/2011</option>
                  <option value="resolucao-357">Resolução CONAMA 357/2005</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Parâmetro</label>
                <select
                  style={styles.select}
                  value={parametro}
                  onChange={(e) => setParametro(e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="ph">pH</option>
                  <option value="turbidez">Turbidez</option>
                  <option value="cloro">Cloro Residual</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Laboratório</label>
                <select
                  style={styles.select}
                  value={laboratorio}
                  onChange={(e) => setLaboratorio(e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="lab1">Laboratório Principal</option>
                  <option value="lab2">Laboratório Terceirizado</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{...styles.rightPanel}}>
            <div style={styles.totalSection}>
              <div style={styles.totalLabel}>Total de resultados:</div>
              <div style={styles.totalInputContainer}>
                <input
                  type="number"
                  style={styles.totalInput}
                  value={totalResultados}
                  onChange={(e) => setTotalResultados(e.target.value)}
                />
              </div>
            </div>

            <button 
              style={{...styles.button, ...styles.primaryButton}}
              onClick={handleLimpar}
            >
              Limpar
            </button>

            <button 
              style={{...styles.button, ...styles.warningButton}}
              onClick={handleImprimir}
            >
              <Printer size={16} />
              Imprimir
            </button>

            <button 
              style={{...styles.button, ...styles.successButton}}
              onClick={handleGerarControleQualidade}
            >
              <Settings size={16} />
              Gerar controle de qualidade
            </button>

            <button 
              style={{...styles.button, ...styles.infoButton}}
              onClick={handleGerarDadosAmostragem}
            >
              <FileText size={16} />
              Gerar dados de amostragem
            </button>

            <button 
              style={{...styles.button, ...styles.primaryButton}}
              onClick={handleBuscar}
            >
              <Search size={16} />
              Buscar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualizarAmostraView;