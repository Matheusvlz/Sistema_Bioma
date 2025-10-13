import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import styles from './styles/CadastrarPesquisa.module.css';

// --- Tipagens consolidadas diretamente no arquivo, conforme solicitado ---

// Representa a resposta padrão da nossa camada Tauri.
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// Para os dropdowns de modelo de pesquisa.
interface PesquisaModeloOption {
  id: number;
  descricao: string;
}

// Para a lista de itens de um modelo.
interface PesquisaItem {
  id: number;
  descricao: string;
}

// Dados detalhados de uma pesquisa (recebidos da API).
interface PesquisaDetalhada {
  id: number;
  descricao: string;
  dataInicial: string; // Formato 'dd/mm/yyyy' vindo da API
  dataTermino: string; // Formato 'dd/mm/yyyy' vindo da API
  modeloId: number;
  nomeModelo: string;
  finalizada: boolean;
}

// Payload para CRIAR ou EDITAR uma pesquisa (enviado para o Tauri).
interface UpsertPesquisaPayload {
  descricao: string;
  dataInicial: string; // Formato 'yyyy-mm-dd' para o input
  dataTermino: string; // Formato 'yyyy-mm-dd' para o input
  modeloId: number;
}

// O componente agora aceita um 'id' para o modo de edição.
interface CadastrarPesquisaProps {
  pesquisaId?: number | null;
  onClose?: () => void; // Função opcional para fechar (se a tela for um modal)
}

