// Em src/view/qualidade/VisualizarFornecedores.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import styles from './styles/Visualizar.module.css'; // Novo arquivo de estilo
import { Modal } from '../../components/Modal'; // Nosso modal de confirmação
import FormularioFornecedor from './FormularioFornecedor'; // O formulário que já criamos

// --- Interfaces ---
// A interface para os dados que vêm na lista da API
interface FornecedorListagem {
    ID: number;
    FANTASIA: string | null;
    NOME: string | null;
    DOCUMENTO: string | null;
    CONTATO: string | null;
}
// Outras interfaces que já usamos
interface ApiResponse<T> { success: boolean; data?: T; message?: string; }
interface FornecedorDetalhado { id: number; /* ...e outros campos... */ }
type ModalType = 'success' | 'error' | 'warning' | 'confirm';

const VisualizarFornecedores: React.FC = () => {
    // --- Estados ---
    const [fornecedores, setFornecedores] = useState<FornecedorListagem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filtro, setFiltro] = useState('');

    // Estado para controlar a visibilidade e o modo do formulário
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | undefined>(undefined);

    // Estado para o modal de confirmação de exclusão
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // --- Busca de Dados ---
    const carregarFornecedores = async () => {
        setIsLoading(true);
        try {
            const res = await invoke<ApiResponse<FornecedorListagem[]>>('listar_fornecedores_tauri');
            if (res.success && res.data) {
                setFornecedores(res.data);
            } else {
                throw new Error(res.message || 'Falha ao carregar fornecedores.');
            }
        } catch (err: any) {
            // Aqui poderíamos usar um modal de erro, se desejado
            console.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        carregarFornecedores();
    }, []);

    // --- Lógica de Filtro ---
    const fornecedoresFiltrados = useMemo(() => {
        if (!filtro) {
            return fornecedores;
        }
        return fornecedores.filter(f =>
            f.FANTASIA?.toLowerCase().includes(filtro.toLowerCase()) ||
            f.NOME?.toLowerCase().includes(filtro.toLowerCase()) ||
            f.DOCUMENTO?.includes(filtro)
        );
    }, [fornecedores, filtro]);

    // --- Handlers de Ação ---
    const handleNovo = () => {
        setEditingId(undefined);
        setIsFormOpen(true);
    };

    const handleEditar = (id: number) => {
        setEditingId(id);
        setIsFormOpen(true);
    };

    const handleExcluirClick = (id: number) => {
        setDeletingId(id);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmarExclusao = async () => {
        if (!deletingId) return;
        
        try {
            await invoke('deletar_fornecedor_tauri', { id: deletingId });
            // Após deletar com sucesso, recarrega a lista
            await carregarFornecedores();
        } catch (err: any) {
            console.error(err.message);
        } finally {
            setIsConfirmModalOpen(false);
            setDeletingId(null);
        }
    };

    // Handler para quando o formulário é salvo ou cancelado
    const handleFormSave = () => {
        setIsFormOpen(false);
        carregarFornecedores(); // Recarrega a lista para mostrar as alterações
    };
    
    const handleFormCancel = () => {
        setIsFormOpen(false);
    };


    // --- Renderização ---
    if (isFormOpen) {
        return (
            <FormularioFornecedor
                fornecedorId={editingId}
                onSave={handleFormSave}
                onCancel={handleFormCancel}
            />
        );
    }
    
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Fornecedores Cadastrados</h1>
                <div className={styles.actions}>
                    <input
                        type="text"
                        placeholder="Buscar por fantasia, razão ou CNPJ..."
                        className={styles.searchInput}
                        value={filtro}
                        onChange={e => setFiltro(e.target.value)}
                    />
                    <button className={styles.btnPrimary} onClick={handleNovo}>
                        Novo Fornecedor
                    </button>
                </div>
            </div>

            {isLoading ? (
                <p>Carregando...</p>
            ) : (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Fantasia</th>
                                <th>Razão Social</th>
                                <th>Documento</th>
                                <th>Contato</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fornecedoresFiltrados.map(f => (
                                <tr key={f.ID}>
                                    <td>{f.ID}</td>
                                    <td>{f.FANTASIA || '-'}</td>
                                    <td>{f.NOME || '-'}</td>
                                    <td>{f.DOCUMENTO || '-'}</td>
                                    <td>{f.CONTATO || '-'}</td>
                                    <td>
                                        <div className={styles.actionButtons}>
                                            <button className={styles.btnEdit} onClick={() => handleEditar(f.ID)}>Editar</button>
                                            <button className={styles.btnDelete} onClick={() => handleExcluirClick(f.ID)}>Excluir</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal
                isOpen={isConfirmModalOpen}
                type="confirm"
                title="Confirmar Exclusão"
                message={`Tem certeza que deseja excluir o fornecedor ID ${deletingId}? Esta ação não pode ser desfeita.`}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmarExclusao}
            />
        </div>
    );
};

export default VisualizarFornecedores;