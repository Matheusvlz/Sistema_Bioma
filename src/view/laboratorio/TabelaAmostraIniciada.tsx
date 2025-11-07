import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { 
  FlaskConical,    // Ícone principal
  Loader2,         // Carregando
  AlertTriangle,   // Erro
  PackageOpen,     // Vazio
  Search,          // Busca
  X,               // Limpar busca
  ExternalLink,    // Ação de abrir
  Clock,           // Ícone para Tempo
  CheckCircle,     // Ícone para Passou (OK)
  XCircle          // Ícone para Passou (Fora)
} from 'lucide-react';

// Assumindo o caminho do WindowManager 
import { WindowManager } from '../../hooks/WindowManager'; 

// --- Tipos de Dados ---

// Definição da interface do Usuário (necessária para abrir a janela)
interface Usuario {
  success: boolean;
  id: number;
  nome: string;
  privilegio: string;
  empresa?: string;
  ativo: boolean;
  nome_completo: string;
  cargo: string;
  numero_doc: string;
  profile_photo?: string; 
  dark_mode: boolean;
}

// CORRIGIDO: Interface baseada em AmostraEmAnaliseItem do laboratorio_controller.rs
interface AmostraEmAnaliseItem {
  id: number;
  numero: string | null;
  identificacao: string | null;
  fantasia: string | null;
  razao: string | null;
  tempo: string | null; // Novo campo
  passou: boolean;      // Novo campo
}

// Interface da resposta do backend
interface LaboratorioResponse {
  success: boolean;
  data: unknown; // O controller envia como serde_json::Value
  message: string | null;
  tipo: string;
}

// --- Componentes de Status ---

const LoadingMessage = () => (
    <div className="status-message loading">
      <Loader2 className="icon spin" size={24} />
      <span>Carregando amostras...</span>
    </div>
);

const ErrorMessage = ({ error }: { error: string | null }) => (
    <div className="status-message error">
      <AlertTriangle className="icon" size={24} />
      <span>{error || 'Ocorreu um erro ao buscar dados.'}</span>
    </div>
);

// CORRIGIDO: Texto para "Em Análise"
const EmptyMessage = () => (
    <div className="status-message empty">
      <PackageOpen className="icon" size={24} />
      <span>Nenhuma amostra em análise encontrada.</span>
    </div>
);

// --- Componente Principal ---