// Função utilitária para converter data dd/mm/yyyy (da API) para yyyy-mm-dd (para o input HTML).
const formatDateToInput = (dateStr: string): string => {
  if (!dateStr || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return '';
  const [day, month, year] = dateStr.split('/');
  return `${year}-${month}-${day}`;
};

const CadastrarPesquisa: React.FC<CadastrarPesquisaProps> = ({ pesquisaId, onClose }) => {
  const isEditMode = !!pesquisaId;

  // O estado do formulário agora usa 'modeloId' para consistência.
  const [formData, setFormData] = useState({
    descricao: '',
    dataInicial: '',
    dataTermino: '',
    modeloId: 0,
  });
  const [modelos, setModelos] = useState<PesquisaModeloOption[]>([]);
  const [itensModelo, setItensModelo] = useState<PesquisaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingItens, setLoadingItens] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Função para carregar itens do modelo, agora envolvida em useCallback
  const carregarItensDoModelo = useCallback(async (modeloId: number) => {
    if (modeloId === 0) {
      setItensModelo([]);
      return;
    }
    setLoadingItens(true);
    try {
      const res: ApiResponse<PesquisaItem[]> = await invoke("listar_itens_por_modelo_tauri", { modeloId });
      if (res.success && res.data) {
        setItensModelo(res.data);
      } else {
        setError(res.message || "Falha ao carregar itens do modelo.");
        setItensModelo([]);
      }
    } catch (err: any) {
      setError(err.message || "Erro de comunicação ao buscar itens do modelo.");
      setItensModelo([]);
    } finally {
      setLoadingItens(false);
    }
  }, []);

  // useEffect para carregar dados da pesquisa se estiver em modo de edição.
  useEffect(() => {
    const carregarPesquisaExistente = async (id: number) => {
      setLoading(true);
      try {
        const res: ApiResponse<PesquisaDetalhada> = await invoke("buscar_pesquisa_por_id_tauri", { id });
        if (res.success && res.data) {
          const { data } = res;
          setFormData({
            descricao: data.descricao,
            dataInicial: formatDateToInput(data.dataInicial),
            dataTermino: formatDateToInput(data.dataTermino),
            modeloId: data.modeloId,
          });
          // Carrega os itens do modelo pré-selecionado
          carregarItensDoModelo(data.modeloId);
        } else {
          setError(res.message || "Falha ao carregar dados da pesquisa.");
        }
      } catch (err: any) {
        setError(err.message || "Erro de comunicação ao buscar pesquisa.");
      } finally {
        setLoading(false);
      }
    };

    if (isEditMode) {
      carregarPesquisaExistente(pesquisaId);
    }
  }, [pesquisaId, isEditMode, carregarItensDoModelo]);

  // useEffect para carregar os modelos de pesquisa.
  useEffect(() => {
    const carregarModelos = async () => {
        try {
            const res: ApiResponse<PesquisaModeloOption[]> = await invoke("listar_modelos_pesquisa_tauri");
            if (res.success && res.data) {
              setModelos(res.data);
            } else {
              setError(res.message || "Falha ao carregar modelos de pesquisa.");
            }
          } catch (err: any) {
            setError(err.message || "Erro de comunicação ao buscar modelos.");
          }
    };
    carregarModelos();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Limpa as mensagens de sucesso/erro ao começar a digitar
    setSuccessMessage(null);
    setError(null);
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'modeloId') {
      const id = parseInt(value, 10);
      carregarItensDoModelo(id);
    }
  };

  // handleSubmit agora lida com criar e editar.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    if (!formData.descricao.trim() || !formData.dataInicial || !formData.dataTermino || formData.modeloId === 0) {
      setError("Todos os campos são obrigatórios.");
      return;
    }
    setLoading(true);

    const payload: UpsertPesquisaPayload = {
      descricao: formData.descricao,
      dataInicial: formData.dataInicial,
      dataTermino: formData.dataTermino,
      modeloId: Number(formData.modeloId),
    };

    try {
      const command = isEditMode ? "editar_pesquisa_tauri" : "cadastrar_pesquisa_tauri";
      const args = isEditMode ? { id: pesquisaId, payload } : { payload };

      const res: ApiResponse<PesquisaDetalhada> = await invoke(command, args);

      if (res.success) {
        setSuccessMessage(isEditMode ? "Pesquisa atualizada com sucesso!" : "Pesquisa cadastrada com sucesso!");
        if (!isEditMode) {
          // Limpa o formulário apenas se estiver criando um novo
          setFormData({ descricao: '', dataInicial: '', dataTermino: '', modeloId: 0 });
          setItensModelo([]);
        }
      } else {
        setError(res.message || "Ocorreu um erro ao salvar a pesquisa.");
      }
    } catch (err: any) {
      setError(err.message || "Erro de comunicação. Não foi possível salvar a pesquisa.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2>{isEditMode ? 'Editar Pesquisa de Qualidade' : 'Cadastrar Nova Pesquisa'}</h2>

        {error && <div className={styles.error} onClick={() => setError(null)}>{error}</div>}
        {successMessage && <div className={styles.success} onClick={() => setSuccessMessage(null)}>{successMessage}</div>}
        
        <div className={styles.formGroup}>
          <label htmlFor="descricao">Descrição</label>
          <input type="text" id="descricao" name="descricao" value={formData.descricao} onChange={handleInputChange} required disabled={loading} />
        </div>
        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label htmlFor="dataInicial">Data de Início</label>
            <input type="date" id="dataInicial" name="dataInicial" value={formData.dataInicial} onChange={handleInputChange} required disabled={loading} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="dataTermino">Data de Término</label>
            <input type="date" id="dataTermino" name="dataTermino" value={formData.dataTermino} onChange={handleInputChange} required disabled={loading} />
          </div>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="modeloId">Modelo da Pesquisa</label>
          <select id="modeloId" name="modeloId" value={formData.modeloId} onChange={handleInputChange} required disabled={loading}>
            <option value={0} disabled>Selecione um modelo...</option>
            {modelos.map(m => (<option key={m.id} value={m.id}>{m.descricao}</option>))}
          </select>
        </div>
        <div className={styles.itemsSection}>
          <h4>Itens do Modelo</h4>
          <div className={styles.itemsList}>
            {loadingItens && <p>Carregando itens...</p>}
            {!loadingItens && itensModelo.length === 0 && Number(formData.modeloId) !== 0 && <p>Nenhum item encontrado.</p>}
            {!loadingItens && itensModelo.length === 0 && Number(formData.modeloId) === 0 && <p>Selecione um modelo para ver os itens.</p>}
            {itensModelo.length > 0 && (<ul>{itensModelo.map(item => (<li key={item.id}>{item.descricao}</li>))}</ul>)}
          </div>
        </div>
        
        <div className={styles.actions}>
          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Salvar Pesquisa')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CadastrarPesquisa;