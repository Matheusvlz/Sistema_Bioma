// src/view/laboratorio/CadastrarInsumo.tsx

import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  ApiResponse,
  InsumoDetalhado,
  InsumoSuporteFormulario,
  InsumoTipoOption,
  MateriaPrimaGrupo,
  UnidadeOption,
  InsumoPayload,
  InsumoCompletoDetalhado,
  MateriaPrimaOption,
  InsumoMateriaPrimaPayload, // Corrigido: tipo que faltava
} from '../../types/insumo';
import styles from './styles/CadastrarInsumo.module.css'; // CSS novo

// Nomes dos tipos que exigem receita (conforme lógica Java)
const TIPOS_COM_RECEITA = ['Meio de cultura', 'Solução/Reagente'];

// Props que o componente recebe
interface CadastrarInsumoProps {
  onSalvar: () => void;
  onCancelar: () => void;
  itemParaEdicao: InsumoDetalhado | null;
}

const CadastrarInsumo: React.FC<CadastrarInsumoProps> = ({
  onSalvar,
  onCancelar,
  itemParaEdicao,
}) => {
  // --- ESTADOS DE DADOS DE SUPORTE ---
  const [loadingSuporte, setLoadingSuporte] = useState(true);
  const [errorSuporte, setErrorSuporte] = useState<string | null>(null);
  const [tipos, setTipos] = useState<InsumoTipoOption[]>([]);
  const [unidades, setUnidades] = useState<UnidadeOption[]>([]);
  const [gruposMp, setGruposMp] = useState<MateriaPrimaGrupo[]>([]);
  const [abaAtiva, setAbaAtiva] = useState(0);

  // --- ESTADOS DE DADOS DO FORMULÁRIO ---
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [errorSubmit, setErrorSubmit] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [tipoId, setTipoId] = useState<number | string>('');
  const [unidade, setUnidade] = useState<string>(''); // Default para string vazia

  // Estrutura de dados para a "Receita": Map<materia_prima_id, quantidade>
  const [receita, setReceita] = useState<Map<number, string>>(new Map());

  // --- DERIVAÇÃO DE ESTADO ---
  const tipoSelecionado = tipos.find((t) => t.id === Number(tipoId));
  const mostrarReceita =
    tipoSelecionado && TIPOS_COM_RECEITA.includes(tipoSelecionado.nome);

  // --- EFEITOS (CARREGAMENTO) ---

  // 1. Carrega todos os dados de suporte (tipos, unidades, grupos)
  useEffect(() => {
    const carregarSuporte = async () => {
      try {
        const res = await invoke<ApiResponse<InsumoSuporteFormulario>>(
          'carregar_suporte_formulario_insumo_tauri'
        );

        if (res.success && res.data) {
          setTipos(res.data.tipos);
          setUnidades(res.data.unidades);
          setGruposMp(res.data.grupos_mp);
          if (res.data.grupos_mp.length > 0) {
            setAbaAtiva(res.data.grupos_mp[0].tipo_id);
          }
        } else {
          setErrorSuporte(res.message || 'Falha ao carregar dados de suporte.');
        }
      } catch (err: any) {
        // Padrão V8.0 corrigido
        if (err && typeof err.message === 'string') {
          setErrorSuporte(err.message);
        } else {
          setErrorSuporte(`Erro fatal ao carregar suporte: ${String(err)}`);
        }
      } finally {
        setLoadingSuporte(false);
      }
    };

    carregarSuporte();
  }, []);

  // 2. Popula o formulário se for modo de edição
  useEffect(() => {
    if (itemParaEdicao) {
      // Seta os dados simples
      setNome(itemParaEdicao.nome);
      setTipoId(itemParaEdicao.tipo_id);
      setUnidade(itemParaEdicao.unidade || '');

      // Busca os dados completos (a receita)
      const carregarReceitaEdicao = async () => {
        setLoadingSuporte(true); // Reativa o loading para buscar a receita
        try {
          const res = await invoke<ApiResponse<InsumoCompletoDetalhado>>(
            'buscar_insumo_tauri',
            { id: itemParaEdicao.id }
          );

          if (res.success && res.data) {
            // Cria o Map da receita a partir dos dados buscados
            const receitaMap = new Map<number, string>();
            res.data.materias_primas.forEach((mp) => {
              // API retorna BigDecimal como string, o que é perfeito
              receitaMap.set(mp.materia_prima_id, mp.quantidade);
            });
            setReceita(receitaMap);
          } else {
            setErrorSuporte(
              res.message || 'Falha ao carregar a receita do insumo.'
            );
          }
        } catch (err: any) {
          // Padrão V8.0 corrigido
          if (err && typeof err.message === 'string') {
            setErrorSuporte(err.message);
          } else {
            setErrorSuporte(`Erro fatal ao carregar receita: ${String(err)}`);
          }
        } finally {
          setLoadingSuporte(false);
        }
      };

      carregarReceitaEdicao();
    }
  }, [itemParaEdicao]);

  // --- HANDLERS (AÇÕES DO USUÁRIO) ---

  // Gerencia a "Receita" (checkboxes e inputs)
  const handleReceitaChange = (mp: MateriaPrimaOption, checked: boolean) => {
    const novaReceita = new Map(receita);
    if (checked) {
      // Adiciona ao Map, com quantidade vazia
      novaReceita.set(mp.id, '');
    } else {
      // Remove do Map
      novaReceita.delete(mp.id);
    }
    setReceita(novaReceita);
  };

  const handleQuantidadeChange = (mp_id: number, quantidade: string) => {
    const novaReceita = new Map(receita);
    // Atualiza a quantidade (só permite se a chave já existir)
    if (novaReceita.has(mp_id)) {
      novaReceita.set(mp_id, quantidade);
    }
    setReceita(novaReceita);
  };

  // Salvar (Submit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSubmit(true);
    setErrorSubmit(null);

    // Validações (como no Java)
    if (!nome.trim()) {
      setErrorSubmit('Informe a descrição do insumo.');
      setLoadingSubmit(false);
      return;
    }
    if (!tipoId) {
      setErrorSubmit('Informe o tipo do insumo.');
      setLoadingSubmit(false);
      return;
    }

    let materiasPrimasPayload: InsumoMateriaPrimaPayload[] = [];

    if (mostrarReceita) {
      if (!unidade) {
        setErrorSubmit('Informe a unidade.');
        setLoadingSubmit(false);
        return;
      }

      // Valida e formata a receita (como no Java)
      for (const [mp_id, qtd] of receita.entries()) {
        const qtdNum = parseFloat(qtd.replace(',', '.'));
        if (!qtd.trim() || isNaN(qtdNum) || qtdNum <= 0) {
          setErrorSubmit(
            'Informe uma quantidade válida (maior que zero) para todas as matérias-primas selecionadas.'
          );
          setLoadingSubmit(false);
          return;
        }
        materiasPrimasPayload.push({
          materia_prima_id: mp_id,
          quantidade: qtd.replace(',', '.'), // Garante padrão decimal
        });
      }
    }

    const payload: InsumoPayload = {
      nome,
      tipo_id: Number(tipoId),
      unidade: mostrarReceita ? unidade : null,
      materias_primas: materiasPrimasPayload,
    };

    try {
      const comando = itemParaEdicao
        ? 'editar_insumo_tauri'
        : 'criar_insumo_tauri';
      const args = itemParaEdicao
        ? { id: itemParaEdicao.id, payload }
        : { payload };

      const res = await invoke<ApiResponse<InsumoDetalhado>>(comando, args);

      if (res.success) {
        onSalvar(); // Chama a função do pai para fechar o modal e atualizar a tabela
      } else {
        setErrorSubmit(res.message || 'Ocorreu um erro ao salvar.');
      }
    } catch (err: any) {
      // Padrão V8.0 corrigido
      if (err && typeof err.message === 'string') {
        setErrorSubmit(err.message);
      } else {
        setErrorSubmit(`Erro fatal ao salvar: ${String(err)}`);
      }
    } finally {
      setLoadingSubmit(false);
    }
  };

  // --- RENDERIZAÇÃO ---

  if (loadingSuporte) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <span>Carregando...</span>
      </div>
    );
  }

  if (errorSuporte) {
    return <div className={styles.errorContainer}>{errorSuporte}</div>;
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.header}>
          <h2>{itemParaEdicao ? 'Editar Insumo' : 'Cadastrar Insumo'}</h2>
        </div>

        {/* --- DADOS BÁSICOS --- */}
        <div className={styles.formGroup}>
          <label htmlFor="nome">Descrição</label>
          <input
            id="nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            disabled={loadingSubmit}
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="tipo">Tipo</label>
            <select
              id="tipo"
              value={tipoId}
              onChange={(e) => setTipoId(Number(e.target.value))}
              disabled={
                loadingSubmit || (itemParaEdicao && !itemParaEdicao.editable)
              }
            >
              <option value="" disabled>
                Selecione...
              </option>
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Renderização Condicional (como no Java) */}
          {mostrarReceita && (
            <div className={styles.formGroup}>
              <label htmlFor="unidade">Unidade</label>
              <select
                id="unidade"
                value={unidade || ''}
                onChange={(e) => setUnidade(e.target.value)}
                disabled={loadingSubmit}
              >
                <option value="" disabled>
                  Selecione...
                </option>
                {unidades.map((u) => (
                  <option key={u.nome} value={u.nome}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Aviso de Edição Bloqueada */}
        {itemParaEdicao && !itemParaEdicao.editable && (
          <div className={styles.warning}>
            Este insumo não pode ser editado (Tipo/Receita) pois já possui
            registros de estoque.
          </div>
        )}

        {/* --- "RECEITA" (Matérias-Primas) --- */}
        {mostrarReceita && (
          <div className={styles.receitaContainer}>
            <label>Composição da Receita</label>
            <div className={styles.tabHeader}>
              {gruposMp.map((grupo) => (
                <button
                  key={grupo.tipo_id}
                  type="button"
                  className={
                    abaAtiva === grupo.tipo_id
                      ? styles.tabButtonActive
                      : styles.tabButton
                  }
                  onClick={() => setAbaAtiva(grupo.tipo_id)}
                >
                  {grupo.tipo_nome}
                </button>
              ))}
            </div>

            <div className={styles.tabContent}>
              {gruposMp.map((grupo) => (
                <div
                  key={grupo.tipo_id}
                  className={
                    abaAtiva === grupo.tipo_id
                      ? styles.tabPaneActive
                      : styles.tabPane
                  }
                >
                  <div className={styles.mpGridHeader}>
                    <span>Matéria-Prima</span>
                    <span>Qtde. Utilizada</span>
                  </div>
                  {grupo.itens.map((mp) => {
                    const isChecked = receita.has(mp.id);
                    return (
                      <div key={mp.id} className={styles.mpGridRow}>
                        <div className={styles.formCheck}>
                          <input
                            type="checkbox"
                            id={`mp-${mp.id}`}
                            checked={isChecked}
                            onChange={(e) =>
                              handleReceitaChange(mp, e.target.checked)
                            }
                            disabled={
                              loadingSubmit ||
                              (itemParaEdicao && !itemParaEdicao.editable)
                            }
                          />
                          <label htmlFor={`mp-${mp.id}`}>{mp.nome}</label>
                        </div>
                        <div className={styles.mpInputGroup}>
                          <input
                            type="number"
                            step="0.0001"
                            placeholder="0,0000"
                            value={receita.get(mp.id) || ''}
                            onChange={(e) =>
                              handleQuantidadeChange(mp.id, e.target.value)
                            }
                            disabled={
                              !isChecked ||
                              loadingSubmit ||
                              (itemParaEdicao && !itemParaEdicao.editable)
                            }
                            className={styles.qtdInput}
                          />
                          <span className={styles.qtdUnidade}>
                            {mp.unidade || 'N/A'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- AÇÕES --- */}
        {errorSubmit && (
          <div className={styles.errorSubmit}>{errorSubmit}</div>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            onClick={onCancelar}
            disabled={loadingSubmit}
            className={styles.buttonSecondary}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loadingSubmit}
            className={styles.buttonPrimary}
          >
            {loadingSubmit
              ? 'Salvando...'
              : itemParaEdicao
              ? 'Salvar Alterações'
              : 'Cadastrar Insumo'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CadastrarInsumo;
