import React, { useState, useEffect } from 'react';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { FaPlus, FaEdit, FaTrash, FaTag, FaSave, FaTimes } from 'react-icons/fa';
import styles from './css/GerenciarCategoria.module.css';
import { core } from "@tauri-apps/api";
import { Modal } from '../../components/Modal';
import { useModal } from "../../hooks/useModal";

interface Categoria {
    id: number;
    nome: string;
}

interface CategoriaResponse {
    success: boolean;
    data?: Categoria[];
    message?: string;
}

export const GerenciarCategoria: React.FC = () => {
    const { modal, showConfirm, closeModal } = useModal();
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [nomeCategoria, setNomeCategoria] = useState('');
    const [categoriaEditando, setCategoriaEditando] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [sucesso, setSucesso] = useState<string | null>(null);

    useEffect(() => {
        carregarCategorias();
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

    const carregarCategorias = async () => {
        setLoading(true);
        setErro(null);

        try {
            const response: CategoriaResponse = await core.invoke('buscar_categorias_cadastro');

            if (response.success && response.data) {
                setCategorias(response.data);
            }
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
            setErro('Erro ao carregar categorias. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!nomeCategoria.trim()) {
            setErro('O nome da categoria é obrigatório.');
            return;
        }

        setSalvando(true);
        setErro(null);

        try {
            if (categoriaEditando) {
                const response = await core.invoke('editar_categoria', {
                    id: categoriaEditando,
                    nome: nomeCategoria.trim()
                }) as CategoriaResponse;

                if (response.success) {
                    setCategorias(prev =>
                        prev.map(cat =>
                            cat.id === categoriaEditando
                                ? { ...cat, nome: nomeCategoria.trim() }
                                : cat
                        )
                    );

                    setSucesso("Categoria editada com sucesso!");
                    setCategoriaEditando(null);
                    (await getCurrentWebviewWindow()).emit("category-updated");
                } else {
                    setErro(response.message || 'Erro ao editar categoria');
                }
            } else {
                const response = await core.invoke('criar_categoria', {
                    nome: nomeCategoria.trim()
                }) as CategoriaResponse;

                if (response.success && response.data && response.data.length > 0) {
                    const novaCategoria = response.data[0];
                    setCategorias(prev => [...prev, novaCategoria]);
                    setSucesso("Categoria cadastrada com sucesso!");
                    (await getCurrentWebviewWindow()).emit("category-updated");
                } else {
                    setErro(response.message || 'Erro ao criar categoria');
                }
            }

            setNomeCategoria('');
        } catch (error) {
            console.error('Erro ao salvar categoria:', error);
            setErro('Erro ao salvar categoria. Tente novamente.');
        } finally {
            setSalvando(false);
        }
    };

    const handleEditar = (categoria: Categoria) => {
        setNomeCategoria(categoria.nome);
        setCategoriaEditando(categoria.id);
        setErro(null);
        setSucesso(null);
    };

    const handleCancelarEdicao = () => {
        setNomeCategoria('');
        setCategoriaEditando(null);
        setErro(null);
    };

    const handleExcluir = async (id: number, nome: string) => {
        const executarExclusao = async () => {
            try {
                const response = await core.invoke('excluir_categoria', { id }) as CategoriaResponse;

                if (response.success) {
                    setCategorias(prev => prev.filter(cat => cat.id !== id));
                    setSucesso("Categoria excluída com sucesso!");
                    if (categoriaEditando === id) {
                        handleCancelarEdicao();
                    }
                    (await getCurrentWebviewWindow()).emit("category-updated");
                } else {
                    setErro(response.message || 'Erro ao excluir categoria');
                }
            } catch (error) {
                console.error('Erro ao excluir categoria:', error);
                setErro('Erro ao excluir categoria. Tente novamente.');
            }
            closeModal();
        };

        showConfirm(`Confirme exclusão`, `Tem certeza que deseja excluir a categoria "${nome}"?`, executarExclusao);
    };

    const isEditMode = categoriaEditando !== null;

    return (
        <div className={styles["container"]}>
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.headerIcon}>
                        <FaTag />
                    </div>
                    <div className={styles.headerText}>
                        <h1 className={styles.title}>Gerenciar Categorias</h1>
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
                            {isEditMode ? 'Editar Categoria' : 'Nova Categoria'}
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
                            <label htmlFor="nomeCategoria" className={styles.label}>
                                Nome da Categoria
                            </label>
                            <input
                                type="text"
                                id="nomeCategoria"
                                value={nomeCategoria}
                                onChange={(e) => setNomeCategoria(e.target.value)}
                                placeholder="Digite o nome da categoria..."
                                className={styles.input}
                                maxLength={50}
                                disabled={salvando}
                                autoComplete="off"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={salvando || !nomeCategoria.trim()}
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
                                    {isEditMode ? 'Salvar Alterações' : 'Salvar Categoria'}
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Lista de categorias */}
                <div className={styles.listCard}>
                    <div className={styles.listHeader}>
                        <h2 className={styles.listTitle}>Categorias Cadastradas</h2>
                        <div className={styles.listStats}>
                            {categorias.length} categoria{categorias.length !== 1 ? 's' : ''}
                        </div>
                    </div>

                    {loading ? (
                        <div className={styles.loadingContainer}>
                            <div className={styles.loadingSpinner}></div>
                            <span>Carregando categorias...</span>
                        </div>
                    ) : (
                        <div className={styles.categoriasList}>
                            {categorias.length > 0 ? (
                                categorias.map((categoria) => (
                                    <div
                                        key={categoria.id}
                                        className={styles.categoriaItem + (categoriaEditando === categoria.id ? ' ' + styles.editing : '')}
                                    >
                                        <div className={styles.categoriaInfo}>
                                            <div className={styles.categoriaIcon}>
                                                <FaTag />
                                            </div>
                                            <div className={styles.categoriaDetails}>
                                                <h3 className={styles.categoriaNome}>{categoria.nome}</h3>
                                            </div>
                                        </div>

                                        <div className={styles.categoriaActions}>
                                            <button
                                                onClick={() => handleEditar(categoria)}
                                                className={styles.actionButton + ' ' + styles.editButton}
                                                title="Editar categoria"
                                                disabled={salvando}
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                onClick={() => handleExcluir(categoria.id, categoria.nome)}
                                                className={styles.actionButton + ' ' + styles.deleteButton}
                                                title="Excluir categoria"
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
                                    <h3>Nenhuma categoria cadastrada</h3>
                                    <p>Cadastre a primeira categoria usando o formulário acima.</p>
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

