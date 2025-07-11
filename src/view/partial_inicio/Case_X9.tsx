import React, { memo, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  UserRound,
  Briefcase,
  Search,
  MessageSquare,
  BellRing,
  FileText,
  CalendarClock,
  AlertTriangle,
  Info,
  Send,
  BarChart2,
  CheckSquare,
  Square,
  Users,
  HardDrive,
  Activity,
  Monitor,
  Pin,
  Columns,
  PlusCircle,
  Tag,
  X,
  Plus,
} from 'lucide-react';

import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title as ChartTitle } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ChartTitle);
import { invoke } from "@tauri-apps/api/core";
import { StatCard } from '../Main';
import { X9Response, UsuarioAtivoComTelas } from '../Main';

import x9ScreenDetailImage from '../../assets/x9.jpg';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.15.26:8082';
const USER_PLACEHOLDER_IMAGE = 'https://placehold.co/50x50/d1d5db/4b5563?text=User';

interface X9ScreenProps {
  x9: X9Response;
}

interface DashboardResult {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
  borderColor: string;
  textColor: string;
}

interface KanbanCard {
  id: string;
  column_id: string;
  type: 'user' | 'task';
  title: string;
  description?: string;
  userId?: number;
  userPhoto?: string;
  nivel_preocupacao: 1 | 2 | 3 | 4;
  tags?: string[];
  card_color?: string;
  index?: number; // Adicionado para controlar a posição do card
}

interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
  color?: string;
}

interface KanbanCardData {
  id?: number;
  urgencia: number;
  user_id?: number;
  user_photo_url?: string;
  title: string;
  description?: string;
  tags?: string;
  card_color?: string;
}

interface RecentEvent {
  id: string;
  type: 'alert' | 'activity' | 'info';
  description: string;
  timestamp: string;
  tags?: string[];
}

interface KanbanCardUrgencyAndIndexUpdate {
  id: number;
  new_urgencia: number;
}

// Hook personalizado para debounce
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Constantes movidas para fora do componente para evitar re-criação
const MOCK_DASHBOARD_RESULTS: DashboardResult[] = [
  {
    title: 'Sessões Ativas',
    value: '124',
    icon: <Activity size={24} color="#3b82f6" />,
    gradient: "linear-gradient(135deg, #e0f2fe 0%, #bfdbfe 100%)",
    borderColor: "#93c5fd",
    textColor: "#1d4ed8",
  },
  {
    title: 'Uso de Disco',
    value: '75%',
    icon: <HardDrive size={24} color="#6b7280" />,
    gradient: "linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)",
    borderColor: "#9ca3af",
    textColor: "#4b5563",
  },
  {
    title: 'Tickets Abertos',
    value: '8',
    icon: <MessageSquare size={24} color="#f59e0b" />,
    gradient: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
    borderColor: "#facc15",
    textColor: "#b45309",
  },
  {
    title: 'Usuários Bloqueados',
    value: '3',
    icon: <UserRound size={24} color="#dc2626" />,
    gradient: "linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)",
    borderColor: "#ef4444",
    textColor: "#b91c1c",
  },
];

const MOCK_DOUGHNUT_DATA = {
  labels: ['Ativos', 'Inativos', 'Bloqueados'],
  datasets: [
    {
      data: [300, 50, 20],
      backgroundColor: ['#22c55e', '#f97316', '#ef4444'],
      hoverOffset: 4,
    },
  ],
};

const MOCK_BAR_DATA = {
  labels: ['MB', 'FQ', 'Financeiro', 'Qualidade', 'Coleta', 'Atendimento'],
  datasets: [
    {
      label: 'Acessos por Tela',
      data: [150, 90, 70, 50, 30, 20],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(244, 63, 94, 0.8)',
        'rgba(239, 68, 68, 0.8)',
      ],
      borderColor: [
        'rgba(59, 130, 246, 1)',
        'rgba(168, 85, 247, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(249, 115, 22, 1)',
        'rgba(244, 63, 94, 1)',
        'rgba(239, 68, 68, 1)',
      ],
      borderWidth: 1,
    },
  ],
};

const DOUGHNUT_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        color: '#334155',
      }
    },
    title: {
      display: true,
      text: 'Status de Usuários',
      color: '#1f2937',
      font: {
        size: 16,
        weight: 'bold',
      }
    },
  },
};

const BAR_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: '#334155',
      }
    },
    title: {
      display: true,
      text: 'Visualizações por Tela',
      color: '#1f2937',
      font: {
        size: 16,
        weight: 'bold',
      }
    },
  },
  scales: {
    x: {
      ticks: {
        color: '#64748b',
      },
      grid: {
        color: 'rgba(226,232,240,0.5)',
      },
    },
    y: {
      ticks: {
        color: '#64748b',
      },
      grid: {
        color: 'rgba(226,232,240,0.5)',
      },
    },
  },
};

const MOCK_RECENT_EVENTS: RecentEvent[] = [];

const BASE_KANBAN_COLUMNS: KanbanColumn[] = [
  { id: '1', title: 'Baixa', color: '#60a5fa', cards: [] },
  { id: '2', title: 'Media', color: '#10b981', cards: [] },
  { id: '3', title: 'Alta', color: '#f97316', cards: [] },
  { id: '4', title: 'Muito Alta', color: '#ef4444', cards: [] },
];

const SCREEN_OPTIONS = [
  'Todos',
  'MB',
  'FQ',
  'FINANCEIRO',
  'QUALIDADE',
  'COLETA',
  'ATENDIMENTO',
];

// Estilos movidos para constantes para evitar re-criação
const modernCardStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  borderRadius: '16px',
  padding: '2rem',
  boxShadow: '0 0 25px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.03)',
  border: '1px solid rgba(255,255,255,0.2)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
};

const userCardItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '1rem 0',
  borderBottom: '1px solid #e5e7eb',
  gap: '1rem',
  cursor: 'pointer',
  position: 'relative',
};

const userDetailsStyle: React.CSSProperties = {
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
};

const userNameStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: '600',
  color: '#334155',
  margin: 0,
};

const userMetaStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  color: '#64748b',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginTop: '0.25rem',
};

const userScreenTagStyle: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#e0f2fe',
  color: '#0c4a6e',
  padding: '0.25rem 0.75rem',
  borderRadius: '12px',
  fontSize: '0.75rem',
  fontWeight: '500',
  marginRight: '0.5rem',
  marginBottom: '0.5rem',
  whiteSpace: 'nowrap',
};

const searchBarContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  backgroundColor: '#f1f5f9',
  borderRadius: '12px',
  padding: '0.75rem 1rem',
  flexGrow: 1,
  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
};

const searchInputStyle: React.CSSProperties = {
  flexGrow: 1,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontSize: '1rem',
  color: '#334155',
};

const actionButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '0.5rem',
  borderRadius: '8px',
  transition: 'background-color 0.2s ease-in-out',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#3b82f6',
};

const topSectionContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2rem',
  marginBottom: '2rem',
  alignItems: 'flex-start',
};

const leftColumnContainerStyle: React.CSSProperties = {
  flex: '1 1 40%',
  minWidth: '300px',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
};

const x9ImageCardStyle: React.CSSProperties = {
  ...modernCardStyle,
  padding: '1rem',
  flex: '0 0 auto',
  height: 'auto',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const largeDetailImageStyle: React.CSSProperties = {
  width: '100%',
  height: 'auto',
  borderRadius: '12px',
  objectFit: 'cover',
};

const chartsContainerStyle: React.CSSProperties = {
  flex: '1 1 55%',
  minWidth: '350px',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
};

const chartCardStyle: React.CSSProperties = {
  ...modernCardStyle,
  padding: '1.5rem',
  flex: '1 1 auto',
  height: '300px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
};

const recentEventsCardStyle: React.CSSProperties = {
  ...modernCardStyle,
  padding: '1.5rem',
  flex: '1 1 auto',
  minHeight: '200px',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const eventItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.75rem',
  padding: '0.75rem 0',
  borderBottom: '1px solid #f1f5f9',
  fontSize: '0.9rem',
  color: '#475569',
};

const eventIconStyle: React.CSSProperties = {
  flexShrink: 0,
  marginTop: '2px',
};

const eventDescriptionStyle: React.CSSProperties = {
  flexGrow: 1,
  color: '#334155',
  fontWeight: '500',
};

const eventTimestampStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#94a3b8',
  whiteSpace: 'nowrap',
};

const eventTagStyle: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#e0f2fe',
  color: '#0c4a6e',
  padding: '0.2rem 0.5rem',
  borderRadius: '8px',
  fontSize: '0.7rem',
  fontWeight: '500',
  marginRight: '0.5rem',
  marginTop: '0.5rem',
  whiteSpace: 'nowrap',
};

const bulkActionButtonStyle: React.CSSProperties = {
  background: 'linear-gradient(45deg, #3b82f6 0%, #2563eb 100%)',
  color: '#fff',
  border: 'none',
  borderRadius: '12px',
  padding: '0.75rem 1.5rem',
  fontSize: '1rem',
  fontWeight: '600',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
  opacity: 0.8,
};

const bulkActionButtonHoverStyle: React.CSSProperties = {
  opacity: 1,
  boxShadow: '0 6px 15px rgba(0,0,0,0.15)',
  transform: 'translateY(-2px)',
};

const userSelectionCheckmarkStyle: React.CSSProperties = {
  position: 'absolute',
  top: '0.75rem',
  left: '0.75rem',
  color: '#3b82f6',
  zIndex: 2,
};

const filterDropdownContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  backgroundColor: '#f1f5f9',
  borderRadius: '12px',
  padding: '0.75rem 1rem',
  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
  flexShrink: 0,
};

const filterSelectStyle: React.CSSProperties = {
  flexGrow: 1,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontSize: '1rem',
  color: '#334155',
  cursor: 'pointer',
  appearance: 'none',
  paddingRight: '1rem',
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  backdropFilter: 'blur(3px)',
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '2rem',
  boxShadow: '0 10px 30px rgba(0,0,0,0.2), 0 4px 10px rgba(0,0,0,0.05)',
  width: '90%',
  maxWidth: '600px',
  maxHeight: '80vh',
  overflowY: 'auto',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
  flex: '1 1 auto',
};

const modalHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid #e2e8f0',
  paddingBottom: '1rem',
  marginBottom: '1rem',
};

const modalTitleStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: '700',
  color: '#1f2937',
  margin: 0,
};

const modalCloseButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '0.5rem',
  borderRadius: '8px',
  color: '#64748b',
  transition: 'background-color 0.2s ease-in-out',
};

const modalUserListStyle: React.CSSProperties = {
  flex: '1 1 auto',
  minHeight: '80px',
  maxHeight: '200px',
  overflowY: 'auto',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  flexShrink: 1,
  padding: '0.5rem',
};

const modalUserItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '0.75rem 1rem',
  borderBottom: '1px solid #f1f5f9',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease-in-out',
  backgroundColor: '#fff',
};

const modalUserItemHoverStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
};

const modalUserItemActiveStyle: React.CSSProperties = {
  backgroundColor: '#e0f2fe',
  borderLeft: '4px solid #3b82f6',
};

const modalUserPhotoStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  objectFit: 'cover',
  border: '1px solid #d1d5db',
  marginRight: '1rem',
};

const modalUserNameStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: '600',
  color: '#334155',
  flexGrow: 1,
};

const modalTextAreaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '100px',
  padding: '1rem',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  fontSize: '1rem',
  color: '#334155',
  resize: 'vertical',
  outline: 'none',
  transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
};

const modalPrimaryButtonStyle: React.CSSProperties = {
  background: 'linear-gradient(45deg, #22c55e 0%, #16a34a 100%)',
  color: '#fff',
  border: 'none',
  borderRadius: '12px',
  padding: '0.75rem 1.5rem',
  fontSize: '1rem',
  fontWeight: '600',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
};

const modalPrimaryButtonHoverStyle: React.CSSProperties = {
  opacity: 0.9,
  boxShadow: '0 6px 15px rgba(0,0,0,0.15)',
  transform: 'translateY(-2px)',
};

const tagInputContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  padding: '0.5rem 1rem',
  flexWrap: 'wrap',
  backgroundColor: '#fff',
};

const tagInputStyle: React.CSSProperties = {
  flexGrow: 1,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontSize: '1rem',
  color: '#334155',
  minWidth: '100px',
};

const selectedTagStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  backgroundColor: '#e0f2fe',
  color: '#0c4a6e',
  padding: '0.3rem 0.75rem',
  borderRadius: '16px',
  fontSize: '0.85rem',
  fontWeight: '500',
  whiteSpace: 'nowrap',
  gap: '0.4rem',
};

const removeTagButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#0c4a6e',
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'color 0.2s ease-in-out',
};

const addTagButtonStyle: React.CSSProperties = {
  background: '#3b82f6',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '0.4rem 0.8rem',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: '500',
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
  transition: 'background-color 0.2s ease-in-out',
};

const kanbanBoardInnerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1.5rem',
  alignItems: 'flex-start',
  paddingBottom: '1rem',
};

const kanbanBoardWrapperStyle: React.CSSProperties = {
  overflowX: 'auto',
  marginBottom: '2rem',
  width: '100%',
  boxSizing: 'border-box',
};

const kanbanColumnStyle: React.CSSProperties = {
  ...modernCardStyle,
  minWidth: '300px',
  maxWidth: '350px',
  flexShrink: 0,
  padding: '1.5rem',
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  height: 'fit-content',
  maxHeight: 'calc(100vh - 200px)',
  overflowY: 'auto',
};

const kanbanColumnHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '1rem',
  paddingBottom: '0.75rem',
  borderBottom: '2px solid',
  color: '#334155',
};

const kanbanColumnTitleStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: '700',
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const kanbanCardStyle: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: '12px',
  padding: '1rem',
  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
  border: '1px solid #e2e8f0',
  cursor: 'grab',
  transition: 'all 0.2s ease-in-out',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const kanbanCardDraggingStyle: React.CSSProperties = {
  opacity: 0.6,
  border: '2px dashed #3b82f6',
  transform: 'rotate(2deg)',
};

const kanbanCardTitleStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: '600',
  color: '#334155',
  margin: 0,
};

const kanbanCardDescriptionStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  color: '#64748b',
  margin: '0.25rem 0',
  lineHeight: '1.4',
};

const kanbanCardUserAvatarStyle: React.CSSProperties = {
  width: '30px',
  height: '30px',
  borderRadius: '50%',
  objectFit: 'cover',
  border: '1px solid #93c5fd',
  marginRight: '0.5rem',
};

const kanbanCardTagStyle: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#e0f2fe',
  color: '#0c4a6e',
  padding: '0.2rem 0.5rem',
  borderRadius: '8px',
  fontSize: '0.7rem',
  fontWeight: '500',
  marginRight: '0.5rem',
  marginTop: '0.5rem',
  whiteSpace: 'nowrap',
};

// Função utilitária para criar cartão Kanban otimizada
const createKanbanCard = (cardData: KanbanCardData, index: number = 0): KanbanCard => {
  const cardId = cardData.id ? String(cardData.id) : `temp-${Date.now()}-${Math.random()}`;
  
  return {
    id: cardId,
    column_id: String(cardData.urgencia),
    type: cardData.user_id ? 'user' : 'task',
    title: cardData.title,
    description: cardData.description,
    userId: cardData.user_id,
    userPhoto: cardData.user_photo_url ? `${API_BASE_URL}${cardData.user_photo_url}` : USER_PLACEHOLDER_IMAGE,
    nivel_preocupacao: cardData.urgencia as 1 | 2 | 3 | 4,
    tags: cardData.tags ? JSON.parse(cardData.tags) : [],
    card_color: cardData.card_color || (
      cardData.urgencia === 4 ? '#ef4444' :
      cardData.urgencia === 3 ? '#f97316' :
      cardData.urgencia === 2 ? '#10b981' : '#60a5fa'
    ),
    index: index, // Adicionar índice para controle de posição
  };
};

