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

interface UseChatWebSocketProps {
    currentUserId: number;
    selectedConversation: Conversation | null;
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
    setIsConnectedToWebSocket: React.Dispatch<React.SetStateAction<boolean>>;
    fetchChatMessages: (chatId: number) => Promise<void>;
}

export const useChatWebSocket = ({
    currentUserId,
    selectedConversation,
    setMessages,
    setConversations,
    setIsConnectedToWebSocket,
    fetchChatMessages
}: UseChatWebSocketProps) => {
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

  const updateConversationWithNewMessage = (notification: ChatMessageNotification) => {
        setConversations(prevConversations => {
            return prevConversations.map(conv => {
                if (conv.chatId === notification.chat_id) {
                    return {
                        ...conv,
                        lastMessage: notification.content,
                        lastMessageTime: new Date(notification.timestamp),
                        unreadCount: conv.unreadCount + 1
                    };
                }
                return conv;
            });
        });
    };

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
 const handleWebSocketMessage = (message: any) => {
        console.log('Processando mensagem WebSocket estruturada:', message);

        // Verificar se é uma notificação de mensagem de chat
        if (message.type === 'chat_message_notification') {
            const notification = message as ChatMessageNotification;
            
            // Verificar se a notificação é para o chat atualmente selecionado
            if (selectedConversation && notification.chat_id === selectedConversation.chatId) {
                // Recarregar mensagens do chat atual
                // fetchChatMessages(selectedConversation.chatId);
            }
            
            // Atualizar a lista de conversas com a nova mensagem
            updateConversationWithNewMessage(notification);
            
            // Mostrar notificação visual (opcional)
            showChatNotification(notification);
        }
        
        // Verificar se é uma mensagem de chat direta
        else if (message.type === 'chat_message') {
            const chatMessage = message as ChatMessageWebSocket;
            
            // Se for para o chat atualmente selecionado, adicionar a mensagem
            if (selectedConversation && chatMessage.chat_id === selectedConversation.chatId) {
                setMessages(prevMessages => {
                    // Verificar se a mensagem já existe para evitar duplicatas
                    const messageExists = prevMessages.some(msg => msg.id === chatMessage.message.id);
                    if (!messageExists) {
                        return [...prevMessages, chatMessage.message];
                    }
                    return prevMessages;
                });
            }
            
            // Atualizar lista de conversas
            updateConversationWithDirectMessage(chatMessage);
        }
    };

    const handleWebSocketTextMessage = useCallback((message: string) => {
        console.log('Processando mensagem WebSocket de texto:', message);
        
        if (message.includes('Conectado como usuário') && message.includes('Bem-vindo ao sistema!')) {
            setIsConnectedToWebSocket(true);
            console.log('Conexão WebSocket confirmada!');
            showConnectionNotification('Conectado ao sistema de chat em tempo real!');
        }
    }, [setIsConnectedToWebSocket, showConnectionNotification]);

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
        initializeWebSocketConnection
    };
};
