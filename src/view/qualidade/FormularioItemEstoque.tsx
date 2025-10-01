// Em: src/view/qualidade/FormularioItemEstoque.tsx

import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import styles from './styles/GerenciarEstoque.module.css'; // Mudei o caminho para o CSS

interface DropdownOption {
    id: string;
    nome: string;
}

interface Props {
    unidades: DropdownOption[];
    onSalvar: () => void;
    onCancelar: () => void;
}

// Definindo a interface para a resposta da API para clareza
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}


const FormularioItemEstoque: React.FC<Props> = ({ unidades, onSalvar, onCancelar }) => {
    const [formData, setFormData] = useState({
        nome: '',
        // O valor inicial é o da primeira unidade, se existir, senão é vazio.
        unidade: unidades[0]?.id || '',
        minimo: 0,
    });
    const [error, setError] = useState<string | null>(null);

    // Este useEffect agora SÓ serve para atualizar a unidade padrão
    // se a lista de unidades chegar DEPOIS que o componente já montou.
    // É uma salvaguarda que não trava a tela.
    useEffect(() => {
        if (unidades.length > 0 && formData.unidade === '') {
            setFormData(prev => ({ ...prev, unidade: unidades[0].id }));
        }
    }, [unidades]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.nome || !formData.unidade) {
            setError("Nome e Unidade são obrigatórios.");
            return;
        }

        try {
            const res: ApiResponse<any> = await invoke("criar_estoque_item_tauri", { payload: formData });
            
            if (res.success) {
                onSalvar();
            } else {
                setError(res.message || "Ocorreu um erro ao salvar.");
            }
        } catch (err: any) {
            const errorMessage = err?.message ? `Erro da API: ${err.message}` : `Erro grave: ${JSON.stringify(err)}`;
            setError(errorMessage);
        }
    };
    
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Novo Item de Estoque</h2>
            </div>
            {error && <div className={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.modalForm}>
                <label>
                    Nome do Item:
                    <input
                        type="text"
                        value={formData.nome}
                        onChange={e => setFormData(p => ({ ...p, nome: e.target.value }))}
                        required
                    />
                </label>
                <label>
                    Unidade:
                      <select
                        value={formData.unidade}
                        onChange={e => setFormData(p => ({ ...p, unidade: e.target.value }))}
                        // O dropdown fica desabilitado se a lista de unidades estiver vazia
                        disabled={unidades.length === 0}
                        required
                    >
                        {unidades.length === 0 ? (
                            // Mostra uma opção clara se as unidades não carregaram
                            <option>Carregando unidades...</option>
                        ) : (
                            // Mapeia as unidades quando elas existirem
                            unidades.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)
                        )}
                    </select>
                </label>
                <label>
                    Estoque Mínimo:
                    <input
                        type="number"
                        value={formData.minimo}
                        onChange={e => setFormData(p => ({ ...p, minimo: Number(e.target.value) }))}
                        required
                    />
                </label>
                <div className={styles.formActions}>
                    <button type="button" onClick={onCancelar} className={styles.buttonSecondary}>Cancelar</button>
                    {/* O botão de salvar fica desabilitado enquanto as unidades não carregam */}
                    <button type="submit" className={styles.buttonPrimary} disabled={unidades.length === 0}>Salvar</button>
                </div>
            </form>
        </div>
    );
};

export default FormularioItemEstoque;