// src/view/laboratorio/CadastrarMateriaPrima.tsx

import React, { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";
import styles from './styles/CadastrarMateriaPrima.module.css'; // Crie este arquivo de CSS depois

// --- Interfaces ---
interface MateriaPrimaTipoOption {
    id: number;
    nome: string;
}

interface UnidadeOption {
    nome: string;
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

// Interface para o item completo que recebemos
interface MateriaPrimaDetalhado {
    id: number;
    nome: string;
    tipo_id: number;
    quantidade_min: string; // Vem como string da API, convertida pelo serde_with
    unidade: string;
}

// Props que o componente receberá
interface Props {
    itemParaEdicao: MateriaPrimaDetalhado | null;
    onSalvar: () => void;
    onCancelar: () => void;
}

const CadastrarMateriaPrima: React.FC<Props> = ({ itemParaEdicao, onSalvar, onCancelar }) => {
    const [nome, setNome] = useState('');
    const [tipoId, setTipoId] = useState<number | ''>('');
    const [quantidadeMin, setQuantidadeMin] = useState('');
    const [unidade, setUnidade] = useState('');

    const [tipos, setTipos] = useState<MateriaPrimaTipoOption[]>([]);
    const [unidades, setUnidades] = useState<UnidadeOption[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Carrega dados dos dropdowns ao montar o componente
    useEffect(() => {
        const carregarDropdowns = async () => {
            try {
                const [tiposRes, unidadesRes] = await Promise.all([
                invoke<ApiResponse<MateriaPrimaTipoOption[]>>("listar_tipos_materia_prima_tauri"),
                invoke<ApiResponse<UnidadeOption[]>>("listar_unidades_tauri")
                ]);

                if (tiposRes.success && tiposRes.data) setTipos(tiposRes.data);
                if (unidadesRes.success && unidadesRes.data) setUnidades(unidadesRes.data);

        } catch (err) {
            setError("Falha ao carregar dados de suporte.");
            console.error(err); // Adicionado para facilitar a depuração no futuro
        }
    };
    carregarDropdowns();
}, []);

    // Popula o formulário se um item para edição for fornecido
    useEffect(() => {
        if (itemParaEdicao) {
            setNome(itemParaEdicao.nome);
            setTipoId(itemParaEdicao.tipo_id);
            setQuantidadeMin(itemParaEdicao.quantidade_min);
            setUnidade(itemParaEdicao.unidade);
        }
    }, [itemParaEdicao]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validação
        if (!nome.trim()) {
            setError("O campo 'Descrição' é obrigatório.");
            return;
        }
        if (tipoId === '') {
            setError("O campo 'Tipo' é obrigatório.");
            return;
        }
        if (!quantidadeMin.trim() || isNaN(parseFloat(quantidadeMin))) {
            setError("O campo 'Quantidade Mínima' deve ser um número válido.");
            return;
        }
         if (!unidade.trim()) {
            setError("O campo 'Unidade' é obrigatório.");
            return;
        }

        setLoading(true);

        try {
            const payload = {
                nome,
                tipo: Number(tipoId),
                quantidade_min: quantidadeMin.replace(',', '.'), // Garante o formato decimal correto
                unidade
            };

            const command = itemParaEdicao 
                ? "editar_materia_prima_tauri" 
                : "cadastrar_materia_prima_tauri";
            
            const args = itemParaEdicao ? { id: itemParaEdicao.id, payload } : { payload };

            const res: ApiResponse<any> = await invoke(command, args);

            if (res.success) {
                onSalvar(); // Chama a função do pai para fechar o form e recarregar a lista
            } else {
                setError(res.message || "Ocorreu um erro desconhecido.");
            }
        } catch (err: any) {
            setError(err.toString());
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>{itemParaEdicao ? 'Editar' : 'Cadastrar'} Matéria-Prima</h2>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                    <label htmlFor="nome">Descrição</label>
                    <input id="nome" type="text" value={nome} onChange={e => setNome(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="tipo">Tipo</label>
                    <select id="tipo" value={tipoId} onChange={e => setTipoId(Number(e.target.value))}>
                        <option value="" disabled>Selecione um tipo</option>
                        {tipos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                    </select>
                </div>
                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label htmlFor="quantidadeMin">Quantidade Mínima</label>
                        <input id="quantidadeMin" type="text" value={quantidadeMin} onChange={e => setQuantidadeMin(e.target.value)} />
                    </div>
                     <div className={styles.formGroup}>
                        <label htmlFor="unidade">Unidade</label>
                        <select id="unidade" value={unidade} onChange={e => setUnidade(e.target.value)}>
                             <option value="" disabled>Selecione uma unidade</option>
                             {unidades.map(u => <option key={u.nome} value={u.nome}>{u.nome}</option>)}
                        </select>
                    </div>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.actions}>
                    <button type="button" onClick={onCancelar} className={styles.buttonSecondary} disabled={loading}>
                        Cancelar
                    </button>
                    <button type="submit" className={styles.buttonPrimary} disabled={loading}>
                        {loading ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CadastrarMateriaPrima;