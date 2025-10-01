// Em: src/view/qualidade/GerenciarEstoque.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import styles from './styles/GerenciarEstoque.module.css';
import FormularioItemEstoque from './FormularioItemEstoque'; // Criaremos este a seguir

// --- Interfaces para Tipagem Forte ---
interface DropdownOption {
    id: string;
    nome: string;
}

interface EstoqueItemDetalhado {
    id: number;
    nome: string;
    minimo: number;
    ativo: boolean;
    unidade: string; // <-- Ajuste de nome que já fizemos
    // --- CORREÇÃO ---
    // O saldo agora virá como uma string da API.
    saldo_atual?: string; 
}

interface EstoqueRegistro {
    data: string; // Vem como string da API
    hora: string; // Vem como string da API
    entrada: boolean;
    quantidade: number;
    observacao?: string;
}

interface EstoqueCompletoResponse {
    detalhes: EstoqueItemDetalhado;
    historico: EstoqueRegistro[];
}

interface PaginatedEstoqueResponse {
    items: EstoqueItemDetalhado[];
    total: number;
    page: number;
    per_page: number;
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

const ITENS_POR_PAGINA = 15;

const GerenciarEstoque: React.FC = () => {
    // --- Estados de Filtro e Lista ---
    const [filtros, setFiltros] = useState({ nome: '', estoqueBaixo: false, mostrarInativos: false });
    const [itens, setItens] = useState<EstoqueItemDetalhado[]>([]);
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [loadingItens, setLoadingItens] = useState(false);

    // --- Estados do Item Selecionado ---
    const [itemSelecionadoId, setItemSelecionadoId] = useState<number | null>(null);
    const [itemDetalhes, setItemDetalhes] = useState<EstoqueItemDetalhado | null>(null);
    const [historico, setHistorico] = useState<EstoqueRegistro[]>([]);
    const [loadingDetalhes, setLoadingDetalhes] = useState(false);

    // --- Estados dos Formulários ---
    const [mostrarFormularioNovo, setMostrarFormularioNovo] = useState(false);
    const [novoRegistro, setNovoRegistro] = useState({
        data: new Date().toISOString().split('T')[0],
        hora: new Date().toTimeString().substring(0, 5),
        quantidade: '',
        entrada: true,
        observacao: ''
    });

    // --- Estados Gerais e de UI ---
    const [unidades, setUnidades] = useState<DropdownOption[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // --- Carregamento de Dados ---
    useEffect(() => {
        const carregarUnidades = async () => {
            try {
                const res: ApiResponse<DropdownOption[]> = await invoke("listar_unidades_compra_tauri");
                if (res.success && res.data) {
                    setUnidades(res.data);
                } else {
                    setError(res.message || "Falha ao carregar unidades.");
                }
            } catch (err) {
                setError("Erro crítico ao carregar unidades.");
            }
        };
        carregarUnidades();
    }, []);

    const buscarItens = useCallback(async () => {
        setLoadingItens(true);
        setError(null);
        try {
            const res: ApiResponse<PaginatedEstoqueResponse> = await invoke("listar_estoque_items_tauri", {
                page: paginaAtual,
                perPage: ITENS_POR_PAGINA,
                nome: filtros.nome,
                estoqueBaixo: filtros.estoqueBaixo,
                mostrarInativos: filtros.mostrarInativos,
            });

            if (res.success && res.data) {
                setItens(res.data.items);
                setTotalPaginas(Math.ceil(res.data.total / res.data.per_page) || 1);
            } else {
                setError(res.message || "Erro ao buscar itens de estoque.");
            }
        } catch (err: any) {
    // --- NOSSO ESPIÃO ---
    // Se o erro for um objeto com uma 'message', mostre a mensagem.
    // Senão, transforme o objeto todo em texto para podermos ver o que é.
    const errorMessage = err?.message ? `Erro da API: ${err.message}` : `Erro grave: ${JSON.stringify(err)}`;
    console.error("ERRO CAPTURADO:", err); // Um espião no console do navegador
    setError(errorMessage);
} finally {
            setLoadingItens(false);
        }
    }, [paginaAtual, filtros]);

    useEffect(() => {
        buscarItens();
    }, [buscarItens]);

    useEffect(() => {
        if (!itemSelecionadoId) {
            setItemDetalhes(null);
            setHistorico([]);
            return;
        }

        const buscarDetalhes = async () => {
            setLoadingDetalhes(true);
            try {
                const res: ApiResponse<EstoqueCompletoResponse> = await invoke("buscar_estoque_item_detalhado_tauri", { id: itemSelecionadoId });
                if (res.success && res.data) {
                    setItemDetalhes(res.data.detalhes);
                    setHistorico(res.data.historico);
                } else {
                    setError(res.message || "Erro ao carregar detalhes do item.");
                }
            } catch (err: any) {
    // --- NOSSO ESPIÃO ---
    // Se o erro for um objeto com uma 'message', mostre a mensagem.
    // Senão, transforme o objeto todo em texto para podermos ver o que é.
    const errorMessage = err?.message ? `Erro da API: ${err.message}` : `Erro grave: ${JSON.stringify(err)}`;
    console.error("ERRO CAPTURADO:", err); // Um espião no console do navegador
    setError(errorMessage);
} finally {
                setLoadingDetalhes(false);
            }
        };

        buscarDetalhes();
    }, [itemSelecionadoId]);

    // --- Handlers de Eventos ---

    const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        setFiltros(prev => ({
            ...prev,
            [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value
        }));
    };
    
    const handleSalvarEdicao = async () => {
        if (!itemDetalhes) return;
        try {
            // --- CORREÇÃO NO PAYLOAD ---
            const payload = {
                nome: itemDetalhes.nome,
                unidade: itemDetalhes.unidade, // Envia o texto da unidade
                minimo: Number(itemDetalhes.minimo),
                ativo: itemDetalhes.ativo,
            };
            const res: ApiResponse<EstoqueItemDetalhado> = await invoke("editar_estoque_item_tauri", { id: itemDetalhes.id, payload });

            if (res.success && res.data) {
                setSuccessMessage("Item atualizado com sucesso!");
                setItemDetalhes(res.data); // Atualiza com os dados retornados
                // Atualiza o item na lista principal para refletir a mudança sem refetch
                setItens(prev => prev.map(item => item.id === res.data!.id ? res.data! : item));
            } else {
                setError(res.message || "Falha ao atualizar.");
            }
        } catch (err: any) {
    // --- NOSSO ESPIÃO ---
    // Se o erro for um objeto com uma 'message', mostre a mensagem.
    // Senão, transforme o objeto todo em texto para podermos ver o que é.
    const errorMessage = err?.message ? `Erro da API: ${err.message}` : `Erro grave: ${JSON.stringify(err)}`;
    console.error("ERRO CAPTURADO:", err); // Um espião no console do navegador
    setError(errorMessage);
} finally {
            setTimeout(() => setSuccessMessage(null), 3000);
        }
    };
    
    const handleAdicionarRegistro = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!itemSelecionadoId || !novoRegistro.quantidade) return;
        try {
            const payload = {
                ...novoRegistro,
                quantidade: Number(novoRegistro.quantidade),
            };
            const res: ApiResponse<EstoqueCompletoResponse> = await invoke("criar_estoque_registro_tauri", { id: itemSelecionadoId, payload });

            if(res.success && res.data) {
                setSuccessMessage("Movimentação registrada!");
                setItemDetalhes(res.data.detalhes);
                setHistorico(res.data.historico);
                // Limpa o formulário de registro
                setNovoRegistro({
                    data: new Date().toISOString().split('T')[0],
                    hora: new Date().toTimeString().substring(0, 5),
                    quantidade: '',
                    entrada: true,
                    observacao: ''
                });
            } else {
                setError(res.message || "Falha ao registrar movimentação.");
            }
        } catch (err: any) {
    // --- NOSSO ESPIÃO ---
    // Se o erro for um objeto com uma 'message', mostre a mensagem.
    // Senão, transforme o objeto todo em texto para podermos ver o que é.
    const errorMessage = err?.message ? `Erro da API: ${err.message}` : `Erro grave: ${JSON.stringify(err)}`;
    console.error("ERRO CAPTURADO:", err); // Um espião no console do navegador
    setError(errorMessage);
} finally {
            setTimeout(() => setSuccessMessage(null), 3000);
        }
    };

