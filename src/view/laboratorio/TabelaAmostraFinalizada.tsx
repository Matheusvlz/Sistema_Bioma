import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { 
  CheckCircle2, Loader2, AlertTriangle, PackageOpen, 
  Search, X, Calendar, Clock, Lock, Unlock, Upload,
  ChevronDown, ChevronUp, Eye
} from 'lucide-react';

interface Laboratorio {
  id: number;
  nome: string;
  grupos: string[];
}

interface AmostraFinalizadaItem {
  analise_id: number;
  numero: string;
  identificacao: string | null;
  complemento: string | null;
  dcoleta: string | null;
  hcoleta: string | null;
  dlab: string;
  hlab: string;
  dinicio: string;
  dtermino: string | null;
  dhtermino: string | null;
  hcoleta_amostra: string | null;
  fantasia: string;
  razao: string;
  datalab: string;
}

interface LaboratorioResponse {
  success: boolean;
  data: AmostraFinalizadaItem[];
  message: string | null;
}

interface RevisarRequest {
  id_usuario: string;
  amostras_ids: number[];
}

interface RevisarResponse {
  success: boolean;
  amostras_revisadas: number;
  message: string | null;
}

type SortField = 'numero' | 'identificacao' | 'complemento' | 'dcoleta' | 'dlab' | 'dinicio' | 'dtermino';
type SortDirection = 'asc' | 'desc';

const LoadingMessage = () => (
  <div className="status-message loading">
    <Loader2 className="icon spin" size={24} />
    <span>Carregando amostras finalizadas...</span>
  </div>
);

const ErrorMessage = ({ error }: { error: string | null }) => (
  <div className="status-message error">
    <AlertTriangle className="icon" size={24} />
    <span>{error || 'Ocorreu um erro ao buscar dados.'}</span>
  </div>
);

const EmptyMessage = () => (
  <div className="status-message empty">
    <PackageOpen className="icon" size={24} />
    <span>Nenhuma amostra finalizada encontrada.</span>
  </div>
);

export const AmostrasFinalizadasView: React.FC = () => {
  const [amostras, setAmostras] = useState<AmostraFinalizadaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAmostras, setSelectedAmostras] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCliente, setShowCliente] = useState(false);
  const [sortField, setSortField] = useState<SortField>('numero');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showLabFilter, setShowLabFilter] = useState(false);
  const [selectedLabs, setSelectedLabs] = useState<Set<string>>(new Set());

  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);

