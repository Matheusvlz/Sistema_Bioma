import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Calendar,
  Clock,
  FlaskConical,
  AlertCircle,
  Loader,
  Save,
  ChevronDown,
  CheckCircle,
  Building,
  FileText,
  Edit,
  Eye,
} from "lucide-react";
import { listen, emit } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import styles from './styles/AmostraNaoIniciada.module.css';
import { WindowManager } from '../../hooks/WindowManager';


interface WindowData {
  idAnalise: number;
  idUsuario: number;
}

interface Parametro {
  id: number;
  nome_parametro: string;
  grupo_parametro: string;
  tecnica_nome: string;
  unidade: string;
  limite: string;
  resultado: string;
}

interface AmostraDetalhes {
  id_amostra: number;
  numero: string;
  identificacao: string;
  complemento: string;
  data_coleta: string;
  hora_coleta: string;
  data_entrada_lab: string;
  hora_entrada_lab: string;
  data_inicio_analise: string;
  parametros: Parametro[];
}

interface TauriResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const AmostraNaoIniciadaView: React.FC = () => {
  const [windowData, setWindowData] = useState<WindowData | null>(null);
  const [detalhes, setDetalhes] = useState<AmostraDetalhes | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataInicio, setDataInicio] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [jaIniciada, setJaIniciada] = useState(false);

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

  const formatarData = (e: React.ChangeEvent<HTMLInputElement>): void => {
    let valor = e.target.value.replace(/\D/g, "");
    if (valor.length >= 2) valor = valor.slice(0, 2) + "/" + valor.slice(2);
    if (valor.length >= 5) valor = valor.slice(0, 5) + "/" + valor.slice(5, 9);
    setDataInicio(valor);
  };

  const formatarHora = (e: React.ChangeEvent<HTMLInputElement>): void => {
    let valor = e.target.value.replace(/\D/g, "");
    if (valor.length >= 2) valor = valor.slice(0, 2) + ":" + valor.slice(2, 4);
    setHoraInicio(valor);
  };

  // Função para abrir janela de resultados