    if (mostrarFormularioNovo) {
        return <FormularioItemEstoque 
            unidades={unidades}
            onCancelar={() => setMostrarFormularioNovo(false)}
            onSalvar={() => {
                setMostrarFormularioNovo(false);
                setSuccessMessage("Novo item criado com sucesso!");
                buscarItens();
                setTimeout(() => setSuccessMessage(null), 3000);
            }}
        />
    }

    // --- Renderização ---
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Gerenciar Estoque</h2>
                <button onClick={() => setMostrarFormularioNovo(true)} className={styles.buttonPrimary}>Novo Item</button>
            </div>

            {error && <div className={styles.error}>{error}</div>}
            {successMessage && <div className={styles.success}>{successMessage}</div>}

            <div className={styles.filters}>
                <input
                    type="text"
                    name="nome"
                    placeholder="Buscar por nome..."
                    value={filtros.nome}
                    onChange={handleFiltroChange}
                />
                <label>
                    <input type="checkbox" name="estoqueBaixo" checked={filtros.estoqueBaixo} onChange={handleFiltroChange} />
                    Estoque Baixo
                </label>
                <label>
                    <input type="checkbox" name="mostrarInativos" checked={filtros.mostrarInativos} onChange={handleFiltroChange} />
                    Mostrar Inativos
                </label>
            </div>

