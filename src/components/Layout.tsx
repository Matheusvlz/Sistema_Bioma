import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from '../routes/Router';
import './css/Layout.css';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { WindowManager } from '../hooks/WindowManager';

// Import notification components
import ChatNotification from './ChatNotification';
import ChatNotificationModal from './ChatNotificationModal';
import NormalNotification from './NormalNotification';
import KanbanNotification from './KanbanNotification';

// --- Interfaces ---
interface WebSocketMessagePayload {
  type: string;
  description?: string;
  icon?: string;
  title?: string;
  isNew?: boolean;
  data?: SavedKanbanCard;
}

interface MessageNotificationPayload {
    type: string;
    sender_id: number;
    chat_id: number;
    sender_name: string;
    sender_avatar: string | null;
    content: string;
    timestamp: string;
}

interface SavedNotification {
  id?: number;
  name: string;
  description: string;
  icon: string;
  type: string;
  finalizado: boolean;
  userId: number;
  createdAt?: string;
}

interface SavedKanbanCard {
  id: number;
  urgencia: number;
  cardType: string;
  title: string;
  description?: string;
  userId?: number;
  userPhotoUrl?: string;
  tags: string;
  cardColor?: string;
}

interface InicioApiResponse {
  pending_notifications: {
    id?: number;
    nome: string;
    descricao: string;
    icon: string;
    type: string;
    finalizado: boolean;
    user_id: number;
    created_at?: string;
  }[];
  kanban_cards: {
    id: number;
    urgencia: number;
    card_type: string;
    title: string;
    description?: string;
    user_id?: number;
    user_photo_url?: string;
    tags: string;
    card_color?: string;
  }[];
   pending_messages: number;
}

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

interface Task {
  id: number;
  name: string;
  description?: string;
  urgency: number;
  cardType: string;
  tags: string;
  cardColor?: string;
  isCompleted: boolean;
}

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { navigate, currentRoute, setAuthenticated, getRouteIcon } = useRouter();
  
  // User and UI state
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string>('https://placehold.co/40x40/065f46/ffffff?text=U');
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Data state
  const [newNotifications, setNewNotifications] = useState<WebSocketMessagePayload[]>([]);
  const [savedNotifications, setSavedNotifications] = useState<SavedNotification[]>([]);

  const [tasks, setTasks] = useState<Task[]>([]);

  // Enhanced notification states
  const [chatNotification, setChatNotification] = useState<MessageNotificationPayload | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);
  
  const [normalNotification, setNormalNotification] = useState<WebSocketMessagePayload | null>(null);
  const [showNormalPopup, setShowNormalPopup] = useState(false);
  
  const [kanbanNotification, setKanbanNotification] = useState<WebSocketMessagePayload | null>(null);
  const [showKanbanPopup, setShowKanbanPopup] = useState(false);

  // Modal states
  const [showClearNotificationsConfirmModal, setShowClearNotificationsConfirmModal] = useState(false);
  const [showConfirmTaskModal, setShowConfirmTaskModal] = useState(false);
  const [taskToFinalize, setTaskToFinalize] = useState<Task | null>(null);
  var [messages, setMessages] = useState<number>(0); 
  // Refs and flags
  const tauriListenerRegistered = useRef(false);
  const userIdSentToWsRef = useRef(false);
  const initialDataLoaded = useRef(false);

  // Enhanced notification handlers
  const closeChatNotificationModal = () => {
    setShowChatModal(false);
    setChatNotification(null);
  };

  const closeChatNotificationPopup = () => {
    setShowChatPopup(false);
    setChatNotification(null);
  };

  const closeNormalNotificationPopup = () => {
    setShowNormalPopup(false);
    setNormalNotification(null);
  };

  const closeKanbanNotificationPopup = () => {
    setShowKanbanPopup(false);
    setKanbanNotification(null);
  };

  const handleOpenChat = (chatId?: number) => {
    console.log(`Opening chat${chatId ? ` with ID: ${chatId}` : ''}`);
    WindowManager.openChat();
  };

  const handleViewTask = (taskId: number) => {
    console.log(`Viewing task with ID: ${taskId}`);
    // Implement task viewing logic here
    setShowTasksModal(true);
  };

  const handleAcceptTask = (taskId: number) => {
    console.log(`Accepting task with ID: ${taskId}`);
    // Implement task acceptance logic here
  };

