// src/view/laboratorio/CadastrarMateriaPrimaRegistro.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import styles from './styles/VisualizarMateriaPrimaRegistro.module.css'; // Reutilizando o CSS

// --- Interfaces (Padrão 3.3.1) ---

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

interface DropdownOption {
    id: number;
    nome: string;
}

// Interface dos dados da tabela (para 'itemParaEdicao')
interface MateriaPrimaRegistroDetalhado {
    id: number;
    fabricante: string | null;
    lote_fabricante: string | null;
    data_fabricacao: string | null;
    validade: string | null;
    nf: string | null;
    quantidade: string | null;
    pureza: string | null;
    observacao: string | null;
    materia_prima_id: number | null;
    materia_prima_tipo_id: number | null;
}

// Interface do Payload que enviamos para a Ponte (Tudo string)
interface MateriaPrimaRegistroPayload {
    materia_prima: number;
    fabricante: string;
    lote_fabricante: string;
    validade: string; // "dd/MM/yyyy"
    data_fabricacao: string; // "dd/MM/yyyy"
    quantidade: string; // "123,45"
    pureza: string; // "99,5"
    nf: string;
    observacao: string;
}

// --- Props do Componente ---
interface Props {
    itemParaEdicao: MateriaPrimaRegistroDetalhado | null;
    onSalvar: () => void;
    onCancelar: () => void;
}

// --- Helpers de Formatação (Padrão) ---
const formatarDataParaApi = (dataISO: string | null): string => {
    if (!dataISO) return '';
    try {
        const [ano, mes, dia] = dataISO.split('T')[0].split('-');
        return `${dia}/${mes}/${ano}`;
    } catch {
        return ''; // Retorna vazio se falhar o parse
    }
};

const formatarDecimalParaBr = (decimalStr: string | null): string => {
    if (!decimalStr) return '';
    return decimalStr.replace('.', ',');
};