            <div className={styles.mainContent}>
                <div className={styles.listPane}>
                    {loadingItens ? <div className={styles.spinner}></div> : (
                        <>
                            <ul>
                                {itens.map(item => (
                                    <li 
                                        key={item.id}
                                        className={item.id === itemSelecionadoId ? styles.active : ''}
                                        onClick={() => setItemSelecionadoId(item.id)}
                                    >
                                        <span>{item.nome}</span>
                                        <small>Saldo: {item.saldo_atual ?? '0'} {item.unidade}</small>

                                    </li>
                                ))}
                            </ul>
                            {/* ... Paginação ... */}
                        </>
                    )}
                </div>

                <div className={styles.detailsPane}>
                    {!itemSelecionadoId ? (
                        <div className={styles.placeholder}>Selecione um item à esquerda para ver os detalhes.</div>
                    ) : loadingDetalhes ? (
                        <div className={styles.spinner}></div>
                    ) : itemDetalhes && (
                        <>
                            {/* Formulário de Edição */}
                            <div className={styles.formSection}>
                                <h3>Detalhes do Item</h3>
                                <div className={styles.formGrid}>
                                    <label>Nome: <input type="text" value={itemDetalhes.nome} onChange={e => setItemDetalhes(prev => ({ ...prev!, nome: e.target.value }))} /></label>
                                    <label>Unidade:
                                        <select value={itemDetalhes.unidade} onChange={e => setItemDetalhes(prev => ({ ...prev!, unidade: e.target.value }))}>
                                            {unidades.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                                        </select>
                                    </label>
                                    <label>Mínimo: <input type="number" value={itemDetalhes.minimo} onChange={e => setItemDetalhes(prev => ({ ...prev!, minimo: Number(e.target.value) }))} /></label>
                                    <label>Saldo: <strong>{itemDetalhes.saldo_atual ?? 0}</strong></label>
                                    <label><input type="checkbox" checked={itemDetalhes.ativo} onChange={e => setItemDetalhes(prev => ({ ...prev!, ativo: e.target.checked }))} /> Ativo</label>
                                </div>
                                <button onClick={handleSalvarEdicao} className={styles.buttonPrimary}>Salvar Alterações</button>
                            </div>

                            {/* Formulário de Nova Movimentação */}
                            <div className={styles.formSection}>
                                <h3>Registrar Movimentação</h3>
                                <form onSubmit={handleAdicionarRegistro} className={styles.movimentoForm}>
                                    <input type="date" value={novoRegistro.data} onChange={e => setNovoRegistro(p => ({...p, data: e.target.value}))} required />
                                    <input type="time" value={novoRegistro.hora} onChange={e => setNovoRegistro(p => ({...p, hora: e.target.value}))} required />
                                    <input type="number" placeholder="Qtde" value={novoRegistro.quantidade} onChange={e => setNovoRegistro(p => ({...p, quantidade: e.target.value}))} required />
                                    <select value={String(novoRegistro.entrada)} onChange={e => setNovoRegistro(p => ({...p, entrada: e.target.value === 'true'}))}>
                                        <option value="true">Entrada</option>
                                        <option value="false">Saída</option>
                                    </select>
                                    <input type="text" placeholder="Observação" value={novoRegistro.observacao} onChange={e => setNovoRegistro(p => ({...p, observacao: e.target.value}))} required />
                                    <button type="submit">Incluir</button>
                                </form>
                            </div>

                            {/* Tabela de Histórico */}
                            <div className={styles.historyTable}>
                                <h3>Histórico</h3>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Data/Hora</th>
                                            <th>Tipo</th>
                                            <th>Qtde</th>
                                            <th>Observação</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historico.map((reg, index) => (
                                            <tr key={index}>
                                                <td>{new Date(reg.data + 'T' + reg.hora).toLocaleString()}</td>
                                                <td className={reg.entrada ? styles.entrada : styles.saida}>{reg.entrada ? 'Entrada' : 'Saída'}</td>
                                                <td>{reg.quantidade}</td>
                                                <td>{reg.observacao}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GerenciarEstoque;