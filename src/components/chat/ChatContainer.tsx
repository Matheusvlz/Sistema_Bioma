import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, MoreVertical, Phone, Video, Search, Plus, Menu } from 'lucide-react';
import { invoke } from "@tauri-apps/api/core";
import './style/ChatContainer.css';

// --- Interfaces (sem alterações) ---
interface Message {
    id: number;
    user_id: number;
    content: string;
    timestamp: string;
    user_name: string;
}

interface BackendUser {
    id: number;
    nome: string;
    ativo: boolean;
    nome_completo: string | null;
    cargo: string | null;
    profile_photo_path: string | null;
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

interface ChatInfo {
    id: number;
    group_id: number;
    group_name: string;
    group_description: string | null;
    group_profile_photo: string | null;
    members: BackendUser[];
    last_message: Message | null;
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

interface GetUsersResponse {
    usuarios: BackendUser[];
}

interface GetChatsResponse {
    chats: ChatInfo[];
}

interface GetMessagesResponse {
    messages: Message[];
}

export const ChatContainer: React.FC = () => {
    // --- State Hooks ---
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [users, setUsers] = useState<BackendUser[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<number>(1);
    const [currentUserName, setCurrentUserName] = useState<string>('Você');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Função para buscar o usuário logado
    const fetchCurrentUser = async () => {
      try {
        const user: Usuario | null = await invoke('usuario_logado');
        if (user) {
          setCurrentUserId(user.id);
          setCurrentUserName(user.nome);
        }
      } catch (error) {
        console.error('Erro ao buscar usuário logado:', error);
      }
    };

    const fetchUsers = async () => {
        try {
            const response = await invoke<GetUsersResponse>('get_users');
            console.log('Usuários recebidos do backend:', response.usuarios);
            setUsers(response.usuarios);
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
        }
    };

    const fetchUserChats = async () => {
        try {
            const response = await invoke<GetChatsResponse>('get_user_chats', { userId: currentUserId });
            console.log('Chats recebidos do backend:', response.chats);

            const fetchedConversations: Conversation[] = response.chats.map(chat => {
                let chatName = chat.group_name;
                let chatAvatar = chat.group_profile_photo;

                if (chat.members.length === 2) {
                    const otherUser = chat.members.find(member => member.id !== currentUserId);
                    if (otherUser) {
                        chatName = otherUser.nome;
                        chatAvatar = otherUser.profile_photo_path;
                    }
                }

                return {
                    id: chat.id.toString(),
                    chatId: chat.id,
                    name: chatName,
                    avatar: chatAvatar
                        ? `http://192.168.15.26:8082${chatAvatar}`
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(chatName)}&background=random`,
                    lastMessage: chat.last_message?.content || 'Nenhuma mensagem',
                    lastMessageTime: chat.last_message ? new Date(chat.last_message.timestamp) : new Date(0), // Corrigido aqui
                    unreadCount: 0,
                    status: 'online', 
                    members: chat.members
                };
            });

            setConversations(fetchedConversations);
        } catch (error) {
            console.error('Erro ao buscar chats:', error);
        }
    };
    
    const fetchChatMessages = async (chatId: number) => {
        try {
            const response = await invoke<GetMessagesResponse>('get_chat_messages', { chatId });
            console.log('Mensagens recebidas do backend:', response.messages);
            setMessages(response.messages);
        } catch (error) {
            console.error('Erro ao buscar mensagens:', error);
        }
    };
    
    const handleSelectUserAndStartChat = async (targetUser: BackendUser) => {
        const existingConversation = conversations.find(conv => 
            conv.members.length === 2 && conv.members.some(member => member.id === targetUser.id)
        );

        if (existingConversation) {
            setSelectedConversation(existingConversation);
        } else {
            try {
                const newChatInfo = await invoke<ChatInfo>('create_direct_chat', {
                    currentUserId: currentUserId,
                    targetUserId: targetUser.id
                });
                console.log('Chat criado:', newChatInfo);

                const newConversation: Conversation = {
                    id: newChatInfo.id.toString(),
                    chatId: newChatInfo.id,
                    name: targetUser.nome,
                    avatar: targetUser.profile_photo_path
                        ? `http://192.168.15.26:8082${targetUser.profile_photo_path}`
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(targetUser.nome)}&background=random`,
                    lastMessage: 'Nenhuma mensagem',
                    lastMessageTime: new Date(0),
                    unreadCount: 0,
                    status: 'online',
                    members: newChatInfo.members
                };

                setConversations(prev => [...prev, newConversation]);
                setSelectedConversation(newConversation);
                setMessages([]);
            } catch (error) {
                console.error('Erro ao criar chat:', error);
            }
        }
        setSearchQuery('');
    };
    
const handleSendMessage = async () => {
        if (newMessage.trim() && selectedConversation) {
            const messageContent = newMessage.trim();
            const now = new Date();
            
            // 1. Criar a mensagem temporária para exibir imediatamente
            const tempMessage: Message = {
                id: Date.now(),
                user_id: currentUserId,
                content: messageContent,
                timestamp: now.toISOString(),
                user_name: currentUserName // Usa o nome do usuário atual
            };

            // 2. Adicionar a mensagem à lista de mensagens e limpar o input
            setMessages(prev => [...prev, tempMessage]);
            setNewMessage('');
            
            // 3. ATUALIZAR A LISTA DE CONVERSAS IMEDIATAMENTE (NOVO)
            setConversations(prevConversations => {
                const updatedConversations = prevConversations.map(conv => {
                    // Encontra a conversa que acabou de receber a nova mensagem
                    if (conv.chatId === selectedConversation.chatId) {
                        return {
                            ...conv,
                            lastMessage: messageContent,
                            lastMessageTime: now,
                        };
                    }
                    return conv;
                });
                
                // Encontra a conversa atualizada
                const updatedSelectedConversation = updatedConversations.find(
                    conv => conv.chatId === selectedConversation.chatId
                );

                // Filtra as outras conversas (para não duplicar)
                const otherConversations = updatedConversations.filter(
                    conv => conv.chatId !== selectedConversation.chatId
                );

                // Retorna uma nova lista com a conversa atualizada no topo
                if (updatedSelectedConversation) {
                    return [updatedSelectedConversation, ...otherConversations];
                }
                
                return updatedConversations;
            });
            
            // 4. Enviar a mensagem para o backend
            try {
                const response = await invoke<Message>('send_message', {
                    chatId: selectedConversation.chatId,
                    userId: currentUserId,
                    content: messageContent
                });

                console.log('Mensagem enviada para API:', response);
                
                // Opcional: Atualizar a mensagem temporária com o ID real da API
                setMessages(prev => 
                    prev.map(msg => 
                        msg.id === tempMessage.id ? response : msg
                    )
                );
                
            } catch (error) {
                console.error('Erro ao enviar mensagem:', error);
            }
        }
    };
    
    // --- Effects ---
    useEffect(() => {
        fetchCurrentUser();
    }, []);

    useEffect(() => {
        fetchUsers();
        fetchUserChats();
    }, [currentUserId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (selectedConversation) {
            fetchChatMessages(selectedConversation.chatId);
        }
    }, [selectedConversation]);

    const filteredAndSortedUsers = users
        .filter(user =>
            user.id !== currentUserId &&
            user.nome.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            const convA = conversations.find(conv => conv.members.length === 2 && conv.members.some(m => m.id === a.id));
            const convB = conversations.find(conv => conv.members.length === 2 && conv.members.some(m => m.id === b.id));
            
            const timeA = convA?.lastMessageTime || new Date(0); 
            const timeB = convB?.lastMessageTime || new Date(0); 
            
            return timeB.getTime() - timeA.getTime();
        });

    // Funções de formatação de data/hora (sem alterações)
    const formatTime = (date: Date) => {
        const now = new Date();
        if(!date || isNaN(date.getTime())) return '';
        const diff = now.getTime() - date.getTime();
        if (diff < 60000) return 'agora';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
        if (diff < 86400000) return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        if (diff < 604800000) return date.toLocaleDateString('pt-BR', { weekday: 'short' });
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    const formatMessageTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="chat-container">
            {/* Sidebar */}
            <div className={`sidebar ${!sidebarOpen ? 'closed' : ''}`}>
                {/* Sidebar Header */}
                <div className="sidebar-header">
                    <div className="sidebar-header-top">
                        <h1 className="sidebar-title">Contatos</h1>
                    </div>
                    {/* Search Bar */}
                    <div className="search-container">
                        <Search className="search-icon" />
                        <input
                            type="text"
                            placeholder="Pesquisar contatos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                    </div>
                </div>

                {/* Lista de Contatos (renderiza todos os usuários) */}
                <div className="conversations-list">
                    {filteredAndSortedUsers.map((user) => {
                        const conversation = conversations.find(conv => 
                            conv.members.length === 2 && conv.members.some(m => m.id === user.id)
                        );
                        
                        const isSelected = selectedConversation?.members.some(m => m.id === user.id);

                        return (
                            <div
                                key={user.id}
                                onClick={() => handleSelectUserAndStartChat(user)}
                                className={`conversation-item ${isSelected ? 'selected' : ''}`}
                            >
                                <div className="conversation-content">
                                    <div className="avatar-container">
                                        <img
                                            src={user.profile_photo_path
                                                ? `http://192.168.15.26:8082${user.profile_photo_path}`
                                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nome)}&background=random`
                                            }
                                            alt={user.nome}
                                            className="avatar"
                                        />
                                    </div>
                                    <div className="conversation-info">
                                        <div className="conversation-header">
                                            <h3 className="conversation-name">{user.nome}</h3>
                                            {conversation && (
                                                <span className="conversation-time">
                                                    {formatTime(conversation.lastMessageTime)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="conversation-footer">
                                            <p className="conversation-message">
                                                {conversation?.lastMessage || user.cargo || 'Disponível'}
                                            </p>
                                            {conversation && conversation.unreadCount > 0 && (
                                                <span className="unread-badge">
                                                    {conversation.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="chat-main">
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="chat-header">
                            <div className="chat-header-left">
                                <button
                                    onClick={() => setSidebarOpen(!sidebarOpen)}
                                    className="menu-button"
                                >
                                    <Menu />
                                </button>
                                <div className="avatar-container">
                                    <img
                                        src={selectedConversation.avatar}
                                        alt={selectedConversation.name}
                                        className="chat-header-avatar"
                                    />
                                    <div className={`status-indicator ${
                                        selectedConversation.status === 'online' ? 'status-online' : 'status-offline'
                                    }`}></div>
                                </div>
                                <div className="chat-header-info">
                                    <h2>{selectedConversation.name}</h2>
                                    <p>
                                        {selectedConversation.status === 'online' ? 'Online' : 'Offline'}
                                    </p>
                                </div>
                            </div>
                            <div className="chat-header-actions">
                                <button className="action-button"><Search /></button>
                                <button className="action-button"><Phone /></button>
                                <button className="action-button"><Video /></button>
                                <button className="action-button"><MoreVertical /></button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="messages-area">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`message-container ${message.user_id === currentUserId ? 'user' : 'other'}`}
                                >
                                    <div className={`message ${message.user_id === currentUserId ? 'user' : 'other'}`}>
                                        {message.user_id !== currentUserId && (
                                          <div className="message-sender">{message.user_name}</div>
                                        )}
                                        <p className="message-text">{message.content}</p>
                                        <div className={`message-footer ${message.user_id === currentUserId ? 'user' : 'other'}`}>
                                            <span className="message-time">{formatMessageTime(message.timestamp)}</span>
                                            {message.user_id === currentUserId && (
                                                <div className="message-status status-sent">✓</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="input-area">
                            <div className="input-container">
                                <button className="attachment-button"><Paperclip /></button>
                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        placeholder="Digite sua mensagem..."
                                        className="message-input"
                                    />
                                    <button className="emoji-button"><Smile /></button>
                                </div>
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!newMessage.trim()}
                                    className="send-button"
                                >
                                    <Send />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    // Mensagem inicial
                    <div className="no-conversation-selected">
                        <p>Selecione um contato na lista para iniciar uma conversa.</p>
                    </div>
                )}
            </div>
        </div>
    );
};