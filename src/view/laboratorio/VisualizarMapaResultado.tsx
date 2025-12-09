import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { FaSave, FaCheckCircle, FaCalculator, FaArrowLeft } from 'react-icons/fa';
import styles from './styles/MapaResultado.module.css';

// --- Interfaces Completas ---
interface ValorEtapa {
    resultado_etapa_id: number;
    analise_id: number;
    etapa_id: number;
    valor: string | null;
}

interface LinhaMapa {
    analise_id: number;
    resultado_id: number;
    amostra_numero: string;
    identificacao: string;
    complemento: string | null;
    data_inicio: string | null;
    hora_inicio: string | null;
    data_termino: string | null;
    hora_termino: string | null;
    resultado_final: string | null;
    // O Rust retorna um HashMap<u32, ValorEtapa>. No JS isso vira um Objeto onde a chave é o ID (string)
    etapas: Record<string, ValorEtapa>; 
    usuario_ini: string | null;
    usuario_visto: string | null;
}

interface DefinicaoEtapa {
    etapa_id: number;
    descricao: string;
    sequencia: number;
}

interface MapaCabecalho {
    parametro_nome: string;
    pop_codigo: string | null;
    pop_numero: string | null;
    pop_revisao: string | null;
    tecnica_nome: string | null;
    unidade: string | null;
    limite_min: string | null;
    limite_simbolo: string | null;
    limite_max: string | null;
    lqi: string | null;
    incerteza: string | null;
}

