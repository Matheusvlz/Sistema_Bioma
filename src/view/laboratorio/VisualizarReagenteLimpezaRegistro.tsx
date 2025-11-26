import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import styles from './styles/VisualizarReagenteLimpezaRegistro.module.css';
import GerenciarReagenteLimpezaModal from './GerenciarReagenteLimpezaModal';

// --- Interfaces ---

interface ReagenteItem {
    id: number;
    nome: string;
    unidade: string;
}

interface ReagenteRegistro {
    id: number;
    id_reagente: number;
    lote: string;
    fabricante: string;
    preparo: string;
    validade: string;
    data_inicial?: string;
    data_final?: string;
    user_iniciado?: string;
    user_finalizado?: string;
}

interface UsuarioSistema {
    id: number;
    nome: string;
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

interface FormularioState {
    lote: string;
    fabricante: string;
    data_preparo: string;
    validade: string;
}

const VisualizarReagenteLimpezaRegistro: React.FC = () => {
    // --- Estados ---
    const [reagentes, setReagentes] = useState<ReagenteItem[]>([]);
    const [reagenteSelecionado, setReagenteSelecionado] = useState<number | null>(null);
    const [registros, setRegistros] = useState<ReagenteRegistro[]>([]);
    const [idUsuarioLogado, setIdUsuarioLogado] = useState<number | null>(null);
    
    // Controles de UI
    const [modalAberto, setModalAberto] = useState(false);
    const [idEmEdicao, setIdEmEdicao] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [form, setForm] = useState<FormularioState>({
        lote: '', fabricante: '', data_preparo: '', validade: ''
    });

    // --- Helpers ---
    const mascaraData = (valor: string) => {
        return valor
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '$1/$2')
            .replace(/(\d{2})(\d)/, '$1/$2')
            .replace(/(\d{4})\d+?$/, '$1');
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'data_preparo' || name === 'validade') {
            setForm(prev => ({ ...prev, [name]: mascaraData(value) }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    // --- Carregamento ---
    
    // Identificar Usuário
    useEffect(() => {
        const identificarUsuario = async () => {
            try {
                const usuario: UsuarioSistema = await invoke('usuario_logado');
                if (usuario && usuario.id) setIdUsuarioLogado(usuario.id);
            } catch (err) {
                const storedId = localStorage.getItem('userId') || localStorage.getItem('id_usuario');
                if (storedId) setIdUsuarioLogado(Number(storedId));
            }
        };
        identificarUsuario();
    }, []);

    // Carregar Dropdown (ITENS)
    const carregarOpcoes = useCallback(async () => {
        try {
            const res: ApiResponse<ReagenteItem[]> = await invoke('listar_reagentes_itens_tauri');
            if (res.success && res.data) setReagentes(res.data);
        } catch (err: any) { setError(`Erro ao carregar reagentes: ${err}`); }
    }, []);

    useEffect(() => {
        carregarOpcoes();
    }, [carregarOpcoes]);

    // Carregar Tabela (REGISTROS)
    const carregarRegistros = useCallback(async () => {
        if (!reagenteSelecionado) return;
        setLoading(true);
        try {
            // ✅ CORREÇÃO FINAL: Enviamos 'reagenteId' (camelCase) para o Tauri traduzir para 'reagente_id' no Rust
            const res: ApiResponse<ReagenteRegistro[]> = await invoke('listar_registros_reagente_tauri', {
                reagenteId: reagenteSelecionado 
            });
            if (res.success && res.data) setRegistros(res.data);
            else setError(res.message || "Erro ao carregar registros.");
        } catch (err: any) {
            setError(`Erro ao buscar registros: ${err}`);
        } finally {
            setLoading(false);
        }
    }, [reagenteSelecionado]);

    useEffect(() => {
        if (reagenteSelecionado) {
            carregarRegistros();
            handleCancelarEdicao();
        } else {
            setRegistros([]);
        }
    }, [carregarRegistros, reagenteSelecionado]);

    // --- Ações ---

    const handleEditar = (reg: ReagenteRegistro) => {
        setForm({
            lote: reg.lote,
            fabricante: reg.fabricante,
            data_preparo: reg.preparo,
            validade: reg.validade
        });
        setIdEmEdicao(reg.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelarEdicao = () => {
        setForm({ lote: '', fabricante: '', data_preparo: '', validade: '' });
        setIdEmEdicao(null);
    };

    const handleSalvarOuAtualizar = async () => {
        if (!reagenteSelecionado) { alert("Selecione um reagente!"); return; }
        if (!form.lote || !form.fabricante || form.data_preparo.length < 10 || form.validade.length < 10) {
            alert("Preencha todos os campos corretamente.");
            return;
        }

        try {
            if (idEmEdicao) {
                // EDIÇÃO (PUT)
                const payload = {
                    lote: form.lote,
                    fabricante: form.fabricante,
                    data_preparo: form.data_preparo,
                    validade: form.validade
                };
                const res: ApiResponse<void> = await invoke('editar_registro_reagente_tauri', { 
                    id: idEmEdicao, payload 
                });

                if (res.success) {
                    setSuccessMessage("Lote atualizado com sucesso!");
                    handleCancelarEdicao();
                    carregarRegistros();
                    setTimeout(() => setSuccessMessage(null), 3000);
                } else { alert(res.message); }
            } else {
                // CRIAÇÃO (POST)
                const payload = {
                    reagente_limpeza: reagenteSelecionado, // Tauri vai converter para reagente_limpeza automaticamente
                    lote: form.lote,
                    fabricante: form.fabricante,
                    data_preparo: form.data_preparo,
                    validade: form.validade
                };
                const res: ApiResponse<void> = await invoke('criar_registro_reagente_tauri', { payload });
                
                if (res.success) {
                    setSuccessMessage("Lote cadastrado com sucesso!");
                    handleCancelarEdicao();
                    carregarRegistros();
                    setTimeout(() => setSuccessMessage(null), 3000);
                } else { alert(res.message); }
            }
        } catch (err: any) { alert(`Erro ao salvar: ${err}`); }
    };

    const handleRegistroUso = async (idRegistro: number, tipo: number) => {
        if (!idUsuarioLogado) {
            alert("Sessão inválida. Faça login novamente.");
            return;
        }
        const dataHoje = new Date().toLocaleDateString('pt-BR'); 

        if(!window.confirm(`Confirma o ${tipo === 1 ? 'INÍCIO' : 'FIM'} do uso para hoje (${dataHoje})?`)) return;

        try {
            const payload = {
                usuario_id: idUsuarioLogado,
                data: dataHoje,
                tipo_registro: tipo
            };
            const res: ApiResponse<void> = await invoke('registrar_uso_reagente_tauri', {
                id: idRegistro, payload
            });

            if (res.success) {
                setSuccessMessage(tipo === 1 ? "Uso iniciado!" : "Uso finalizado!");
                carregarRegistros();
                setTimeout(() => setSuccessMessage(null), 3000);
            } else { alert(res.message); }
        } catch (err: any) { alert(`Erro na operação: ${err}`); }
    };

    return (
        <div className={styles.container}>
            {modalAberto && (
                <GerenciarReagenteLimpezaModal 
                    onClose={() => setModalAberto(false)} 
                    onSuccess={() => {
                        carregarOpcoes(); // Atualiza o dropdown quando fecha o modal
                    }} 
                />
            )}

            <div className={styles.header}>
                <h2>Reagentes de Limpeza - Registro</h2>
            </div>

            {error && <div className={styles.errorBanner}>{error}</div>}
            {successMessage && <div className={styles.successBanner}>{successMessage}</div>}

            {/* SEÇÃO 1: Formulário */}
            <div className={styles.card}>
                <div style={{marginBottom: '10px', fontWeight: 'bold', color: idEmEdicao ? '#e67e22' : '#333'}}>
                    {idEmEdicao ? `✏️ Editando Lote: ${form.lote}` : '➕ Novo Registro'}
                </div>

                <div className={styles.row}>
                    <div className={styles.inputGroup} style={{ flex: 2 }}>
                        <label>Selecione o Reagente:</label>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <select 
                                value={reagenteSelecionado || ''} 
                                onChange={(e) => setReagenteSelecionado(Number(e.target.value))}
                                className={styles.select}
                                style={{ flex: 1 }}
                                disabled={!!idEmEdicao}
                            >
                                <option value="">-- Selecione --</option>
                                {reagentes.map(r => (
                                    <option key={r.id} value={r.id}>{r.nome}</option>
                                ))}
                            </select>
                            <button 
                                className={styles.btnSmall} 
                                style={{ fontSize: '1.2rem', padding: '0 12px', height: '42px' }}
                                onClick={() => setModalAberto(true)}
                                title="Gerenciar Tipos de Reagente"
                                disabled={!!idEmEdicao}
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>

                <div className={styles.row}>
                    <div className={styles.inputGroup}>
                        <label>Lote:</label>
                        <input name="lote" value={form.lote} onChange={handleFormChange} disabled={!reagenteSelecionado}/>
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Fabricante:</label>
                        <input name="fabricante" value={form.fabricante} onChange={handleFormChange} disabled={!reagenteSelecionado}/>
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Preparo:</label>
                        <input name="data_preparo" value={form.data_preparo} onChange={handleFormChange} placeholder="dd/mm/aaaa" maxLength={10} disabled={!reagenteSelecionado}/>
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Validade:</label>
                        <input name="validade" value={form.validade} onChange={handleFormChange} placeholder="dd/mm/aaaa" maxLength={10} disabled={!reagenteSelecionado}/>
                    </div>
                    <div className={styles.actions}>
                        {idEmEdicao && (
                            <button onClick={handleCancelarEdicao} className={styles.btnSmall} style={{backgroundColor: '#6c757d', marginRight: '10px', height: '42px'}}>
                                Cancelar
                            </button>
                        )}
                        <button 
                            onClick={handleSalvarOuAtualizar} 
                            disabled={!reagenteSelecionado} 
                            className={styles.btnPrimary}
                            style={{backgroundColor: idEmEdicao ? '#e67e22' : undefined}}
                        >
                            {idEmEdicao ? 'Atualizar Lote' : 'Salvar Lote'}
                        </button>
                    </div>
                </div>
            </div>

            {/* SEÇÃO 2: Tabela */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Lote</th>
                            <th>Fabricante</th>
                            <th>Preparo</th>
                            <th>Validade</th>
                            <th>Data Inicial / Usuário</th>
                            <th>Data Final / Usuário</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{textAlign: 'center'}}>Carregando...</td></tr>
                        ) : registros.length === 0 ? (
                            <tr><td colSpan={7} style={{textAlign: 'center'}}>Nenhum registro encontrado.</td></tr>
                        ) : (
                            registros.map(reg => (
                                <tr key={reg.id} style={{backgroundColor: idEmEdicao === reg.id ? '#fff3cd' : 'transparent'}}>
                                    <td>{reg.lote}</td>
                                    <td>{reg.fabricante}</td>
                                    <td>{reg.preparo}</td>
                                    <td>{reg.validade}</td>
                                    <td>
                                        {reg.data_inicial ? (
                                            <div><strong>{reg.data_inicial}</strong><br/><small>{reg.user_iniciado}</small></div>
                                        ) : (
                                            <button 
                                                className={styles.btnSmall} 
                                                onClick={() => handleRegistroUso(reg.id, 1)}
                                                disabled={!!idEmEdicao}
                                            >
                                                Iniciar Uso
                                            </button>
                                        )}
                                    </td>
                                    <td>
                                        {reg.data_final ? (
                                            <div><strong>{reg.data_final}</strong><br/><small>{reg.user_finalizado}</small></div>
                                        ) : (
                                            <button 
                                                className={styles.btnSmall} 
                                                disabled={!reg.data_inicial || !!idEmEdicao} 
                                                onClick={() => handleRegistroUso(reg.id, 0)}
                                            >
                                                Finalizar Uso
                                            </button>
                                        )}
                                    </td>
                                    <td>
                                        <button 
                                            disabled={!!reg.data_inicial} 
                                            title={reg.data_inicial ? "Em uso" : "Editar"} 
                                            className={styles.btnIcon}
                                            onClick={() => handleEditar(reg)}
                                        >
                                            ✏️
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default VisualizarReagenteLimpezaRegistro;