// Função utilitária para filtrar usuários otimizada
const filterUsers = (users: UsuarioAtivoComTelas[], searchTerm: string, screenFilter: string) => {
  let filteredUsers = users;

  if (searchTerm) {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    filteredUsers = filteredUsers.filter(user =>
      (user.nome_completo?.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (user.nome?.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (user.cargo?.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (user.privilegio?.toLowerCase().includes(lowerCaseSearchTerm))
    );
  }

  if (screenFilter !== 'Todos') {
    filteredUsers = filteredUsers.filter(user =>
      user.telas_acesso.some(tela => tela.nome === screenFilter)
    );
  }

  return filteredUsers;
};

export const X9Screen = memo<X9ScreenProps>(({ x9 }) => {
  // Estados principais
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScreenFilter, setSelectedScreenFilter] = useState('Todos');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set<number>()); // Corrected initialization
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>(BASE_KANBAN_COLUMNS);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);

  // Estados do modal
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false);
  const [selectedUserForActivity, setSelectedUserForActivity] = useState<UsuarioAtivoComTelas | null>(null);
  const [newActivityText, setNewActivityText] = useState('');
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [currentTagInput, setCurrentTagInput] = useState('');
  const [activityTags, setActivityTags] = useState<string[]>([]);
  const [selectedNivelPreocupacao, setSelectedNivelPreocupacao] = useState<1 | 2 | 3 | 4>(1);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  // New state for success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Debounce para os campos de busca
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const debouncedModalSearchTerm = useDebounce(modalSearchTerm, 300);

  // Ref para evitar re-criação desnecessária do useEffect
  const kanbanCardsRef = useRef<KanbanCardData[]>([]);

  // useEffect otimizado para preencher o Kanban
  useEffect(() => {
    // Verifica se os dados realmente mudaram para evitar processamento desnecessário
    if (JSON.stringify(x9.kanban_cards) === JSON.stringify(kanbanCardsRef.current)) {
      return;
    }

    kanbanCardsRef.current = x9.kanban_cards || [];

    if (!x9.kanban_cards || x9.kanban_cards.length === 0) {
      setKanbanColumns(BASE_KANBAN_COLUMNS);
      return;
    }

    // Criar um mapa para organizar cards por coluna de forma mais eficiente
    const cardsByColumn = new Map<string, KanbanCard[]>();
    
    // Inicializar o mapa com as colunas base
    BASE_KANBAN_COLUMNS.forEach(column => {
      cardsByColumn.set(column.id, []);
    });

    // Processar cards de forma mais eficiente
    x9.kanban_cards.forEach((cardData: KanbanCardData, index: number) => {
      try {
        if (cardData.id === undefined || cardData.id === null) {
          cardData.id = Date.now() + Math.floor(Math.random() * 100000);
        }

        const columnId = String(cardData.urgencia);
        const existingCards = cardsByColumn.get(columnId);
        
        if (existingCards) {
          existingCards.push(createKanbanCard(cardData, index));
        }
      } catch (e) {
        console.error("Erro ao processar kanban card:", cardData, e);
      }
    });

    // Criar as novas colunas de forma mais eficiente
    const newKanbanColumns = BASE_KANBAN_COLUMNS.map(baseColumn => ({
      ...baseColumn,
      cards: cardsByColumn.get(baseColumn.id) || []
    }));

    setKanbanColumns(newKanbanColumns);
  }, [x9.kanban_cards]);

  // useMemo otimizado para filtrar usuários
  const filteredUsers = useMemo(() => {
    return filterUsers(x9.usuarios_ativos_com_telas, debouncedSearchTerm, selectedScreenFilter);
  }, [x9.usuarios_ativos_com_telas, debouncedSearchTerm, selectedScreenFilter]);

  // useMemo otimizado para filtrar usuários do modal
  const filteredModalUsers = useMemo(() => {
    if (!debouncedModalSearchTerm) {
      return x9.usuarios_ativos_com_telas;
    }
    return filterUsers(x9.usuarios_ativos_com_telas, debouncedModalSearchTerm, 'Todos');
  }, [x9.usuarios_ativos_com_telas, debouncedModalSearchTerm]);

  // Handlers otimizados com useCallback
  const handleUserSelect = useCallback((userId: number) => {
    setSelectedUserIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(userId)) {
        newSelected.delete(userId);
      } else {
        newSelected.add(userId);
      }
      return newSelected;
    });
  }, []);

  const handleOpenErrorModal = useCallback((message: string) => {
  setErrorModalMessage(message);
  setIsErrorModalOpen(true);
}, []);