// CORRIGIDO: Nome do componente
export const AmostrasEmAnaliseView: React.FC = () => {
  // CORRIGIDO: Tipo do estado
  const [amostras, setAmostras] = useState<AmostraEmAnaliseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Hook para buscar os dados
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // CORRIGIDO: Chamada para 'buscar_em_analise'
        const response = (await invoke('buscar_em_analise')) as LaboratorioResponse;

        if (response.success) {
          // CORRIGIDO: Cast para o tipo correto
          // O controller envia 'data' como 'Option<serde_json::Value>'
          // Assumimos que o 'Value' é o array de AmostraEmAnaliseItem
          setAmostras(response.data as AmostraEmAnaliseItem[]);
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

    fetchData();
  }, []);

  // --- Lógica de Busca ---
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);
  
  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  // Filtra as amostras com base no termo de busca (Memoizado para performance)
  const filteredAmostras = useMemo(() => {
    if (!searchTerm) return amostras;

    const lowerCaseSearch = searchTerm.toLowerCase();

    return amostras.filter(amostra => 
      (amostra.numero && amostra.numero.toLowerCase().includes(lowerCaseSearch)) ||
      (amostra.identificacao && amostra.identificacao.toLowerCase().includes(lowerCaseSearch)) ||
      (amostra.fantasia && amostra.fantasia.toLowerCase().includes(lowerCaseSearch)) ||
      (amostra.razao && amostra.razao.toLowerCase().includes(lowerCaseSearch)) ||
      // CORRIGIDO: Adicionado campo 'tempo' na busca
      (amostra.tempo && amostra.tempo.toLowerCase().includes(lowerCaseSearch))
    );
  }, [amostras, searchTerm]);


  // --- Lógica de Clique na Linha (Abertura da Janela) ---
  // Mantida a lógica de abrir a tela de resultados, pois a amostra já está em análise
  const handleRowClick = useCallback(async (item: AmostraEmAnaliseItem) => {
    try {
        // 1. Busca o ID do usuário logado
        const userResponse = await invoke('usuario_logado') as Usuario;

        if (!userResponse || !userResponse.id) {
            console.error("Erro: ID do usuário logado não encontrado.");
            alert("Não foi possível identificar o usuário logado para ver os resultados.");
            return;
        }

        const idUsuario = userResponse.id; 
        
        // 2. Abre a janela de resultados da amostra
        // (Assumindo que esta é a função correta no WindowManager)
        WindowManager.openAmostrasNaoIniciadas({ 
            idAnalise: item.id,
            idUsuario: idUsuario 
        });

    } catch (error) {
        console.error("Erro ao buscar usuário logado ou abrir janela:", error);
        alert("Erro ao abrir detalhes da análise. Tente novamente.");
    }
  }, []);


  // --- Renderização Condicional do Conteúdo (Tabela, Loading, Erro) ---

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
    
    if (filteredAmostras.length === 0 && searchTerm) {
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
          {/* CORRIGIDO: Cabeçalho da tabela com novos campos */}
          <thead>
            <tr>
              <th style={{ width: '8%' }}>ID</th>
              <th style={{ width: '12%' }}>Número</th>
              <th style={{ width: '25%' }}>Identificação</th>
              <th style={{ width: '20%' }}>Cliente</th>
              <th style={{ width: '15%' }}>Tempo</th>
              <th style={{ width: '12%', textAlign: 'center' }}>Status</th>
              <th style={{ width: '8%', textAlign: 'center' }}>Ver</th> 
            </tr>
          </thead>
          <tbody>
            {filteredAmostras.map((amostra) => (
              <tr 
                key={amostra.id} 
                className="clickable-row"
                onClick={() => handleRowClick(amostra)}
                title={`Clique para ver resultados da amostra #${amostra.numero}`}
              >
                <td>{amostra.id}</td>
                <td>{amostra.numero || 'N/A'}</td>
                <td>{amostra.identificacao || 'N/A'}</td>
                <td>{amostra.fantasia || amostra.razao || 'N/A'}</td>
                
                {/* CORRIGIDO: Coluna de Tempo */}
                <td style={{ display: 'flex', alignItems: 'center' }}>
                  <Clock size={16} style={{ marginRight: '8px', color: '#6c757d' }} />
                  {amostra.tempo || 'N/A'}
                </td>
                
                {/* CORRIGIDO: Coluna de Status (passou) */}
                <td style={{ textAlign: 'center' }}>
                  {amostra.passou ? (
                    <CheckCircle size={18} color="#00a789" title="Dentro do prazo" />
                  ) : (
                    <XCircle size={18} color="#dc3545" title="Fora do prazo" />
                  )}
                </td>
                
                <td style={{ textAlign: 'center' }}>
                    <ExternalLink size={18} color="#00a789" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="amostras-wrapper"> 
      
      {/* Estilos CSS (Idênticos ao TabelaAmostraNaoIniciada.tsx) */}
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
            border-bottom: 3px solid #00a789;
            padding-bottom: 15px;
            margin-bottom: 20px;
            flex-shrink: 0;
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

          .clickable-row {
            cursor: pointer;
          }
          
          .clickable-row:hover {
            background-color: #f7fcfb;
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

          .loading { color: #007bff; }
          .error { color: #dc3545; background-color: #fceae9; border: 1px solid #dc3545; }
          .empty { color: #6c757d; background-color: #f8f9fa; }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .loading .spin {
            animation: spin 1.5s linear infinite;
          }
        `}
      </style>

      {/* Estrutura principal do componente */}
      <div className="amostras-container">
        <div className="amostras-header">
          <span className="amostras-header-icon">
            <FlaskConical size={32} />
          </span>
          {/* CORRIGIDO: Título */}
          <h2>Amostras em Análise</h2>
        </div>
        
        <div className="search-bar">
            <Search className="icon" size={20} />
            <input
                type="text"
                placeholder="Buscar por número, identificação, cliente ou tempo..."
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

// CORRIGIDO: Export
export default AmostrasEmAnaliseView;