const fetchInicioData = useCallback(async () => {
  try {
    const fetchedData: InicioApiResponse = await invoke('get_inicio_data_from_api');

    const formattedNotifications: SavedNotification[] = fetchedData.pending_notifications.map(notif => ({
      id: notif.id,
      name: notif.nome,
      description: notif.descricao,
      icon: notif.icon,
      type: notif.type,
      finalizado: notif.finalizado,
      userId: notif.user_id,
      createdAt: notif.created_at,
    }));
    setSavedNotifications(formattedNotifications);

    const formattedKanbanCards: SavedKanbanCard[] = fetchedData.kanban_cards.map(card => ({
      id: card.id,
      urgencia: card.urgencia,
      cardType: card.card_type,
      title: card.title,
      description: card.description,
      userId: card.user_id,
      userPhotoUrl: card.user_photo_url,
      tags: card.tags,
      cardColor: card.card_color,
    }));


    const initialTasks: Task[] = formattedKanbanCards.map(card => ({
      id: card.id,
      name: card.title,
      description: card.description,
      urgency: card.urgencia,
      cardType: card.cardType,
      tags: card.tags,
      cardColor: card.cardColor,
      isCompleted: false,
    }));
    setTasks(initialTasks);

    // Set messages to a numeric value.
    // For example, if you want to set it to the number of pending notifications:
    setMessages(formattedNotifications.length);
    // Or to a specific number, e.g., 5:
    // setMessages(5);

  } catch (error) {
    console.error("Erro ao buscar dados iniciais:", error);
  }
}, []);
useEffect(() => {
  if (!tauriListenerRegistered.current) {
    tauriListenerRegistered.current = true;
    console.log('[Frontend] Registrando listener Tauri para "nova_mensagem_ws".');

    const unlistenPromise = listen<string>('nova_mensagem_ws', (event) => {
      console.log('[Tauri Event] Mensagem WS recebida:', event.payload);
      try {
        const messagePayload = JSON.parse(event.payload);
        const { type, ...data } = messagePayload;

        // Enhanced notification routing
        if (type === 'chat_message_notification') {
          const chatNotificationData = data as MessageNotificationPayload;
          console.log('Recebida notificação de chat:', chatNotificationData);
          
          setChatNotification(chatNotificationData);
          setShowChatPopup(true);
          messages =  messages + 1;
          // Auto-hide popup after 6 seconds
          setTimeout(() => {
            setShowChatPopup(false);
          }, 6000);

        } else if (type === "new_kanban_card" && messagePayload.data) {
          const newKanbanCard: SavedKanbanCard = messagePayload.data;
          console.log("Recebido novo Kanban Card:", newKanbanCard);

          // Update tasks state
          setTasks(prevTasks => {
            const newTask: Task = {
              id: newKanbanCard.id,
              name: newKanbanCard.title,
              description: newKanbanCard.description,
              urgency: newKanbanCard.urgencia,
              cardType: newKanbanCard.cardType,
              tags: newKanbanCard.tags,
              cardColor: newKanbanCard.cardColor,
              isCompleted: false,
            };
            return [newTask, ...prevTasks];
          });

          // Show Kanban notification
          const kanbanNotificationData: WebSocketMessagePayload = {
            type: "new_kanban_card",
            title: `Nova Tarefa: ${newKanbanCard.title}`,
            description: newKanbanCard.description || 'Nenhuma descrição.',
            icon: 'ticket',
            isNew: true,
            data: newKanbanCard
          };
          
          setKanbanNotification(kanbanNotificationData);
          setShowKanbanPopup(true);

        } else if (type === "new_ticket") {
          // Handle normal notifications
          const newNotification: WebSocketMessagePayload = { ...messagePayload, isNew: true };
          setNewNotifications((prevNotifications) => [newNotification, ...prevNotifications]);
          
          setNormalNotification(newNotification);
          setShowNormalPopup(true);

        } else {
          // Handle unknown notification types as normal notifications
          console.warn("Mensagem WebSocket com tipo desconhecido:", messagePayload);
          
          const unknownNotification: WebSocketMessagePayload = { 
            title: messagePayload.title || "Nova Notificação", 
            description: messagePayload.description || "Notificação recebida", 
            icon: messagePayload.icon || "info", 
            type: messagePayload.type || "info", 
            isNew: true 
          };
          
          setNormalNotification(unknownNotification);
          setShowNormalPopup(true);
        }

      } catch (e) {
        console.error("Erro ao parsear mensagem JSON do WebSocket:", e);
        const errorNotification: WebSocketMessagePayload = { 
          title: "Erro de Comunicação", 
          description: "Erro ao processar mensagem do servidor", 
          icon: "alert", 
          type: "error", 
          isNew: true 
        };
        
        setNormalNotification(errorNotification);
        setShowNormalPopup(true);
      }
    });

    return () => {
      console.log('[Frontend] Desregistrando listener Tauri.');
      (async () => {
        (await unlistenPromise)();
      })();
      tauriListenerRegistered.current = false;
    };
  }
}, []);

  useEffect(() => {
    if (!initialDataLoaded.current) {
      initialDataLoaded.current = true;

      const loadInitialData = async () => {
        try {
          const user: Usuario | null = await invoke('usuario_logado');
          if (user) {
            setUsuario(user);
            const apiUrl = import.meta.env.VITE_API_URL || 'http://192.168.15.26:8082';
            const fullProfilePhotoUrl = user.profile_photo ? `${apiUrl}${user.profile_photo}` : 'https://placehold.co/40x40/065f46/ffffff?text=U';
            setProfileImageUrl(fullProfilePhotoUrl);
            document.body.classList.toggle('dark-mode', user.dark_mode);

            if (user.id && !userIdSentToWsRef.current) {
              console.log(`[Frontend] Enviando ID do usuário (${user.id}) para o WebSocket.`);
              invoke('send_ws_message', { message: user.id.toString() })
                .then(() => {
                  console.log(`[Frontend] ID do usuário (${user.id}) enviado com sucesso.`);
                  userIdSentToWsRef.current = true;
                })
                .catch(e => console.error("Erro ao enviar ID do usuário para WS:", e));
            }

            await fetchInicioData();

          } else {
            userIdSentToWsRef.current = false;
          }
        } catch (error) {
          console.error("Erro ao buscar informações do usuário:", error);
          userIdSentToWsRef.current = false;
        }
      };

      loadInitialData();
    }
  }, [fetchInicioData]);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedMode = localStorage.getItem('appDarkMode');
      if (savedMode !== null) {
        document.body.classList.toggle('dark-mode', JSON.parse(savedMode));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    userIdSentToWsRef.current = false;
    initialDataLoaded.current = false;
    setAuthenticated(false);
  };

  const toggleNotificationsModal = () => {
    setShowNotificationsModal(!showNotificationsModal);
  };

  const toggleTasksModal = () => {
    setShowTasksModal(!showTasksModal);
  };

  const clearAllNotifications = () => {
    setShowClearNotificationsConfirmModal(true);
  };

  const confirmClearAllNotifications = async () => {
    setNewNotifications([]);
    setSavedNotifications([]);
    try {
      await invoke('finalizar_notificacao');
      console.log('Notificações limpas no backend com sucesso.');
    } catch (error) {
      console.error('Erro ao limpar notificações no backend:', error);
    } finally {
      setShowClearNotificationsConfirmModal(false);
      setShowNotificationsModal(false);
    }
  };

  const cancelClearAllNotifications = () => {
    setShowClearNotificationsConfirmModal(false);
  };

  const handleFinalizeTask = (task: Task) => {
    setTaskToFinalize(task);
    setShowConfirmTaskModal(true);
  };

  const confirmFinalizeTask = async () => {
    if (taskToFinalize) {
      try {
        await invoke('mark_kanban_card_as_completed', { cardId: taskToFinalize.id });
        console.log(`Task ${taskToFinalize.id} finalizada com sucesso.`);

        setTasks(prevTasks =>
          prevTasks.filter(task => task.id !== taskToFinalize.id)
        );
      } catch (e) {
        console.error(`Erro ao finalizar task ${taskToFinalize.id}:`, e);
      } finally {
        setTaskToFinalize(null);
        setShowConfirmTaskModal(false);
      }
    }
  };

  const cancelFinalizeTask = () => {
    setTaskToFinalize(null);
    setShowConfirmTaskModal(false);
  };

  const getNotificationIcon = (iconName: string) => {
    switch (iconName) {
      case 'ticket':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="notification-item-icon">
            <path d="M22 17H2a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3z"></path>
            <path d="M12 11h.01"></path>
            <path d="M12 14h.01"></path>
          </svg>
        );
      case 'alert':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="notification-item-icon">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        );
      case 'info':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="notification-item-icon">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="notification-item-icon">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        );
    }
  };

  const getUrgencyIcon = (urgency: number) => {
     const iconBaseProps = {
      width: "18",
      height: "18",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round" as const,
      strokeLinejoin: "round" as const,
      className: "urgency-icon"
    };

    switch (urgency) {
      case 1:
        return (
          <svg {...iconBaseProps}>
            <circle cx="12" cy="12" r="8"></circle>
          </svg>
        );
      case 2:
        return (
          <svg {...iconBaseProps}>
            <rect x="6" y="6" width="12" height="12" rx="2" ry="2"></rect>
          </svg>
        );
      case 3:
        return (
          <svg {...iconBaseProps}>
            <path d="M12 2L3 18h18z"></path>
            <line x1="12" y1="6" x2="12" y2="10"></line>
          </svg>
        );
      case 4:
        return (
          <svg {...iconBaseProps}>
            <line x1="12" y1="1" x2="12" y2="6"></line>
            <line x1="12" y1="8" x2="12" y2="13"></line>
            <line x1="12" y1="15" x2="12.01" y2="15"></line>
            <polyline points="7 17 12 22 17 17"></polyline>
          </svg>
        );
      default:
        return (
          <svg {...iconBaseProps}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        );
    }
  };

  const allNotifications = [
    ...newNotifications.filter(notif => notif.type === "new_ticket"),
    ...savedNotifications.map(notif => ({
      description: notif.description,
      icon: notif.icon,
      title: notif.name,
      type: notif.type,
      isNew: false,
    }))
  ];

  const totalNotificationsCount = newNotifications.filter(notif => notif.type === "new_ticket").length + savedNotifications.length;
  const totalTasksCount = tasks.filter(task => !task.isCompleted).length;

  return (
    <div className="layout">
      <header className="layout-header">
        <div className="header-content">
          <div className="logo-small">
            <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" fill="#44dc8c" />
              <path d="M12 20l6 6 10-12" stroke="#ffffff" strokeWidth="3" />
            </svg>
            <span>Bioma Ambiental</span>
          </div>

          <div className="header-actions-left">
                       <div className="messages-container">
            <button className="header-icon-button" onClick={() => WindowManager.openChat()}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
                 {messages > 0 && <span className="messages-badge">{messages}</span>}
            </button>
            </div>
            <div className="notifications-container">
              <button className="header-icon-button" onClick={toggleNotificationsModal}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {totalNotificationsCount > 0 && <span className="notification-badge">{totalNotificationsCount}</span>}
              </button>
              {showNotificationsModal && (
                <div className="modal notifications-modal">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h3>Notificações</h3>
                      <button className="close-button" onClick={toggleNotificationsModal}>&times;</button>
                    </div>
                    <div className="modal-body">
                      {allNotifications.length === 0 ? (
                        <p className="no-items-message">Nenhuma notificação.</p>
                      ) : (
                        <ul>
                          {allNotifications.map((notif, index) => (
                            <li key={`${notif.type}-${index}`} className={`notification-item-modal ${notif.isNew ? 'new' : ''}`}>
                              {getNotificationIcon(notif.icon || 'default')}
                              <div className="notification-text-content">
                                <span className="notification-title">{notif.title}</span>
                                <span className="notification-description">{notif.description}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="modal-footer">
                      <button className="clear-all-notifications-button" onClick={clearAllNotifications}>Limpar todas</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="tasks-container">
              <button className="header-icon-button" onClick={toggleTasksModal}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                </svg>
                {totalTasksCount > 0 && <span className="notification-badge">{totalTasksCount}</span>}
              </button>
              {showTasksModal && (
                <div className="modal tasks-modal">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h3>Minhas Tarefas</h3>
                      <button className="close-button" onClick={toggleTasksModal}>&times;</button>
                    </div>
                    <div className="modal-body">
                      {tasks.length === 0 ? (
                        <p className="no-items-message">Nenhuma Tarefa pendente.</p>
                      ) : (
                        <ul>
                          {tasks.map((task) => (
                            <li key={task.id} className={`task-item urgency-${task.urgency} ${task.isCompleted ? 'completed' : ''}`}>
                              <div className="task-details">
                                <div className="task-urgency-indicator">
                                  {getUrgencyIcon(task.urgency)}
                                </div>
                                <div style={{flexGrow: 1, display: 'flex', flexDirection: 'column'}}>
                                    <span className="task-name">{task.name}</span>
                                    {task.description && <span className="task-description">{task.description}</span>}
                                </div>
                              </div>
                              <div className="task-actions">
                                {task.isCompleted ? (
                                  <span className="task-completed-text">Concluída &#10003;</span>
                                ) : (
                                  <button
                                    className="finalize-task-button"
                                    onClick={() => handleFinalizeTask(task)}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-confirm-task">
                                      <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="header-actions-right">
            <div className="user-dropdown" ref={dropdownRef}>
                <button className="user-info-toggle" onClick={() => setShowUserDropdown(!showUserDropdown)}>
                    {usuario && (
                        <div className="user-info">
                            <img src={profileImageUrl} alt="Foto de Perfil" className="profile-photo" />
                            <div className="user-details">
                                <span className="user-name">{usuario.nome_completo}</span>
                                <span className="user-cargo">{usuario.cargo}</span>
                            </div>
                        </div>
                    )}
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`dropdown-arrow ${showUserDropdown ? 'open' : ''}`}>
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
                {showUserDropdown && (
                    <div className={`dropdown-content ${showUserDropdown ? 'show-dropdown' : ''}`}>
                        <button className="dropdown-item logout-button" onClick={handleLogout}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16,17 21,12 16,7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            <span>Sair</span>
                        </button>
                    </div>
                )}
            </div>
          </div>
        </div>
      </header>
      
      <div className="layout-body">
        <aside className="layout-sidebar">
          <nav className="sidebar-nav">
            <button
              className={`nav-item ${currentRoute === 'inicio' ? 'active' : ''}`}
              onClick={() => navigate('inicio')}
            >
              {getRouteIcon('inicio')}
              <span>Início</span>
            </button>
            <button
              className={`nav-item ${currentRoute === 'reports' ? 'active' : ''}`}
              onClick={() => navigate('reports')}
            >
              {getRouteIcon('reports')}
              <span>Relatórios</span>
            </button>
            <button
              className={`nav-item ${currentRoute === 'geral' ? 'active' : ''}`}
              onClick={() => navigate('geral')}
            >
              {getRouteIcon('geral')}
              <span>Geral</span>
            </button>
            <button
              className={`nav-item ${currentRoute === 'laboratorio' ? 'active' : ''}`}
              onClick={() => navigate('laboratorio')}
            >
              {getRouteIcon('laboratorio')}
              <span>Laboratório</span>
            </button>
            <button
              className={`nav-item ${currentRoute === 'qualidade' ? 'active' : ''}`}
              onClick={() => navigate('qualidade')}
            >
              {getRouteIcon('qualidade')}
              <span>Qualidade</span>
            </button>
            <button
              className={`nav-item ${currentRoute === 'financeiro' ? 'active' : ''}`}
              onClick={() => navigate('financeiro')}
            >
              {getRouteIcon('financeiro')}
              <span>Financeiro</span>
            </button>
            <button
              className={`nav-item ${currentRoute === 'administracao' ? 'active' : ''}`}
              onClick={() => navigate('administracao')}
            >
              {getRouteIcon('administracao')}
              <span>Administração</span>
            </button>
            <button
              className={`nav-item ${currentRoute === 'agenda' ? 'active' : ''}`}
              onClick={() => navigate('agenda')}
            >
              {getRouteIcon('agenda')}
              <span>Agenda</span>
            </button>
            <button
              className={`nav-item ${currentRoute === 'frota' ? 'active' : ''}`}
              onClick={() => navigate('frota')}
            >
              {getRouteIcon('frota')}
              <span>Frota</span>
            </button>
            <button
              className={`nav-item ${currentRoute === 'settings' ? 'active' : ''}`}
              onClick={() => navigate('settings')}
            >
              {getRouteIcon('settings')}
              <span>Configurações</span>
            </button>
          </nav>
        </aside>
        <main className="layout-main">
          {children}
        </main>
      </div>

      {/* Enhanced Notification Components */}
      {showChatPopup && chatNotification && (
        <ChatNotification
          notification={chatNotification}
          onClose={closeChatNotificationPopup}
          onOpenChat={handleOpenChat}
        />
      )}

      {showChatModal && chatNotification && (
        <ChatNotificationModal
          notification={chatNotification}
          onClose={closeChatNotificationModal}
          onOpenChat={handleOpenChat}
        />
      )}

      {showNormalPopup && normalNotification && (
        <NormalNotification
          notification={normalNotification}
          onClose={closeNormalNotificationPopup}
        />
      )}

      {showKanbanPopup && kanbanNotification && (
        <KanbanNotification
          notification={kanbanNotification}
          onClose={closeKanbanNotificationPopup}
          onViewTask={handleViewTask}
          onAcceptTask={handleAcceptTask}
        />
      )}

      {/* Confirmation Modals */}
      {showClearNotificationsConfirmModal && (
        <div className="modal confirm-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Confirmar Limpeza de Notificações</h3>
              <button className="close-button" onClick={cancelClearAllNotifications}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Tem certeza de que deseja limpar todas as notificações?</p>
              <p>Esta ação removerá todas as notificações da sua lista.</p>
            </div>
            <div className="modal-footer">
              <button className="cancel-button" onClick={cancelClearAllNotifications}>Cancelar</button>
              <button className="confirm-button" onClick={confirmClearAllNotifications}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {showConfirmTaskModal && taskToFinalize && (
        <div className="modal confirm-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Confirmar Finalização de Tarefa</h3>
              <button className="close-button" onClick={cancelFinalizeTask}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Tem certeza de que deseja finalizar a tarefa:</p>
              <p className="task-to-confirm-name">{taskToFinalize.name}?</p>
              <p>Essa ação a removerá da sua lista de tarefas pendentes.</p>
            </div>
            <div className="modal-footer">
              <button className="cancel-button" onClick={cancelFinalizeTask}>Cancelar</button>
              <button className="confirm-button" onClick={confirmFinalizeTask}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

