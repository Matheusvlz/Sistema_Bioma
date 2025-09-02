// src/view/geral/VisualizarLqIncerteza.tsx

import React, { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";
import styles from './css/VisualizarLqIncerteza.module.css';
// ✅ CORREÇÃO: Importa a função correta que criámos.
import { formatNumber } from '../../utils/formatters'; 

// Tipos de dados que esperamos receber do backend Tauri
interface Grupo {
    id: number;
    nome: string;
}

interface ParametroPopDetalhado {
    id: number;
    nome_parametro: string | null;
    grupo: string | null;
    pop_numero: string | null;
    pop_revisao: string | null;
    nome_tecnica: string | null;
    objetivo: string | null;
    lqi: string | null; 
    incerteza: string | null;
}

export function VisualizarLqIncerteza() {
    const [grupos, setGrupos] = useState<Grupo[]>([]);
    const [grupoSelecionado, setGrupoSelecionado] = useState<string | null>(null);
    const [dadosTabela, setDadosTabela] = useState<ParametroPopDetalhado[]>([]);
    const [linhaSelecionada, setLinhaSelecionada] = useState<ParametroPopDetalhado | null>(null);
    
    const [lqEditado, setLqEditado] = useState<string>('');
    const [incertezaEditada, setIncertezaEditada] = useState<string>('');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [termoBusca, setTermoBusca] = useState('');
    const [dadosFiltrados, setDadosFiltrados] = useState<ParametroPopDetalhado[]>([]);

    useEffect(() => {
        invoke<{ success: boolean; data: Grupo[]; message: string }>('listar_grupos')
            .then(response => {
                if (response.success && response.data) {
                    setGrupos(response.data);
                    if (response.data.length > 0) {
                        setGrupoSelecionado(response.data[0].nome);
                    }
                } else {
                    setError(response.message);
                }
            })
            .catch(err => setError(err.toString()));
    }, []);

    useEffect(() => {
        if (grupoSelecionado) {
            setLoading(true);
            setError(null);
            setDadosTabela([]);
            setLinhaSelecionada(null);
            setTermoBusca('');

            invoke<{ success: boolean; data: ParametroPopDetalhado[]; message: string }>('listar_parametros_pops_por_grupo', { grupo: grupoSelecionado })
                .then(response => {
                    if (response.success && response.data) {
                        setDadosTabela(response.data);
                        if (response.data.length > 0) {
                            setLinhaSelecionada(response.data[0]);
                        }
                    } else {
                        setError(response.message);
                    }
                })
                .catch(err => setError(err.toString()))
                .finally(() => setLoading(false));
        }
    }, [grupoSelecionado]);
    
    useEffect(() => {
        const resultado = dadosTabela.filter(item => 
            item.nome_parametro?.toLowerCase().includes(termoBusca.toLowerCase())
        );
        setDadosFiltrados(resultado);
    }, [termoBusca, dadosTabela]);

    useEffect(() => {
        if (linhaSelecionada) {
            // ✅ CORREÇÃO: Usa a função formatNumber correta
            setLqEditado(formatNumber(linhaSelecionada.lqi));
            setIncertezaEditada(formatNumber(linhaSelecionada.incerteza));
        } else {
            setLqEditado('');
            setIncertezaEditada('');
        }
    }, [linhaSelecionada]);
    
    const handleUpdate = async () => {
        if (!linhaSelecionada) return;

        try {
            const payload = { lqi: lqEditado.replace(',', '.'), incerteza: incertezaEditada.replace(',', '.') };
            const response = await invoke<{ success: boolean; message: string }>('atualizar_lq_incerteza_tauri', {
                id: linhaSelecionada.id,
                payload: payload
            });

            if (response.success) {
                alert('Valores atualizados com sucesso!');
                const grupoAtual = grupoSelecionado;
                setGrupoSelecionado(null);
                setTimeout(() => setGrupoSelecionado(grupoAtual), 10); // Força a recarga
            } else {
                alert(`Erro ao atualizar: ${response.message}`);
            }
        } catch (err) {
            alert(`Erro ao chamar o backend: ${err}`);
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Limite de Quantificação e Incerteza</h1>

            <div className={styles.editingPanel}>
                <div className={styles.infoField}>
                    <label>Parâmetro</label>
                    <span>{linhaSelecionada?.nome_parametro || 'Nenhum selecionado'}</span>
                </div>
                <div className={styles.infoField}>
                    <label>POP</label>
                    <span>{linhaSelecionada ? `${linhaSelecionada.pop_numero}/${linhaSelecionada.pop_revisao}` : '-'}</span>
                </div>
                <div className={styles.inputGroup}>
                    <label>Limite de quantificação</label>
                    <input type="text" value={lqEditado} onChange={(e) => setLqEditado(e.target.value)} />
                </div>
                <div className={styles.inputGroup}>
                    <label>Incerteza ±</label>
                    <input type="text" value={incertezaEditada} onChange={(e) => setIncertezaEditada(e.target.value)} />
                </div>
                <button onClick={handleUpdate} className={styles.updateButton} disabled={!linhaSelecionada}>
                    Alterar Valores
                </button>
            </div>
            
            <div className={styles.searchContainer}>
                <input
                    type="text"
                    placeholder="Pesquisar por nome do parâmetro..."
                    className={styles.searchInput}
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                />
            </div>

            <div className={styles.tabContainer}>
                {grupos.map(grupo => (
                    <button
                        key={grupo.id}
                        className={`${styles.tabButton} ${grupo.nome === grupoSelecionado ? styles.activeTab : ''}`}
                        onClick={() => setGrupoSelecionado(grupo.nome)}
                    >
                        {grupo.nome}
                    </button>
                ))}
            </div>

            <div className={styles.tableContainer}>
                {loading && <p>Carregando...</p>}
                {error && <p className={styles.error}>Erro: {error}</p>}
                {!loading && !error && (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Parâmetro</th>
                                <th>POP</th>
                                <th>Técnica</th>
                                <th>Objetivo</th>
                                <th>Limite de quantificação</th>
                                <th>Incerteza ±</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dadosFiltrados.map(item => (
                                <tr
                                    key={item.id}
                                    className={linhaSelecionada?.id === item.id ? styles.selectedRow : ''}
                                    onClick={() => setLinhaSelecionada(item)}
                                >
                                    <td>{item.nome_parametro || '-'}</td>
                                    <td>{item.pop_numero}/{item.pop_revisao}</td>
                                    <td>{item.nome_tecnica || '-'}</td>
                                    <td>{item.objetivo || '-'}</td>
                                    {/* ✅ CORREÇÃO: Usa a função formatNumber correta */}
                                    <td>{formatNumber(item.lqi)}</td>
                                    <td>{formatNumber(item.incerteza)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}