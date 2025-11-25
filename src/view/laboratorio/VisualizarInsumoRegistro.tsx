// src/view/laboratorio/VisualizarInsumoRegistro.tsx
// Tela principal para "Cadastro de Registro de Insumo"

import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  ApiResponse,
  InsumoTipoOption,
  InsumoOption,
  InsumoRegistroDetalhado,
} from '../../types/insumo';
import CadastrarInsumoRegistro from './CadastrarInsumoRegistro';
import styles from './styles/VisualizarInsumoRegistro.module.css';

// --- Componente de Tabela Dinâmica ---
// A tabela muda as colunas com base no tipo_nome
interface TabelaDinamicaProps {
  tipoNome: string;
  dados: InsumoRegistroDetalhado[];
  onEditar: (item: InsumoRegistroDetalhado) => void;
  onRemover: (item: InsumoRegistroDetalhado) => void;
  onVerHistorico: (item: InsumoRegistroDetalhado) => void;
  onVerCalibracao: (item: InsumoRegistroDetalhado) => void;
}

const TabelaDinamica: React.FC<TabelaDinamicaProps> = ({
  tipoNome,
  dados,
  onEditar,
  onRemover,
  onVerHistorico,
  onVerCalibracao,
}) => {
  let colunas: string[] = [];
  
  // Define as colunas com base no tipo (replicando a lógica do Java)
  switch (tipoNome) {
    case 'Equipamento':
      colunas = ['Insumo', 'Patrimônio', 'Modelo', 'Nº Série', 'Status'];
      break;
    case 'Meio de cultura':
      colunas = ['Insumo', 'Lote', 'Data', 'Validade', 'Quant.', 'Status'];
      break;
    case 'Solução/Reagente':
      colunas = ['Insumo', 'Lote', 'Data', 'Validade', 'Quant.', 'Fator', 'Status'];
      break;
    case 'Vidraria':
      colunas = ['Insumo', 'Volume', 'Fabricante', 'Status'];
      break;
    case 'Acessório':
      colunas = ['Insumo', 'Fabricante', 'Quant.', 'Status'];
      break;
    default:
      colunas = ['Insumo', 'Registro', 'Status'];
  }
  colunas.push('Ações');

  const renderizarCelula = (
    item: InsumoRegistroDetalhado,
    coluna: string
  ) => {
    // Formata datas "YYYY-MM-DD" para "DD/MM/YYYY"
    const formatarData = (data: string | null | undefined) => {
      if (!data) return 'N/A';
      try {
        const [ano, mes, dia] = data.split('-');
        return `${dia}/${mes}/${ano}`;
      } catch {
        return 'Data Inválida';
      }
    };
    
    // Formata o status
    if (coluna === 'Status') {
      if (item.obsoleto) return <span className={styles.statusObsoleto}>Obsoleto</span>;
      if (item.fora_de_uso) return <span className={styles.statusForaDeUso}>Fora de Uso</span>;
      return <span className={styles.statusAtivo}>Ativo</span>;
    }

    // Mapeia os dados para as colunas dinâmicas
    switch (coluna) {
      case 'Insumo':
        return item.insumo_nome;
      case 'Patrimônio':
      case 'Lote':
      case 'Registro':
        return item.registro || 'N/A';
      case 'Modelo':
        return item.modelo || 'N/A';
      case 'Nº Série':
        return item.numero_serie || 'N/A';
      case 'Data':
        return formatarData(item.data_preparo);
      case 'Validade':
        return formatarData(item.validade);
      case 'Quant.':
        return item.quantidade ? parseFloat(item.quantidade).toFixed(4) : 'N/A';
      case 'Fator':
        return item.fator_correcao ? parseFloat(item.fator_correcao).toFixed(4) : 'N/A';
      case 'Volume':
        return item.volume || 'N/A';
      case 'Fabricante':
        return item.fabricante || 'N/A';
      default:
        return null;
    }
  };

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead className={styles.tableHeaderSticky}>
          <tr>
            {colunas.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dados.map((item) => (
            <tr key={item.id}>
              {colunas.map((col) => (
                <td key={`${item.id}-${col}`}>
                  {col === 'Ações' ? (
                    <div className={styles.actions}>
                      {tipoNome === 'Equipamento' && (
                         <button
                            onClick={() => onVerCalibracao(item)}
                            className={styles.buttonIcon}
                            title="Calibração"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4.31 4.311L4.15 5.099a.5.5 0 0 0 .42.61l.582.116a.5.5 0 0 1 .47.47l.116.582a.5.5 0 0 0 .61.42l.788-.158A4.002 4.002 0 0 0 8 2.311l.788.158a.5.5 0 0 0 .61-.42l.116-.582a.5.5 0 0 1 .47-.47l.582-.116a.5.5 0 0 0 .42-.61L11.69 4.31a4.002 4.002 0 0 0-2.682-2.22l-.797-.162zM4.178 8.026a.5.5 0 0 0-.42.61l.116.582a.5.5 0 0 1 .47.47l.582.116a.5.5 0 0 0 .61.42l.788-.158A4.002 4.002 0 0 0 8 9.311l.788.158a.5.5 0 0 0 .61-.42l.116-.582a.5.5 0 0 1 .47-.47l.582-.116a.5.5 0 0 0 .42-.61L11.69 7.69a4.002 4.002 0 0 0-2.682-2.22l-.797-.162A4.002 4.002 0 0 0 5.098 7.69l-.788.158z"/></svg>
                          </button>
                      )}
                      <button
                        onClick={() => onVerHistorico(item)}
                        className={styles.buttonIcon}
                        title="Histórico de Gasto"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.5 4.5a.5.5 0 0 0-1 0v5.793l-2.146 2.147a.5.5 0 0 0 .708.708l2.5-2.5a.5.5 0 0 0 .146-.353V4.5z"/></svg>
                      </button>
                      <button
                        onClick={() => onEditar(item)}
                        className={styles.buttonIcon}
                        title="Editar"
                        disabled={!item.editable}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/><path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/></svg>
                      </button>
                      <button
                        onClick={() => onRemover(item)}
                        className={`${styles.buttonIcon} ${styles.buttonDelete}`}
                        title="Remover"
                        disabled={!item.editable}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
                      </button>
                    </div>
                  ) : (
                    renderizarCelula(item, col)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {dados.length === 0 && (
        <div className={styles.emptyState}>Nenhum registro encontrado.</div>
      )}
    </div>
  );
};

// --- Componente de Confirmação ---
interface ConfirmModalProps {
  mensagem: string;
  onConfirm: () => void;
  onCancel: () => void;
}
const ConfirmModal: React.FC<ConfirmModalProps> = ({ mensagem, onConfirm, onCancel }) => (
  <div className={styles.modalOverlay}>
    <div className={styles.modalContent}>
      <h4>Confirmar Ação</h4>
      <p>{mensagem}</p>
      <div className={styles.modalActions}>
        <button onClick={onCancel} className={styles.buttonSecondary}>Cancelar</button>
        <button onClick={onConfirm} className={styles.buttonDelete}>Confirmar Remoção</button>
      </div>
    </div>
  </div>
);

// --- Componente Principal ---
const VisualizarInsumoRegistro: React.FC = () => {
  // --- ESTADOS ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dados das tabelas e filtros
  const [dados, setDados] = useState<InsumoRegistroDetalhado[]>([]);
  const [tiposInsumo, setTiposInsumo] = useState<InsumoTipoOption[]>([]);
  const [insumosFiltrados, setInsumosFiltrados] = useState<InsumoOption[]>([]);
  
  // Estado dos filtros
  const [tipoIdFiltro, setTipoIdFiltro] = useState<string>('');
  const [insumoIdFiltro, setInsumoIdFiltro] = useState<string>('0');
  const [mostrarObsoletos, setMostrarObsoletos] = useState(false);
  const [tipoNomeSelecionado, setTipoNomeSelecionado] = useState('');

  // Estado dos Modais (Padrão V8.0)
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [itemEmEdicao, setItemEmEdicao] = useState<InsumoRegistroDetalhado | null>(null);
  const [itemParaRemover, setItemParaRemover] = useState<InsumoRegistroDetalhado | null>(null);
  
  // --- FUNÇÕES DE CARREGAMENTO (DATA) ---

  // Carrega os dropdowns de filtro (Tipos de Insumo)
  const carregarFiltros = useCallback(async () => {
    try {
      // Reutiliza o comando da tela de "Gerenciar Insumos"
      const res = await invoke<ApiResponse<InsumoTipoOption[]>>('listar_insumo_tipos_tauri');
      if (res.success && res.data) {
        setTiposInsumo(res.data);
        if (res.data.length > 0) {
          // Seleciona o primeiro tipo por padrão
          setTipoIdFiltro(res.data[0].id.toString());
          setTipoNomeSelecionado(res.data[0].nome);
        }
      } else {
        setError(res.message || 'Falha ao carregar tipos de insumo.');
      }
    } catch (err: any) {
      setError(err.message || `Erro grave ao carregar filtros: ${String(err)}`);
    }
  }, []);

  // Carrega os dados principais da tabela
  const carregarDados = useCallback(async () => {
    if (!tipoIdFiltro) return; // Não carrega se nenhum tipo estiver selecionado

    setLoading(true);
    setError(null);
    try {
      const res = await invoke<ApiResponse<InsumoRegistroDetalhado[]>>(
        'listar_insumos_registros_tauri',
        {
          tipoId: Number(tipoIdFiltro),
          insumoId: Number(insumoIdFiltro),
          obsoletos: mostrarObsoletos,
        }
      );
      if (res.success && res.data) {
        setDados(res.data);
      } else {
        setError(res.message || 'Erro ao carregar registros.');
      }
    } catch (err: any) {
      setError(err.message || `Erro grave ao carregar dados: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [tipoIdFiltro, insumoIdFiltro, mostrarObsoletos]);

  // --- EFEITOS (LIFECYCLE) ---

  // Carregamento inicial dos filtros
  useEffect(() => {
    carregarFiltros();
  }, [carregarFiltros]);

  // Recarrega a tabela principal quando os filtros mudam
  useEffect(() => {
    if (tipoIdFiltro) {
      carregarDados();
    }
  }, [carregarDados, tipoIdFiltro]); // Depende de carregarDados, que depende dos filtros

  // Atualiza o dropdown de Insumos quando o Tipo muda
  useEffect(() => {
    const atualizarInsumosDoTipo = async () => {
      if (!tipoIdFiltro) {
        setInsumosFiltrados([]);
        return;
      }
      // Reseta o filtro de insumo
      setInsumoIdFiltro('0'); 
      try {
        const res = await invoke<ApiResponse<InsumoOption[]>>(
          'listar_insumos_por_tipo_tauri',
          { tipoId: Number(tipoIdFiltro) }
        );
        if (res.success && res.data) {
          setInsumosFiltrados(res.data);
        } else {
          setError(res.message || 'Falha ao carregar insumos do tipo.');
        }
      } catch (err: any) {
         setError(err.message || `Erro ao carregar insumos: ${String(err)}`);
      }
    };
    atualizarInsumosDoTipo();
  }, [tipoIdFiltro]);


  // --- HANDLERS (AÇÕES DO USUÁRIO) ---

  const handleTipoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const novoTipoId = e.target.value;
    const tipoSelecionado = tiposInsumo.find(t => t.id.toString() === novoTipoId);
    setTipoIdFiltro(novoTipoId);
    setTipoNomeSelecionado(tipoSelecionado ? tipoSelecionado.nome : '');
  };
  
  const handleMostrarFormulario = (item: InsumoRegistroDetalhado | null) => {
    setItemEmEdicao(item);
    setMostrarFormulario(true);
  };
  
  const handleFecharFormulario = () => {
    setItemEmEdicao(null);
    setMostrarFormulario(false);
  };
  
  // Chamado pelo modal de cadastro/edição após sucesso
  const handleSalvarSucesso = () => {
    handleFecharFormulario();
    setSuccess('Operação realizada com sucesso!');
    setTimeout(() => setSuccess(null), 3000);
    carregarDados(); // Recarrega a tabela
  };

  const handleRemoverClick = (item: InsumoRegistroDetalhado) => {
     if (!item.editable) {
       setError("Este item não pode ser removido (pode ter registros de uso).");
       setTimeout(() => setError(null), 4000);
       return;
     }
    setItemParaRemover(item);
  };

  const handleConfirmarRemocao = async () => {
    if (!itemParaRemover) return;
    
    try {
      const res = await invoke<ApiResponse<void>>('deletar_insumo_registro_tauri', {
        id: itemParaRemover.id,
      });
      if (res.success) {
        setSuccess('Registro removido com sucesso!');
        setTimeout(() => setSuccess(null), 3000);
        setItemParaRemover(null);
        carregarDados(); // Recarrega a tabela
      } else {
        setError(res.message || 'Erro ao remover.');
      }
    } catch (err: any) {
      setError(err.message || `Erro grave ao remover: ${String(err)}`);
    }
  };

  const handleVerHistorico = (item: InsumoRegistroDetalhado) => {
    // TODO: Abrir o modal/tela de histórico de gasto
    console.log("Abrir histórico para:", item);
    setError("Função 'Histórico' ainda não implementada.");
    setTimeout(() => setError(null), 3000);
  };
  
  const handleVerCalibracao = (item: InsumoRegistroDetalhado) => {
    // TODO: Abrir o modal/tela de calibração
    console.log("Abrir calibração para:", item);
     setError("Função 'Calibração' ainda não implementada.");
    setTimeout(() => setError(null), 3000);
  };
  
  // --- RENDERIZAÇÃO ---
  
  return (
    <div className={styles.container}>
      {/* Modal de Confirmação */}
      {itemParaRemover && (
        <ConfirmModal
          mensagem={`Tem certeza que deseja remover o registro "${itemParaRemover.insumo_nome} - ${itemParaRemover.registro || itemParaRemover.id}"?`}
          onConfirm={handleConfirmarRemocao}
          onCancel={() => setItemParaRemover(null)}
        />
      )}

      {/* Modal de Formulário (Cadastro/Edição) */}
      {mostrarFormulario && (
        <CadastrarInsumoRegistro
          onSalvar={handleSalvarSucesso}
          onCancelar={handleFecharFormulario}
          itemParaEdicao={itemEmEdicao}
          tipoIdDefault={Number(tipoIdFiltro)} // Passa o tipo selecionado para o modal
          tipoNomeDefault={tipoNomeSelecionado}
          insumosDoTipo={insumosFiltrados} // Passa a lista de insumos já carregada
        />
      )}
      
      <div className={styles.header}>
        <h2>Gerenciar Registros de Insumos (Estoque)</h2>
        <button
          onClick={() => handleMostrarFormulario(null)}
          className={styles.buttonPrimary}
          disabled={!tipoIdFiltro}
          title={!tipoIdFiltro ? "Selecione um Tipo primeiro" : "Novo Registro"}
        >
          Novo Registro
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.filters}>
        <div className={styles.formGroup}>
          <label htmlFor="tipoFiltro">Tipo de Insumo</label>
          <select
            id="tipoFiltro"
            value={tipoIdFiltro}
            onChange={handleTipoChange}
          >
            <option value="" disabled>Selecione um tipo...</option>
            {tiposInsumo.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>
            ))}
          </select>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="insumoFiltro">Insumo Específico</label>
          <select
            id="insumoFiltro"
            value={insumoIdFiltro}
            onChange={(e) => setInsumoIdFiltro(e.target.value)}
            disabled={!tipoIdFiltro || insumosFiltrados.length === 0}
          >
            <option value="0">Todos</option>
            {insumosFiltrados.map((insumo) => (
              <option key={insumo.id} value={insumo.id}>{insumo.nome}</option>
            ))}
          </select>
        </div>
        
         <div className={styles.checkboxGroup}>
          <input
            type="checkbox"
            id="mostrarObsoletos"
            checked={mostrarObsoletos}
            onChange={(e) => setMostrarObsoletos(e.target.checked)}
          />
          <label htmlFor="mostrarObsoletos">Mostrar obsoletos</label>
        </div>
      </div>
      
      {loading && (
        <div className={styles.loadingState}>
           <div className={styles.spinner}></div>
           <span>Carregando registros...</span>
        </div>
      )}

      {!loading && (
         <TabelaDinamica
            tipoNome={tipoNomeSelecionado}
            dados={dados}
            onEditar={handleMostrarFormulario}
            onRemover={handleRemoverClick}
            onVerHistorico={handleVerHistorico}
            onVerCalibracao={handleVerCalibracao}
          />
      )}

    </div>
  );
};

export default VisualizarInsumoRegistro;    