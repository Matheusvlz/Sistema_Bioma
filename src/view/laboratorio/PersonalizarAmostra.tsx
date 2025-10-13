// src/view/laboratorio/PersonalizarAmostra.tsx

import React, { useState, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import styles from './styles/PersonalizarAmostra.module.css'; // Crie este arquivo CSS depois

// --- Interfaces para Tipagem (Seguindo o Padrão) ---

// Espelha a struct `AmostraPersonalizavelDetalhado` do Tauri
interface AmostraPersonalizavelDetalhado {
    id: number;
    numero: number;
    hora_coleta: string | null;
    identificacao: string | null;
    complemento: string | null;
    condicoes_amb: string | null;
    unidade: string | null;
    formacoleta: string | null;
    area_amostrada: string | null;
    unidade_amostrada: string | null;
    protocolo_cliente: string | null;
    remessa_cliente: string | null;
    certificado_tipo_nome: string;
    is_editavel: number;
}

// Espelha a struct `AmostraPersonalizavelPayload` do Tauri
interface AmostraPersonalizavelPayload {
    id: number;
    hora_coleta: string | null;
    identificacao: string | null;
    complemento: string | null;
    condicoes_amb: string | null;
    unidade: string | null;
    formacoleta: string | null;
    area_amostrada: string | null;
    unidade_amostrada: string | null;
    protocolo_cliente: string | null;
    remessa_cliente: string | null;
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

const PersonalizarAmostra: React.FC = () => {
    // --- Gerenciamento de Estado Abrangente ---
    const [inicioAmostra, setInicioAmostra] = useState('');
    const [fimAmostra, setFimAmostra] = useState('');
    const [amostras, setAmostras] = useState<AmostraPersonalizavelDetalhado[]>([]);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // --- Lógica de Negócio e Interação com Tauri ---

    const handleBuscarAmostras = useCallback(async () => {
        if (!inicioAmostra) {
            setError("Por favor, informe o número da amostra inicial.");
            return;
        }
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        setAmostras([]);

        const inicio = parseInt(inicioAmostra, 10);
        const fim = fimAmostra ? parseInt(fimAmostra, 10) : inicio;

        if (isNaN(inicio) || isNaN(fim) || inicio > fim) {
            setError("Os números das amostras são inválidos.");
            setLoading(false);
            return;
        }

        try {
            const res = await invoke<ApiResponse<AmostraPersonalizavelDetalhado[]>>("listar_amostras_por_faixa_tauri", { inicio, fim });
            if (res.success && res.data) {
                // Formata a hora para HH:mm antes de colocar no estado
                const amostrasFormatadas = res.data.map(a => ({
                    ...a,
                    hora_coleta: a.hora_coleta ? a.hora_coleta.substring(0, 5) : '',
                }));
                setAmostras(amostrasFormatadas);
                if (res.data.length === 0) {
                    setSuccessMessage("Nenhuma amostra encontrada nesta faixa.");
                }
            } else {
                setError(res.message || "Falha ao buscar amostras.");
            }
        } catch (err: any) {
            setError(`Erro grave ao comunicar com o backend: ${err.toString()}`);
        } finally {
            setLoading(false);
        }
    }, [inicioAmostra, fimAmostra]);

    const handleSalvarAmostras = async () => {
        if (amostras.length === 0) {
            setError("Não há amostras para salvar.");
            return;
        }
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        // Prepara o payload apenas com as amostras editáveis
        const payload: AmostraPersonalizavelPayload[] = amostras
            .filter(a => a.is_editavel)
            .map(a => ({
                id: a.id,
                hora_coleta: a.hora_coleta ? `${a.hora_coleta}:00` : null, // Garante formato HH:mm:ss para o banco
                identificacao: a.identificacao,
                complemento: a.complemento,
                condicoes_amb: a.condicoes_amb,
                unidade: a.unidade,
                formacoleta: a.formacoleta,
                area_amostrada: a.area_amostrada,
                unidade_amostrada: a.unidade_amostrada,
                protocolo_cliente: a.protocolo_cliente,
                remessa_cliente: a.remessa_cliente,
            }));

        try {
            const res = await invoke<ApiResponse<void>>("atualizar_amostras_em_lote_tauri", { payload });
            if (res.success) {
                setSuccessMessage(res.message || "Amostras personalizadas com sucesso!");
                // Opcional: recarregar os dados após salvar
                handleBuscarAmostras();
            } else {
                setError(res.message || "Falha ao salvar as alterações.");
            }
        } catch (err: any) {
            setError(`Erro grave ao salvar: ${err.toString()}`);
        } finally {
            setLoading(false);
        }
    };
    
    // Função para atualizar o estado de forma imutável quando um campo de uma amostra é alterado
    const handleInputChange = (index: number, field: keyof AmostraPersonalizavelDetalhado, value: string) => {
        const novasAmostras = [...amostras];
        novasAmostras[index] = { ...novasAmostras[index], [field]: value };
        setAmostras(novasAmostras);
    };

    // Helper para replicar a lógica de visibilidade do Java
    const shouldShowField = (certificadoTipo: string, fieldName: string): boolean => {
        switch (certificadoTipo) {
            case "IN 60":
                return ['protocolo_cliente', 'remessa_cliente'].includes(fieldName);
            case "Eficácia de limpeza":
                return ['unidade', 'formacoleta', 'area_amostrada', 'unidade_amostrada'].includes(fieldName);
            case "Monitoramento Ambiental":
                return ['unidade', 'formacoleta'].includes(fieldName);
            default:
                // Para "1 amostra por relatório", "Agrupar amostras", "Solo", etc., os campos extras ficam ocultos
                return false;
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Personalizar Amostras</h2>
                <div className={styles.searchBox}>
                    <input
                        type="number"
                        placeholder="Amostra Inicial"
                        value={inicioAmostra}
                        onChange={(e) => setInicioAmostra(e.target.value)}
                        className={styles.input}
                    />
                    <span>até</span>
                    <input
                        type="number"
                        placeholder="Amostra Final"
                        value={fimAmostra}
                        onChange={(e) => setFimAmostra(e.target.value)}
                        className={styles.input}
                    />
                    <button onClick={handleBuscarAmostras} disabled={loading} className={styles.buttonPrimary}>
                        {loading ? 'Buscando...' : 'Buscar'}
                    </button>
                </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}
            {successMessage && <div className={styles.success}>{successMessage}</div>}

            <div className={styles.tableContainer}>
                {loading && amostras.length === 0 ? (
                    <div className={styles.spinner}></div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Nº Amostra</th>
                                <th>H. Coleta</th>
                                <th>Identificação</th>
                                <th>Complemento</th>
                                <th>Cond. Amb.</th>
                                {amostras.length > 0 && shouldShowField(amostras[0].certificado_tipo_nome, 'protocolo_cliente') && <th>Protocolo</th>}
                                {amostras.length > 0 && shouldShowField(amostras[0].certificado_tipo_nome, 'remessa_cliente') && <th>Remessa</th>}
                                {amostras.length > 0 && shouldShowField(amostras[0].certificado_tipo_nome, 'unidade') && <th>Unidade</th>}
                                {amostras.length > 0 && shouldShowField(amostras[0].certificado_tipo_nome, 'formacoleta') && <th>Forma Coleta</th>}
                                {amostras.length > 0 && shouldShowField(amostras[0].certificado_tipo_nome, 'area_amostrada') && <th>Área Amost.</th>}
                                {amostras.length > 0 && shouldShowField(amostras[0].certificado_tipo_nome, 'unidade_amostrada') && <th>Un. Área</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {amostras.map((amostra, index) => (
                                <tr key={amostra.id} className={!amostra.is_editavel ? styles.locked : ''}>
                                    <td title={!amostra.is_editavel ? 'Bloqueado: Certificado já emitido' : ''}>
                                        {!amostra.is_editavel && '🔒 '}
                                        {amostra.numero}
                                    </td>
                                    <td><input type="time" value={amostra.hora_coleta || ''} onChange={e => handleInputChange(index, 'hora_coleta', e.target.value)} disabled={!amostra.is_editavel} /></td>
                                    <td><input type="text" value={amostra.identificacao || ''} onChange={e => handleInputChange(index, 'identificacao', e.target.value)} disabled={!amostra.is_editavel} /></td>
                                    <td><input type="text" value={amostra.complemento || ''} onChange={e => handleInputChange(index, 'complemento', e.target.value)} disabled={!amostra.is_editavel} /></td>
                                    <td><input type="text" value={amostra.condicoes_amb || ''} onChange={e => handleInputChange(index, 'condicoes_amb', e.target.value)} disabled={!amostra.is_editavel} /></td>
                                    
                                    {shouldShowField(amostra.certificado_tipo_nome, 'protocolo_cliente') && <td><input type="text" value={amostra.protocolo_cliente || ''} onChange={e => handleInputChange(index, 'protocolo_cliente', e.target.value)} disabled={!amostra.is_editavel} /></td>}
                                    {shouldShowField(amostra.certificado_tipo_nome, 'remessa_cliente') && <td><input type="text" value={amostra.remessa_cliente || ''} onChange={e => handleInputChange(index, 'remessa_cliente', e.target.value)} disabled={!amostra.is_editavel} /></td>}
                                    {shouldShowField(amostra.certificado_tipo_nome, 'unidade') && <td><input type="text" value={amostra.unidade || ''} onChange={e => handleInputChange(index, 'unidade', e.target.value)} disabled={!amostra.is_editavel} /></td>}
                                    {shouldShowField(amostra.certificado_tipo_nome, 'formacoleta') && <td><input type="text" value={amostra.formacoleta || ''} onChange={e => handleInputChange(index, 'formacoleta', e.target.value)} disabled={!amostra.is_editavel} /></td>}
                                    {shouldShowField(amostra.certificado_tipo_nome, 'area_amostrada') && <td><input type="text" value={amostra.area_amostrada || ''} onChange={e => handleInputChange(index, 'area_amostrada', e.target.value)} disabled={!amostra.is_editavel} /></td>}
                                    {shouldShowField(amostra.certificado_tipo_nome, 'unidade_amostrada') && <td><input type="text" value={amostra.unidade_amostrada || ''} onChange={e => handleInputChange(index, 'unidade_amostrada', e.target.value)} disabled={!amostra.is_editavel} /></td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            
            <div className={styles.footer}>
                <button onClick={handleSalvarAmostras} disabled={loading || amostras.length === 0} className={styles.buttonSuccess}>
                    {loading ? 'Salvando...' : 'Personalizar e Salvar'}
                </button>
            </div>
        </div>
    );
};

export default PersonalizarAmostra;