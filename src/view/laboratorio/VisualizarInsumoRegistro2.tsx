import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import styles from './styles/VisualizarInsumoRegistro2.module.css';
import ModalInsumoRegistro2 from './components/ModalInsumoRegistro2';

// --- Interfaces ---
interface InsumoDropdown {
    id: number;
    nome: string;
}

interface RegistroDetalhado {
    id: number;
    insumo_id: number;
    registro: string; // Lote
    fabricante: string;
    data_preparo: string;
    validade: string;
    amostra_inicial?: number;
    amostra_inicial_letra?: string;
    amostra_final?: number;
    amostra_final_letra?: string;
    usuario_iniciado_nome?: string;
    usuario_finalizado_nome?: string;
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

interface PaginatedResponse {
    items: RegistroDetalhado[];
    total: number;
}

// --- Componente Principal ---
const VisualizarInsumoRegistro2: React.FC = () => {
    // Estados de Dados
    const [insumos, setInsumos] = useState<InsumoDropdown[]>([]);
    const [insumoSelecionado, setInsumoSelecionado] = useState<number | ''>('');
    const [registros, setRegistros] = useState<RegistroDetalhado[]>([]);
    
    // Estados de UI e Controle
    const [loading, setLoading] = useState(false);
    const [usuarioLogadoId, setUsuarioLogadoId] = useState<number>(0); // Carregar via Contexto ou API
    const [modalOpen, setModalOpen] = useState(false);
    const [itemEmEdicao, setItemEmEdicao] = useState<RegistroDetalhado | null>(null);
    
    // Estados Locais para Inputs de Amostra (Controle Inline)
    // Mapa: { [registroId_tipo]: { numero: string, letra: string } }
    const [inputValues, setInputValues] = useState<Record<string, {num: string, letra: string}>>({});

    // --- 1. Carregamento Inicial ---
    useEffect(() => {
        carregarInsumos();
        obterUsuarioLogado();
    }, []);

    const obterUsuarioLogado = async () => {
        // Simulação: Em produção, usar Contexto ou chamar API de sessão
        // await invoke("get_usuario_logado_id");
        setUsuarioLogadoId(1); // Default temporário
    };

    const carregarInsumos = async () => {
        try {
            const res: ApiResponse<InsumoDropdown[]> = await invoke("listar_insumos_tauri");
            if (res.success && res.data) {
                setInsumos(res.data);
            }
        } catch (error) {
            console.error("Erro ao carregar insumos:", error);
        }
    };

    // --- 2. Carregar Registros da Tabela ---
    const carregarRegistros = useCallback(async () => {
        if (!insumoSelecionado) return;
        setLoading(true);
        try {
            const res: ApiResponse<PaginatedResponse> = await invoke("listar_insumo_registro_2_tauri", {
                insumoId: Number(insumoSelecionado),
                page: 1,
                perPage: 100 // Trazemos 100 para simplificar, paginação real pode ser adicionada depois
            });
            if (res.success && res.data) {
                setRegistros(res.data.items);
            } else {
                alert(res.message || "Erro ao buscar registros.");
            }
        } catch (error) {
            console.error(error);
            alert("Erro de conexão.");
        } finally {
            setLoading(false);
        }
    }, [insumoSelecionado]);

    useEffect(() => {
        if (insumoSelecionado) {
            carregarRegistros();
        } else {
            setRegistros([]);
        }
    }, [insumoSelecionado, carregarRegistros]);

    // --- 3. Ações de CRUD (Lote) ---
    const handleSaveLote = async (payload: any) => {
        try {
            const comando = itemEmEdicao ? "editar_insumo_registro_2_tauri" : "criar_insumo_registro_2_tauri";
            const args = itemEmEdicao ? { id: itemEmEdicao.id, payload } : { payload };
            
            const res: ApiResponse<any> = await invoke(comando, args);
            
            if (res.success) {
                setModalOpen(false);
                setItemEmEdicao(null);
                carregarRegistros();
            } else {
                alert("Erro: " + res.message);
            }
        } catch (e) {
            alert("Erro crítico ao salvar.");
        }
    };

    const handleDelete = async (id: number) => {
        if(!window.confirm("Tem certeza que deseja excluir este lote?")) return;
        try {
            const res: ApiResponse<any> = await invoke("deletar_insumo_registro_2_tauri", { id });
            if(res.success) carregarRegistros();
            else alert(res.message);
        } catch(e) { alert("Erro ao deletar."); }
    };

    // --- 4. Lógica Crítica: Atualizar Amostra Inline ---
    const handleInputChange = (id: number, tipo: 'INICIAL'|'FINAL', field: 'num'|'letra', value: string) => {
        const key = `${id}_${tipo}`;
        setInputValues(prev => ({
            ...prev,
            [key]: {
                ...prev[key] || { num: '', letra: '' },
                [field]: value
            }
        }));
    };

    const handleSaveAmostra = async (item: RegistroDetalhado, tipo: 'INICIAL'|'FINAL') => {
        const key = `${item.id}_${tipo}`;
        const input = inputValues[key];

        if (!input || !input.num) {
            alert("Informe o número da amostra.");
            return;
        }

        // Validações de Frontend (UX Imediata)
        const numAmostra = parseInt(input.num);
        if (tipo === 'FINAL' && item.amostra_inicial && numAmostra < item.amostra_inicial) {
            alert("Amostra Final não pode ser menor que a Inicial.");
            return;
        }
        if (tipo === 'INICIAL' && item.amostra_final && numAmostra > item.amostra_final) {
            alert("Amostra Inicial não pode ser maior que a Final.");
            return;
        }

        if(!window.confirm(`Confirma registrar a Amostra ${tipo} como ${input.num}${input.letra || ''}?`)) return;

        try {
            const res: ApiResponse<any> = await invoke("atualizar_amostra_registro_2_tauri", {
                id: item.id,
                payload: {
                    amostra: numAmostra,
                    letra: input.letra?.toUpperCase() || null,
                    usuario_id: usuarioLogadoId,
                    tipo: tipo
                }
            });

            if (res.success) {
                carregarRegistros();
                // Limpa o input após sucesso
                const newInputs = {...inputValues};
                delete newInputs[key];
                setInputValues(newInputs);
            } else {
                alert("Erro: " + res.message);
            }
        } catch (e) {
            alert("Erro ao salvar amostra.");
        }
    };

    // --- Renderizadores Auxiliares ---
    const renderAmostraCell = (item: RegistroDetalhado, tipo: 'INICIAL'|'FINAL') => {
        const valorExistente = tipo === 'INICIAL' ? item.amostra_inicial : item.amostra_final;
        const letraExistente = tipo === 'INICIAL' ? item.amostra_inicial_letra : item.amostra_final_letra;
        const usuario = tipo === 'INICIAL' ? item.usuario_iniciado_nome : item.usuario_finalizado_nome;

        // Se já tem valor, mostra Badge (Bloqueado para edição direta para manter integridade)
        if (valorExistente) {
            return (
                <div className={styles.completedBadge}>
                    <span className={styles.amostraValue}>
                        {valorExistente}{letraExistente || ''}
                    </span>
                    <span className={styles.userName}>👤 {usuario || 'Sistema'}</span>
                </div>
            );
        }

        // Se for Final e não tem Inicial, bloqueia
        if (tipo === 'FINAL' && !item.amostra_inicial) {
            return <span style={{color:'#cbd5e0', fontStyle:'italic'}}>Aguardando Início...</span>;
        }

        // Se não tem valor, mostra Inputs
        const key = `${item.id}_${tipo}`;
        const input = inputValues[key] || { num: '', letra: '' };

        return (
            <div className={styles.amostraCell}>
                <input 
                    type="number" 
                    placeholder="Nº"
                    className={styles.inputAmostra}
                    value={input.num}
                    onChange={(e) => handleInputChange(item.id, tipo, 'num', e.target.value)}
                />
                <input 
                    type="text" 
                    placeholder="Letra"
                    maxLength={1}
                    className={styles.inputLetra}
                    value={input.letra}
                    onChange={(e) => handleInputChange(item.id, tipo, 'letra', e.target.value)}
                />
                <button 
                    className={styles.btnSaveMini} 
                    title="Salvar Amostra"
                    onClick={() => handleSaveAmostra(item, tipo)}
                >
                    💾
                </button>
            </div>
        );
    };

    // Formata datas para PT-BR
    const formatDate = (dateStr: string) => {
        if(!dateStr) return '-';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    return (
        <div className={styles.container}>
            {/* --- Header --- */}
            <div className={styles.header}>
                <h2>🧪 Registro de Insumos e Amostras</h2>
                <div className={styles.controls}>
                    <select 
                        className={styles.selectInsumo}
                        value={insumoSelecionado}
                        onChange={(e) => setInsumoSelecionado(Number(e.target.value))}
                    >
                        <option value="">Selecione um Meio de Cultura...</option>
                        {insumos.map(i => (
                            <option key={i.id} value={i.id}>{i.nome}</option>
                        ))}
                    </select>
                    <button 
                        className={styles.btnPrimary} 
                        disabled={!insumoSelecionado}
                        onClick={() => { setItemEmEdicao(null); setModalOpen(true); }}
                    >
                        + Novo Lote
                    </button>
                </div>
            </div>

            {/* --- Tabela --- */}
            <div className={styles.tableContainer}>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th style={{width: '50px'}}>ID</th>
                                <th style={{width: '15%'}}>Lote / Registro</th>
                                <th style={{width: '15%'}}>Fabricante</th>
                                <th style={{width: '10%'}}>Preparo</th>
                                <th style={{width: '10%'}}>Validade</th>
                                <th style={{width: '20%'}}>Amostra Inicial</th>
                                <th style={{width: '20%'}}>Amostra Final</th>
                                <th style={{width: '10%', textAlign:'center'}}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className={styles.loading}>Carregando dados...</td></tr>
                            ) : registros.length === 0 ? (
                                <tr><td colSpan={8} className={styles.empty}>
                                    {!insumoSelecionado ? "Selecione um insumo acima." : "Nenhum lote encontrado."}
                                </td></tr>
                            ) : (
                                registros.map(item => (
                                    <tr key={item.id}>
                                        <td>{item.id}</td>
                                        <td style={{fontWeight:'bold'}}>{item.registro}</td>
                                        <td>{item.fabricante}</td>
                                        <td>{formatDate(item.data_preparo)}</td>
                                        <td className={new Date(item.validade) < new Date() ? styles.validadeVencida : styles.validadeOk}>
                                            {formatDate(item.validade)}
                                        </td>
                                        
                                        {/* Células Inteligentes de Amostra */}
                                        <td>{renderAmostraCell(item, 'INICIAL')}</td>
                                        <td>{renderAmostraCell(item, 'FINAL')}</td>

                                        <td style={{textAlign:'center'}}>
                                            <div className={styles.actions} style={{justifyContent:'center'}}>
                                                <button 
                                                    className={styles.btnEdit} 
                                                    title="Editar Lote"
                                                    onClick={() => { setItemEmEdicao(item); setModalOpen(true); }}
                                                >
                                                    ✏️
                                                </button>
                                                <button 
                                                    className={styles.btnDelete} 
                                                    title="Excluir"
                                                    onClick={() => handleDelete(item.id)}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- Modal --- */}
            <ModalInsumoRegistro2 
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                insumoId={Number(insumoSelecionado)}
                usuarioLogadoId={usuarioLogadoId}
                itemParaEditar={itemEmEdicao}
                onSave={handleSaveLote}
            />
        </div>
    );
};

export default VisualizarInsumoRegistro2;