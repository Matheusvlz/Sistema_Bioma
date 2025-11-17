// AmostraDetailModal.tsx - COMPLETO E CORRIGIDO (Versão 2.0 com interface faltante)
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { listen, emit } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import styles from './styles/AmostraNaoIniciada.module.css';
import { WindowManager } from '../../hooks/WindowManager';
// Importa o componente do modal
import AlterarPopModal from "./AlterarPopModal"; 

// ============ INÍCIO DAS NOVAS INTERFACES ============

interface AmostraNaoIniciadaItem {
  id: number;
  numero?: string;
  identificacao?: string;
  fantasia?: string;
  razao?: string;
}

interface AmostraEmAnaliseItem {
  id: number;
  numero?: string;
  identificacao?: string;
  tempo?: string;
  passou: boolean;
  fantasia?: string;
  razao?: string;
}

// NOVO TIPO: Unifica os itens da amostra
type AmostraItem = AmostraNaoIniciadaItem | AmostraEmAnaliseItem;

interface WindowData {
  idAnalise: number; // O ID da amostra para exibir primeiro
  idUsuario: number;
  arrayAmostras: AmostraItem[]; // CORRIGIDO: Deve ser um array
}

// 💥 INTERFACE FALTANTE ADICIONADA PARA CORRIGIR O ERRO "ResultadosWindowData"
interface ResultadosWindowData {
  idAnalise: number;
  idUsuario: number;
  arrayAmostras: AmostraItem[];
  focusResultadoId?: number; // Opcional, para focar em um resultado específico ao clicar no parâmetro
}
// ---------------------------------------------------------------------

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
  // CAMPOS ADICIONADOS PARA A NOVA FUNCIONALIDADE
  id_legislacao: number;
  id_parametro: number;
  id_legislacao_parametro: number;
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

// Interface para os dados que serão passados para o AlterarPopModal
interface PopModalData {
  idResultado: number;
  idUsuario: number;
  idLegislacao: number;
  idParametro: number;
  idLegislacaoParametro: number;
  nomeParametro: string;
  nomeAmostra: string;
}
// ============ FIM DAS NOVAS INTERFACES ============