const handleCloseErrorModal = useCallback(() => {
  setIsErrorModalOpen(false);
  setErrorModalMessage('');
}, []);

  const handleNudge = useCallback((userId: number, userName: string) => {
    console.log(`Cutucando usuário: ${userName} (ID: ${userId})`);
    alert(`Enviando um "cutucão" para ${userName}!`);
  }, []);

  const handleNotify = useCallback((userId: number, userName: string) => {
    console.log(`Notificando usuário: ${userName} (ID: ${userId})`);
    alert(`Abrindo chat/envio de notificação para ${userName}.`);
  }, []);

  const handleSendBulkNotification = useCallback(() => {
    if (selectedUserIds.size === 0) {
      alert('Selecione pelo menos um usuário para enviar a notificação.');
      return;
    }
    const selectedUserNames = filteredUsers
      .filter(user => selectedUserIds.has(user.id))
      .map(user => user.nome_completo || user.nome)
      .join(', ');

    console.log(`Enviando notificação em massa para IDs: ${Array.from(selectedUserIds).join(', ')}`);
    alert(`Enviando notificação em massa para: ${selectedUserNames}. (A implementar envio real)`);
    setSelectedUserIds(new Set());
  }, [selectedUserIds, filteredUsers]);

  const handleOpenAddActivityModal = useCallback(() => {
    setIsAddActivityModalOpen(true);
    setSelectedUserForActivity(null);
    setNewActivityText('');
    setModalSearchTerm('');
    setCurrentTagInput('');
    setActivityTags([]);
    setSelectedNivelPreocupacao(1);
  }, []);

  const handleCloseAddActivityModal = useCallback(() => {
    setIsAddActivityModalOpen(false);
  }, []);

  const handleAddTag = useCallback(() => {
    const trimmedTag = currentTagInput.trim();
    if (trimmedTag && !activityTags.includes(trimmedTag)) {
      setActivityTags(prevTags => [...prevTags, trimmedTag]);
      setCurrentTagInput('');
    }
  }, [currentTagInput, activityTags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setActivityTags(prevTags => prevTags.filter(tag => tag !== tagToRemove));
  }, []);

  const handleSaveActivity = useCallback(async () => {
    if (!selectedUserForActivity && !newActivityText.trim()) {
      alert('Selecione um usuário ou escreva uma atividade.');
      return;
    }

    const newCard: KanbanCard = {
      id: `task-${Date.now()}`,
      column_id: String(selectedNivelPreocupacao),
      type: selectedUserForActivity ? 'user' : 'task',
      title: selectedUserForActivity ? (selectedUserForActivity.nome_completo || selectedUserForActivity.nome) : 'Nova Atividade',
      description: newActivityText.trim() || undefined,
      userId: selectedUserForActivity?.id,
      userPhoto: selectedUserForActivity?.profile_photo_path || USER_PLACEHOLDER_IMAGE,
      nivel_preocupacao: selectedNivelPreocupacao,
      tags: activityTags.length > 0 ? activityTags : undefined,
      card_color: selectedNivelPreocupacao === 4 ? '#ef4444' :
                  selectedNivelPreocupacao === 3 ? '#f97316' :
                  selectedNivelPreocupacao === 2 ? '#10b981' : '#60a5fa',
      index: 0, // Novo card sempre vai para o início
    };

    const cardDataForBackend = {
      id: 0,
      column_id: newCard.column_id,
      urgencia: newCard.nivel_preocupacao,
      type: newCard.type,
      title: newCard.title,
      description: newCard.description,
      user_id: newCard.userId,
      user_photo_url: newCard.userPhoto !== USER_PLACEHOLDER_IMAGE ? newCard.userPhoto : undefined,
      tags: JSON.stringify(newCard.tags || []),
      card_color: newCard.card_color,
    };

    try {
      await invoke('salvar_ticket', { cardData: cardDataForBackend });

      // Atualização otimizada do estado
      setKanbanColumns(prevColumns => {
        const targetColumnIndex = prevColumns.findIndex(col => col.id === newCard.column_id);
        if (targetColumnIndex === -1) return prevColumns;

        const updatedColumns = [...prevColumns];
        const targetColumn = { ...updatedColumns[targetColumnIndex] };
        targetColumn.cards = [newCard, ...targetColumn.cards]; // Add new card to the beginning
        updatedColumns[targetColumnIndex] = targetColumn;

        return updatedColumns;
      });

      setShowSuccessModal(true); // Show success modal instead of alert
      setTimeout(() => setShowSuccessModal(false), 3000); // Hide after 3 seconds
      handleCloseAddActivityModal();

    } catch (error) {
      console.error("Erro ao salvar atividade via Tauri:", error);
      alert(`Falha ao salvar a atividade: ${error}`); // Keep this alert for errors
    }
  }, [selectedUserForActivity, newActivityText, activityTags, selectedNivelPreocupacao, handleCloseAddActivityModal]);

  // Handlers de Drag & Drop otimizados com nova lógica
  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, cardId: string) => {
    setDraggingCardId(cardId);
    e.dataTransfer.setData('cardId', cardId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>, targetColumnId: string, targetCardId?: string) => {
    e.preventDefault();
    const draggedCardId = e.dataTransfer.getData('cardId');
    if (!draggedCardId) return;

    // --- LÓGICA DE VALIDAÇÃO MOVIDA PARA O INÍCIO ---
    // Encontrar a coluna de origem antes de qualquer alteração de estado.
    const sourceColumn = kanbanColumns.find(col => col.cards.some(card => card.id === draggedCardId));
    const sourceColumnId = sourceColumn?.id;

    const isSameColumn = sourceColumnId === targetColumnId;

    // Se o card foi movido para uma coluna diferente, execute a validação.
    if (!isSameColumn) {
      const cardNumericId = parseInt(draggedCardId.replace(/\D/g, '')) || 0;
      const MAX_INT32 = 2147483647; // Máximo valor para um inteiro de 32 bits com sinal.

      // Se o ID numérico do card exceder o limite, mostre o erro e pare a execução.
      if (cardNumericId > MAX_INT32) {
        console.warn(`Tentativa de mover card ${cardNumericId} que excede o limite de 32 bits.`);
        handleOpenErrorModal("Você ainda não pode alterar a urgência deste item, pois ele ainda não foi processado pelo sistema.");
        setDraggingCardId(null); // Limpa o estado de arrasto.
        return; // Impede que o resto da função (incluindo a atualização de estado) seja executado.
      }
    }
    // --- FIM DA LÓGICA DE VALIDAÇÃO ---


    // A atualização do estado agora só ocorre se a validação acima passar.
    setKanbanColumns(prevColumns => {
      const newColumns = prevColumns.map(col => ({ ...col, cards: [...col.cards] }));

      let draggedCard: KanbanCard | undefined;
      let sourceColumn: KanbanColumn | undefined;
      let draggedCardIndexInSource: number = -1;

      for (const column of newColumns) {
        const cardIndex = column.cards.findIndex(card => card.id === draggedCardId);
        if (cardIndex > -1) {
          draggedCard = column.cards[cardIndex];
          sourceColumn = column;
          draggedCardIndexInSource = cardIndex;
          break;
        }
      }

      if (!draggedCard || !sourceColumn) return prevColumns;

      sourceColumn.cards.splice(draggedCardIndexInSource, 1);

      const targetColumn = newColumns.find(col => col.id === targetColumnId);
      if (!targetColumn) return prevColumns;

      const updatedCard = {
        ...draggedCard,
        column_id: targetColumnId,
        nivel_preocupacao: parseInt(targetColumnId) as KanbanCard['nivel_preocupacao'],
        card_color: parseInt(targetColumnId) === 4 ? '#ef4444' :
                   parseInt(targetColumnId) === 3 ? '#f97316' :
                   parseInt(targetColumnId) === 2 ? '#10b981' : '#60a5fa',
      };
      
      let finalNewIndex = targetColumn.cards.length;
      if (targetCardId) {
        const targetCardIndex = targetColumn.cards.findIndex(card => card.id === targetCardId);
        if (targetCardIndex !== -1) {
          finalNewIndex = targetCardIndex;
        }
      }
      
      finalNewIndex = Math.max(0, Math.min(finalNewIndex, targetColumn.cards.length));
      targetColumn.cards.splice(finalNewIndex, 0, { ...updatedCard, index: finalNewIndex });

      return newColumns;
    });

    // A chamada ao backend também só ocorre se a validação inicial passar.
    if (!isSameColumn) {
      const cardNumericId = parseInt(draggedCardId.replace(/\D/g, '')) || 0;
      console.log(`Movendo card ${draggedCardId} do painel ${sourceColumnId} para ${targetColumnId}.`);

      const updateData: KanbanCardUrgencyAndIndexUpdate = {
        id: cardNumericId,
        new_urgencia: parseInt(targetColumnId)
      };

      try {
        await invoke('update_kanban_card_urgency_and_index', { updateData });
        console.log('Urgência e índice atualizados com sucesso no backend');
      } catch (error) {
        console.error('Erro ao atualizar posição do card no backend:', error);
        alert(`Erro ao atualizar posição do card: ${error}`);
        // NOTA: Em um cenário real, você poderia querer reverter a mudança de estado aqui em caso de falha no backend.
      }
    }

    setDraggingCardId(null);
  }, [kanbanColumns, handleOpenErrorModal]); // Adicionado kanbanColumns e handleOpenErrorModal às dependências do useCallback// Removed kanbanColumns from dependencies, as state update uses prevColumns.

  const handleDragEnd = useCallback(() => {
    setDraggingCardId(null);
  }, []);

  // Cálculo otimizado do total de cards no Kanban
  const totalKanbanCards = useMemo(() => {
    return kanbanColumns.reduce((acc, col) => acc + col.cards.length, 0);
  }, [kanbanColumns]);

  return (
    <>
      {/* Add Activity Modal */}
      {isAddActivityModalOpen && (
        <div style={modalOverlayStyle} onClick={handleCloseAddActivityModal}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h3 style={modalTitleStyle}>Adicionar Nova Atividade</h3>
              <button style={modalCloseButtonStyle} onClick={handleCloseAddActivityModal}>
                <X size={24} />
              </button>
            </div>

            <div style={searchBarContainerStyle}>
              <Search size={20} color="#64748b" />
              <input
                type="text"
                placeholder="Buscar usuário para associar..."
                style={searchInputStyle}
                value={modalSearchTerm}
                onChange={(e) => setModalSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
              Selecione um usuário ou adicione uma atividade geral:
            </div>

            <div style={modalUserListStyle}>
              {filteredModalUsers.length > 0 ? (
                filteredModalUsers.map((user) => (
                  <div
                    key={user.id}
                    style={{
                      ...modalUserItemStyle,
                      ...(selectedUserForActivity?.id === user.id ? modalUserItemActiveStyle : {}),
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = modalUserItemHoverStyle.backgroundColor)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = modalUserItemStyle.backgroundColor)}
                    onClick={() => setSelectedUserForActivity(user)}
                  >
                    <img
                      src={user.profile_photo_path ? `${API_BASE_URL}${user.profile_photo_path}` : USER_PLACEHOLDER_IMAGE}
                      alt={user.nome_completo || user.nome}
                      style={modalUserPhotoStyle}
                    />
                    <span style={modalUserNameStyle}>{user.nome_completo || user.nome}</span>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#9ca3af', padding: '1rem' }}>
                  Nenhum usuário encontrado.
                </div>
              )}
            </div>

            <textarea
              placeholder={selectedUserForActivity ? `Descreva a atividade para ${selectedUserForActivity.nome_completo || selectedUserForActivity.nome}...` : 'Descreva a nova atividade...'}
              style={modalTextAreaStyle}
              value={newActivityText}
              onChange={(e) => setNewActivityText(e.target.value)}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>Nível de Preocupação:</label>
              <select
                style={filterSelectStyle}
                value={selectedNivelPreocupacao}
                onChange={(e) => setSelectedNivelPreocupacao(Number(e.target.value) as 1 | 2 | 3 | 4)}
              >
                <option value={1}>1 - Baixa</option>
                <option value={2}>2 - Média</option>
                <option value={3}>3 - Alta</option>
                <option value={4}>4 - Muito Alta</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>Tags:</label>
              <div style={tagInputContainerStyle}>
                {activityTags.map((tag, index) => (
                  <span key={index} style={selectedTagStyle}>
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      style={removeTagButtonStyle}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="Adicionar tags (ex: Financeiro, Urgente)"
                  style={tagInputStyle}
                  value={currentTagInput}
                  onChange={(e) => setCurrentTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  style={addTagButtonStyle}
                >
                  <Plus size={16} /> Adicionar
                </button>
              </div>
            </div>

            <button
              style={modalPrimaryButtonStyle}
              onClick={handleSaveActivity}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, modalPrimaryButtonHoverStyle)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, modalPrimaryButtonStyle)}
            >
              <Send size={20} /> Salvar Atividade
            </button>
          </div>
        </div>
      )}
{/* Generic Error Modal */}
{isErrorModalOpen && (
  <div style={modalOverlayStyle} onClick={handleCloseErrorModal}>
    <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
      <div style={modalHeaderStyle}>
        <h3 style={{ ...modalTitleStyle, color: '#dc2626' }}>
          <AlertTriangle size={24} color="#dc2626" style={{ marginRight: '0.5rem' }} />
          Atenção!
        </h3>
        <button style={modalCloseButtonStyle} onClick={handleCloseErrorModal}>
          <X size={24} />
        </button>
      </div>
      <p style={{ fontSize: '1.1rem', color: '#334155', lineHeight: '1.5' }}>
        {errorModalMessage}
      </p>
      <button
        style={{
          ...modalPrimaryButtonStyle,
          background: 'linear-gradient(45deg, #ef4444 0%, #b91c1c 100%)', // Red gradient
        }}
        onClick={handleCloseErrorModal}
        onMouseEnter={(e) => Object.assign(e.currentTarget.style, modalPrimaryButtonHoverStyle)}
        onMouseLeave={(e) => Object.assign(e.currentTarget.style, {
          background: 'linear-gradient(45deg, #ef4444 0%, #b91c1c 100%)',
          opacity: 1, // Keep opacity at 1
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)', // Keep shadow consistent
          transform: 'translateY(0)', // Prevent initial transform
        })}
      >
        Entendi
      </button>
    </div>
  </div>
)}
      {/* Success Modal */}
      {showSuccessModal && (
        <div style={modalOverlayStyle} onClick={() => setShowSuccessModal(false)}>
          <div style={{ ...modalContentStyle, maxWidth: '400px', textAlign: 'center', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
            <CheckSquare size={48} color="#22c55e" style={{ marginBottom: '1rem' }} />
            <h3 style={modalTitleStyle}>Sucesso!</h3>
            <p style={{ fontSize: '1.1rem', color: '#475569', marginBottom: '1.5rem' }}>Atividade adicionada ao Kanban com sucesso!</p>
            <button
              style={modalPrimaryButtonStyle}
              onClick={() => setShowSuccessModal(false)}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, modalPrimaryButtonHoverStyle)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, modalPrimaryButtonStyle)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Top Section: X9 Image (left) and Dashboard Charts (right) */}
      <div style={topSectionContainerStyle}>
        <div style={leftColumnContainerStyle}>
          <div style={x9ImageCardStyle}>
            <img src={x9ScreenDetailImage} alt="Visão Geral X9" style={largeDetailImageStyle} />
          </div>

          <div style={recentEventsCardStyle}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarClock size={22} color="#4f46e5" /> Acontecimentos Recentes
            </h3>
            {MOCK_RECENT_EVENTS.length > 0 ? (
              <div>
                {MOCK_RECENT_EVENTS.map(event => (
                  <div key={event.id} style={eventItemStyle}>
                    <span style={eventIconStyle}>
                      {event.type === 'alert' && <AlertTriangle size={18} color="#ef4444" />}
                      {event.type === 'activity' && <Activity size={18} color="#3b82f6" />}
                      {event.type === 'info' && <Info size={18} color="#10b981" />}
                    </span>
                    <div style={{ flexGrow: 1 }}>
                      <p style={eventDescriptionStyle}>{event.description}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.25rem' }}>
                        {event.tags && event.tags.map((tag, idx) => (
                          <span key={idx} style={eventTagStyle}>
                            <Tag size={12} style={{ marginRight: '0.25rem' }} />{tag}
                          </span>
                        ))}
                        <span style={eventTimestampStyle}>{event.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '1rem', fontSize: '0.9rem' }}>
                Nenhum acontecimento recente.
              </div>
            )}
          </div>
        </div>

        <div style={chartsContainerStyle}>
          <div style={chartCardStyle}>
            <Doughnut data={MOCK_DOUGHNUT_DATA} options={DOUGHNUT_OPTIONS} />
          </div>
          <div style={chartCardStyle}>
            <Bar data={MOCK_BAR_DATA} options={BAR_OPTIONS} />
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#1f2937', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <BarChart2 size={28} color="#4f46e5" />
        Dashboard de Resultados
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <StatCard
          icon={<Users size={24} color="#3b82f6" />}
          title="Total de Usuários Ativos"
          value={x9.total_usuarios_ativos}
          gradient="linear-gradient(135deg, #e0f2fe 0%, #bfdbfe 100%)"
          borderColor="#93c5fd"
          textColor="#1d4ed8"
        />
        <StatCard
          icon={<Pin size={24} color="#64748b" />}
          title="Pins no Kanban"
          value={totalKanbanCards}
          gradient="linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)"
          borderColor="#94a3b8"
          textColor="#475569"
        />
        <StatCard
          icon={<Columns size={24} color="#0d9488" />}
          title="Setores no Kanban"
          value={kanbanColumns.length}
          gradient="linear-gradient(135deg, #ccfbf1 0%, #5eead4 100%)"
          borderColor="#14b8a6"
          textColor="#0f766e"
        />
        {MOCK_DASHBOARD_RESULTS.map((card, index) => (
          <StatCard
            key={index}
            icon={card.icon}
            title={card.title}
            value={card.value}
            gradient={card.gradient}
            borderColor={card.borderColor}
            textColor={card.textColor}
          />
        ))}
      </div>

      <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#1f2937', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Columns size={28} color="#4f46e5" />
        Kanban de Gestão
        <button
          style={{ ...actionButtonStyle, color: '#22c55e', marginLeft: '1rem', background: '#dcfce7', padding: '0.5rem 1rem', borderRadius: '10px' }}
          onClick={handleOpenAddActivityModal}
          title="Adicionar nova atividade"
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#86efac')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#dcfce7')}
        >
          <PlusCircle size={20} style={{ marginRight: '0.5rem' }} /> Adicionar
        </button>
      </h2>

      <div style={kanbanBoardWrapperStyle}>
        <div style={kanbanBoardInnerStyle}>
          {kanbanColumns.map(column => (
            <div
              key={column.id}
              style={kanbanColumnStyle}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div style={{ ...kanbanColumnHeaderStyle, borderBottomColor: column.color || '#e2e8f0' }}>
                <h3 style={{ ...kanbanColumnTitleStyle, color: column.color || '#334155' }}>
                  <Pin size={20} /> {column.title} ({column.cards.length})
                </h3>
              </div>
              {column.cards.length > 0 ? (
                column.cards.map(card => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, card.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, column.id, card.id)}
                    style={{
                      ...kanbanCardStyle,
                      ...(draggingCardId === card.id ? kanbanCardDraggingStyle : {}),
                      borderLeft: card.card_color ? `5px solid ${card.card_color}` : '1px solid #e2e8f0',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                    onClick={() => alert(`Clicado no pin: ${card.title} (Detalhes a implementar)`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {card.type === 'user' && card.userPhoto && (
                        <img src={card.userPhoto.startsWith('http') ? card.userPhoto : `${API_BASE_URL}${card.userPhoto}`} alt={card.title} style={kanbanCardUserAvatarStyle} />
                      )}
                      <p style={kanbanCardTitleStyle}>{card.title}</p>
                    </div>
                    {card.description && (
                      <p style={kanbanCardDescriptionStyle}>{card.description}</p>
                    )}
                    {card.tags && card.tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                        {card.tags.map((tag, idx) => (
                          <span key={idx} style={kanbanCardTagStyle}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#9ca3af', padding: '1rem', fontSize: '0.9rem', border: '1px dashed #e5e7eb', borderRadius: '8px' }}>
                  Arraste cards para cá ou adicione um novo.
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#1f2937', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <UserRound size={28} color="#3b82f6" />
        Gestão de Usuários Ativos
      </h2>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={searchBarContainerStyle}>
          <Search size={20} color="#64748b" />
          <input
            type="text"
            placeholder="Pesquisar usuários..."
            style={searchInputStyle}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={filterDropdownContainerStyle}>
          <Monitor size={20} color="#64748b" />
          <select
            style={filterSelectStyle}
            value={selectedScreenFilter}
            onChange={(e) => setSelectedScreenFilter(e.target.value)}
          >
            {SCREEN_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === 'Todos' ? 'Todas as Telas' : option}
              </option>
            ))}
          </select>
        </div>

        {selectedUserIds.size > 0 && (
          <button
            style={bulkActionButtonStyle}
            onClick={handleSendBulkNotification}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, bulkActionButtonHoverStyle)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, bulkActionButtonStyle)}
          >
            <Send size={20} />
            Notificar ({selectedUserIds.size})
          </button>
        )}
      </div>

      <div style={modernCardStyle}>
        {filteredUsers.length > 0 ? (
          <div>
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                style={{
                  ...userCardItemStyle,
                  background: selectedUserIds.has(user.id) ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                  borderRadius: selectedUserIds.has(user.id) ? '12px' : '0',
                  paddingLeft: selectedUserIds.has(user.id) ? '3rem' : '1rem',
                }}
                onClick={() => handleUserSelect(user.id)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = selectedUserIds.has(user.id) ? 'rgba(59, 130, 246, 0.1)' : '#f8fafc')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = selectedUserIds.has(user.id) ? 'rgba(59, 130, 246, 0.05)' : 'transparent')}
              >
                {selectedUserIds.has(user.id) && (
                  <div style={userSelectionCheckmarkStyle}>
                    <CheckSquare size={20} color="#3b82f6" />
                  </div>
                )}
                {!selectedUserIds.has(user.id) && (
                  <div style={userSelectionCheckmarkStyle}>
                    <Square size={20} color="#e5e7eb" />
                  </div>
                )}

                <img
                  src={user.profile_photo_path ? `${API_BASE_URL}${user.profile_photo_path}` : USER_PLACEHOLDER_IMAGE}
                  alt={user.nome_completo || user.nome}
                  style={modalUserPhotoStyle}
                />

                <div style={userDetailsStyle}>
                  <p style={userNameStyle}>{user.nome_completo || user.nome}</p>
                  {user.cargo && (
                    <div style={userMetaStyle}>
                      <Briefcase size={16} color="#64748b" />
                      <span>{user.cargo}</span>
                    </div>
                  )}
                  {user.privilegio && (
                    <div style={userMetaStyle}>
                      <UserRound size={16} color="#64748b" />
                      <span>{user.privilegio}</span>
                    </div>
                  )}
                  <div style={{ marginTop: '0.5rem' }}>
                    {user.telas_acesso.map((tela, index) => (
                      <span key={tela.id || index} style={userScreenTagStyle}>
                        {tela.nome}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button
                    style={{ ...actionButtonStyle, color: '#f59e0b' }}
                    onClick={(e) => { e.stopPropagation(); handleNudge(user.id, user.nome_completo || user.nome); }}
                    title={`Cutucar ${user.nome_completo || user.nome}`}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef3c7')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <BellRing size={20} />
                  </button>
                  <button
                    style={{ ...actionButtonStyle, color: '#2563eb' }}
                    onClick={(e) => { e.stopPropagation(); handleNotify(user.id, user.nome_completo || user.nome); }}
                    title={`Notificar ${user.nome_completo || user.nome}`}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e0f2fe')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <MessageSquare size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            color: '#6b748b',
            padding: '2rem',
            fontSize: '1rem'
          }}>
            {searchTerm || selectedScreenFilter !== 'Todos' ? "Nenhum usuário encontrado com os filtros aplicados." : "Nenhum usuário ativo encontrado."}
          </div>
        )}
      </div>
    </>
  );
});

X9Screen.displayName = 'X9Screen';