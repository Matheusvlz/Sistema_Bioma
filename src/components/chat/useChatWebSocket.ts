import { useEffect, useRef, useCallback } from 'react';
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

interface Message {
    id: number;
    user_id: number;
    content: string;
    timestamp: string;
    user_name: string;
    visualizado_hora: string | null;
    visualizado: boolean;
    visualizado_cont: number;
    arquivo: boolean | null;
    arquivo_nome?: string;
    arquivo_tipo?: string;
    arquivo_tamanho?: number;
    arquivo_url?: string;
}

interface BackendUser {
    id: number;
    nome: string;
    ativo: boolean;
    nome_completo: string | null;
    cargo: string | null;
    profile_photo_path: string | null;
}

interface Conversation {
    id: string;
    chatId: number;
    name: string;
    avatar: string;
    lastMessage: string;
    lastMessageTime: Date;
    unreadCount: number;
    status: 'online' | 'offline' | 'away';
    members: BackendUser[];
}

interface OnlineUser {
    user_id: number;
    user_name: string;
    status: 'online' | 'offline' | 'away' | 'typing';
    last_activity: string;
}

interface UserOnlineStatus {
    user_id: number;
    user_name: string;
    is_online: boolean;
    last_seen?: string;
}

interface ChatMessageNotification {
    type: string;
    sender_id: number;
    chat_id: number;
    sender_name: string;
    sender_avatar: string | null;
    content: string;
    timestamp: string;
}

interface ChatMessageWebSocket {
    type: string;
    chat_id: number;
    message: Message;
}

interface UserStatusUpdate {
    type: string;
    chat_id: number;
    user_id: number;
    status: 'online' | 'offline' | 'away' | 'typing';
    user_name: string;
}

interface UserTyping {
    type: string;
    chat_id: number;
    user_id: number;
    user_name: string;
    is_typing: boolean;
}

interface ChatOnlineUsers {
    type: string;
    chat_id: number;
    online_users: OnlineUser[];
}

interface UseChatWebSocketEnhancedProps {
    currentUserId: number;
    selectedConversation: Conversation | null;
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
    setIsConnectedToWebSocket: React.Dispatch<React.SetStateAction<boolean>>;
    fetchChatMessages: (chatId: number) => Promise<void>;
    // Callbacks para status online
    onUserOnlineStatusUpdate?: (status: UserOnlineStatus) => void;
    onChatOnlineUsersUpdate?: (users: OnlineUser[]) => void;
    onUserStatusInChatUpdate?: (chatId: number, userId: number, status: 'online' | 'offline' | 'away' | 'typing', userName: string) => void;
    // Callbacks para digitação
    onUserTypingUpdate?: (userId: number, userName: string, chatId: number, isTyping: boolean) => void;
}

