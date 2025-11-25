import React, { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";
import styles from './styles/VisualizarReagenteLimpezaRegistro.module.css';

interface Props {
    onClose: () => void;
    onSuccess: () => void;
}

interface ReagenteItem {
    id: number;
    nome: string;
    unidade: string;
}

interface UnidadeOption {
    id: number;
    nome: string; // ou sigla, dependendo do seu backend de unidades
}

const GerenciarReagenteLimpezaModal: React.FC<Props> = ({ onClose, onSuccess }) => {
    const [reagentes, setReagentes] = useState<ReagenteItem[]>([]);
    const [unidades, setUnidades] = useState<UnidadeOption[]>([]);
    
    const [nome, setNome] = useState('');
    const [unidadeSelecionada, setUnidadeSelecionada] = useState('');

    useEffect(() => {
        carregarDados();
        carregarUnidades();
    }, []);

    const carregarDados = async () => {
        try {
            // ✅ NOME DO COMANDO ATUALIZADO (Backend Unificado)
            const res: any = await invoke('listar_reagentes_itens_tauri');
            if(res.success) setReagentes(res.data);
        } catch(e) { console.error(e); }
    };

    const carregarUnidades = async () => {
        try {
            // Usa o controller de unidades existente no sistema
            const res: any = await invoke('listar_unidades_tauri'); 
            if(res.success) setUnidades(res.data);
        } catch(e) { console.error(e); }
    };

    const handleCadastrar = async () => {
        if(!nome || !unidadeSelecionada) {
            alert("Preencha nome e unidade");
            return;
        }
        try {
            // ✅ NOME DO COMANDO ATUALIZADO
            const res: any = await invoke('criar_reagente_item_tauri', { 
                nome: nome, 
                unidade: unidadeSelecionada 
            });
            if(res.success) {
                alert("Reagente cadastrado!");
                setNome('');
                carregarDados();
                onSuccess();
            } else {
                alert(res.message);
            }
        } catch(e) { alert("Erro ao cadastrar: " + e); }
    };

    const handleDeletar = async (id: number) => {
        if(!confirm("Deseja deletar este tipo de reagente?")) return;
        try {
            // ✅ NOME DO COMANDO ATUALIZADO
            const res: any = await invoke('deletar_reagente_item_tauri', { id });
            if(res.success) {
                carregarDados();
                onSuccess();
            } else {
                alert(res.message);
            }
        } catch(e) { alert("Erro ao deletar: " + e); }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
            <div className={styles.card} style={{ width: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
                <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h2>Gerenciar Tipos de Reagentes</h2>
                    <button onClick={onClose} style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer'}}>×</button>
                </div>

                <div className={styles.row} style={{ alignItems: 'flex-end', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                    <div className={styles.inputGroup} style={{ flex: 2 }}>
                        <label>Nome do Reagente</label>
                        <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Álcool 70" />
                    </div>
                    <div className={styles.inputGroup} style={{ flex: 1 }}>
                        <label>Unidade</label>
                        <select value={unidadeSelecionada} onChange={e => setUnidadeSelecionada(e.target.value)} className={styles.select}>
                            <option value="">Selecione</option>
                            {unidades.map(u => (
                                <option key={u.id} value={u.nome}>{u.nome}</option>
                            ))}
                        </select>
                    </div>
                    <button className={styles.btnPrimary} onClick={handleCadastrar}>Salvar</button>
                </div>

                <div className={styles.tableContainer} style={{ marginTop: '15px', flex: 1, minHeight: '200px' }}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Reagente</th>
                                <th>Unidade</th>
                                <th style={{width: '50px'}}>Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reagentes.map(r => (
                                <tr key={r.id}>
                                    <td>{r.nome}</td>
                                    <td>{r.unidade}</td>
                                    <td>
                                        <button className={styles.btnIcon} onClick={() => handleDeletar(r.id)} style={{color: 'red'}}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default GerenciarReagenteLimpezaModal;