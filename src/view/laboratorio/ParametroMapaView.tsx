// parametro-resultado-view.tsx - VERSÃO MAPA (Substitui o arquivo)
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  X,
  Loader,
  Save,
  CheckCircle,
  FileText,
  Beaker,
  Eye,
  AlertCircle,
  Filter,
  Check,
} from "lucide-react";
import { listen, emit } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";



// window-data esperado
interface WindowData {
  idParametroPop: number;
  idUsuario: number;
  // idAmostra: number; // Opcional, para focar em uma amostra
}

interface TauriResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// --- Structs do Mapa ---
interface ParametroMapaInfo {
  nome_parametro: string;
  pop_info: string;
  lq: string;
  incerteza: string;
  is_calculo: boolean;
}

interface MapaAmostraResultado {
  has_report: boolean;
  id_grupo_doble: number;
  id_analise: number;
  id_resultado: number;
  id_cliente: number;
  numero_amostra: string;
  identificacao: string;
  complemento: string;
  data_inicio: string;
  hora_inicio: string;
  data_termino: string;
  hora_termino: string;
  limite_min: string;
  limite_simbolo: string;
  limite_max: string;
  limite_completo: string;
  unidade: string;
  resultado: string;
  user_ini_id: number;
  user_ini_nome: string;
  user_visto_id: number;
  user_visto_nome: string;
}

interface MapaEtapaDefinition {
  id_etapa: number;
  descricao: string;
  sequencia: number;
}

interface MapaEtapaValor {
  id_resultado_etapa: number;
  id_analise: number;
  id_etapa: number;
  valor: string;
}

interface ParametroMapaResponse {
  info: ParametroMapaInfo;
  amostras: MapaAmostraResultado[];
  etapas_definicao: MapaEtapaDefinition[];
  etapas_valores: MapaEtapaValor[];
}

// --- Payloads ---
interface EtapaPayload {
  id: number; // id_resultado_etapa
  valor: string;
}

interface SalvarMapaPayloadItem {
  id_resultado: number;
  data_inicio: string;
  hora_inicio: string;
  resultado: string;
  data_termino: string;
  hora_termino: string;
  etapas: EtapaPayload[];
}

interface SalvarMapaPayload {
  id_usuario: number;
  amostras: SalvarMapaPayloadItem[];
}

interface VistarMapaPayloadItem {
  id_resultado: number;
}

interface VistarMapaPayload {
  id_usuario: number;
  amostras: VistarMapaPayloadItem[];
}

// ==========================================
// ESTADO INTERNO DA VIEW
// ==========================================

// Armazena os valores dos inputs para uma amostra
interface AmostraInputState {
  data_inicio: string;
  hora_inicio: string;
  data_termino: string;
  hora_termino: string;
  resultado: string;
  // Mapeia [id_etapa_definicao] -> { valor, id_resultado_etapa }
  etapas: Record<number, { valor: string; id_resultado_etapa: number }>;
}

// Mapeia [id_resultado] -> AmostraInputState
type MapaInputValues = Record<number, AmostraInputState>;

// Mapeia [id_resultado] -> boolean
type MapaSelecao = Record<number, boolean>;


