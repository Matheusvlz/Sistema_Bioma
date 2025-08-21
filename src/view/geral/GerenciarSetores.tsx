import React, { useState, useEffect } from 'react';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { FaPlus, FaEdit, FaTrash, FaTag, FaSave, FaTimes } from 'react-icons/fa';
import styles from './css/GerenciarCategoria.module.css';
import { core } from "@tauri-apps/api";
import { Modal } from '../../components/Modal';
import { useModal } from "../../hooks/useModal";

interface Setor {
    id: number;
    nome: string;
}

interface SetorResponse {
    success: boolean;
    data?: Setor[];
    message?: string;
}

export const GerenciarSetores: React.FC = () => {
    const { modal, showConfirm, closeModal } = useModal();
    const [setores, setSetores] = useState<Setor[]>([]);
    const [nomeSetor, setNomeSetor] = useState('');
    const [setorEditando, setSetorEditando] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [sucesso, setSucesso] = useState<string | null>(null);

    useEffect(() => {
        carregarSetores();
    }, []);

    useEffect(() => {
        if (erro || sucesso) {
            const timer = setTimeout(() => {
                setErro(null);
                setSucesso(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [erro, sucesso]);

    const carregarSetores = async () => {
        setLoading(true);
        setErro(null);

        try {
            const response: SetorResponse = await core.invoke('buscar_setores_cadastro');

            if (response.success && response.data) {
                setSetores(response.data);
            }
        } catch (error) {
            console.error('Erro ao carregar setores:', error);
            setErro('Erro ao carregar setores. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!nomeSetor.trim()) {
            setErro('O nome do setor é obrigatório.');
            return;
        }

        setSalvando(true);
        setErro(null);

        try {
            if (setorEditando) {
                const response = await core.invoke('editar_setor', {
                    id: setorEditando,
                    nome: nomeSetor.trim()
                }) as SetorResponse;

                if (response.success) {
                    setSetores(prev =>
                        prev.map(cat =>
                            cat.id === setorEditando
                                ? { ...cat, nome: nomeSetor.trim() }
                                : cat
                        )
                    );

                    setSucesso("Setor editado com sucesso!");
                    setSetorEditando(null);
                    (await getCurrentWebviewWindow()).emit("setor-updated");
                } else {
                    setErro(response.message || 'Erro ao editar setor');
                }
            } else {
                const response = await core.invoke('criar_setor', {
                    nome: nomeSetor.trim()
                }) as SetorResponse;

                if (response.success && response.data && response.data.length > 0) {
                    const novoSetor = response.data[0];
                    setSetores(prev => [...prev, novoSetor]);
                    setSucesso("Setor cadastrada com sucesso!");
                    (await getCurrentWebviewWindow()).emit("setor-updated");
                } else {
                    setErro(response.message || 'Erro ao criar setor');
                }
            }

            setNomeSetor('');
        } catch (error) {
            console.error('Erro ao salvar setor:', error);
            setErro('Erro ao salvar setor. Tente novamente.');
        } finally {
            setSalvando(false);
        }
    };

    const handleEditar = (setor: Setor) => {
        setNomeSetor(setor.nome);
        setSetorEditando(setor.id);
        setErro(null);
        setSucesso(null);
    };

    const handleCancelarEdicao = () => {
        setNomeSetor('');
        setSetorEditando(null);
        setErro(null);
    };

    const handleExcluir = async (id: number, nome: string) => {
        const executarExclusao = async () => {
            try {
                const response = await core.invoke('excluir_setor', { id }) as SetorResponse;

                if (response.success) {
                    setSetores(prev => prev.filter(cat => cat.id !== id));
                    setSucesso("Setor excluída com sucesso!");
                    if (setorEditando === id) {
                        handleCancelarEdicao();
                    }
                    (await getCurrentWebviewWindow()).emit("setor-updated");
                } else {
                    setErro(response.message || 'Erro ao excluir setor');
                }
            } catch (error) {
                console.error('Erro ao excluir setor:', error);
                setErro('Erro ao excluir setor. Tente novamente.');
            }
            closeModal();
        };

        showConfirm(`Confirme exclusão`, `Tem certeza que deseja excluir a setor "${nome}"?`, executarExclusao);
    };

    const isEditMode = setorEditando !== null;

    return (
        <div className={styles["container"]}>
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.headerIcon}>
                        <FaTag />
                    </div>
                    <div className={styles.headerText}>
                        <h1 className={styles.title}>Gerenciar Setores</h1>
                    </div>
                </div>
            </div>

            {/* Mensagens de feedback */}
            {erro && (
                <div className={styles.alert + ' ' + styles.alertError}>
                    <FaTimes className={styles.alertIcon} />
                    {erro}
                </div>
            )}

            {sucesso && (
                <div className={styles.alert + ' ' + styles.alertSuccess}>
                    <FaSave className={styles.alertIcon} />
                    {sucesso}
                </div>
            )}

            <div className={styles.content}>
                {/* Formulário de cadastro/edição */}
                <div className={styles.formCard}>
                    <div className={styles.formHeader}>
                        <h2 className={styles.formTitle}>
                            {isEditMode ? 'Editar Setor' : 'Novo Setor'}
                        </h2>
                        {isEditMode && (
                            <button
                                type="button"
                                onClick={handleCancelarEdicao}
                                className={styles.cancelButton}
                                title="Cancelar edição"
                            >
                                <FaTimes />
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="nomeSetor" className={styles.label}>
                                Nome do Setor
                            </label>
                            <input
                                type="text"
                                id="nomeSetor"
                                value={nomeSetor}
                                onChange={(e) => setNomeSetor(e.target.value)}
                                placeholder="Digite o nome do setor..."
                                className={styles.input}
                                maxLength={50}
                                disabled={salvando}
                                autoComplete="off"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={salvando || !nomeSetor.trim()}
                            className={styles.submitButton + (isEditMode ? ' ' + styles.editMode : '')}
                        >
                            {salvando ? (
                                <>
                                    <div className={styles.spinner}></div>
                                    {isEditMode ? 'Salvando...' : 'Cadastrando...'}
                                </>
                            ) : (
                                <>
                                    {isEditMode ? <FaEdit /> : <FaPlus />}
                                    {isEditMode ? 'Salvar Alterações' : 'Salvar Setor'}
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Lista de setores */}
                <div className={styles.listCard}>
                    <div className={styles.listHeader}>
                        <h2 className={styles.listTitle}>Setores Cadastrados</h2>
                        <div className={styles.listStats}>
                            {setores.length} setor{setores.length !== 1 ? 's' : ''}
                        </div>
                    </div>

                    {loading ? (
                        <div className={styles.loadingContainer}>
                            <div className={styles.loadingSpinner}></div>
                            <span>Carregando setores...</span>
                        </div>
                    ) : (
                        <div className={styles.categoriasList}>
                            {setores.length > 0 ? (
                                setores.map((setor) => (
                                    <div
                                        key={setor.id}
                                        className={styles.categoriaItem + (setorEditando === setor.id ? ' ' + styles.editing : '')}
                                    >
                                        <div className={styles.categoriaInfo}>
                                            <div className={styles.categoriaIcon}>
                                                <FaTag />
                                            </div>
                                            <div className={styles.categoriaDetails}>
                                                <h3 className={styles.categoriaNome}>{setor.nome}</h3>
                                            </div>
                                        </div>

                                        <div className={styles.categoriaActions}>
                                            <button
                                                onClick={() => handleEditar(setor)}
                                                className={styles.actionButton + ' ' + styles.editButton}
                                                title="Editar setor"
                                                disabled={salvando}
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                onClick={() => handleExcluir(setor.id, setor.nome)}
                                                className={styles.actionButton + ' ' + styles.deleteButton}
                                                title="Excluir setor"
                                                disabled={salvando}
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className={styles.emptyState}>
                                    <FaTag className={styles.emptyIcon} />
                                    <h3>Nenhum setor cadastrado</h3>
                                    <p>Cadastre o primeiro setor usando o formulário acima.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <Modal {...modal} onClose={closeModal} onConfirm={modal.onConfirm} />
        </div>
    );
};

