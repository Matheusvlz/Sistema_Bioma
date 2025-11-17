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
  Eye,
  EyeOff,
  FileText,
  Beaker,
} from "lucide-react";
import { listen, emit } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import styles from './styles/ResultadoCadastro.module.css';

interface WindowData {
  idAnalise: number;
  idUsuario: number;
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

interface TauriResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface ResultadoEditando {
  [key: number]: {
    valor: string;
    dataTermino: string;
    horaTermino: string;
  };
}

const ResultadoCadastroView: React.FC = () => {
  const [windowData, setWindowData] = useState<WindowData | null>(null);
  const [dados, setDados] = useState<AmostraResultadosResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [resultadosEditando, setResultadosEditando] = useState<ResultadoEditando>({});

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

  const carregarDados = useCallback(async (idAnalise: number) => {
    setLoading(true);
    setError(null);
    try {
      console.log("📊 Carregando resultados da amostra ID:", idAnalise);
     
      const response = await invoke("buscar_resultados_amostra", { 
        idAnalise: idAnalise
      }) as TauriResponse<AmostraResultadosResponse>;
      
      console.log("✅ Resposta recebida:", response);

      if (response.success && response.data) {
        setDados(response.data);
        
        // Inicializar grupos expandidos
        const grupos: Record<string, boolean> = {};
        response.data.resultados.forEach(r => {
          grupos[r.grupo_parametro] = true;
        });
        setExpandedGroups(grupos);

        // Inicializar resultados editando com data/hora atuais
        const agora = new Date();
        const dataAtual = agora.toLocaleDateString('pt-BR');
        const horaAtual = agora.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });

        const editando: ResultadoEditando = {};
        response.data.resultados.forEach(r => {
          editando[r.id] = {
            valor: r.resultado || '',
            dataTermino: r.data_termino || dataAtual,
            horaTermino: r.hora_termino || horaAtual,
          };
        });
        setResultadosEditando(editando);
      } else {
        setError(response.message || "Erro ao carregar dados");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao conectar com o backend");
      console.error("Erro:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSalvarResultado = async (idResultado: number) => {
    if (!windowData) {
      setError("Dados da janela não recebidos.");
      return;
    }

    const editando = resultadosEditando[idResultado];
    if (!editando) return;

    if (!editando.valor.trim()) {
      setError("Por favor, informe o resultado");
      return;
    }

    if (!validarData(editando.dataTermino)) {
      setError("Data inválida. Use formato DD/MM/YYYY");
      return;
    }

    if (!validarHora(editando.horaTermino)) {
      setError("Hora inválida. Use formato HH:MM");
      return;
    }

    setSalvando(true);
    setError(null);

    try {
      const response = await invoke("salvar_resultado", {
        idResultado: idResultado,
        resultado: editando.valor,
        dataTermino: editando.dataTermino,
        horaTermino: editando.horaTermino,
        idUsuario: windowData.idUsuario,
      }) as TauriResponse<any>;

      if (response.success) {
        // Emitir evento de sucesso
        await emit('resultado-salvo-sucesso', { 
          idAnalise: windowData.idAnalise,
          idResultado: idResultado 
        });
        
        // Recarregar dados
        await carregarDados(windowData.idAnalise);
        alert("Resultado salvo com sucesso!");
      } else {
        setError(response.message || "Erro ao salvar resultado");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao conectar com o backend");
      console.error("Erro:", err);
    } finally {
      setSalvando(false);
    }
  };

  const handleVistarResultado = async (idResultado: number, remover: boolean = false) => {
    if (!windowData) return;

    setSalvando(true);
    setError(null);

    try {
      const comando = remover ? "remover_visto_resultado" : "vistar_resultado";
      const response = await invoke(comando, {
        idResultado: idResultado,
        idUsuario: windowData.idUsuario,
      }) as TauriResponse<any>;

      if (response.success) {
        await carregarDados(windowData.idAnalise);
        alert(remover ? "Visto removido!" : "Resultado vistado!");
      } else {
        setError(response.message || "Erro ao processar");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao conectar com o backend");
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

  const atualizarResultado = (idResultado: number, campo: 'valor' | 'dataTermino' | 'horaTermino', valor: string) => {
    setResultadosEditando(prev => ({
      ...prev,
      [idResultado]: {
        ...prev[idResultado],
        [campo]: valor
      }
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
            carregarDados(received.idAnalise);
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
  }, [carregarDados]);

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

  const resultadosPorGrupo = dados?.resultados.reduce((acc, resultado) => {
    if (!acc[resultado.grupo_parametro]) {
      acc[resultado.grupo_parametro] = [];
    }
    acc[resultado.grupo_parametro].push(resultado);
    return acc;
  }, {} as Record<string, ResultadoItem[]>) || {};

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <div className={styles.iconContainer}>
              <Beaker className={styles.headerIcon} />
            </div>
            <div>
              <h1 className={styles.title}>Cadastrar Resultados</h1>
              <p className={styles.subtitle}>Amostra ID: {windowData.idAnalise}</p>
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
            <span>Carregando dados...</span>
          </div>
        )}

        {error && (
          <div className={styles.errorAlert}>
            <AlertCircle className={styles.errorIcon} size={20} />
            <span>{error}</span>
          </div>
        )}

        {dados && !loading && (
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
                  <p className={styles.infoValue}>#{dados.info.numero}</p>
                </div>

                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Identificação</label>
                  <p className={styles.infoValue}>{dados.info.identificacao}</p>
                </div>

                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Data da Coleta</label>
                  <div className={styles.infoValueWithIcon}>
                    <Calendar size={18} className={styles.infoIcon} />
                    <p className={styles.infoValue}>{dados.info.data_coleta}</p>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Hora da Coleta</label>
                  <div className={styles.infoValueWithIcon}>
                    <Clock size={18} className={styles.infoIcon} />
                    <p className={styles.infoValue}>{dados.info.hora_coleta}</p>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Entrada no Lab</label>
                  <div className={styles.infoValueWithIcon}>
                    <Calendar size={18} className={`${styles.infoIcon} ${styles.iconGreen}`} />
                    <p className={styles.infoValue}>{dados.info.data_entrada_lab}</p>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Início das Análises</label>
                  <div className={styles.infoValueWithIcon}>
                    <Clock size={18} className={`${styles.infoIcon} ${styles.iconBlue}`} />
                    <p className={styles.infoValue}>{dados.info.data_inicio_analise || 'Não iniciada'}</p>
                  </div>
                </div>
              </div>

              {dados.info.complemento && (
                <div className={styles.complementoBox}>
                  <strong>Complemento:</strong> {dados.info.complemento}
                </div>
              )}
            </div>

            {/* Card Resultados */}
            <div className={styles.resultadosCard}>
              <div className={styles.resultadosHeader}>
                <h3 className={styles.resultadosTitle}>
                  Resultados ({dados.resultados?.length || 0})
                </h3>
              </div>

              {dados.resultados && dados.resultados.length > 0 ? (
                <div className={styles.gruposContainer}>
                  {Object.entries(resultadosPorGrupo).map(([grupo, resultados]) => (
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
                        <span className={styles.grupoCount}>({resultados.length})</span>
                      </button>

                      {expandedGroups[grupo] && (
                        <div className={styles.resultadosLista}>
                          {resultados.map((resultado) => (
                            <div 
                              key={resultado.id} 
                              className={`${styles.resultadoItem} ${
                                resultado.analista ? styles.vistado : ''
                              } ${
                                resultado.terceirizado ? styles.terceirizado : ''
                              }`}
                            >
                              <div className={styles.resultadoHeader}>
                                <div className={styles.parametroInfo}>
                                  <h4 className={styles.parametroNome}>
                                    {resultado.nome_parametro}
                                    {resultado.em_campo && (
                                      <span className={styles.badge}>Em campo</span>
                                    )}
                                    {resultado.terceirizado && (
                                      <span className={`${styles.badge} ${styles.badgeTerceirizado}`}>
                                        Terceirizado
                                      </span>
                                    )}
                                  </h4>
                                  <p className={styles.tecnica}>{resultado.tecnica_nome}</p>
                                </div>

                                {resultado.analista && (
                                  <div className={styles.vistaInfo}>
                                    <CheckCircle size={18} className={styles.iconCheck} />
                                    <span>Vistado por: {resultado.analista}</span>
                                  </div>
                                )}
                              </div>

                              <div className={styles.resultadoBody}>
                                <div className={styles.limiteInfo}>
                                  <span className={styles.label}>Limite:</span>
                                  <span className={styles.value}>{resultado.limite}</span>
                                  <span className={styles.label}>Unidade:</span>
                                  <span className={styles.value}>{resultado.unidade}</span>
                                </div>

                                {!resultado.terceirizado && (
                                  <div className={styles.formGrid}>
                                    <div className={styles.formGroup}>
                                      <label className={styles.formLabel}>
                                        Resultado <span className={styles.required}>*</span>
                                      </label>
                                      <input
                                        type="text"
                                        value={resultadosEditando[resultado.id]?.valor || ''}
                                        onChange={(e) => atualizarResultado(
                                          resultado.id, 
                                          'valor', 
                                          e.target.value
                                        )}
                                        className={styles.formInput}
                                        disabled={!!resultado.analista}
                                        placeholder="Informe o resultado"
                                      />
                                    </div>

                                    <div className={styles.formGroup}>
                                      <label className={styles.formLabel}>
                                        Data Término <span className={styles.required}>*</span>
                                      </label>
                                      <input
                                        type="text"
                                        value={resultadosEditando[resultado.id]?.dataTermino || ''}
                                        onChange={(e) => atualizarResultado(
                                          resultado.id, 
                                          'dataTermino', 
                                          formatarData(e.target.value)
                                        )}
                                        className={styles.formInput}
                                        disabled={!!resultado.analista}
                                        placeholder="DD/MM/YYYY"
                                        maxLength={10}
                                      />
                                    </div>

                                    <div className={styles.formGroup}>
                                      <label className={styles.formLabel}>
                                        Hora Término <span className={styles.required}>*</span>
                                      </label>
                                      <input
                                        type="text"
                                        value={resultadosEditando[resultado.id]?.horaTermino || ''}
                                        onChange={(e) => atualizarResultado(
                                          resultado.id, 
                                          'horaTermino', 
                                          formatarHora(e.target.value)
                                        )}
                                        className={styles.formInput}
                                        disabled={!!resultado.analista}
                                        placeholder="HH:MM"
                                        maxLength={5}
                                      />
                                    </div>
                                  </div>
                                )}

                                {resultado.terceirizado && (
                                  <div className={styles.terceirizadoInfo}>
                                    <AlertCircle size={18} />
                                    <span>Este parâmetro está terceirizado</span>
                                  </div>
                                )}

                                <div className={styles.resultadoActions}>
                                  {!resultado.analista && !resultado.terceirizado && (
                                    <button
                                      onClick={() => handleSalvarResultado(resultado.id)}
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
                                          <span>Salvar</span>
                                        </>
                                      )}
                                    </button>
                                  )}

                                  {!resultado.terceirizado && (
                                    <>
                                      {!resultado.analista && resultado.resultado && (
                                        <button
                                          onClick={() => handleVistarResultado(resultado.id, false)}
                                          disabled={salvando}
                                          className={styles.btnVistar}
                                        >
                                          <Eye size={18} />
                                          <span>Vistar</span>
                                        </button>
                                      )}

                                      {resultado.analista && (
                                        <button
                                          onClick={() => handleVistarResultado(resultado.id, true)}
                                          disabled={salvando}
                                          className={styles.btnRemoverVisto}
                                        >
                                          <EyeOff size={18} />
                                          <span>Remover Visto</span>
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>

                                {resultado.data_inicio && (
                                  <div className={styles.timestampInfo}>
                                    <span>Início: {resultado.data_inicio} {resultado.hora_inicio}</span>
                                    {resultado.data_termino && (
                                      <span>Término: {resultado.data_termino} {resultado.hora_termino}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  Nenhum resultado encontrado
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      {dados && !loading && (
        <footer className={styles.footer}>
          <button
            onClick={fecharJanela}
            className={styles.btnCancel}
            disabled={salvando}
          >
            Fechar
          </button>
        </footer>
      )}
    </div>
  );
};

export default ResultadoCadastroView;