interface TauriResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const AmostraNaoIniciadaView: React.FC = () => {
  const [windowData, setWindowData] = useState<WindowData | null>(null);
  const [detalhes, setDetalhes] = useState<AmostraResultadosResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataInicio, setDataInicio] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [jaIniciada, setJaIniciada] = useState(false);
  
  // ============ ESTADOS DE NAVEGAÇÃO ============
  const [amostrasEmAnalise, setAmostrasEmAnalise] = useState<AmostraItem[]>([]); 
  const [indiceAtual, setIndiceAtual] = useState(0); 
  // ============ FIM DOS ESTADOS DE NAVEGAÇÃO ============

  // ============ NOVOS ESTADOS PARA O MODAL POP ============
  const [isPopModalOpen, setIsPopModalOpen] = useState(false);
  const [popModalData, setPopModalData] = useState<PopModalData | null>(null);
  // ============ FIM DOS NOVOS ESTADOS ============

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

  // Função MODIFICADA para abrir a tela de resultados no novo formato
  const abrirJanelaParametroResultado = useCallback(async (parametro: ResultadoItem) => {
    if (!windowData) return;

    // NOVO FORMATO DE DADOS ENVIADO
    const dadosJanela: ResultadosWindowData = {
      idAnalise: windowData.idAnalise, 
      idUsuario: windowData.idUsuario,
      arrayAmostras: amostrasEmAnalise, 
      focusResultadoId: parametro.id, // O ID do resultado para focar na aba correta
    };

    try {
      // O nome da função de WindowManager pode ter mudado
      await WindowManager.openParametroResultado(dadosJanela); 
    } catch (error) {
      console.error("Erro ao abrir janela de resultado:", error);
      setError("Erro ao abrir tela de resultado do parâmetro");
    }
  }, [windowData, amostrasEmAnalise]); 

  // Abre o MODAL de alteração de POP/Técnica
  const abrirModalAlterarPOP = useCallback((parametro: ResultadoItem) => {
    if (!windowData || !detalhes) return;

    const dadosJanela: PopModalData = {
      idResultado: parametro.id,
      idUsuario: windowData.idUsuario,
      idLegislacao: parametro.id_legislacao,
      idParametro: parametro.id_parametro,
      idLegislacaoParametro: parametro.id_legislacao_parametro,
      nomeParametro: parametro.nome_parametro,
      nomeAmostra: detalhes.info.numero || "Amostra",
    };

    setPopModalData(dadosJanela);
    setIsPopModalOpen(true);
  }, [windowData, detalhes]);

  // Função MODIFICADA para abrir a tela de resultados no novo formato
  const abrirJanelaResultados = useCallback(async () => {
    if (!windowData) return;

    // NOVO FORMATO DE DADOS ENVIADO
    const dadosJanela: ResultadosWindowData = {
      idAnalise: windowData.idAnalise, // Usa o idAnalise do windowData (que é atualizado)
      idUsuario: windowData.idUsuario,
      arrayAmostras: amostrasEmAnalise, // Passa o array completo
    };

    try {
      // O nome da função de WindowManager pode ter mudado
      await WindowManager.openParametroResultado(dadosJanela);
    } catch (error) {
       console.error("Erro ao abrir janela de resultados:", error);
       setError("Erro ao abrir tela de resultados");
    }
    
  }, [windowData, amostrasEmAnalise]); 

  const carregarDetalhes = useCallback(async (idAnalise: number) => {
    setLoading(true);
    setError(null);
    setDetalhes(null); // Limpa detalhes antigos antes de carregar
    try {
      console.log("🔍 Carregando detalhes da amostra ID:", idAnalise);
     
      const response = await invoke("buscar_resultados_amostra", { 
        idAnalise: idAnalise
      }) as TauriResponse<AmostraResultadosResponse>;
      
      console.log("✅ Resposta recebida:", response);

      if (response.success && response.data) {
        setDetalhes(response.data);
        
        const iniciada = response.data.info.data_inicio_analise !== null && 
                         response.data.info.data_inicio_analise !== '';
        setJaIniciada(iniciada);

        if (!iniciada) {
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
        
        const grupos: Record<string, boolean> = {};
        response.data.resultados.forEach(p => {
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
  }, []); // Sem dependências, é estável

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
        idAnalise: windowData.idAnalise, // Usa o idAnalise atual
        dataInicio: dataInicio,
        horaInicio: horaInicio,
        idUsuario: windowData.idUsuario,
      }) as TauriResponse<any>;

      if (response.success) {
        await emit('amostra-iniciada-sucesso', { idAnalise: windowData.idAnalise });
        alert("Amostra iniciada com sucesso!");
        
        // Recarrega os detalhes da amostra ATUAL
        await carregarDetalhes(windowData.idAnalise);
        
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

  // ============ FUNÇÕES DE NAVEGAÇÃO ============
  const handleProximaAmostra = () => {
    if (indiceAtual < amostrasEmAnalise.length - 1) {
      setIndiceAtual(prev => prev + 1);
    }
  };

  const handleAmostraAnterior = () => {
    if (indiceAtual > 0) {
      setIndiceAtual(prev => prev - 1);
    }
  };
  // ============ FIM DAS FUNÇÕES DE NAVEGAÇÃO ============

  // UseEffect para carregar dados da janela (MODIFICADO)
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    const setupListener = async () => {
      try {
        unlisten = await listen<WindowData>('window-data', (event) => {
          const received = event.payload;
          console.log("Recebido window-data:", received);
          setWindowData(received);

          // Garante que 'arrayAmostras' é um array
          const amostras = Array.isArray(received.arrayAmostras)
            ? received.arrayAmostras
            : [];
          
          setAmostrasEmAnalise(amostras);

          // Encontra o índice da amostra inicial
          const startIndex = amostras.findIndex(a => a.id === received.idAnalise);
          const initialIndex = startIndex !== -1 ? startIndex : 0;
          
          console.log(`Índice inicial definido: ${initialIndex}`);
          setIndiceAtual(initialIndex);

          // Carrega os detalhes da amostra inicial
          if (amostras.length > 0 && amostras[initialIndex]) {
            carregarDetalhes(amostras[initialIndex].id);
          } else if (received.idAnalise) {
             // Fallback caso o array esteja vazio ou não contenha o ID
            carregarDetalhes(received.idAnalise);
          } else {
            setError("Falha ao carregar dados da amostra inicial.");
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

  // ============ NOVO useEffect (Para navegação) ============
  // Dispara quando o índice atual muda (botões prox/ant)
  useEffect(() => {
    // Evita rodar na montagem inicial (que é tratada pelo setupListener)
    if (!windowData || amostrasEmAnalise.length === 0) {
      return;
    }

    if (indiceAtual >= 0 && indiceAtual < amostrasEmAnalise.length) {
      const amostraAtual = amostrasEmAnalise[indiceAtual];
      
      // Verifica se o ID da amostra atual é diferente do ID carregado
      if (amostraAtual && amostraAtual.id !== detalhes?.info.id_analise) {
        console.log(`Navegando para índice ${indiceAtual}, ID: ${amostraAtual.id}`);
        
        // Carrega os detalhes da nova amostra
        carregarDetalhes(amostraAtual.id);
        
        // Atualiza o 'windowData' para refletir a amostra atual
        setWindowData(prevData => ({
          ...prevData!,
          idAnalise: amostraAtual.id,
        }));
      }
    }
  }, [indiceAtual, amostrasEmAnalise]); 

  // ============ NOVO useEffect (Pop Modal) ============
  // Escuta o evento de sucesso do modal de alteração de POP
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    
    const setupPopListener = async () => {
      try {
        unlisten = await listen('pop-alterado-sucesso', (event) => {
          console.log('🎉 POP alterado! Recarregando detalhes...', event.payload);
          // Recarregar os detalhes da amostra ATUAL
          if (windowData?.idAnalise) {
            carregarDetalhes(windowData.idAnalise);
          }
        });
      } catch (error) {
        console.error('Erro ao configurar listener [pop-alterado-sucesso]:', error);
      }
    };

    setupPopListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [windowData, carregarDetalhes]); 
  // ============ FIM DO NOVO useEffect ============


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

  const parametrosPorGrupo = detalhes?.resultados.reduce((acc, param) => {
    if (!acc[param.grupo_parametro]) {
      acc[param.grupo_parametro] = [];
    }
    acc[param.grupo_parametro].push(param);
    return acc;
  }, {} as Record<string, ResultadoItem[]>) || {};

  // Obtém o número da amostra atual para exibição (mesmo durante o loading)
  const numeroAmostraAtual = detalhes?.info.numero || 
                             amostrasEmAnalise[indiceAtual]?.numero || 
                             `ID ${windowData?.idAnalise}`;

  return (
    <div className={styles.container}>
      
      {/* =================================================================== */}
      {/* ============ HEADER COM NAVEGAÇÃO (AQUI ESTÁ A MUDANÇA) ============ */}
      {/* =================================================================== */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          
          {/* Bloco da Esquerda (Título) */}
          <div className={styles.headerLeft}>
            <div className={styles.iconContainer}>
              <FlaskConical className={styles.headerIcon} />
            </div>
            <div>
              <h1 className={styles.title}>
                {jaIniciada ? 'Detalhes da Análise' : 'Iniciar Análise'}
              </h1>
              <p className={styles.subtitle}>
                Amostra {numeroAmostraAtual}
                {jaIniciada && (
                  <span className={styles.badgeIniciada}>
                    <CheckCircle size={14} /> Iniciada
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* ============ MENU DE NAVEGAÇÃO (AS SETAS) ============ */}
          {amostrasEmAnalise.length > 1 && (
            <div className={styles.navigationMenu}>
              <button
                onClick={handleAmostraAnterior}
                disabled={indiceAtual === 0 || loading || salvando}
                className={styles.navButton}
                title="Amostra Anterior"
              >
                <ChevronLeft size={24} />
              </button>
              <span className={styles.navCounter}>
                {indiceAtual + 1} de {amostrasEmAnalise.length}
              </span>
              <button
                onClick={handleProximaAmostra}
                disabled={indiceAtual === amostrasEmAnalise.length - 1 || loading || salvando}
                className={styles.navButton}
                title="Próxima Amostra"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          )}
          {/* ============ FIM DO MENU DE NAVEGAÇÃO ============ */}

          {/* Botão de Fechar (Direita) */}
          <button
            onClick={fecharJanela}
            className={styles.closeButton}
            aria-label="Fechar"
          >
            <X size={24} />
          </button>
        </div>
      </header>
      {/* =============================================================== */}
      {/* ============ FIM DO HEADER ==================================== */}
      {/* =============================================================== */}


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
                  <p className={styles.infoValue}>#{detalhes.info.numero}</p>
                </div>

                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Identificação</label>
                  <p className={styles.infoValue}>{detalhes.info.identificacao}</p>
                </div>

                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Data da Coleta</label>
                  <div className={styles.infoValueWithIcon}>
                    <Calendar size={18} className={styles.infoIcon} />
                    <p className={styles.infoValue}>{detalhes.info.data_coleta}</p>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Hora da Coleta</label>
                  <div className={styles.infoValueWithIcon}>
                    <Clock size={18} className={styles.infoIcon} />
                    <p className={styles.infoValue}>{detalhes.info.hora_coleta}</p>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Data Entrada Lab</label>
                  <div className={styles.infoValueWithIcon}>
                    <Calendar size={18} className={`${styles.infoIcon} ${styles.iconGreen}`} />
                    <p className={styles.infoValue}>{detalhes.info.data_entrada_lab}</p>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>
                    {jaIniciada ? 'Início das Análises' : 'Hora Entrada Lab'}
                  </label>
                  <div className={styles.infoValueWithIcon}>
                    <Clock size={18} className={`${styles.infoIcon} ${jaIniciada ? styles.iconBlue : styles.iconGreen}`} />
                    <p className={styles.infoValue}>
                      {jaIniciada ? detalhes.info.data_inicio_analise : detalhes.info.hora_entrada_lab}
                    </p>
                  </div>
                </div>
              </div>

              {detalhes.info.complemento && (
                <div className={styles.complementoBox}>
                  <strong>Complemento:</strong> {detalhes.info.complemento}
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
                        Esta amostra foi iniciada em {detalhes.info.data_inicio_analise}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={abrirJanelaResultados}
                    className={styles.btnAbrirResultados}
                    disabled={loading || salvando}
                  >
                    <Edit size={20} />
                    <span>Cadastrar Resultados</span>
                  </button>
                </div>
              </div>
            )}

            {/* Card Parâmetros - MODIFICADO */}
            <div className={styles.parametrosCard}>
              <div className={styles.parametrosHeader}>
                <h3 className={styles.parametrosTitle}>
                  Parâmetros ({detalhes.resultados?.length || 0})
                </h3>
              </div>

              {detalhes.resultados && detalhes.resultados.length > 0 ? (
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

                          {/* ============ LINHA DA TABELA MODIFICADA ============ */}
                          {params.map((param, idx) => (
                            <div 
                              key={idx} 
                              className={styles.tableRow}
                            >
                              <div className={styles.tableCell}>
                                <div // Célula de parâmetro clicável
                                  onClick={() => jaIniciada && abrirJanelaParametroResultado(param)}
                                  style={jaIniciada ? { cursor: 'pointer', display: 'inline-block' } : {}}
                                  title={jaIniciada ? "Cadastrar/Ver Resultado" : ""}
                                >
                                  <strong>{param.nome_parametro}</strong>
                                </div>
                              </div>
                              <div className={styles.tableCell}>
                                <div // Célula de técnica clicável (CHAMA O MODAL)
                                  onClick={() => jaIniciada && abrirModalAlterarPOP(param)}
                                  style={jaIniciada ? { cursor: 'pointer', display: 'inline-block' } : {}}
                                  title={jaIniciada ? "Alterar POP/Técnica" : ""}
                                >
                                  {param.tecnica_nome}
                                </div>
                              </div>
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
              disabled={salvando || loading}
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
              disabled={loading || salvando}
            >
              <Edit size={18} />
              <span>Cadastrar Resultados</span>
            </button>
          )}
        </footer>
      )}

      {/* Modal de Alteração de POP */}
      {isPopModalOpen && popModalData && (
        <div className={styles.modalOverlay}>
          <AlterarPopModal
            data={popModalData}
            onClose={() => {
              setIsPopModalOpen(false);
              setPopModalData(null);
            }}
          />
        </div>
      )}

    </div>
  );
};

export default AmostraNaoIniciadaView;