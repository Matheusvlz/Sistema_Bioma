import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Calendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

import './styles/inicio_style.css';
import { invoke } from "@tauri-apps/api/core";
import { CustomSelect, OptionType } from '../components/CustomSelect';

// Import partial screens - their props will now be more specific
import { ColetaScreen } from './partial_inicio/Case_Coleta';
import { AtendimentoScreen } from './partial_inicio/Case_Atendimento';

import { MBScreen } from './partial_inicio/Case_MB';
import { FQScreen } from './partial_inicio/Case_FQ';
import { X9Screen } from './partial_inicio/Case_X9';
import { FinanceiroScreen } from './partial_inicio/Case_Financeiro';

import {
  AlertTriangle,
  CheckCircle, // Manter se for usado em ProjectItem ou outro lugar
  Clock,
  Calendar as CalendarIcon,
  Flag,
  Users,
} from 'lucide-react';


type CalendarValue = Date | null;

export interface Projeto {
  id: number;
  nome: string;
  responsavel: string;
  status: 'concluido' | 'andamento' | 'planejamento';
  prioridade: 'alta' | 'media' | 'baixa';
  dataEntrega: string;
  progresso: number;
  atencoes: number;
}

export interface KanbanCardData { // <-- Mantenha esta interface, ela já está no seu código
  id: number
  urgencia: number;
  card_type: string;
  title: string;
  description?: string;
  user_id?: number;
  user_photo_url?: string;
  tags: string;
  card_color?: string;
}

export interface MicrobiologiaPendenteItem {
  id: number;
  numero?: string;
  identificacao?: string;
  tempo?: string;
  passou: boolean;
  fantasia?: string;
  razao?: string;
}

export interface MicrobiologiaLiberacaoPendenteItem {
  id: number;
  numero?: string;
  identificacao?: string;
  fantasia?: string;
  razao?: string;
}

export interface MBResponse {
  pendencias_prazo: MicrobiologiaPendenteItem[];
  total_pendencias_prazo: number;
  pendencias_liberacao: MicrobiologiaLiberacaoPendenteItem[];
  total_pendencias_liberacao: number;
}

export interface FisicoQuimicoPendente {
  id: number;
  numero?: string;
  identificacao?: string;
  tempo?: string;
  passou: boolean;
  fantasia?: string;
  razao?: string;
}

export interface FisicoQuimicoLiberacao {
  id: number;
  numero?: string;
  identificacao?: string;
  fantasia?: string;
  razao?: string;
}

export interface UsuarioAtivoComTelas {
  id: number;
  nome: string;
  privilegio?: string; // Optional if it can be null in the DB
  empresa?: number; // Optional if it can be null in the DB
  ativo: boolean;
  nome_completo?: string;
  cargo?: string;
  numero_doc?: string;
  profile_photo_path?: string;
  dark_mode: boolean;
  cor?: string;
  telas_acesso: TelaPermitida[];
}

export interface X9Response {
  usuarios_ativos_com_telas: UsuarioAtivoComTelas[];
  total_usuarios_ativos: number;
  kanban_cards: KanbanCardData[]; // <-- Adicione esta linha
}
export interface FQResponse {
  pendencias_prazo: FisicoQuimicoPendente[];
  total_pendencias_prazo: number;
  pendencias_liberacao: FisicoQuimicoLiberacao[];
  total_pendencias_liberacao: number;
}
export interface UnpaidBoletoNF {
  id_boleto: number;
  nome_cliente?: string;
  descricao_boleto?: string;
  valor_boleto?: string; // Use string for BigDecimal to handle arbitrary precision
  data_vencimento_boleto?: string; // Use string for NaiveDate (YYYY-MM-DD)

  id_boleto_nf?: number;
  nf_numero?: string;
  data_emissao_nf?: string; // Use string for NaiveDate
  data_vencimento_nf?: string; // Use string for NaiveDate
  nf_pago?: boolean;
  boleto_nf_caminho?: string;
}

export interface FinanceiroResponse {
  boletos_vencidos: UnpaidBoletoNF[];
  boletos_vencem_hoje: UnpaidBoletoNF[];
  boletos_vencem_este_mes: UnpaidBoletoNF[];
  total_itens_nao_pagos: number;
}

export interface TelaPermitida {
  id: number;
  nome: string;
}

export interface AgendamentoComCliente {
  descricao?: string;
  data?: string;
  hora?: string;
  recibo_gerado?: boolean;
  recibo_assinado?: boolean;
  cliente_nome?: string;
  cliente_cod?: number;
}