interface MapaResponse {
    cabecalho: MapaCabecalho;
    colunas_etapas: DefinicaoEtapa[];
    linhas: LinhaMapa[];
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

interface MapaProps {
    idParametro: number;
    idAmostra: number | null;
    onVoltar: () => void;
}

// --- Lógica de Validação Visual (Porting do Java) ---
const verificarLimiteVisual = (valor: string | null, min: string | null, simb: string | null, max: string | null): boolean => {
    if (!valor || valor.trim() === '') return true; // Vazio é neutro
    
    // Trata vírgula como ponto
    const num = parseFloat(valor.replace(',', '.'));
    if (isNaN(num)) return true; // Texto não numérico não valida (ou valida como true para não ficar vermelho)

    const nMin = parseFloat(min?.replace(',', '.') || '0');
    const nMax = parseFloat(max?.replace(',', '.') || '0');

    if (!simb) return true;

    switch (simb) {
        case '<': return num < nMax;
        case '>': return num > nMax;
        case '<=': return num <= nMax;
        case '>=': return num >= nMax;
        case '=': return num === nMax;
        case 'até': return num >= nMin && num <= nMax;
        default: return true;
    }
};

const VisualizarMapaResultado: React.FC<MapaProps> = ({ idParametro, idAmostra, onVoltar }) => {
    const [mapa, setMapa] = useState<MapaResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [alteracoesPendentes, setAlteracoesPendentes] = useState(false);

    // 1. Carregar Dados
    const carregarMapa = useCallback(async () => {
        setLoading(true);
        try {
            const res: ApiResponse<MapaResponse> = await invoke("carregar_mapa_tauri", { 
                idParametro: idParametro,
                idAmostra: idAmostra 
            });
            
            if (res.success && res.data) {
                setMapa(res.data);
                setAlteracoesPendentes(false);
            } else {
                alert("Erro ao carregar mapa: " + res.message);
            }
        } catch (e) {
            console.error(e);
            alert("Erro de comunicação.");
        } finally {
            setLoading(false);
        }
    }, [idParametro, idAmostra]);

    useEffect(() => {
        carregarMapa();
    }, [carregarMapa]);

    // 2. Manipulação de Inputs (Imutabilidade)
    // Atualiza campos principais (Resultado, Datas)
    const handleChangeResultado = (indexLinha: number, campo: keyof LinhaMapa, valor: string) => {
        if (!mapa) return;
        
        // Cria cópia profunda do array de linhas
        const novasLinhas = [...mapa.linhas];
        const linhaAtual = { ...novasLinhas[indexLinha] };
        
        // TypeScript safe update
        (linhaAtual as any)[campo] = valor;
        
        novasLinhas[indexLinha] = linhaAtual;
        
        setMapa({ ...mapa, linhas: novasLinhas });
        setAlteracoesPendentes(true);
    };

    // Atualiza campos dinâmicos (Etapas)
    const handleChangeEtapa = (indexLinha: number, etapaId: number, novoValor: string) => {
        if (!mapa) return;
        
        const novasLinhas = [...mapa.linhas];
        const linha = { ...novasLinhas[indexLinha] };
        
        // Copia o objeto de etapas
        const novasEtapas = { ...linha.etapas };
        
        // Pega a etapa atual ou cria um esqueleto se for nova
        const etapaAtual = novasEtapas[etapaId] || { 
            resultado_etapa_id: 0, 
            analise_id: linha.analise_id,
            etapa_id: etapaId,
            valor: ''
        };

        // Atualiza o valor
        novasEtapas[etapaId] = { ...etapaAtual, valor: novoValor };
        linha.etapas = novasEtapas;
        
        novasLinhas[indexLinha] = linha;

        setMapa({ ...mapa, linhas: novasLinhas });
        setAlteracoesPendentes(true);
    };

    // 3. Salvar (Batch Update)
    const salvar = async (vistar: boolean = false) => {
        if (!mapa) return;
        
        if (vistar && !window.confirm("Deseja realmente vistar (assinar) as amostras editadas?")) {
            return;
        }

        // Mapeia o estado visual para o Payload do Backend
        const payloadItens = mapa.linhas.map(linha => ({
            resultado_id: linha.resultado_id,
            analise_id: linha.analise_id,
            data_inicio: linha.data_inicio,
            hora_inicio: linha.hora_inicio,
            data_termino: linha.data_termino,
            hora_termino: linha.hora_termino,
            resultado_final: linha.resultado_final,
            // Converte o objeto de etapas para um Map simples ID(string)->Valor(string)
            etapas: Object.keys(linha.etapas).reduce((acc, key) => {
                acc[key] = linha.etapas[key].valor || '';
                return acc;
            }, {} as Record<string, string>),
            vistar: vistar
        }));

        const payload = {
            itens: payloadItens,
            usuario_id: 1, // TODO: Contexto do Usuário
            computador: "DESKTOP-TAURI", // TODO: Pegar hostname real se possível
            ip: "127.0.0.1"
        };

        setLoading(true);
        try {
            const res: ApiResponse<null> = await invoke("salvar_mapa_tauri", { payload });
            if (res.success) {
                alert("Salvo com sucesso!");
                carregarMapa(); // Recarrega para confirmar dados e limpar flags
            } else {
                alert("Erro ao salvar: " + res.message);
            }
        } catch (e) {
            alert("Erro crítico ao salvar.");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !mapa) return <div className={styles.container}><div style={{padding:20}}>Carregando Mapa...</div></div>;
    if (!mapa) return <div className={styles.container}><div style={{padding:20}}>Nenhum dado encontrado.</div><button onClick={onVoltar}>Voltar</button></div>;

    return (
        <div className={styles.container}>
            {/* Header com Info do Parâmetro */}
            <div className={styles.headerInfo}>
                <div className={styles.infoBlock}>
                    <label>Parâmetro</label>
                    <h2><FaFlask /> {mapa.cabecalho.parametro_nome}</h2>
                </div>
                <div className={styles.infoBlock}>
                    <label>POP / Método</label>
                    <span>{mapa.cabecalho.pop_codigo} {mapa.cabecalho.pop_numero ? `- ${mapa.cabecalho.pop_numero}` : ''}</span>
                </div>
                <div className={styles.infoBlock}>
                    <label>Limites ({mapa.cabecalho.unidade})</label>
                    <span>
                        {mapa.cabecalho.limite_min || ''} {mapa.cabecalho.limite_simbolo || ''} {mapa.cabecalho.limite_max || ''}
                    </span>
                </div>
            </div>

            {/* Toolbar */}
            <div className={styles.toolbar}>
                <button className={styles.btnAction} onClick={onVoltar}>
                    <FaArrowLeft /> Voltar para Fila
                </button>
                <div style={{flex: 1}}></div>
                <button className={`${styles.btnAction} ${styles.btnCalc}`} onClick={() => alert('Motor de Cálculo: Em Breve')}>
                    <FaCalculator /> Calcular
                </button>
                <button className={`${styles.btnAction} ${styles.btnVerify}`} onClick={() => salvar(true)}>
                    <FaCheckCircle /> Salvar e Vistar
                </button>
                <button className={`${styles.btnAction} ${styles.btnSave}`} onClick={() => salvar(false)} disabled={!alteracoesPendentes}>
                    <FaSave /> Salvar Alterações
                </button>
            </div>

            {/* Grid Principal */}
            <div className={styles.gridWrapper}>
                <table className={styles.gridTable}>
                    <thead>
                        <tr>
                            <th className={styles.colFixed}>Amostra</th>
                            <th>Identificação</th>
                            <th>Início</th>
                            <th>Hora</th>
                            
                            {/* Renderização Dinâmica das Colunas de Etapa */}
                            {mapa.colunas_etapas.map(col => (
                                <th key={col.etapa_id}>{col.descricao}</th>
                            ))}

                            <th>Término</th>
                            <th>Hora</th>
                            <th>Resultado</th>
                            <th>Visto</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mapa.linhas.map((linha, idx) => {
                            // Validação Visual
                            const isError = !verificarLimiteVisual(
                                linha.resultado_final, 
                                mapa.cabecalho.limite_min, 
                                mapa.cabecalho.limite_simbolo, 
                                mapa.cabecalho.limite_max
                            );

                            return (
                                <tr key={linha.analise_id}>
                                    <td className={styles.colFixed}>
                                        <div className={styles.cellText}>
                                            <strong>{linha.amostra_numero}</strong>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.cellText} title={linha.complemento || ''}>
                                            {linha.identificacao}
                                        </div>
                                    </td>
                                    
                                    {/* Campos de Data/Hora Início */}
                                    <td>
                                        <input 
                                            className={styles.cellInput} 
                                            value={linha.data_inicio || ''} 
                                            onChange={e => handleChangeResultado(idx, 'data_inicio', e.target.value)}
                                            placeholder="__/__/____"
                                        />
                                    </td>
                                    <td>
                                        <input 
                                            className={styles.cellInput} 
                                            value={linha.hora_inicio || ''} 
                                            onChange={e => handleChangeResultado(idx, 'hora_inicio', e.target.value)}
                                            placeholder="__:__"
                                        />
                                    </td>

                                    {/* Células Dinâmicas das Etapas */}
                                    {mapa.colunas_etapas.map(col => {
                                        // Acessa o valor no objeto de etapas. Se undefined, string vazia.
                                        const valor = linha.etapas[col.etapa_id]?.valor || '';
                                        return (
                                            <td key={col.etapa_id}>
                                                <input 
                                                    className={styles.cellInput}
                                                    value={valor}
                                                    onChange={e => handleChangeEtapa(idx, col.etapa_id, e.target.value)}
                                                />
                                            </td>
                                        );
                                    })}

                                    {/* Campos de Data/Hora Término e Resultado */}
                                    <td>
                                        <input 
                                            className={styles.cellInput} 
                                            value={linha.data_termino || ''} 
                                            onChange={e => handleChangeResultado(idx, 'data_termino', e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <input 
                                            className={styles.cellInput} 
                                            value={linha.hora_termino || ''} 
                                            onChange={e => handleChangeResultado(idx, 'hora_termino', e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <input 
                                            className={`${styles.cellInput} ${isError ? styles.limitError : styles.limitSuccess}`} 
                                            value={linha.resultado_final || ''} 
                                            onChange={e => handleChangeResultado(idx, 'resultado_final', e.target.value)}
                                            style={{fontWeight: 'bold'}}
                                        />
                                    </td>
                                    <td>
                                        <div className={styles.cellText} style={{textAlign: 'center', color: '#27ae60', fontSize: '0.8rem'}}>
                                            {linha.usuario_visto ? '✓ ' + linha.usuario_visto : ''}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            <div className={styles.statusBar}>
                Total de Amostras: {mapa.linhas.length}
            </div>
        </div>
    );
};

export default VisualizarMapaResultado;