// Modifique o useEffect principal
  useEffect(() => {
    // Carrega laboratórios primeiro
    fetchLaboratorios().then(() => {
      // O fetchLaboratorios atualiza o estado 'selectedLabs'
      // O próximo useEffect (abaixo) irá disparar o fetchData
    });
    
    // Atalho Alt+C (mantenha o código existente do listener)
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'c') {
        setShowCliente(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []); // Executa apenas na montagem

  // Adicione um useEffect específico para recarregar dados quando filtros mudarem
  useEffect(() => {
    // Só busca se tivermos laboratórios selecionados (opcional, evita busca vazia inicial)
    if (laboratorios.length > 0) {
        fetchData();
    }
  }, [selectedLabs, sortField, sortDirection, laboratorios.length]); // Reage a mudanças nos filtros

  const mapSortToSql = (field: SortField, direction: SortDirection): string => {
  const map: Record<SortField, string> = {
    'numero': 'a.numero',
    'identificacao': 'a.identificacao',
    'complemento': 'a.complemento',
    'dcoleta': 'gd.data_coleta',
    'dlab': 'gd.data_lab',
    'dinicio': 'dinicio', // Alias na query SQL
    'dtermino': 'dtermino' // Alias na query SQL
  };
  
  // Exemplo de retorno: "a.numero ASC"
  return `${map[field] || 'a.numero'} ${direction.toUpperCase()}`;
};

const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Preparar os filtros baseados no estado atual
      // Converta o Set de laboratórios selecionados para Array
      // Se estiver vazio (nenhum filtro), enviamos vazio (o backend deve tratar) 
      // ou todos se for a lógica inicial.
      const gruposArray = Array.from(selectedLabs); 
      
      // Se não tiver labs carregados ainda (primeira renderização), 
      // talvez seja melhor não filtrar ou pegar de uma prop padrão.
      // Aqui assumimos que se selectedLabs estiver vazio, enviamos array vazio.
      
      const filtrosPayload = {
        grupos: gruposArray.length > 0 ? gruposArray : [], 
        ordenar: mapSortToSql(sortField, sortDirection)
      };

      // 2. CORREÇÃO PRINCIPAL: Passar o objeto { filtros: ... }
      const response = await invoke('buscar_finalizada2', { 
        filtros: filtrosPayload 
      }) as LaboratorioResponse;

      if (response.success) {
        const validAmostras = response.data.filter(a => 
            a.analise_id !== undefined && 
            a.analise_id !== null && 
            typeof a.analise_id === 'number' &&
            a.analise_id > 0
        );

        if (validAmostras.length !== response.data.length) {
            console.warn(`AVISO: ${response.data.length - validAmostras.length} amostras descartadas.`);
        }

        setAmostras(validAmostras as AmostraFinalizadaItem[]); 
      } else {
        setError(response.message || 'Falha ao buscar dados.');
      }
    } catch (err) {
      console.error('Erro ao invocar comando Tauri:', err);
      setError('Ocorreu um erro ao se comunicar com o backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLaboratorios = async () => {
    try {
      const response = await invoke('buscar_laboratorios2') as { 
        success: boolean; 
        data: Laboratorio[];
      };
      
      if (response.success) {
        setLaboratorios(response.data);
        // Selecionar todos os laboratórios por padrão
        const todosGrupos = new Set(
          response.data.flatMap(lab => lab.grupos)
        );
        setSelectedLabs(todosGrupos);
      }
    } catch (err) {
      console.error('Erro ao buscar laboratórios:', err);
    }
  };

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);
  
  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  const toggleLabFilter = useCallback(() => {
    setShowLabFilter(prev => !prev);
  }, []);

  const handleLabToggle = useCallback((grupos: string[]) => {
    setSelectedLabs(prev => {
      const newSet = new Set(prev);
      const allSelected = grupos.every(g => newSet.has(g));
      
      if (allSelected) {
        grupos.forEach(g => newSet.delete(g));
      } else {
        grupos.forEach(g => newSet.add(g));
      }
      
      return newSet;
    });
  }, []);

const filteredAndSortedAmostras = useMemo(() => {
    let filtered = amostras;

    // Filtro por laboratório (usando datalab do backend)
    if (selectedLabs.size > 0 && selectedLabs.size < laboratorios.flatMap(l => l.grupos).length) {
      filtered = filtered.filter(amostra => {
        // Verifica se pelo menos um grupo selecionado está presente
        // Como não temos o grupo diretamente na amostra, precisamos buscar pelo laboratório
        // Por enquanto, vamos manter todas se algum lab estiver selecionado
        return true; // TODO: implementar filtro correto quando tivermos o campo grupo na amostra
      });
    }

    // Filtro por busca
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(amostra => 
        amostra.numero.toLowerCase().includes(lowerCaseSearch) ||
        (amostra.identificacao && amostra.identificacao.toLowerCase().includes(lowerCaseSearch)) ||
        amostra.fantasia.toLowerCase().includes(lowerCaseSearch) ||
        amostra.razao.toLowerCase().includes(lowerCaseSearch)
      );
    }

    // Ordenação
    const sorted = [...filtered].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      // Tratamento especial para campos de data
      if (sortField === 'dcoleta' || sortField === 'dlab' || sortField === 'dinicio' || sortField === 'dtermino') {
        aVal = aVal || '';
        bVal = bVal || '';
      }

      if (aVal === null) aVal = '';
      if (bVal === null) bVal = '';

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [amostras, searchTerm, sortField, sortDirection, selectedLabs, laboratorios]);

  // CORREÇÃO: Usar apenas IDs válidos para a seleção
  const validAnaliseIds = useMemo(() => 
    filteredAndSortedAmostras.map(a => a.analise_id)
  , [filteredAndSortedAmostras]);

  const isAllSelected = useMemo(() => {
    return validAnaliseIds.length > 0 && 
           validAnaliseIds.every(id => selectedAmostras.has(id));
  }, [validAnaliseIds, selectedAmostras]);

  const handleSelectAll = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // CORREÇÃO: Usar IDs válidos para popular o Set
      setSelectedAmostras(new Set(validAnaliseIds));
    } else {
      setSelectedAmostras(new Set());
    }
  }, [validAnaliseIds]);

  const handleSelectAmostra = useCallback((analiseId: number) => {
    setSelectedAmostras(prev => {
      const newSet = new Set(prev);
      if (newSet.has(analiseId)) {
        newSet.delete(analiseId);
      } else {
        newSet.add(analiseId);
      }
      return newSet;
    });
  }, []);

  const handleConfirmarVerificacao = async () => {
    if (selectedAmostras.size === 0) {
      alert('Selecione pelo menos uma amostra para verificar.');
      return;
    }

    const confirmar = window.confirm(
      `Confirmar verificação de ${selectedAmostras.size} amostra(s) selecionada(s)?`
    );

    if (!confirmar) return;

    setIsProcessing(true);

    try {
      const userResponse = await invoke('usuario_logado') as { id: number };
      
      const request: RevisarRequest = {
        id_usuario: userResponse.id.toString(),
        amostras_ids: Array.from(selectedAmostras)
      };

      const response = await invoke('revisar_amostras2', { request }) as RevisarResponse;

      if (response.success) {
        alert(response.message || `${response.amostras_revisadas} amostras verificadas com sucesso!`);
        setSelectedAmostras(new Set());
        fetchData();
      } else {
        alert(response.message || 'Erro ao verificar amostras.');
      }
    } catch (err) {
      console.error('Erro ao verificar amostras:', err);
      alert('Ocorreu um erro ao verificar as amostras.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBloquear = async () => {
    if (selectedAmostras.size === 0) {
      alert('Selecione pelo menos uma amostra para bloquear.');
      return;
    }

    const confirmar = window.confirm(
      `Deseja bloquear ${selectedAmostras.size} amostra(s) selecionada(s)?`
    );

    if (!confirmar) return;

    setIsProcessing(true);

    try {
      const userResponse = await invoke('usuario_logado') as { id: number };
      
      const response = await invoke('bloquear_amostras2', {
        request: {
          id_usuario: userResponse.id.toString(),
          amostras_ids: Array.from(selectedAmostras),
          bloquear: true
        }
      }) as { success: boolean; amostras_afetadas: number; message: string };

      if (response.success) {
        alert(response.message || `${response.amostras_afetadas} amostras bloqueadas!`);
        setSelectedAmostras(new Set());
        fetchData();
      } else {
        alert(response.message || 'Erro ao bloquear amostras.');
      }
    } catch (err) {
      console.error('Erro ao bloquear amostras:', err);
      alert('Ocorreu um erro ao bloquear as amostras.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePublicar = async () => {
    if (selectedAmostras.size === 0) {
      alert('Selecione pelo menos uma amostra para publicar.');
      return;
    }

    const confirmar = window.confirm(
      `Deseja publicar os resultados de ${selectedAmostras.size} amostra(s) selecionada(s)?`
    );

    if (!confirmar) return;

    setIsProcessing(true);

    try {
      const response = await invoke('publicar_resultados2', {
        request: {
          amostras_ids: Array.from(selectedAmostras)
        }
      }) as { success: boolean; resultados_publicados: number; message: string };

      if (response.success) {
        alert(response.message || `${response.resultados_publicados} resultados publicados!`);
        setSelectedAmostras(new Set());
        fetchData();
      } else {
        alert(response.message || 'Erro ao publicar resultados.');
      }
    } catch (err) {
      console.error('Erro ao publicar resultados:', err);
      alert('Ocorreu um erro ao publicar os resultados.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAmostraClick = (analiseId: number) => {
    alert(`Abrir detalhes da amostra ${analiseId}\n(Implementar navegação para MapaParametros)`);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  const renderContent = () => {
    if (isLoading) {
      return <LoadingMessage />;
    }

    if (error) {
      return <ErrorMessage error={error} />;
    }

    if (amostras.length === 0) {
      return <EmptyMessage />;
    }
    
    if (filteredAndSortedAmostras.length === 0 && searchTerm) {
      return (
        <div className="status-message empty">
          <Search className="icon" size={24} />
          <span>Nenhuma amostra encontrada para: "{searchTerm}"</span>
        </div>
      );
    }
    
    return (
      <div className="table-scroll-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '50px', textAlign: 'center' }}>
                <input 
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={isAllSelected}
                />
              </th>
              <th style={{ width: '120px', cursor: 'pointer' }} onClick={() => handleSort('numero')}>
                <div className="th-content">
                  Número <SortIcon field="numero" />
                </div>
              </th>
              <th style={{ width: '200px', cursor: 'pointer' }} onClick={() => handleSort('identificacao')}>
                <div className="th-content">
                  Identificação <SortIcon field="identificacao" />
                </div>
              </th>
              <th style={{ width: '200px' }}>Cliente</th>
              <th style={{ width: '150px', cursor: 'pointer' }} onClick={() => handleSort('dcoleta')}>
                <div className="th-content">
                  Data Coleta <SortIcon field="dcoleta" />
                </div>
              </th>
              <th style={{ width: '150px', cursor: 'pointer' }} onClick={() => handleSort('dlab')}>
                <div className="th-content">
                  Entrada Lab. <SortIcon field="dlab" />
                </div>
              </th>
              <th style={{ width: '150px', cursor: 'pointer' }} onClick={() => handleSort('dinicio')}>
                <div className="th-content">
                  Início Análises <SortIcon field="dinicio" />
                </div>
              </th>
              <th style={{ width: '150px', cursor: 'pointer' }} onClick={() => handleSort('dtermino')}>
                <div className="th-content">
                  Término <SortIcon field="dtermino" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedAmostras.map((amostra) => {
              // Garante que analiseId é um number válido
              const analiseId = amostra.analise_id;
              
              // Verificação final de segurança (para o caso de filteredAndSortedAmostras conter IDs inválidos por falha anterior)
              if (!analiseId || typeof analiseId !== 'number') {
                  return null; 
              }
              
              const identificacaoCompleta = [amostra.identificacao, amostra.complemento]
                .filter(Boolean)
                .join(' - ');
              const horaColeta = amostra.hcoleta || amostra.hcoleta_amostra || 'Não informada';
              const clienteInfo = `${amostra.fantasia} - ${amostra.razao}`;
              const tooltipText = showCliente ? clienteInfo : identificacaoCompleta;
              const isSelected = selectedAmostras.has(analiseId);
              
              return (
                <tr 
                  key={`amostra-row-${analiseId}`} // CHAVE CORRIGIDA, usando ID único
                  className={isSelected ? 'selected-row' : ''}
                >
                  <td style={{ textAlign: 'center' }}>
                    <input 
                      type="checkbox"
                      checked={isSelected}
                      // Passar o ID válido para a função de seleção
                      onChange={() => handleSelectAmostra(analiseId)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td 
                    className="clickable-cell"
                    onClick={() => handleAmostraClick(analiseId)}
                    title={tooltipText}
                  >
                    {amostra.numero}
                  </td>
                  <td title={identificacaoCompleta}>{identificacaoCompleta || 'N/A'}</td>
                  <td title={clienteInfo}>{amostra.fantasia}</td>
                  <td>
                    {amostra.dcoleta && amostra.dcoleta !== '00/00/0000' 
                      ? `${amostra.dcoleta} ${horaColeta}` 
                      : 'Não informada'}
                  </td>
                  <td>{`${amostra.dlab} ${amostra.hlab}`}</td>
                  <td>{amostra.dinicio}</td>
                  <td>{amostra.dhtermino || 'N/A'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="amostras-wrapper">
      <style>
        {`
          .amostras-wrapper {
            height: 100vh;
            display: flex;
            flex-direction: column;
            padding: 20px;
            box-sizing: border-box;
            background-color: #f7f9fc;
          }

          .amostras-container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
            font-family: 'Inter', sans-serif;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
          }

          .amostras-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 3px solid #00a789;
            padding-bottom: 15px;
            margin-bottom: 20px;
            flex-shrink: 0;
          }

          .header-left {
            display: flex;
            align-items: center;
          }

          .amostras-header-icon {
            margin-right: 12px;
            color: #00a789;
            display: flex;
          }

          .amostras-header h2 {
            margin: 0;
            color: #212529;
            font-size: 1.6rem;
            font-weight: 700;
          }

          .header-actions {
            display: flex;
            gap: 10px;
            align-items: center;
          }

          .btn-primary, .btn-secondary, .btn-warning {
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
            font-size: 0.9rem;
          }

          .btn-primary {
            background-color: #00a789;
            color: white;
          }

          .btn-primary:hover:not(:disabled) {
            background-color: #008f75;
          }

          .btn-secondary {
            background-color: #6c757d;
            color: white;
          }

          .btn-secondary:hover:not(:disabled) {
            background-color: #5a6268;
          }

          .btn-warning {
            background-color: #ffc107;
            color: #000;
          }

          .btn-warning:hover:not(:disabled) {
            background-color: #e0a800;
          }

          .btn-primary:disabled, .btn-secondary:disabled, .btn-warning:disabled {
            background-color: #ccc;
            cursor: not-allowed;
          }

          .filter-toggle {
            background-color: #e9ecef;
            color: #495057;
            border: 1px solid #ced4da;
          }

          .filter-toggle:hover {
            background-color: #dee2e6;
          }

          .filter-toggle.active {
            background-color: #00a789;
            color: white;
            border-color: #00a789;
          }

          .lab-filter-panel {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            flex-shrink: 0;
          }

          .lab-filter-title {
            font-weight: 600;
            margin-bottom: 10px;
            color: #495057;
          }

          .lab-checkboxes {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
          }

          .lab-checkbox-item {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .lab-checkbox-item input[type="checkbox"] {
            cursor: pointer;
          }

          .lab-checkbox-item label {
            cursor: pointer;
            user-select: none;
          }

          .search-bar {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
            padding: 10px 15px;
            border: 1px solid #eef2f7;
            border-radius: 8px;
            background-color: #f8f9fa;
            flex-shrink: 0;
          }
          
          .search-bar .icon {
            color: #999;
            margin-right: 10px;
            flex-shrink: 0;
          }
          
          .search-bar input {
            border: none;
            outline: none;
            flex-grow: 1;
            padding: 5px 0;
            background-color: transparent;
            font-size: 1rem;
          }

          .search-bar button {
            background: none;
            border: none;
            cursor: pointer;
            color: #999;
            padding: 0 5px;
          }

          .table-scroll-container {
            flex-grow: 1;
            overflow-y: auto;
            overflow-x: hidden;
            border: 1px solid #eef2f7;
            border-radius: 8px;
            min-height: 0;
          }

          .data-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          .data-table thead {
            position: sticky;
            top: 0;
            z-index: 10;
            background-color: #e6fff7;
          }

          .data-table th,
          .data-table td {
            padding: 14px 18px;
            text-align: left;
            border-bottom: 1px solid #f0f4f7;
            color: #495057;
            font-size: 0.95rem;
            word-wrap: break-word;
          }
          
          .data-table thead th {
            color: #00796b;
            font-weight: 600;
            font-size: 1rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #00a789;
          }

          .th-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 5px;
          }

          .data-table tbody tr:hover {
            background-color: #f7fcfb;
          }

          .selected-row {
            background-color: #e6fff7 !important;
          }

          .clickable-cell {
            cursor: pointer;
            color: #00a789;
            font-weight: 600;
          }

          .clickable-cell:hover {
            text-decoration: underline;
          }

          .data-table tbody tr:last-child td {
            border-bottom: none;
          }
          
          .status-message {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 50px 20px;
            font-size: 1.1rem;
            font-weight: 500;
            border-radius: 8px;
            margin-top: 10px;
            flex-grow: 1;
          }
          
          .status-message span {
            margin-top: 15px;
            text-align: center;
          }

          .status-message .icon {
            margin-bottom: 10px;
          }

          .loading {
            color: #007bff;
          }

          .error {
            color: #dc3545;
            background-color: #fceae9;
            border: 1px solid #dc3545;
          }

          .empty {
            color: #6c757d;
            background-color: #f8f9fa;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .loading .spin {
            animation: spin 1.5s linear infinite;
          }

          .info-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85rem;
            font-weight: 600;
            background-color: #e7f3ff;
            color: #0066cc;
            margin-left: 10px;
          }
        `}
      </style>

      <div className="amostras-container">
        <div className="amostras-header">
          <div className="header-left">
            <span className="amostras-header-icon">
              <CheckCircle2 size={32} />
            </span>
            <h2>Amostras Finalizadas</h2>
            {showCliente && (
              <span className="info-badge">Modo Cliente (Alt+C)</span>
            )}
          </div>
          <div className="header-actions">
            <button 
              className={`btn-primary filter-toggle ${showLabFilter ? 'active' : ''}`}
              onClick={toggleLabFilter}
            >
              <Eye size={18} />
              Filtros
            </button>
            <button 
              className="btn-warning"
              onClick={handleBloquear}
              disabled={selectedAmostras.size === 0 || isProcessing}
            >
              <Lock size={18} />
              Bloquear ({selectedAmostras.size})
            </button>
            <button 
              className="btn-secondary"
              onClick={handlePublicar}
              disabled={selectedAmostras.size === 0 || isProcessing}
            >
              <Upload size={18} />
              Publicar ({selectedAmostras.size})
            </button>
            <button 
              className="btn-primary"
              onClick={handleConfirmarVerificacao}
              disabled={selectedAmostras.size === 0 || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="spin" size={18} />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Verificar ({selectedAmostras.size})
                </>
              )}
            </button>
          </div>
        </div>

        {showLabFilter && (
          <div className="lab-filter-panel">
            <div className="lab-filter-title">Filtrar por Laboratório:</div>
            <div className="lab-checkboxes">
              {laboratorios.map((lab) => (
                <div key={`lab-filter-${lab.id}`} className="lab-checkbox-item">
                  <input 
                    type="checkbox"
                    id={`lab-${lab.id}`}
                    checked={lab.grupos.every(g => selectedLabs.has(g))}
                    onChange={() => handleLabToggle(lab.grupos)}
                  />
                  <label htmlFor={`lab-${lab.id}`} title={lab.grupos.join(', ')}>
                    {lab.nome}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="search-bar">
          <Search className="icon" size={20} />
          <input
            type="text"
            placeholder="Buscar por número, identificação ou cliente..."
            value={searchTerm}
            onChange={handleSearchChange}
            aria-label="Campo de pesquisa da tabela"
          />
          {searchTerm && (
            <button 
              onClick={clearSearch}
              title="Limpar pesquisa"
              aria-label="Limpar pesquisa"
            >
              <X size={20} />
            </button>
          )}
        </div>
        
        {renderContent()}
      </div>
    </div>
  );
};

export default AmostrasFinalizadasView;