export const useChatWebSocket = ({
    currentUserId,
    selectedConversation,
    setMessages,
    setConversations,
    setIsConnectedToWebSocket,
    fetchChatMessages,
    onUserOnlineStatusUpdate,
    onChatOnlineUsersUpdate,
    onUserStatusInChatUpdate,
    onUserTypingUpdate
}: UseChatWebSocketEnhancedProps) => {
    const processingWebSocketMessage = useRef(false);

    const initializeWebSocketConnection = useCallback(async (userId: number) => {
        try {
            const identificationMessage = `user_id:${userId}`;
            await invoke('send_ws_message', { message: identificationMessage });
            console.log('Mensagem de identificação enviada via WebSocket:', identificationMessage);
        } catch (error) {
            console.error('Erro ao enviar mensagem de identificação WebSocket:', error);
        }
    }, []);

    const joinChat = useCallback(async (chatId: number) => {
        try {
            const message = {
                type: 'JoinChat',
                chat_id: chatId
            };
            await invoke('send_ws_message', { message: JSON.stringify(message) });
            console.log('Entrando no chat:', chatId);
        } catch (error) {
            console.error('Erro ao entrar no chat:', error);
        }
    }, []);

    const leaveChat = useCallback(async (chatId: number) => {
        try {
            const message = {
                type: 'LeaveChat',
                chat_id: chatId
            };
            await invoke('send_ws_message', { message: JSON.stringify(message) });
            console.log('Saindo do chat:', chatId);
        } catch (error) {
            console.error('Erro ao sair do chat:', error);
        }
    }, []);

    const requestOnlineUsers = useCallback(async (chatId: number) => {
        try {
            const message = {
                type: 'RequestOnlineUsers',
                chat_id: chatId
            };
            await invoke('send_ws_message', { message: JSON.stringify(message) });
            console.log('Solicitando usuários online do chat:', chatId);
        } catch (error) {
            console.error('Erro ao solicitar usuários online:', error);
        }
    }, []);

    const updateUserStatus = useCallback(async (status: 'online' | 'offline' | 'away') => {
        try {
            const message = {
                type: 'UpdateStatus',
                status: status
            };
            await invoke('send_ws_message', { message: JSON.stringify(message) });
            console.log('Status atualizado para:', status);
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
        }
    }, []);

    const sendHeartbeat = useCallback(async () => {
        try {
            const message = {
                type: 'Heartbeat'
            };
            await invoke('send_ws_message', { message: JSON.stringify(message) });
        } catch (error) {
            console.error('Erro ao enviar heartbeat:', error);
        }
    }, []);

    const showChatNotification = useCallback((notification: ChatMessageNotification) => {
        if (notification.sender_id === currentUserId) return;
        
        const notificationElement = document.createElement('div');
        notificationElement.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 12px 16px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 1000;
                max-width: 300px;
                animation: slideIn 0.3s ease-out;
            ">
                <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">
                    ${notification.sender_name}
                </div>
                <div style="color: #6b7280; font-size: 14px;">
                    ${notification.content}
                </div>
            </div>
        `;
        
        document.body.appendChild(notificationElement);
        
        setTimeout(() => {
            if (document.body.contains(notificationElement)) {
                document.body.removeChild(notificationElement);
            }
        }, 5000);
    }, [currentUserId]);

    const showConnectionNotification = useCallback((message: string) => {
        const notificationElement = document.createElement('div');
        notificationElement.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #10b981;
                color: white;
                border-radius: 8px;
                padding: 12px 16px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 1000;
                animation: slideIn 0.3s ease-out;
            ">
                ${message}
            </div>
        `;
        
        document.body.appendChild(notificationElement);
        
        setTimeout(() => {
            if (document.body.contains(notificationElement)) {
                document.body.removeChild(notificationElement);
            }
        }, 3000);
    }, []);

    const updateConversationWithNewMessage = useCallback((notification: ChatMessageNotification) => {
        setConversations(prevConversations => {
            return prevConversations.map(conv => {
                if (conv.chatId === notification.chat_id) {
                    return {
                        ...conv,
                        lastMessage: notification.content,
                        lastMessageTime: new Date(notification.timestamp),
                        unreadCount: notification.sender_id !== currentUserId ? conv.unreadCount + 1 : conv.unreadCount
                    };
                }
                return conv;
            });
        });
    }, [currentUserId, setConversations]);

    const updateConversationWithDirectMessage = useCallback((chatMessage: ChatMessageWebSocket) => {
        setConversations(prevConversations => {
            return prevConversations.map(conv => {
                if (conv.chatId === chatMessage.chat_id) {
                    return {
                        ...conv,
                        lastMessage: chatMessage.message.content,
                        lastMessageTime: new Date(chatMessage.message.timestamp),
                        unreadCount: chatMessage.message.user_id !== currentUserId ? conv.unreadCount + 1 : conv.unreadCount
                    };
                }
                return conv;
            });
        });
    }, [currentUserId, setConversations]);

    const handleWebSocketMessage = useCallback((message: any) => {
        if (processingWebSocketMessage.current) {
            return;
        }
        
        processingWebSocketMessage.current = true;
        
        try {
            console.log('Processando mensagem WebSocket estruturada:', message);

            switch (message.type) {
                case 'chat_message_notification':
                    const notification = message as ChatMessageNotification;
                    
                    if (selectedConversation && 
                        notification.chat_id === selectedConversation.chatId && 
                        notification.sender_id !== currentUserId) {
                        fetchChatMessages(selectedConversation.chatId);
                    }
                    
                    updateConversationWithNewMessage(notification);
                    
                    if (notification.sender_id !== currentUserId) {
                        showChatNotification(notification);
                    }
                    break;

                case 'chat_message':
                    const chatMessage = message as ChatMessageWebSocket;
                    
                    if (selectedConversation && 
                        chatMessage.chat_id === selectedConversation.chatId &&
                        chatMessage.message.user_id !== currentUserId) {
                        
                        setMessages(prevMessages => {
                            const messageExists = prevMessages.some(msg => msg.id === chatMessage.message.id);
                            if (!messageExists) {
                                return [...prevMessages, chatMessage.message];
                            }
                            return prevMessages;
                        });
                    }
                    
                    updateConversationWithDirectMessage(chatMessage);
                    break;

                case 'UserOnlineStatus':
                    const onlineStatus = message as UserOnlineStatus;
                    console.log('Status online atualizado:', onlineStatus);
                    if (onUserOnlineStatusUpdate) {
                        onUserOnlineStatusUpdate(onlineStatus);
                    }
                    break;

                case 'ChatOnlineUsers':
                    const chatOnlineUsers = message as ChatOnlineUsers;
                    console.log('Usuários online do chat:', chatOnlineUsers);
                    if (onChatOnlineUsersUpdate) {
                        onChatOnlineUsersUpdate(chatOnlineUsers.online_users);
                    }
                    break;

                case 'UserStatusUpdate':
                    const statusUpdate = message as UserStatusUpdate;
                    console.log('Status do usuário no chat atualizado:', statusUpdate);
                    if (onUserStatusInChatUpdate) {
                        onUserStatusInChatUpdate(
                            statusUpdate.chat_id,
                            statusUpdate.user_id,
                            statusUpdate.status,
                            statusUpdate.user_name
                        );
                    }
                    break;

                case 'UserTyping':
                    const typingUpdate = message as UserTyping;
                    console.log('Status de digitação atualizado:', typingUpdate);
                    if (onUserTypingUpdate) {
                        onUserTypingUpdate(
                            typingUpdate.user_id,
                            typingUpdate.user_name,
                            typingUpdate.chat_id,
                            typingUpdate.is_typing
                        );
                    }
                    break;

                case 'Heartbeat':
                    // Responder ao heartbeat do servidor
                    sendHeartbeat();
                    break;

                default:
                    console.log('Tipo de mensagem WebSocket não reconhecido:', message.type);
                    break;
            }
        } finally {
            setTimeout(() => {
                processingWebSocketMessage.current = false;
            }, 100);
        }
    }, [
        selectedConversation,
        currentUserId,
        fetchChatMessages,
        updateConversationWithNewMessage,
        updateConversationWithDirectMessage,
        showChatNotification,
        setMessages,
        onUserOnlineStatusUpdate,
        onChatOnlineUsersUpdate,
        onUserStatusInChatUpdate,
        onUserTypingUpdate,
        sendHeartbeat
    ]);

    const handleWebSocketTextMessage = useCallback((message: string) => {
        console.log('Processando mensagem WebSocket de texto:', message);
        
        if (message.includes('Conectado como usuário') && message.includes('Bem-vindo ao sistema!')) {
            setIsConnectedToWebSocket(true);
            console.log('Conexão WebSocket confirmada!');
            showConnectionNotification('Conectado ao sistema de chat em tempo real!');
        }
    }, [setIsConnectedToWebSocket, showConnectionNotification]);

    // Entrar automaticamente no chat quando selecionado
    useEffect(() => {
        if (selectedConversation) {
            joinChat(selectedConversation.chatId);
            requestOnlineUsers(selectedConversation.chatId);
        }
    }, [selectedConversation?.chatId, joinChat, requestOnlineUsers]);

    // Configurar heartbeat
    useEffect(() => {
        const heartbeatInterval = setInterval(() => {
            sendHeartbeat();
        }, 30000); // 30 segundos

        return () => {
            clearInterval(heartbeatInterval);
        };
    }, [sendHeartbeat]);

    useEffect(() => {
        const setupWebSocketListener = async () => {
            try {
                const unlistenWebSocket = await listen<string>('nova_mensagem_ws', (event) => {
                    console.log('Evento WebSocket recebido:', event.payload);
                    
                    try {
                        const parsedMessage = JSON.parse(event.payload);
                        handleWebSocketMessage(parsedMessage);
                    } catch (jsonError) {
                        handleWebSocketTextMessage(event.payload);
                    }
                });

                return () => {
                    unlistenWebSocket();
                };
            } catch (error) {
                console.error('Erro ao configurar listener WebSocket:', error);
            }
        };

        setupWebSocketListener();
    }, [handleWebSocketMessage, handleWebSocketTextMessage]);

    return {
        initializeWebSocketConnection,
        joinChat,
        leaveChat,
        requestOnlineUsers,
        updateUserStatus,
        sendHeartbeat
    };
};