export interface ColetaResponse {
  total_agendamentos: number;
  total_recibos_gerados: number;
  agendamentos: AgendamentoComCliente[];
}

export interface AtendimentoItem {
  id: number;
  numero?: number;
  prefixo?: string;
  data_coleta?: string;
  cliente?: string;
}

// Ensure AllResponseData can handle a message string
export type AllResponseData = ColetaResponse | AtendimentoItem[] | MBResponse | FQResponse | X9Response | FinanceiroResponse | string;

export interface RespostaTela<T> {
  telas: TelaPermitida[];
  dados: T;
  // Make sure this matches the backend's serialized name (camelCase)
  firstScreenName?: string;
}

// --- Component Props for shared components ---

export interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  gradient: string;
  borderColor: string;
  textColor: string;
}

export interface ProjectItemProps {
  projeto: Projeto;
  // Se você realmente precisa de estilos customizados para ProjectItem, adicione aqui:
  // style?: React.CSSProperties;
}

interface CalendarTileContentProps {
  date: Date;
  datasEntrega: string[];
}

interface ProximasEntregasProps {
  projetos: Projeto[];
}

// --- Constantes para Estilos e Cores ---
const CORES = {
  prioridade: {
    alta: '#ef4444',
    media: '#f59e0b',
    baixa: '#22c55e',
  },
  status: {
    concluido: { bg: '#dcfce7', color: '#166534', text: 'Concluído' },
    andamento: { bg: '#dbeafe', color: '#1e40af', text: 'Em Andamento' },
    planejamento: { bg: '#f3f4f6', color: '#374151', text: 'Planejamento' }
  }
} as const;

// --- Exported Common Components (StatCard, ProjectItem) ---

