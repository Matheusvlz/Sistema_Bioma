// Arquivo completo: src/view/geral/GerenciarTecnicaEtapa.tsx

import React, { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import styles from './css/GerenciarTecnicaEtapa.module.css';

// --- Interfaces ---
interface Tecnica {
    ID: number;
    nome: string;
}
interface Etapa {
    ID: number;
    descricao: string;
}
interface TecnicaEtapaView {
    ID: number;
    descricao: string;
    sequencia: number;
}
interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
}

const GerenciarTecnicaEtapa: React.FC = () => {
    // --- Estados ---
    const [tecnicas, setTecnicas] = useState<Tecnica[]>([]);
    const [etapasDisponiveis, setEtapasDisponiveis] = useState<Etapa[]>([]);
    const [etapasRelacionadas, setEtapasRelacionadas] = useState<TecnicaEtapaView[]>([]);
    const [tecnicaSelecionada, setTecnicaSelecionada] = useState<Tecnica | null>(null);
    const [etapasParaAdicionar, setEtapasParaAdicionar] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState({ tecnicas: true, etapas: true, relacionadas: false });
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        carregarTecnicasEEtapas();
    }, []);

    useEffect(() => {
        if (tecnicaSelecionada) {
            carregarEtapasRelacionadas(tecnicaSelecionada.ID);
        } else {
            setEtapasRelacionadas([]);
        }
    }, [tecnicaSelecionada]);
    
    useEffect(() => {
        if (message) {
          const timer = setTimeout(() => setMessage(null), 5000);
          return () => clearTimeout(timer);
        }
    }, [message]);

    const carregarTecnicasEEtapas = async () => {
        setLoading(prev => ({ ...prev, tecnicas: true, etapas: true }));
        try {
            const [resTecnicas, resEtapas] = await Promise.all([
                invoke<ApiResponse<Tecnica[]>>('listar_tecnicas'),
                invoke<ApiResponse<Etapa[]>>('listar_etapas')
            ]);
            if (resTecnicas.success && resTecnicas.data) setTecnicas(resTecnicas.data);
            if (resEtapas.success && resEtapas.data) setEtapasDisponiveis(resEtapas.data);
        } catch (error) {
            setMessage({ text: `Erro ao carregar dados iniciais: ${error}`, type: 'error' });
        } finally {
            setLoading(prev => ({ ...prev, tecnicas: false, etapas: false }));
        }
    };

    const carregarEtapasRelacionadas = async (tecnicaId: number) => {
        setLoading(prev => ({ ...prev, relacionadas: true }));
        try {
            const response: ApiResponse<TecnicaEtapaView[]> = await invoke('listar_etapas_por_tecnica', { tecnicaId });
            if (response.success && response.data) {
                setEtapasRelacionadas(response.data);
            } else {
                setMessage({ text: response.message, type: 'error' });
            }
        } catch (error) {
            setMessage({ text: `Erro ao carregar etapas relacionadas: ${error}`, type: 'error' });
        } finally {
            setLoading(prev => ({ ...prev, relacionadas: false }));
        }
    };

    const handleToggleEtapaParaAdicionar = (etapaId: number) => {
        setEtapasParaAdicionar(prevSet => {
            const newSet = new Set(prevSet);
            if (newSet.has(etapaId)) {
                newSet.delete(etapaId);
            } else {
                newSet.add(etapaId);
            }
            return newSet;
        });
    };

    const handleRelacionar = async () => {
        if (!tecnicaSelecionada || etapasParaAdicionar.size === 0) return;
        try {
            const payload = { etapa_ids: Array.from(etapasParaAdicionar) }; 
            const response: ApiResponse<void> = await invoke('relacionar_etapas_a_tecnica', { tecnicaId: tecnicaSelecionada.ID, payload });
            if (response.success) {
                setMessage({ text: response.message, type: 'success' });
                setEtapasParaAdicionar(new Set());
                carregarEtapasRelacionadas(tecnicaSelecionada.ID);
            } else {
                setMessage({ text: response.message, type: 'error' });
            }
        } catch (error: any) {
            setMessage({ text: error.message || `Erro ao relacionar etapas`, type: 'error' });
        }
    };
    
    const handleRemover = async (relacaoId: number) => {
        if (!tecnicaSelecionada) return;
        if (!window.confirm("Tem certeza que deseja remover esta etapa da técnica?")) return;
        try {
            const response: ApiResponse<void> = await invoke('remover_tecnica_etapa', { id: relacaoId });
            if (response.success) {
                setMessage({ text: response.message, type: 'success' });
                carregarEtapasRelacionadas(tecnicaSelecionada.ID);
            } else {
                setMessage({ text: response.message, type: 'error' });
            }
        } catch (error) {
            setMessage({ text: `Erro ao remover etapa: ${error}`, type: 'error' });
        }
    };

    const onDragEnd = async (result: DropResult) => {
        const { destination, source } = result;
        if (!destination || !tecnicaSelecionada) return;
        const items = Array.from(etapasRelacionadas);
        const [reorderedItem] = items.splice(source.index, 1);
        items.splice(destination.index, 0, reorderedItem);
        setEtapasRelacionadas(items);
        const payload = { tecnica_etapa_ids: items.map(item => item.ID) };
        try {
            const response: ApiResponse<void> = await invoke('reordenar_etapas_da_tecnica', { tecnicaId: tecnicaSelecionada.ID, payload });
            if (response.success) {
                setMessage({ text: response.message, type: 'success' });
            } else {
                setMessage({ text: response.message, type: 'error' });
                carregarEtapasRelacionadas(tecnicaSelecionada.ID); // Reverte buscando do servidor
            }
        } catch (error) {
            setMessage({ text: `Erro ao reordenar: ${error}`, type: 'error' });
            carregarEtapasRelacionadas(tecnicaSelecionada.ID); // Reverte buscando do servidor
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h2>Gerenciar Etapas por Técnica</h2>
            </header>
            {message && (
                <div className={`${styles.message} ${styles[message.type]}`}>
                  {message.text}
                  <button onClick={() => setMessage(null)} className={styles.closeMessage}>×</button>
                </div>
            )}
            <main className={styles.mainContent}>
                <div className={styles.column}>
                    <h3 className={styles.columnHeader}>Técnicas</h3>
                    <div className={styles.list}>
                        {loading.tecnicas ? <div className={styles.loadingState}>Carregando...</div> : 
                            tecnicas.map(t => (
                                <div key={t.ID} onClick={() => setTecnicaSelecionada(t)} className={`${styles.listItem} ${tecnicaSelecionada?.ID === t.ID ? styles.selected : ''}`}>
                                    {t.nome}
                                </div>
                            ))
                        }
                    </div>
                </div>
                <div className={styles.column}>
                    <h3 className={styles.columnHeader}>Etapas Disponíveis</h3>
                    <div className={styles.list}>
                        {loading.etapas ? <div className={styles.loadingState}>Carregando...</div> : 
                            etapasDisponiveis.map(e => (
                                <label key={e.ID} className={styles.checkboxItem}>
                                    <input type="checkbox" checked={etapasParaAdicionar.has(e.ID)} onChange={() => handleToggleEtapaParaAdicionar(e.ID)} />
                                    <span>{e.descricao}</span>
                                </label>
                            ))
                        }
                    </div>
                    <div className={styles.columnFooter}>
                        <button onClick={handleRelacionar} disabled={!tecnicaSelecionada || etapasParaAdicionar.size === 0} className={styles.buttonPrimary}>
                            Relacionar Selecionadas →
                        </button>
                    </div>
                </div>
                <div className={styles.column}>
                    <h3 className={styles.columnHeader}>
                        Etapas em: <span className={styles.highlight}>{tecnicaSelecionada?.nome || 'N/A'}</span>
                    </h3>
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="etapasRelacionadas">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className={styles.list}>
                                    {loading.relacionadas && <div className={styles.loadingState}>Carregando...</div>}
                                    {!loading.relacionadas && etapasRelacionadas.length === 0 && (
                                        <div className={styles.emptyState}>Nenhuma etapa relacionada.</div>
                                    )}
                                    {etapasRelacionadas.map((er, index) => (
                                        <Draggable key={er.ID} draggableId={String(er.ID)} index={index}>
                                            {(provided) => (
                                                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={styles.draggableItem}>
                                                    <span className={styles.dragHandle}>☰</span>
                                                    <span>{er.descricao}</span>
                                                    <button onClick={() => handleRemover(er.ID)} className={styles.deleteButton}>🗑️</button>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>
            </main>
        </div>
    );
};

export default GerenciarTecnicaEtapa;