// ==========================================
// ESTILOS (Simplificado)
// ==========================================
// (Vou usar estilos inline para simplificar, mas CSS Modules é melhor)
const styles: { [key: string]: React.CSSProperties } = {
  container: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f9fafb' },
  header: { padding: '1rem 1.5rem', backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '1rem' },
  title: { fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: 0 },
  subtitle: { fontSize: '0.875rem', color: '#6b7280', margin: 0 },
  closeButton: { padding: '0.5rem', borderRadius: '99px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' },
  topBar: { padding: '1rem 1.5rem', backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  paramInfo: { display: 'flex', gap: '1.5rem', fontSize: '0.875rem' },
  infoBox: { display: 'flex', flexDirection: 'column' },
  infoLabel: { color: '#6b7280', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase' },
  infoValue: { color: '#111827', fontWeight: 600 },
  actions: { display: 'flex', gap: '0.75rem' },
  btn: { padding: '0.5rem 1rem', borderRadius: '0.375rem', border: '1px solid transparent', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.1s' },
  btnSave: { backgroundColor: '#4f46e5', color: '#fff', borderColor: '#4f46e5' },
  btnVistar: { backgroundColor: '#10b981', color: '#fff', borderColor: '#10b981' },
  btnVerificacao: { backgroundColor: '#f59e0b', color: '#fff', borderColor: '#f59e0b' },
  content: { flex: 1, overflow: 'auto' },
  tableContainer: { width: '100%', overflowX: 'auto', backgroundColor: '#fff' },
  table: { borderCollapse: 'collapse', minWidth: '100%', fontSize: '0.875rem' },
  th: { padding: '0.75rem 1rem', textAlign: 'left', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', position: 'sticky', top: 0, zIndex: 10 },
  thAmostra: { minWidth: '180px', maxWidth: '300px', whiteSpace: 'normal', lineHeight: 1.3 },
  td: { padding: '0.5rem 1rem', border: '1px solid #e5e7eb', verticalAlign: 'top' },
  tdLabel: { fontWeight: 600, color: '#374151', minWidth: '150px', position: 'sticky', left: 0, backgroundColor: '#fff', zIndex: 5 },
  input: { width: '100%', minWidth: '120px', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' },
  inputError: { borderColor: '#ef4444', backgroundColor: '#fee2e2' },
  vistoLabel: { padding: '0.5rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 500, color: '#15803d', backgroundColor: '#dcfce7', borderRadius: '0.375rem' },
  loadingContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.5rem', flexDirection: 'column' },
  errorAlert: { margin: '1.5rem', padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  spinningLoader: { animation: 'spin 1s linear infinite' },
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
const ParametroMapaView: React.FC = () => {
  const [windowData, setWindowData] = useState<WindowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Dados do Mapa
  const [paramInfo, setParamInfo] = useState<ParametroMapaInfo | null>(null);
  const [amostras, setAmostras] = useState<MapaAmostraResultado[]>([]);
  const [etapasDef, setEtapasDef] = useState<MapaEtapaDefinition[]>([]);
  
  // Estado dos Inputs e Seleção
  const [inputValues, setInputValues] = useState<MapaInputValues>({});
  const [selecao, setSelecao] = useState<MapaSelecao>({});

  const fecharJanela = useCallback(() => {
    getCurrentWindow().close();
  }, []);

  // Inicializa o estado dos inputs quando os dados são carregados
  const inicializarInputState = useCallback((
    amostras: MapaAmostraResultado[],
    etapasVal: MapaEtapaValor[]
  ) => {
    const newValues: MapaInputValues = {};
    const newSelecao: MapaSelecao = {};
    
    const etapasValoresMap = new Map<number, MapaEtapaValor[]>();
    etapasVal.forEach(val => {
        if (!etapasValoresMap.has(val.id_analise)) {
            etapasValoresMap.set(val.id_analise, []);
        }
        etapasValoresMap.get(val.id_analise)!.push(val);
    });

    for (const amostra of amostras) {
      const etapasInput: Record<number, { valor: string; id_resultado_etapa: number }> = {};
      
      const amostraEtapas = etapasValoresMap.get(amostra.id_analise) || [];
      
      for (const etapaVal of amostraEtapas) {
          etapasInput[etapaVal.id_etapa] = {
              valor: etapaVal.valor || '',
              id_resultado_etapa: etapaVal.id_resultado_etapa,
          };
      }

      newValues[amostra.id_resultado] = {
        data_inicio: amostra.data_inicio || '',
        hora_inicio: amostra.hora_inicio || '',
        data_termino: amostra.data_termino || '',
        hora_termino: amostra.hora_termino || '',
        resultado: amostra.resultado || '',
        etapas: etapasInput,
      };

      // Seleciona automaticamente se foi iniciado pelo usuário atual e não está vistado
      newSelecao[amostra.id_resultado] = 
          !amostra.user_visto_id && 
          amostra.user_ini_id === windowData?.idUsuario;
    }

    setInputValues(newValues);
    setSelecao(newSelecao);
  }, [windowData?.idUsuario]);

  const carregarMapa = useCallback(async (idParametroPop: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await invoke("buscar_parametro_mapa", { 
        idParametroPop 
      }) as TauriResponse<ParametroMapaResponse>;

      if (response.success && response.data) {
        setParamInfo(response.data.info);
        setAmostras(response.data.amostras);
        setEtapasDef(response.data.etapas_definicao);
        inicializarInputState(response.data.amostras, response.data.etapas_valores);
      } else {
        setError(response.message || "Erro ao carregar dados do mapa");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao conectar com o backend");
    } finally {
      setLoading(false);
    }
  }, [inicializarInputState]);

  // Carrega dados da janela
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    const setupListener = async () => {
      try {
        unlisten = await listen<WindowData>('window-data', (event) => {
          const received = event.payload;
          setWindowData(received);
          if (received.idParametroPop) {
            carregarMapa(17);
          } else {
            setError("ID do Parâmetro (POP) não recebido.");
            setLoading(false);
          }
        });
        await emit('window-ready');
      } catch (error) {
        console.error('Erro ao configurar listener:', error);
        setError("Falha ao receber dados da janela principal.");
        setLoading(false);
      }
    };
    setupListener();
    return () => { unlisten && unlisten(); };
  }, [carregarMapa]);

  // --- Handlers de Interação ---

  const handleSelecaoTodos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    const newSelecao: MapaSelecao = {};
    for (const amostra of amostras) {
        // Só permite selecionar se não estiver vistado
        if (!amostra.user_visto_id) {
            newSelecao[amostra.id_resultado] = isChecked;
        } else {
            newSelecao[amostra.id_resultado] = false; // Mantém desmarcado se já vistado
        }
    }
    setSelecao(newSelecao);
  };

  const handleSelecaoUnica = (id_resultado: number) => {
    setSelecao(prev => ({
      ...prev,
      [id_resultado]: !prev[id_resultado],
    }));
  };

  const handleInputChange = (
    id_resultado: number, 
    campo: keyof Omit<AmostraInputState, 'etapas'>, 
    valor: string
  ) => {
    setInputValues(prev => ({
        ...prev,
        [id_resultado]: {
            ...prev[id_resultado],
            [campo]: valor,
        }
    }));
  };

  const handleEtapaChange = (
    id_resultado: number,
    id_etapa_def: number,
    valor: string
  ) => {
    setInputValues(prev => ({
        ...prev,
        [id_resultado]: {
            ...prev[id_resultado],
            etapas: {
                ...prev[id_resultado].etapas,
                [id_etapa_def]: {
                    ...prev[id_resultado].etapas[id_etapa_def],
                    valor: valor,
                }
            }
        }
    }));
  };

  // --- Handlers de Ação (Salvar, Vistar) ---

  const handleSalvar = async () => {
    if (!windowData) return;

    const amostrasParaSalvar: SalvarMapaPayloadItem[] = [];
    
    for (const amostra of amostras) {
        if (selecao[amostra.id_resultado] && !amostra.user_visto_id) {
            const inputs = inputValues[amostra.id_resultado];
            if (!inputs) continue;
            
            // TODO: Validação (datas, horas, campos obrigatórios)
            
            const etapasPayload: EtapaPayload[] = Object.values(inputs.etapas).map(etapa => ({
                id: etapa.id_resultado_etapa,
                valor: etapa.valor
            }));

            amostrasParaSalvar.push({
                id_resultado: amostra.id_resultado,
                data_inicio: inputs.data_inicio,
                hora_inicio: inputs.hora_inicio,
                data_termino: inputs.data_termino,
                hora_termino: inputs.hora_termino,
                resultado: inputs.resultado,
                etapas: etapasPayload,
            });
        }
    }

    if (amostrasParaSalvar.length === 0) {
        alert("Nenhuma amostra selecionada ou editável para salvar.");
        return;
    }

    setSalvando(true);
    setError(null);
    
    const payload: SalvarMapaPayload = {
        id_usuario: windowData.idUsuario,
        amostras: amostrasParaSalvar,
    };

    try {
        const response = await invoke("salvar_mapa_parametro", { payload }) as TauriResponse<any>;
        if (response.success) {
            alert("Resultados salvos com sucesso!");
            carregarMapa(windowData.idParametroPop); // Recarrega
        } else {
            setError(response.message || "Erro ao salvar dados.");
        }
    } catch (err: any) {
        setError(err.message || "Erro de conexão ao salvar.");
    } finally {
        setSalvando(false);
    }
  };
  
  const handleVistar = async () => {
    if (!windowData) return;
    
    const amostrasParaVistar: VistarMapaPayloadItem[] = [];
    
    for (const amostra of amostras) {
        if (selecao[amostra.id_resultado] && !amostra.user_visto_id) {
             const inputs = inputValues[amostra.id_resultado];
             // Validação (copiada do Java 'verificaCamposVisto')
             if (!inputs.data_inicio || !inputs.hora_inicio || !inputs.data_termino || !inputs.hora_termino || !inputs.resultado) {
                 alert(`Amostra ${amostra.numero_amostra}: Todos os campos (datas, horas, resultado) são obrigatórios para vistar.`);
                 return;
             }
             // TODO: Validar etapas
             
             amostrasParaVistar.push({ id_resultado: amostra.id_resultado });
        }
    }
    
    if (amostrasParaVistar.length === 0) {
        alert("Nenhuma amostra selecionada para vistar.");
        return;
    }
    
    if (!window.confirm(`Deseja vistar ${amostrasParaVistar.length} amostra(s) selecionada(s)?`)) {
        return;
    }

    setSalvando(true);
    setError(null);
    
    const payload: VistarMapaPayload = {
        id_usuario: windowData.idUsuario,
        amostras: amostrasParaVistar,
    };
    
    try {
        // 1. Salva primeiro, para garantir que os dados estão atualizados
        await handleSalvar(); 
        
        // 2. Vistar
        const response = await invoke("vistar_mapa_parametro", { payload }) as TauriResponse<any>;
        if (response.success) {
            alert("Resultados vistados com sucesso!");
            carregarMapa(windowData.idParametroPop); // Recarrega
        } else {
            setError(response.message || "Erro ao vistar dados.");
        }
    } catch (err: any) {
        setError(err.message || "Erro de conexão ao vistar.");
    } finally {
        setSalvando(false);
    }
  };

  const totalSelecionado = useMemo(() => {
      return Object.values(selecao).filter(Boolean).length;
  }, [selecao]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Loader style={styles.spinningLoader} size={32} />
        <span>Carregando Mapa do Parâmetro...</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <Beaker size={24} color="#4f46e5" />
          <div>
            <h1 style={styles.title}>Mapa de Parâmetro</h1>
            <p style={styles.subtitle}>
              {amostras.length} amostra(s) encontrada(s)
            </p>
          </div>
        </div>
        <button onClick={fecharJanela} style={styles.closeButton} title="Fechar">
          <X size={24} color="#6b7280" />
        </button>
      </header>
      
      {/* Top Bar (Info + Ações) */}
      <div style={styles.topBar}>
        {paramInfo && (
            <div style={styles.paramInfo}>
                <div style={styles.infoBox}>
                    <span style={styles.infoLabel}>Parâmetro</span>
                    <span style={styles.infoValue}>{paramInfo.nome_parametro}</span>
                </div>
                <div style={styles.infoBox}>
                    <span style={styles.infoLabel}>POP/Técnica</span>
                    <span style={styles.infoValue}>{paramInfo.pop_info}</span>
                </div>
                 <div style={styles.infoBox}>
                    <span style={styles.infoLabel}>LQ</span>
                    <span style={styles.infoValue}>{paramInfo.lq || '-'}</span>
                </div>
                 <div style={styles.infoBox}>
                    <span style={styles.infoLabel}>Incerteza</span>
                    <span style={styles.infoValue}>{paramInfo.incerteza || '-'}</span>
                </div>
            </div>
        )}
        <div style={styles.actions}>
            {/* TODO: Filtros */}
            <button style={{...styles.btn, backgroundColor: '#fff', borderColor: '#d1d5db', color: '#374151'}}>
                <Filter size={16} /> Filtros
            </button>
            <button style={{...styles.btn, ...styles.btnVerificacao}} disabled={salvando}>
                Solicitar Verificação
            </button>
            <button style={{...styles.btn, ...styles.btnVistar}} onClick={handleVistar} disabled={salvando || totalSelecionado === 0}>
                <Eye size={16} /> Vistar ({totalSelecionado})
            </button>
            <button style={{...styles.btn, ...styles.btnSave}} onClick={handleSalvar} disabled={salvando || totalSelecionado === 0}>
                {salvando ? <Loader size={16} style={styles.spinningLoader} /> : <Save size={16} />}
                Salvar ({totalSelecionado})
            </button>
        </div>
      </div>
      
      {error && (
        <div style={styles.errorAlert}>
            <AlertCircle size={20} /> <span>{error}</span>
        </div>
      )}

      {/* Content (Grid) */}
      <div style={styles.content}>
        <div style={styles.tableContainer}>
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={{...styles.th, ...styles.tdLabel, top: 0, zIndex: 11}}>Amostra</th>
                        {amostras.map(am => (
                            <th key={am.id_resultado} style={{...styles.th, ...styles.thAmostra}}>
                                <div style={{ fontWeight: 600, fontSize: '1rem' }}>{am.numero_amostra}</div>
                                <div style={{ fontWeight: 400, color: '#6b7280' }}>{am.identificacao}</div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {/* --- Seleção --- */}
                    <tr>
                        <td style={styles.tdLabel}>
                           <input 
                                type="checkbox" 
                                onChange={handleSelecaoTodos} 
                                title="Selecionar Todos Editáveis"
                                style={{ width: '20px', height: '20px' }}
                            />
                            <span style={{ marginLeft: '0.5rem' }}>Selecionar</span>
                        </td>
                        {amostras.map(am => (
                            <td key={am.id_resultado} style={{...styles.td, textAlign: 'center'}}>
                                {!am.user_visto_id ? (
                                    <input 
                                        type="checkbox" 
                                        checked={selecao[am.id_resultado] || false}
                                        onChange={() => handleSelecaoUnica(am.id_resultado)}
                                        style={{ width: '20px', height: '20px' }}
                                    />
                                ) : (
                                    <CheckCircle size={20} color="#10b981" title={`Vistado por ${am.user_visto_nome}`} />
                                )}
                            </td>
                        ))}
                    </tr>
                    {/* --- Limite --- */}
                    <tr>
                        <td style={styles.tdLabel}>Limite</td>
                        {amostras.map(am => (
                            <td key={am.id_resultado} style={{...styles.td, textAlign: 'center'}}>
                                {am.limite_completo}
                            </td>
                        ))}
                    </tr>
                    {/* --- Unidade --- */}
                    <tr>
                        <td style={styles.tdLabel}>Unidade</td>
                        {amostras.map(am => (
                            <td key={am.id_resultado} style={{...styles.td, textAlign: 'center'}}>
                                {am.unidade}
                            </td>
                        ))}
                    </tr>
                    {/* --- Início --- */}
                    <tr>
                        <td style={styles.tdLabel}>Início Análise</td>
                        {amostras.map(am => {
                            const id = am.id_resultado;
                            const editavel = selecao[id] && !am.user_visto_id;
                            return (
                                <td key={id} style={styles.td}>
                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                        <input 
                                            type="text"
                                            placeholder="DD/MM/AAAA"
                                            style={styles.input}
                                            value={inputValues[id]?.data_inicio || ''}
                                            onChange={e => handleInputChange(id, 'data_inicio', e.target.value)}
                                            disabled={!editavel}
                                            maxLength={10}
                                        />
                                        <input 
                                            type="text"
                                            placeholder="HH:MM"
                                            style={{...styles.input, minWidth: '70px', flexGrow: 0}}
                                            value={inputValues[id]?.hora_inicio || ''}
                                            onChange={e => handleInputChange(id, 'hora_inicio', e.target.value)}
                                            disabled={!editavel}
                                            maxLength={5}
                                        />
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                        Por: {am.user_ini_nome || 'N/A'}
                                    </div>
                                </td>
                            )
                        })}
                    </tr>
                    {/* --- Etapas --- */}
                    {etapasDef.map(etapa => (
                        <tr key={etapa.id_etapa}>
                            <td style={styles.tdLabel}>{etapa.descricao}</td>
                            {amostras.map(am => {
                                const id_res = am.id_resultado;
                                const id_etapa_def = etapa.id_etapa;
                                const editavel = selecao[id_res] && !am.user_visto_id;
                                const etapaInput = inputValues[id_res]?.etapas[id_etapa_def];
                                
                                return (
                                    <td key={id_res} style={styles.td}>
                                        {etapaInput ? (
                                            <input 
                                                type="text"
                                                style={styles.input}
                                                value={etapaInput.valor}
                                                onChange={e => handleEtapaChange(id_res, id_etapa_def, e.target.value)}
                                                disabled={!editavel}
                                            />
                                        ) : (
                                            <span style={{ color: '#9ca3af' }}>N/A</span>
                                        )}
                                    </td>
                                )
                            })}
                        </tr>
                    ))}
                    {/* --- Resultado --- */}
                    <tr>
                        <td style={styles.tdLabel}>Resultado</td>
                        {amostras.map(am => {
                             const id = am.id_resultado;
                             const editavel = selecao[id] && !am.user_visto_id;
                             return (
                                <td key={id} style={styles.td}>
                                    <input 
                                        type="text"
                                        style={styles.input}
                                        value={inputValues[id]?.resultado || ''}
                                        onChange={e => handleInputChange(id, 'resultado', e.target.value)}
                                        disabled={!editavel}
                                    />
                                </td>
                             )
                        })}
                    </tr>
                     {/* --- Término --- */}
                    <tr>
                        <td style={styles.tdLabel}>Término Análise</td>
                        {amostras.map(am => {
                            const id = am.id_resultado;
                            const editavel = selecao[id] && !am.user_visto_id;
                            return (
                                <td key={id} style={styles.td}>
                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                        <input 
                                            type="text"
                                            placeholder="DD/MM/AAAA"
                                            style={styles.input}
                                            value={inputValues[id]?.data_termino || ''}
                                            onChange={e => handleInputChange(id, 'data_termino', e.target.value)}
                                            disabled={!editavel}
                                            maxLength={10}
                                        />
                                        <input 
                                            type="text"
                                            placeholder="HH:MM"
                                            style={{...styles.input, minWidth: '70px', flexGrow: 0}}
                                            value={inputValues[id]?.hora_termino || ''}
                                            onChange={e => handleInputChange(id, 'hora_termino', e.target.value)}
                                            disabled={!editavel}
                                            maxLength={5}
                                        />
                                    </div>
                                </td>
                            )
                        })}
                    </tr>
                     {/* --- Visto --- */}
                    <tr>
                        <td style={styles.tdLabel}>Analisado por</td>
                        {amostras.map(am => (
                            <td key={am.id_resultado} style={styles.td}>
                                {am.user_visto_nome ? (
                                    <div style={styles.vistoLabel}>
                                        {am.user_visto_nome}
                                    </div>
                                ) : (
                                    <span style={{ color: '#9ca3af' }}>-</span>
                                )}
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default ParametroMapaView;