export const StatCard = memo<StatCardProps>(({ icon, title, value, gradient, borderColor, textColor }) => (
  <div
    className="stat-card"
    style={{
      background: gradient,
      borderRadius: '16px',
      padding: '1.5rem',
      textAlign: 'center',
      cursor: 'pointer',
      boxShadow: '0 10px 25px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.03)',
      border: `1px solid ${borderColor}`,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
      {icon}
    </div>
    <h4 style={{ color: textColor, marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
      {title}
    </h4>
    <p style={{ fontSize: '2.2rem', fontWeight: '700', color: textColor, margin: 0 }}>
      {value}
    </p>
  </div>
));
StatCard.displayName = 'StatCard';

export const ProjectItem = memo<ProjectItemProps>(({ projeto }) => {
  const formatarData = useCallback((data: string): string => {
    return new Date(data).toLocaleDateString('pt-BR');
  }, []);

  const getStatusIcon = useCallback((status: Projeto['status']): React.ReactNode => {
    switch (status) {
      case 'concluido': return <CheckCircle size={16} color="#22c55e" />;
      case 'andamento': return <Clock size={16} color="#3b82f6" />;
      default: return <Flag size={16} color="#6b7280" />;
    }
  }, []);

  const getStatusBadge = useCallback((status: Projeto['status']): React.ReactNode => {
    const style = CORES.status[status];
    return (
      <span style={{
        backgroundColor: style.bg,
        color: style.color,
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '500'
      }}>
        {style.text}
      </span>
    );
  }, []);

  return (
    <div className="project-item" style={{ marginBottom: '1rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <strong style={{ color: '#111827', fontSize: '1.1rem' }}>{projeto.nome}</strong>
            {getStatusBadge(projeto.status)}
          </div>
          <div style={{
            fontSize: '0.9rem',
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Users size={14} />
            {projeto.responsavel}
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${projeto.progresso}%` }}
            />
          </div>
          <div style={{
            fontSize: '0.8rem',
            color: '#22c55e',
            fontWeight: '500',
            marginTop: '0.25rem'
          }}>
            {projeto.progresso}% concluído
          </div>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '0.5rem',
          marginLeft: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {getStatusIcon(projeto.status)}
            <span style={{ fontSize: '0.875rem', color: '#4b5563', fontWeight: '500' }}>
              {formatarData(projeto.dataEntrega)}
            </span>
          </div>
          {projeto.atencoes > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              backgroundColor: '#fef3c7',
              padding: '0.25rem 0.5rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: '#92400e'
            }}>
              <AlertTriangle size={12} />
              {projeto.atencoes} atenção{projeto.atencoes > 1 ? 'ões' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
ProjectItem.displayName = 'ProjectItem';

const CalendarTileContent = memo<CalendarTileContentProps>(({ date, datasEntrega }) => {
  const isEntregaDate = datasEntrega.includes(date.toDateString());
  if (!isEntregaDate) return null;
  return (
    <div style={{
      position: 'absolute',
      bottom: '2px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '6px',
      height: '6px',
      backgroundColor: '#22c55e',
      borderRadius: '50%',
      boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.8)'
    }} />
  );
});
CalendarTileContent.displayName = 'CalendarTileContent';

const ProximasEntregas = memo<ProximasEntregasProps>(({ projetos }) => {
  const proximasEntregas = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return projetos
      .filter(p => {
        const dataEntrega = new Date(p.dataEntrega);
        dataEntrega.setHours(0, 0, 0, 0);
        return dataEntrega >= hoje;
      })
      .sort((a, b) => new Date(a.dataEntrega).getTime() - new Date(b.dataEntrega).getTime())
      .slice(0, 3);
  }, [projetos]);

  const getPrioridadeColor = useCallback((prioridade: Projeto['prioridade']): string => {
    return CORES.prioridade[prioridade];
  }, []);

  const formatarData = useCallback((data: string): string => {
    return new Date(data).toLocaleDateString('pt-BR');
  }, []);

  if (proximasEntregas.length === 0) {
    return (
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        background: 'rgba(255, 255, 255, 0.8)',
        borderRadius: '12px',
        border: '1px solid rgba(34, 197, 94, 0.2)',
        textAlign: 'center'
      }}>
        <h4 style={{
          marginBottom: '1rem',
          color: '#166534',
          fontSize: '1.1rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          justifyContent: 'center'
        }}>
          <Clock size={18} />
          Próximas Entregas
        </h4>
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
          Nenhuma entrega programada
        </p>
      </div>
    );
  }

  return (
    <div style={{
      marginTop: '2rem',
      padding: '1.5rem',
      background: 'rgba(255, 255, 255, 0.8)',
      borderRadius: '12px',
      border: '1px solid rgba(34, 197, 94, 0.2)'
    }}>
      <h4 style={{
        marginBottom: '1rem',
        color: '#166534',
        fontSize: '1.1rem',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Clock size={18} />
        Próximas Entregas
      </h4>

      {proximasEntregas.map(projeto => (
        <div key={projeto.id} style={{
          fontSize: '0.9rem',
          color: '#374151',
          marginBottom: '0.75rem',
          padding: '0.75rem',
          background: 'rgba(34, 197, 94, 0.05)',
          borderRadius: '8px',
          border: '1px solid rgba(34, 197, 94, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: getPrioridadeColor(projeto.prioridade),
            borderRadius: '50%',
            flexShrink: 0
          }} />
          <div>
            <div style={{ fontWeight: '600', color: '#166534' }}>
              {formatarData(projeto.dataEntrega)}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
              {projeto.nome}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});
ProximasEntregas.displayName = 'ProximasEntregas';


export const Inicio: React.FC = () => {
  // Removido setDataSelecionada pois não está sendo utilizado
  const [dataSelecionada] = useState<CalendarValue>(new Date());
  // The main response data from the backend, which now holds the currently active screen's data
  const [currentScreenResponse, setCurrentScreenResponse] = useState<RespostaTela<AllResponseData> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // This state holds the name of the currently displayed screen (e.g., "COLETA", "ATENDIMENTO")
  const [activeScreenName, setActiveScreenName] = useState<string | null>(null);
  // Removido selectedTelaOption pois não está sendo utilizado diretamente após a seleção
  const [, setSelectedTelaOption] = useState<OptionType | null>(null);

  const projetosParaCalendarioEProximasEntregas: Projeto[] = useMemo(() => {
    // This array is for calendar/deliveries. It remains static here as per previous discussion,
    // but in a real app, you might fetch relevant projects for this section.
    return [
      { id: 1, nome: 'Sistema de Gestão', responsavel: 'Ana Silva', status: 'andamento', prioridade: 'alta', dataEntrega: '2025-07-15', progresso: 75, atencoes: 2 },
      { id: 2, nome: 'App Mobile', responsavel: 'João Santos', status: 'concluido', prioridade: 'media', dataEntrega: '2025-06-20', progresso: 100, atencoes: 0 },
      { id: 3, nome: 'Website Corporativo', responsavel: 'Maria Costa', status: 'andamento', prioridade: 'alta', dataEntrega: '2025-08-01', progresso: 45, atencoes: 1 },
      { id: 4, nome: 'API de Integração', responsavel: 'Pedro Oliveira', status: 'planejamento', prioridade: 'baixa', dataEntrega: '2025-09-15', progresso: 15, atencoes: 0 }
    ];
  }, []);

  const datasEntrega = useMemo(() =>
    projetosParaCalendarioEProximasEntregas.map(p => new Date(p.dataEntrega).toDateString()),
    [projetosParaCalendarioEProximasEntregas]
  );

  // This `telasPermitidas` will come from the initial `get_data_inicio` call
  const telasPermitidas: TelaPermitida[] = useMemo(() => {
    return currentScreenResponse?.telas || [];
  }, [currentScreenResponse]);

  const telasOptions: OptionType[] = useMemo(() =>
    telasPermitidas.map(tela => ({
      id: tela.id,
      label: tela.nome
    })),
    [telasPermitidas]
  );

  // --- Initial Data Fetch (on component mount) ---
  useEffect(() => {
    let mounted = true;

    const fetchInitialData = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        // Call the "get_data_inicio" command to get initial data and allowed screens
        const result = await invoke<RespostaTela<AllResponseData>>("get_data_inicio");

        if (mounted) {
          // Correctly map `first_screen_name` from backend (Rust) to `firstScreenName` (JS/TS)
          const adjustedResult = {
              ...result,
          };
          setCurrentScreenResponse(adjustedResult); // Store the entire response

          if (adjustedResult.firstScreenName) { // Use adjusted property
            setActiveScreenName(adjustedResult.firstScreenName);
            // Set the initial selected option for the CustomSelect
            const initialOption = adjustedResult.telas.find(t => t.nome === adjustedResult.firstScreenName);
            if (initialOption) {
              setSelectedTelaOption({ id: initialOption.id, label: initialOption.nome });
            }
          } else if (adjustedResult.telas.length > 0) {
            // If backend doesn't provide firstScreenName, default to the first available
            setActiveScreenName(adjustedResult.telas[0].nome);
            setSelectedTelaOption({ id: adjustedResult.telas[0].id, label: adjustedResult.telas[0].nome });
          }
          console.log("Initial data from backend:", adjustedResult);
        }
      } catch (err: any) {
        console.error("Error fetching initial data:", err);
        if (mounted) {
          setCurrentScreenResponse(null);
          setError(`Falha ao carregar dados: ${err.message || String(err)}`);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchInitialData();

    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array means this runs once on mount

  // --- Handle Tela Selection from ComboBox ---
  const handleSelectTela = useCallback(async (selectedOption: OptionType): Promise<void> => {
    console.log("Tela selecionada:", selectedOption);
    setActiveScreenName(selectedOption.label); // Update the active screen name immediately
    setSelectedTelaOption(selectedOption); // Update the selected option in the combobox

    try {
      setLoading(true); // Indicate loading for the new screen's data
      setError(null);

      // Call the new Tauri command to fetch data for the specific selected screen
      const result = await invoke<RespostaTela<AllResponseData>>("get_data_for_screen", { screenName: selectedOption.label });

      // Update only the `dados` and `firstScreenName` (which will be `currentScreenName` from Rust)
      // while keeping the original `telas` list from the initial fetch.
      // This ensures the dropdown options don't disappear.
      setCurrentScreenResponse(prev => {
        if (prev) {
          return {
            ...prev,
            dados: result.dados, // Update the data payload
            // Use result.first_screen_name if it exists, otherwise fall back to selectedOption.label
            firstScreenName:  selectedOption.label
          };
        }
        return result; // Fallback if prev is null (shouldn't happen if initial fetch worked)
      });

      console.log(`Data for screen ${selectedOption.label}:`, result);

    } catch (err: any) {
      console.error(`Error fetching data for ${selectedOption.label}:`, err);
      setError(`Failed to load data for ${selectedOption.label}: ${err.message || String(err)}`);
      // Optionally, revert to previous data or clear it on error
      setCurrentScreenResponse(prev => prev ? { ...prev, dados: "Erro ao carregar dados." as AllResponseData } : null);
    } finally {
      setLoading(false);
    }
  }, []);

  const tileContent = useCallback(({ date }: { date: Date }): React.ReactNode => (
    <CalendarTileContent date={date} datasEntrega={datasEntrega} />
  ), [datasEntrega]);

  const containerStyle = useMemo((): React.CSSProperties => ({
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '2rem',
    maxWidth: '1400px',
    margin: '0 auto',
    paddingBottom: '2rem'
  }), []);

  const renderScreenContent = () => {
    const currentScreenData = currentScreenResponse?.dados;

    // Show a loading message or spinner if data is being fetched for the current screen
    if (loading && currentScreenData === undefined) { // Check for undefined to distinguish initial load vs subsequent loads
        return <p>Carregando dados do módulo...</p>;
    }

    if (error) {
        return <p style={{ color: 'red' }}>Erro ao carregar dados: {error}</p>;
    }

   switch (activeScreenName) {
      case "COLETA":
        if (typeof currentScreenData !== 'string' && !Array.isArray(currentScreenData) && currentScreenData !== undefined) {
          return <ColetaScreen coleta={currentScreenData as ColetaResponse} />;
        }
        return <p>Dados de Coleta indisponíveis ou no formato incorreto.</p>;
      case "ATENDIMENTO":
        if (Array.isArray(currentScreenData)) {
          return <AtendimentoScreen atendimentos={currentScreenData as AtendimentoItem[]} />;
        }
        return <p>Dados de Atendimento indisponíveis ou no formato incorreto.</p>;
      case "MB":
        if (typeof currentScreenData === 'object' && currentScreenData && 'total_pendencias_prazo' in currentScreenData) {
          return <MBScreen mb={currentScreenData as MBResponse} />;
        }
        return <p>Dados de MB indisponíveis ou no formato incorreto.</p>;
      case "FQ":
        if (typeof currentScreenData === 'object' && currentScreenData && 'total_pendencias_prazo' in currentScreenData) {
          return <FQScreen fq={currentScreenData as FQResponse} />;
        }
        return <p>Dados de Físico-Químico indisponíveis ou no formato incorreto.</p>; // Corrected message
      case "FINANCEIRO":
          if (typeof currentScreenData === 'object' && currentScreenData && 'boletos_vencidos' in currentScreenData && 'total_itens_nao_pagos' in currentScreenData) {
        return <FinanceiroScreen financeiro={currentScreenData as FinanceiroResponse} />;
      }
      return <p>Dados Financeiros indisponíveis ou no formato incorreto.</p>;
      case "X9": // <-- ADD THIS NEW CASE
        if (typeof currentScreenData === 'object' && currentScreenData && 'usuarios_ativos_com_telas' in currentScreenData && 'total_usuarios_ativos' in currentScreenData) {
          return <X9Screen x9={currentScreenData as X9Response} />;
        }
        return <p>Dados de X9 indisponíveis ou no formato incorreto.</p>;
      default:
        // Default content if no specific screen is selected or recognized
        if (currentScreenData && typeof currentScreenData === 'string') {
            return <p>{currentScreenData}</p>; // Display message from backend
        }
        return (
          <div>
            <p>Selecione uma opção no menu suspenso para exibir o conteúdo.</p>
          </div>
        );
    }
  };

  return (
 
      <div style={containerStyle}>
        <div>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #166534 0%, #22c55e 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.5rem'
            }}>
              Dashboard Geral
            </h1>
            <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
              Gerencie seus dados e operações
            </p>
          </div>

          <div className="custom-select-wrapper" style={{ marginBottom: '2rem' }}>
            {loading && !currentScreenResponse ? ( // Only show "Carregando opções..." on initial load
              <div>Carregando opções...</div>
            ) : error && !currentScreenResponse ? ( // Only show initial error if no data was loaded at all
              <div style={{ color: 'red' }}>Erro: {error}</div>
            ) : telasPermitidas.length > 0 ? (
              <CustomSelect
                options={telasOptions}
                onSelect={handleSelectTela}
                placeholder="Selecione uma tela"
              />
            ) : (
              <div>Nenhuma tela disponível.</div>
            )}
          </div>

          {renderScreenContent()}

        </div>

        <div>
          <div className="calendar-container">
            <div className="calendar-header">
              <CalendarIcon size={24} color="#166534" style={{ marginRight: '0.75rem' }} />
              <h2>Calendário</h2>
            </div>

            <Calendar
              value={dataSelecionada}
              locale="pt-BR"
              calendarType="gregory"
              tileContent={tileContent}
              formatMonthYear={(_locale, date) => // Corrigido: _locale
                date.toLocaleDateString('pt-BR', {
                  month: 'long',
                  year: 'numeric',
                })
              }
              formatShortWeekday={(_locale, date) => // Corrigido: _locale
                date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
              }
              showNeighboringMonth={false}
              prev2Label={null}
              next2Label={null}
              navigationLabel={({ date }) =>
                date.toLocaleDateString('pt-BR', {
                  month: 'long',
                  year: 'numeric',
                })
              }
            />

            <ProximasEntregas projetos={projetosParaCalendarioEProximasEntregas} />
          </div>
        </div>
      </div>

  );
};