const abrirJanelaResultados = useCallback(async () => {
    if (!windowData) return;

    // 1. Cria o objeto 'amostra' com as propriedades de windowData
    const dadosJanela: WindowData = {
        idAnalise: windowData.idAnalise,
        idUsuario: windowData.idUsuario,
    };

    // 2. Chama WindowManager.openResultados, passando o objeto 'dadosJanela'
    //    como o argumento 'amostra' (o parâmetro opcional 'amostra' da função openResultados)
    WindowManager.openResultados(dadosJanela);
    
}, [windowData, detalhes]);

  const carregarDetalhes = useCallback(async (idAnalise: number) => {
    setLoading(true);
    setError(null);
    try {
      console.log("🔍 Carregando detalhes da amostra ID:", idAnalise);
     
      const response = await invoke("obter_detalhes_amostra", { 
        idAnalise: idAnalise
      }) as TauriResponse<AmostraDetalhes>;
      
      console.log("✅ Resposta recebida:", response);

      if (response.success && response.data) {
        setDetalhes(response.data);
        
        // Verificar se a amostra já foi iniciada
        const iniciada = response.data.data_inicio_analise !== null && 
                         response.data.data_inicio_analise !== '';
        setJaIniciada(iniciada);

        if (!iniciada) {
          // Se não iniciada, inicializar com data/hora atual
          const agora = new Date();
          const dataAtual = agora.toLocaleDateString('pt-BR');
          const horaAtual = agora.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          setDataInicio(dataAtual);
          setHoraInicio(horaAtual);
        } else {
          setDataInicio("");
          setHoraInicio("");
        }
        
        // Inicializar grupos expandidos
        const grupos: Record<string, boolean> = {};
        response.data.parametros.forEach(p => {
          grupos[p.grupo_parametro] = true;
        });
        setExpandedGroups(grupos);
      } else {
        setError(response.message || "Erro ao carregar detalhes");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao conectar com o backend");
      console.error("Erro:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleIniciarAmostra = async () => {
    if (!windowData) {
      setError("Dados da janela não recebidos.");
      return;
    }

    if (jaIniciada) {
      setError("Esta amostra já foi iniciada. Use o botão 'Cadastrar Resultados'.");
      return;
    }

    if (!dataInicio.trim()) {
      setError("Por favor, informe a data de início");
      return;
    }

    if (!validarData(dataInicio)) {
      setError("Data inválida. Use formato DD/MM/YYYY");
      return;
    }

    if (!horaInicio.trim()) {
      setError("Por favor, informe a hora de início");
      return;
    }

    if (!validarHora(horaInicio)) {
      setError("Hora inválida. Use formato HH:MM");
      return;
    }

    setSalvando(true);
    setError(null);

    try {
      const response = await invoke("iniciar_amostra_analise", {
        idAnalise: windowData.idAnalise,
        dataInicio: dataInicio,
        horaInicio: horaInicio,
        idUsuario: windowData.idUsuario,
      }) as TauriResponse<any>;

      if (response.success) {
        await emit('amostra-iniciada-sucesso', { idAnalise: windowData.idAnalise });
        alert("Amostra iniciada com sucesso!");
        
        // Recarregar detalhes para atualizar o estado
        await carregarDetalhes(windowData.idAnalise);
        
        // Abrir automaticamente a janela de resultados
        setTimeout(() => {
          abrirJanelaResultados();
        }, 500);
      } else {
        setError(response.message || "Erro ao iniciar amostra");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao conectar com o backend");
      console.error("Erro:", err);
    } finally {
      setSalvando(false);
    }
  };

  const toggleGrupo = (grupo: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [grupo]: !prev[grupo]
    }));
  };

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    const setupListener = async () => {
      try {
        unlisten = await listen<WindowData>('window-data', (event) => {
          const received = event.payload;
          setWindowData(received);
          if (received.idAnalise) {
            carregarDetalhes(received.idAnalise);
          }
        });
        await emit('window-ready');
      } catch (error) {
        alert("Erro ao configurar listener");
        console.error('Erro ao configurar listener:', error);
        setError("Falha ao receber dados da janela principal.");
      }
    };

    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [carregarDetalhes]);

  if (!windowData) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingCard}>
          <Loader className={styles.spinningLoader} size={32} />
          <span className={styles.loadingText}>Aguardando dados da janela principal...</span>
        </div>
      </div>
    );
  }

  const parametrosPorGrupo = detalhes?.parametros.reduce((acc, param) => {
    if (!acc[param.grupo_parametro]) {
      acc[param.grupo_parametro] = [];
    }
    acc[param.grupo_parametro].push(param);
    return acc;
  }, {} as Record<string, Parametro[]>) || {};

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
              <h1 className={styles.title}>
                {jaIniciada ? 'Detalhes da Análise' : 'Iniciar Análise'}
              </h1>
              <p className={styles.subtitle}>
                Amostra {detalhes?.numero || `#${windowData.idAnalise}`}
                {jaIniciada && (
                  <span className={styles.badgeIniciada}>
                    <CheckCircle size={14} /> Iniciada
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={fecharJanela}
            className={styles.closeButton}
            aria-label="Fechar"
          >
            <X size={24} />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className={styles.content}>
        {loading && (
          <div className={styles.loadingCenter}>
            <Loader className={styles.spinningLoader} size={32} />
            <span>Carregando detalhes...</span>
          </div>
        )}

        {error && (
          <div className={styles.errorAlert}>
            <AlertCircle className={styles.errorIcon} size={20} />
            <span>{error}</span>
          </div>
        )}

        {detalhes && !loading && (
          <>
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
                  <p className={styles.infoValue}>#{detalhes.numero}</p>
                </div>

                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Identificação</label>
                  <p className={styles.infoValue}>{detalhes.identificacao}</p>
                </div>

                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Data da Coleta</label>
                  <div className={styles.infoValueWithIcon}>
                    <Calendar size={18} className={styles.infoIcon} />
                    <p className={styles.infoValue}>{detalhes.data_coleta}</p>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Hora da Coleta</label>
                  <div className={styles.infoValueWithIcon}>
                    <Clock size={18} className={styles.infoIcon} />
                    <p className={styles.infoValue}>{detalhes.hora_coleta}</p>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Data Entrada Lab</label>
                  <div className={styles.infoValueWithIcon}>
                    <Calendar size={18} className={`${styles.infoIcon} ${styles.iconGreen}`} />
                    <p className={styles.infoValue}>{detalhes.data_entrada_lab}</p>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>
                    {jaIniciada ? 'Início das Análises' : 'Hora Entrada Lab'}
                  </label>
                  <div className={styles.infoValueWithIcon}>
                    <Clock size={18} className={`${styles.infoIcon} ${jaIniciada ? styles.iconBlue : styles.iconGreen}`} />
                    <p className={styles.infoValue}>
                      {jaIniciada ? detalhes.data_inicio_analise : detalhes.hora_entrada_lab}
                    </p>
                  </div>
                </div>
              </div>

              {detalhes.complemento && (
                <div className={styles.complementoBox}>
                  <strong>Complemento:</strong> {detalhes.complemento}
                </div>
              )}
            </div>

            {/* Card Iniciar Análise ou Ação Rápida */}
            {!jaIniciada ? (
              <div className={styles.iniciarCard}>
                <div className={styles.iniciarCardHeader}>
                  <h3 className={styles.iniciarCardTitle}>
                    <FlaskConical size={20} className={styles.titleIcon} />
                    Dados de Início
                  </h3>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Data de Início <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      value={dataInicio}
                      onChange={formatarData}
                      className={styles.formInput}
                      maxLength={10}
                    />
                    <span className={styles.formHint}>Ex: 15/01/2025</span>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Hora de Início <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="HH:MM"
                      value={horaInicio}
                      onChange={formatarHora}
                      className={styles.formInput}
                      maxLength={5}
                    />
                    <span className={styles.formHint}>Ex: 14:30</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.acaoRapidaCard}>
                <div className={styles.acaoRapidaContent}>
                  <div className={styles.acaoRapidaInfo}>
                    <CheckCircle size={32} className={styles.acaoRapidaIcon} />
                    <div>
                      <h3 className={styles.acaoRapidaTitle}>Análise Iniciada</h3>
                      <p className={styles.acaoRapidaText}>
                        Esta amostra foi iniciada em {detalhes.data_inicio_analise}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={abrirJanelaResultados}
                    className={styles.btnAbrirResultados}
                  >
                    <Edit size={20} />
                    <span>Cadastrar Resultados</span>
                  </button>
                </div>
              </div>
            )}

            {/* Card Parâmetros */}
            <div className={styles.parametrosCard}>
              <div className={styles.parametrosHeader}>
                <h3 className={styles.parametrosTitle}>
                  Parâmetros ({detalhes.parametros?.length || 0})
                </h3>
              </div>

              {detalhes.parametros && detalhes.parametros.length > 0 ? (
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
                          </div>

                          {params.map((param, idx) => (
                            <div key={idx} className={styles.tableRow}>
                              <div className={styles.tableCell}>
                                <strong>{param.nome_parametro}</strong>
                              </div>
                              <div className={styles.tableCell}>{param.tecnica_nome}</div>
                              <div className={styles.tableCell}>{param.unidade}</div>
                              <div className={styles.tableCell}>{param.limite}</div>
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
          </>
        )}
      </div>

      {/* Footer */}
      {detalhes && !loading && (
        <footer className={styles.footer}>
          <button
            onClick={fecharJanela}
            className={styles.btnCancel}
            disabled={salvando}
          >
            {jaIniciada ? 'Fechar' : 'Cancelar'}
          </button>
          
          {!jaIniciada ? (
            <button
              onClick={handleIniciarAmostra}
              disabled={salvando}
              className={styles.btnSave}
            >
              {salvando ? (
                <>
                  <Loader className={styles.spinningIcon} size={18} />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Iniciar Análise</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={abrirJanelaResultados}
              className={styles.btnSave}
            >
              <Edit size={18} />
              <span>Cadastrar Resultados</span>
            </button>
          )}
        </footer>
      )}
    </div>
  );
};

export default AmostraNaoIniciadaView;