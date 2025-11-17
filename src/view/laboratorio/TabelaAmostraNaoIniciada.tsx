import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { 
  FlaskConical,    // Ícone principal
  Loader2,         // Carregando
  AlertTriangle,   // Erro
  PackageOpen,     // Vazio
  Search,          // Busca
  X,               // Limpar busca
  ExternalLink     // Ação de abrir
} from 'lucide-react';

// Assumindo o caminho do WindowManager baseado em Laboratorio.tsx
// CERTIFIQUE-SE DE QUE ESTE CAMINHO ESTÁ CORRETO NO SEU PROJETO
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

interface AmostraNaoIniciadaItem {
  id: number;
  numero: string | null;
  identificacao: string | null;
  fantasia: string | null;
  razao: string | null;
}

interface LaboratorioResponse {
  success: boolean;
  data: unknown;
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

const EmptyMessage = () => (
    <div className="status-message empty">
      <PackageOpen className="icon" size={24} />
      <span>Nenhuma amostra não iniciada encontrada.</span>
    </div>
);

// --- Componente Principal ---

export const AmostrasNaoIniciadasView: React.FC = () => {
  const [amostras, setAmostras] = useState<AmostraNaoIniciadaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Novo estado para a barra de busca
  const [searchTerm, setSearchTerm] = useState('');

  // Hook para buscar os dados
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = (await invoke('buscar_nao_iniciada')) as LaboratorioResponse;

        if (response.success) {
          setAmostras(response.data as AmostraNaoIniciadaItem[]);
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
      (amostra.razao && amostra.razao.toLowerCase().includes(lowerCaseSearch))
    );
  }, [amostras, searchTerm]);


  // --- Lógica de Clique na Linha (Abertura da Janela) ---
  const handleRowClick = useCallback(async (item: AmostraNaoIniciadaItem) => {
    try {
        // 1. Busca o ID do usuário logado (usando a mesma lógica do Laboratorio.tsx)
        const userResponse = await invoke('usuario_logado') as Usuario;

        if (!userResponse || !userResponse.id) {
            console.error("Erro: ID do usuário logado não encontrado.");
            alert("Não foi possível identificar o usuário logado para iniciar a análise.");
            return;
        }

        const idUsuario = userResponse.id; 
        
        // 2. Abre a janela de detalhes da amostra
        // O nome da função WindowManager.openAmostrasNaoIniciadas foi copiado do Laboratorio.tsx
        WindowManager.openAmostrasNaoIniciadas({ 
            idAnalise: item.id,
            idUsuario: idUsuario 
        });

    } catch (error) {
        console.error("Erro ao buscar usuário logado ou abrir janela:", error);
        alert("Erro ao iniciar a análise. Tente novamente.");
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
    
    // Se o filtro não retornar resultados
    if (filteredAmostras.length === 0 && searchTerm) {
         return (
            <div className="status-message empty">
              <Search className="icon" size={24} />
              <span>Nenhuma amostra encontrada para: "{searchTerm}"</span>
            </div>
         );
    }
    
    // Tabela com Scroll Vertical
    return (
      <div className="table-scroll-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '10%' }}>ID</th>
              <th style={{ width: '15%' }}>Número</th>
              <th style={{ width: '25%' }}>Identificação</th>
              <th style={{ width: '25%' }}>Cliente (Fantasia)</th>
              <th style={{ width: '25%' }}>Razão Social</th>
              <th style={{ width: '80px', textAlign: 'center' }}>Ver</th> 
            </tr>
          </thead>
          <tbody>
            {filteredAmostras.map((amostra) => (
              <tr 
                key={amostra.id} 
                className="clickable-row"
                onClick={() => handleRowClick(amostra)} // Adiciona a ação de clique na linha
                title={`Clique para iniciar análise da amostra #${amostra.numero}`}
              >
                <td>{amostra.id}</td>
                <td>{amostra.numero || 'N/A'}</td>
                <td>{amostra.identificacao || 'N/A'}</td>
                <td>{amostra.fantasia || 'N/A'}</td>
                <td>{amostra.razao || 'N/A'}</td>
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
    // Usa uma div wrapper que preenche a altura da tela (vh)
    <div className="amostras-wrapper"> 
      {/* Estilos CSS embutidos (Aprimorados) */}
      <style>
        {`
          .amostras-wrapper {
            height: 100vh; /* Ocupa a altura total da viewport (tela) */
            display: flex;
            flex-direction: column;
            padding: 20px;
            box-sizing: border-box;
            background-color: #f7f9fc; /* Fundo levemente cinza */
          }

          .amostras-container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
            font-family: 'Inter', sans-serif;
            flex-grow: 1; /* Faz o container crescer para preencher o espaço restante */
            display: flex;
            flex-direction: column;
            min-height: 0; /* Importante para flex-grow funcionar corretamente com rolagem */
          }

          .amostras-header {
            display: flex;
            align-items: center;
            border-bottom: 3px solid #00a789;
            padding-bottom: 15px;
            margin-bottom: 20px;
            flex-shrink: 0; /* Não permite o header encolher */
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

          /* --- Barra de Busca --- */
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

          /* --- Tabela e Scroll --- */

          .table-scroll-container {
            flex-grow: 1; /* Faz o container da tabela ocupar o espaço restante */
            overflow-y: auto; /* Habilita a rolagem vertical */
            overflow-x: hidden;
            border: 1px solid #eef2f7;
            border-radius: 8px;
            min-height: 0; /* Permite a rolagem interna */
          }

          .data-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          .data-table thead {
            position: sticky; /* Fixa o cabeçalho no topo da rolagem */
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
            word-wrap: break-word; /* Evita que o texto quebre o layout */
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
            background-color: #f7fcfb; /* Hover mais claro */
          }

          .data-table tbody tr:last-child td {
            border-bottom: none;
          }
          
          /* Estilos para Mensagens de Estado */
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
          
          /* Animação de rotação para o Loader */
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
          <h2>Amostras Não Iniciadas</h2>
        </div>
        
        {/* Barra de Busca */}
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
        
        {/* O conteúdo (tabela, loading, erro) é renderizado aqui */}
        {renderContent()}
      </div>
    </div>
  );
};

export default AmostrasNaoIniciadasView;