const CadastrarMateriaPrimaRegistro: React.FC<Props> = ({ itemParaEdicao, onSalvar, onCancelar }) => {

    // --- Estados dos Dropdowns ---
    const [tipos, setTipos] = useState<DropdownOption[]>([]);
    const [materiasPrimas, setMateriasPrimas] = useState<DropdownOption[]>([]);

    // --- Estados do Formulário (Baseado no Java 'tf...' e 'cb...') ---
    const [tipoId, setTipoId] = useState<number | null>(itemParaEdicao?.materia_prima_tipo_id || null);
    const [materiaPrimaId, setMateriaPrimaId] = useState<number | null>(itemParaEdicao?.materia_prima_id || null);
    
    const [fabricante, setFabricante] = useState(itemParaEdicao?.fabricante || '');
    const [lote, setLote] = useState(itemParaEdicao?.lote_fabricante || '');
    const [dataFabricacao, setDataFabricacao] = useState(formatarDataParaApi(itemParaEdicao?.data_fabricacao));
    const [validade, setValidade] = useState(formatarDataParaApi(itemParaEdicao?.validade));
    const [quantidade, setQuantidade] = useState(formatarDecimalParaBr(itemParaEdicao?.quantidade));
    const [pureza, setPureza] = useState(formatarDecimalParaBr(itemParaEdicao?.pureza));
    const [nf, setNf] = useState(itemParaEdicao?.nf || '');
    const [observacao, setObservacao] = useState(itemParaEdicao?.observacao || '');

    // --- Estados de UI ---
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- Carregamento dos Dropdowns (Baseado em 'showMateriaPrimaTipo') ---
    const carregarTipos = useCallback(async () => {
        try {
            const res: ApiResponse<DropdownOption[]> = await invoke("listar_tipos_materia_prima_tauri");
            if (res.success && res.data) {
                setTipos(res.data);
            } else {
                setError(res.message || "Falha ao carregar tipos.");
            }
        } catch (err: any) {
            setError(err.toString());
        }
    }, []);

    // Carregamento de MP (Baseado em 'showMateriaPrima')
    const carregarMateriasPrimas = useCallback(async (idTipo: number) => {
        setLoading(true);
        try {
            // SIMULAÇÃO (REGRA 5): Assumindo que o comando 'listar_materia_prima_tauri' aceita um 'tipoId'
            const res: ApiResponse<DropdownOption[]> = await invoke("listar_materia_prima_tauri", { tipoId: idTipo });
            if (res.success && res.data) {
                setMateriasPrimas(res.data);
            } else {
                setMateriasPrimas([]);
            }
        } catch (err: any) {
            setError(err.toString());
        } finally {
            setLoading(false);
        }
    }, []);

    // Efeito para carregar dados iniciais (Tipos)
    useEffect(() => {
        carregarTipos();
    }, [carregarTipos]);

    // Efeito para carregar MP quando o Tipo muda (ou na edição)
    useEffect(() => {
        if (tipoId) {
            carregarMateriasPrimas(tipoId);
        } else {
            setMateriasPrimas([]);
        }
    }, [tipoId, carregarMateriasPrimas]);

    // --- Ação de Salvar (Baseado em 'btcadastrar' e 'bteditar') ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validação (Baseado no Java)
        if (!tipoId) {
            setError("Informe o tipo da matéria-prima!");
            return;
        }
        if (!materiaPrimaId) {
            setError("Informe a matéria-prima!");
            return;
        }
        if (!fabricante.trim()) {
            setError("Informe o fabricante!");
            return;
        }
        if (!lote.trim()) {
            setError("Informe o lote!");
            return;
        }
        if (dataFabricacao.replace(/[^0-9]/g, '').length < 8) {
            setError("Informe a data de fabricação completa (dd/mm/aaaa)!");
            return;
        }
        if (validade.replace(/[^0-9]/g, '').length < 8) {
            setError("Informe a validade completa (dd/mm/aaaa)!");
            return;
        }
        if (!quantidade.trim() || parseFloat(quantidade.replace(',', '.')) === 0) {
            setError("Informe a quantidade!");
            return;
        }
        if (!pureza.trim() || parseFloat(pureza.replace(',', '.')) === 0) {
            setError("Informe a pureza/concentração!");
            return;
        }

        setLoading(true);

        const payload: MateriaPrimaRegistroPayload = {
            materia_prima: materiaPrimaId,
            fabricante,
            lote_fabricante: lote,
            validade,
            data_fabricacao: dataFabricacao,
            quantidade,
            pureza,
            nf,
            observacao,
        };

        try {
            let res: ApiResponse<MateriaPrimaRegistroDetalhado>;
            if (itemParaEdicao) {
                // Modo Edição
                res = await invoke("editar_materia_prima_registro_tauri", {
                    id: itemParaEdicao.id,
                    payload: payload
                });
            } else {
                // Modo Cadastro
                res = await invoke("cadastrar_materia_prima_registro_tauri", {
                    payload: payload
                });
            }

            if (res.success) {
                onSalvar(); // Chama a função do pai para fechar o form e recarregar
            } else {
                setError(res.message || "Erro desconhecido ao salvar.");
            }
        } catch (err: any) {
            setError(`Erro grave: ${err.toString()}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>{itemParaEdicao ? "Editar Registro" : "Cadastrar Novo Registro"}</h2>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.formGrid}>
                {/* Linha 1: Dropdowns */}
                <div className={styles.formGroup}>
                    <label>Tipo Matéria-Prima *</label>
                    <select
                        value={tipoId || ''}
                        onChange={(e) => {
                            setTipoId(e.target.value ? Number(e.target.value) : null);
                            setMateriaPrimaId(null); // Reseta a MP ao mudar o tipo
                        }}
                        disabled={loading || !!itemParaEdicao} // Não pode mudar tipo na edição
                    >
                        <option value="">Selecione...</option>
                        {tipos.map(tipo => (
                            <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label>Matéria-Prima *</label>
                    <select
                        value={materiaPrimaId || ''}
                        onChange={(e) => setMateriaPrimaId(e.target.value ? Number(e.target.value) : null)}
                        disabled={loading || !tipoId || !!itemParaEdicao} // Não pode mudar MP na edição
                    >
                        <option value="">Selecione...</option>
                        {materiasPrimas.map(mp => (
                            <option key={mp.id} value={mp.id}>{mp.nome}</option>
                        ))}
                    </select>
                </div>

                {/* Linha 2: Fabricante e Lote */}
                <div className={styles.formGroup}>
                    <label>Fabricante *</label>
                    <input
                        type="text"
                        value={fabricante}
                        onChange={(e) => setFabricante(e.target.value)}
                        disabled={loading}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>Lote *</label>
                    <input
                        type="text"
                        value={lote}
                        onChange={(e) => setLote(e.target.value)}
                        disabled={loading}
                    />
                </div>

                {/* Linha 3: Datas */}
                <div className={styles.formGroup}>
                    <label>Data Fabricação (dd/mm/aaaa) *</label>
                    <input
                        type="text"
                        placeholder="dd/mm/aaaa"
                        value={dataFabricacao}
                        onChange={(e) => setDataFabricacao(e.target.value)}
                        disabled={loading}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>Validade (dd/mm/aaaa) *</label>
                    <input
                        type="text"
                        placeholder="dd/mm/aaaa"
                        value={validade}
                        onChange={(e) => setValidade(e.target.value)}
                        disabled={loading}
                    />
                </div>

                {/* Linha 4: Valores Numéricos */}
                <div className={styles.formGroup}>
                    <label>Quantidade *</label>
                    <input
                        type="text" // Texto para aceitar vírgula
                        placeholder="ex: 123,45"
                        value={quantidade}
                        onChange={(e) => setQuantidade(e.target.value)}
                        disabled={loading}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>Pureza/Concentração (%) *</label>
                    <input
                        type="text" // Texto para aceitar vírgula
                        placeholder="ex: 99,5"
                        value={pureza}
                        onChange={(e) => setPureza(e.target.value)}
                        disabled={loading}
                    />
                </div>

                {/* Linha 5: NF e Observação */}
                <div className={styles.formGroup}>
                    <label>Nota Fiscal (N.F.)</label>
                    <input
                        type="text"
                        value={nf}
                        onChange={(e) => setNf(e.target.value)}
                        disabled={loading}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>Observação</label>
                    <input
                        type="text"
                        value={observacao}
                        onChange={(e) => setObservacao(e.target.value)}
                        disabled={loading}
                    />
                </div>

                {/* Linha 6: Botões */}
                <div className={`${styles.formGroup} ${styles.fullWidth} ${styles.buttonRow}`}>
                    <button type="button" onClick={onCancelar} className={styles.buttonSecondary} disabled={loading}>
                        Cancelar
                    </button>
                    <button type="submit" className={styles.buttonPrimary} disabled={loading}>
                        {loading ? "Salvando..." : (itemParaEdicao ? "Salvar Edição" : "Cadastrar")}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CadastrarMateriaPrimaRegistro;