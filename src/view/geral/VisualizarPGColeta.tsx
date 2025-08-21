import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import styles from './css/VisualizarPGColeta.module.css';

// Interface para os dados do PG no frontend
interface PG {
  ID: number;
  NOME?: string;
  NUMERO1?: number;
  NUMERO2?: number;
  NUMERO3?: number;
  REVISAO?: number;
  ATIVO?: number;
}

// Interface para a resposta da API do Tauri
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

const VisualizarPGColeta: React.FC = () => {
  const [pgAtivo, setPgAtivo] = useState<PG | null>(null);
  const [novaRevisao, setNovaRevisao] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const carregarPgAtivo = useCallback(async () => {
    setLoading(true);
    try {
      const response: ApiResponse<PG | null> = await invoke('buscar_pg_ativo');
      if (response.success && response.data) {
        setPgAtivo(response.data);
        // Sugere o próximo número de revisão
        setNovaRevisao(String((response.data?.REVISAO || 0) + 1));
      } else {
        setMessage({ text: response.message || 'Erro ao carregar PG ativo', type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro de comunicação com o backend', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarPgAtivo();
  }, [carregarPgAtivo]);

  const formatarPG = (pg: PG | null): string => {
    if (!pg) return "Nenhum PG ativo encontrado.";
    const n3 = String(pg.NUMERO3 || '').padStart(2, '0');
    return `${pg.NUMERO1}.${pg.NUMERO2}-${n3}/${pg.REVISAO} - ${pg.NOME}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pgAtivo || !novaRevisao.trim()) {
      setMessage({ text: "A nova revisão não pode estar vazia.", type: 'error' });
      return;
    }
    
    setSaving(true);
    setMessage(null);

    const payload = {
      NOME: pgAtivo.NOME || '',
      NUMERO1: pgAtivo.NUMERO1 || 0,
      NUMERO2: pgAtivo.NUMERO2 || 0,
      NUMERO3: pgAtivo.NUMERO3 || 0,
      REVISAO: Number(novaRevisao),
    };

    try {
      const response: ApiResponse<PG> = await invoke('criar_nova_versao_pg', { pgData: payload });
      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        carregarPgAtivo(); // Recarrega para mostrar a nova versão ativa
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro ao criar nova versão', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Procedimento de Coleta (PG)</h2>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>PG Atualmente Ativo</h3>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>A carregar...</p>
          </div>
        ) : (
          <p className={styles.pgText}>{formatarPG(pgAtivo)}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="novaRevisao" className={styles.label}>Criar Nova Revisão</label>
          <input
            type="number"
            id="novaRevisao"
            value={novaRevisao}
            onChange={(e) => setNovaRevisao(e.target.value)}
            className={styles.input}
            placeholder="Nº da Revisão"
            disabled={loading || saving}
            min="0"
          />
        </div>
        <button type="submit" className={styles.buttonPrimary} disabled={loading || saving}>
          {saving ? 'A Salvar...' : 'Salvar Nova Versão'}
        </button>
      </form>
    </div>
  );
};

export default VisualizarPGColeta;
