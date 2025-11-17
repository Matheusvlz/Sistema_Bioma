// src/view/laboratorio/VisualizarInsumo.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ApiResponse, InsumoDetalhado } from '../../types/insumo';
import CadastrarInsumo from './CadastrarInsumo';
import styles from './styles/VisualizarInsumo.module.css';

const VisualizarInsumo: React.FC = () => {
  // --- ESTADOS ---
  const [dados, setDados] = useState<InsumoDetalhado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // --- ESTADOS DE FILTRO ---
  const [filtroTabela, setFiltroTabela] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [tiposUnicos, setTiposUnicos] = useState<string[]>([]);

  // --- ESTADOS DE "VISÃO" (Padrão V8.0 - Modal) ---
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [itemEmEdicao, setItemEmEdicao] = useState<InsumoDetalhado | null>(null);
  
  // Modal de confirmação para delete (Padrão V8.0 - Sem window.confirm)
  const [modalConfirm, setModalConfirm] = useState<InsumoDetalhado | null>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // --- CALLBACK DE CARREGAMENTO ---
  const carregarDados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await invoke<ApiResponse<InsumoDetalhado[]>>(
        'listar_insumos_tauri'
      );
      if (res.success && res.data) {
        setDados(res.data);
      } else {
        // Erro "controlado" (API retornou success: false)
        setError(res.message || 'Erro ao carregar insumos.');
      }
    } catch (err: any) {
      // Erro "grave" (invoke foi rejeitado - Padrão V8.0 corrigido)
      if (err && typeof err.message === 'string') {
        setError(err.message);
      } else {
        setError(`Erro grave ao carregar dados: ${String(err)}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregamento inicial
  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Atualiza os tipos únicos para o filtro dropdown
  useEffect(() => {
    const tipos = [...new Set(dados.map((item) => item.tipo_nome))].sort();
    setTiposUnicos(tipos);
  }, [dados]);

  // --- HANDLERS ---

  const handleAbrirFormulario = (item: InsumoDetalhado | null) => {
    setItemEmEdicao(item);
    setMostrarFormulario(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleFecharFormulario = () => {
    setItemEmEdicao(null);
    setMostrarFormulario(false);
  };

  // Exibe mensagem de sucesso e recarrega a tabela
  const handleSalvar = () => {
    handleFecharFormulario();
    setSuccessMessage('Operação realizada com sucesso!');
    setTimeout(() => setSuccessMessage(null), 3000);
    carregarDados(); // Recarrega a tabela
  };

  // Abre o modal de confirmação
  const handleRemover = (item: InsumoDetalhado) => {
    if (!item.editable) {
      setError(
        'Não é possível excluir: Este insumo já possui registros de estoque.'
      );
      setTimeout(() => setError(null), 4000);
      return;
    }
    setModalConfirm(item);
  };

  const handleCancelarRemocao = () => {
    setModalConfirm(null);
    setLoadingDelete(false);
  };

  const handleConfirmarRemocao = async () => {
    if (!modalConfirm) return;

    setLoadingDelete(true);
    setError(null);

    try {
      const res = await invoke<ApiResponse<void>>('deletar_insumo_tauri', {
        id: modalConfirm.id,
      });

      if (res.success) {
        setSuccessMessage('Insumo removido com sucesso!');
        setTimeout(() => setSuccessMessage(null), 3000);
        carregarDados(); // Recarrega a tabela
      } else {
        setError(res.message || 'Erro ao remover.');
      }
    } catch (err: any) {
      // Padrão V8.0 corrigido
      if (err && typeof err.message === 'string') {
        setError(err.message);
      } else {
        setError(`Erro grave ao remover: ${String(err)}`);
      }
    } finally {
      setLoadingDelete(false);
      setModalConfirm(null);
    }
  };
 
  

  // --- RENDERIZAÇÃO ---

  // Filtro da tabela
  const dadosFiltrados = dados.filter((item) => {
    const searchTerm = filtroTabela.toLowerCase();

    const matchTexto =
      !searchTerm ||
      item.nome.toLowerCase().includes(searchTerm) ||
      item.tipo_nome.toLowerCase().includes(searchTerm);

    const matchTipoFiltro = !filtroTipo || item.tipo_nome === filtroTipo;

    return matchTexto && matchTipoFiltro;
  });
  
  // Visão Principal (Tabela)
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Gerenciar Insumos</h2>
        <button
          onClick={() => handleAbrirFormulario(null)}
          className={styles.buttonPrimary}
        >
          Novo Insumo
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {successMessage && <div className={styles.success}>{successMessage}</div>}

      {/* --- Filtros --- */}
      <div className={styles.filterContainer}>
        <input
          type="text"
          placeholder="Buscar por descrição ou tipo..."
          value={filtroTabela}
          onChange={(e) => setFiltroTabela(e.target.value)}
          className={styles.searchInput}
          disabled={dados.length === 0}
        />
        
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className={styles.selectInput}
          disabled={tiposUnicos.length === 0}
        >
          <option value="">Todos os Tipos</option>
          {tiposUnicos.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </select>
      </div>

      {/* --- Tabela com Scroll --- */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Descrição</th>
              <th>Tipo</th>
              <th>Unidade</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className={styles.loadingCell}>
                  <div className={styles.spinner}></div>
                  <span>Carregando dados...</span>
                </td>
              </tr>
            ) : dadosFiltrados.length > 0 ? (
              dadosFiltrados.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.nome}</td>
                  <td>{item.tipo_nome}</td>
                  <td>{item.unidade || 'N/A'}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        onClick={() => handleAbrirFormulario(item)}
                        className={styles.buttonEdit}
                        title="Editar"
                      >
                        {/* SVG para Editar (Padrão Profissional) */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleRemover(item)}
                        className={styles.buttonDelete}
                        title={
                          item.editable
                            ? 'Remover'
                            : 'Não pode ser removido (possui registros)'
                        }
                        disabled={!item.editable}
                      >
                        {/* SVG para Deletar */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className={styles.empty}>
                  {filtroTabela || filtroTipo
                    ? 'Nenhum insumo encontrado com os filtros aplicados.'
                    : 'Nenhum insumo cadastrado.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- Modal de Cadastro/Edição --- */}
      {mostrarFormulario && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <CadastrarInsumo
              onSalvar={handleSalvar}
              onCancelar={handleFecharFormulario}
              itemParaEdicao={itemEmEdicao}
            />
          </div>
        </div>
      )}

      {/* --- Modal de Confirmação (Delete) --- */}
      {modalConfirm && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalConfirm}>
            <h3>Confirmar Remoção</h3>
            <p>
              Tem certeza que deseja remover o insumo "
              <strong>{modalConfirm.nome}</strong>"? Esta ação não pode ser
              desfeita.
            </p>
            <div className={styles.modalActions}>
              <button
                onClick={handleCancelarRemocao}
                disabled={loadingDelete}
                className={styles.buttonSecondary}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarRemocao}
                disabled={loadingDelete}
                className={styles.buttonDeleteConfirm}
              >
                {loadingDelete ? 'Removendo...' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualizarInsumo;
