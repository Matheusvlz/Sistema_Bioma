import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, MoreVertical, Phone, Video, Search, Plus, Menu, Check, CheckCheck, X, File, Image, Download } from 'lucide-react';
import { invoke } from "@tauri-apps/api/core";
import './style/ChatContainer.css';

// --- Interfaces ---
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

interface FileUpload {
    file: File;
    preview?: string;
    type: 'image' | 'document';
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
    const [selectedFiles, setSelectedFiles] = useState<FileUpload[]>([]);
    const [showFilePreview, setShowFilePreview] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                    lastMessageTime: chat.last_message ? new Date(chat.last_message.timestamp) : new Date(0),
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

    // Funções para manipulação de arquivos
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            handleFiles(Array.from(files));
        }
    };

    const handleFiles = (files: File[]) => {
        const newFiles: FileUpload[] = [];

        files.forEach(file => {
            const isImage = file.type.startsWith('image/');
            const fileUpload: FileUpload = {
                file,
                type: isImage ? 'image' : 'document'
            };

            if (isImage) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    fileUpload.preview = e.target?.result as string;
                    setSelectedFiles(prev => [...prev, fileUpload]);
                };
                reader.readAsDataURL(file);
            } else {
                newFiles.push(fileUpload);
            }
        });

        if (newFiles.length > 0) {
            setSelectedFiles(prev => [...prev, ...newFiles]);
        }

        setShowFilePreview(true);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        if (selectedFiles.length <= 1) {
            setShowFilePreview(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (fileName: string) => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'pdf':
                return <File className="text-red-500" size={24} />;
            case 'doc':
            case 'docx':
                return <File className="text-blue-500" size={24} />;
            case 'xls':
            case 'xlsx':
                return <File className="text-green-500" size={24} />;
            case 'txt':
                return <File className="text-gray-500" size={24} />;
            default:
                return <File className="text-gray-500" size={24} />;
        }
    };

    const handleSendMessage = async () => {
        if ((newMessage.trim() || selectedFiles.length > 0) && selectedConversation) {
            const now = new Date();
            
            // Enviar mensagem de texto se houver
            if (newMessage.trim()) {
                const messageContent = newMessage.trim();
                
                const tempMessage: Message = {
                    id: Date.now(),
                    user_id: currentUserId,
                    content: messageContent,
                    timestamp: now.toISOString(),
                    user_name: currentUserName,
                    visualizado: false,
                    visualizado_cont: 0,
                    visualizado_hora: null,
                    arquivo: false
                };

                setMessages(prev => [...prev, tempMessage]);
                setNewMessage('');
                
                try {
                    const response = await invoke<Message>('send_message', {
                        chatId: selectedConversation.chatId,
                        userId: currentUserId,
                        content: messageContent,
                        arquivo: false,
                        arquivoNome: null,
                        arquivoTipo: null,
                        arquivoTamanho: null,
                        arquivoUrl: null,
                        fileContent: null,
                    });

                    setMessages(prev => 
                        prev.map(msg => 
                            msg.id === tempMessage.id ? response : msg
                        )
                    );
                } catch (error) {
                    console.error('Erro ao enviar mensagem:', error);
                }
            }

            // Enviar arquivos se houver
            if (selectedFiles.length > 0) {
                for (const fileUpload of selectedFiles) {
                    const tempFileMessage: Message = {
                        id: Date.now() + Math.random(),
                        user_id: currentUserId,
                        content: fileUpload.type === 'image' ? '📷 Imagem' : `📄 ${fileUpload.file.name}`,
                        timestamp: now.toISOString(),
                        user_name: currentUserName,
                        visualizado: false,
                        visualizado_cont: 0,
                        visualizado_hora: null,
                        arquivo: true,
                        arquivo_nome: fileUpload.file.name,
                        arquivo_tipo: fileUpload.file.type,
                        arquivo_tamanho: fileUpload.file.size,
                        arquivo_url: fileUpload.preview
                    };

                    setMessages(prev => [...prev, tempFileMessage]);

                                       try {
                        const reader = new FileReader();
                        reader.onload = async (e) => {
                            const base64Content = e.target?.result as string;
                            const response = await invoke<Message>('send_file_message', {
                                chatId: selectedConversation.chatId,
                                userId: currentUserId,
                                fileName: fileUpload.file.name,
                                fileType: fileUpload.file.type,
                                fileSize: fileUpload.file.size,
                                fileContent: base64Content.split(',')[1] // Remove o prefixo 'data:image/png;base64,'
                            });
                            setMessages(prev => 
                                prev.map(msg => 
                                    msg.id === tempFileMessage.id ? response : msg
                                )
                            );
                        };
                        reader.readAsDataURL(fileUpload.file);
                    } catch (error) {
                        console.error('Erro ao enviar arquivo:', error);
                    }
                }
                
                setSelectedFiles([]);
                setShowFilePreview(false);
            }

            // Atualizar lista de conversas
            setConversations(prevConversations => {
                const updatedConversations = prevConversations.map(conv => {
                    if (conv.chatId === selectedConversation.chatId) {
                        return {
                            ...conv,
                            lastMessage: selectedFiles.length > 0 ? '📎 Arquivo' : newMessage.trim(),
                            lastMessageTime: now,
                        };
                    }
                    return conv;
                });
                
                const updatedSelectedConversation = updatedConversations.find(
                    conv => conv.chatId === selectedConversation.chatId
                );

                const otherConversations = updatedConversations.filter(
                    conv => conv.chatId !== selectedConversation.chatId
                );

                if (updatedSelectedConversation) {
                    return [updatedSelectedConversation, ...otherConversations];
                }
                
                return updatedConversations;
            });
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

    // Funções de formatação de data/hora
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

    const formatReadTime = (timestamp: string | null) => {
        if (!timestamp) return null;
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

                {/* Lista de Contatos */}
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
                        <div 
                            className={`messages-area ${isDragging ? 'dragging' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            {isDragging && (
                                <div className="drag-overlay">
                                    <div className="drag-message">
                                        <Paperclip size={48} />
                                        <p>Solte os arquivos aqui para enviar</p>
                                    </div>
                                </div>
                            )}
                            
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`message-container ${message.user_id === currentUserId ? 'user' : 'other'}`}
                                >
                                    <div className={`message ${message.user_id === currentUserId ? 'user' : 'other'}`}>
                                        {message.user_id !== currentUserId && (
                                            <div className="message-sender">{message.user_name}</div>
                                        )}
                                        
                                        {message.arquivo && message.arquivo_tipo?.startsWith('image/') && message.arquivo_url ? (
                                            <div className="message-image">
                                                <img 
                                                    src={`http://192.168.15.26:8082${message.arquivo_url}`} 
                                                    alt={message.arquivo_nome}
                                                    className="message-image-content"
                                                />
                                                <div className="message-image-info">
                                                    <span>{message.arquivo_nome}</span>
                                                    <span>{message.arquivo_tamanho ? formatFileSize(message.arquivo_tamanho) : ''}</span>
                                                </div>
                                            </div>
                                        ) : message.arquivo ? (
                                            <div className="message-file">
                                                <div className="message-file-icon">
                                                    {getFileIcon(message.arquivo_nome || '')}
                                                </div>
                                                <div className="message-file-info">
                                                    <span className="file-name">{message.arquivo_nome}</span>
                                                    <span className="file-size">
                                                        {message.arquivo_tamanho ? formatFileSize(message.arquivo_tamanho) : ''}
                                                    </span>
                                                </div>
                                                    <a href={`http://192.168.15.26:8082${message.arquivo_url}`} target="_blank" rel="noopener noreferrer" className="file-download-button"/>
                                                    <Download size={16} />
                                             
                                            </div>
                                        ) : (
                                            <p className="message-text">{message.content}</p>
                                        )}
                                        
                                        <div className={`message-footer ${message.user_id === currentUserId ? 'user' : 'other'}`}>
                                            <span className="message-time">{formatMessageTime(message.timestamp)}</span>
                                            {message.user_id === currentUserId && (
                                                <div className="status-checkmarks">
                                                    {message.visualizado ? (
                                                        <CheckCheck size={16} color="#3b82f6" />
                                                    ) : (
                                                        <Check size={16} color="#6b7280" />
                                                    )}
                                                </div>
                                            )}
                                            {message.user_id === currentUserId && message.visualizado_hora && (
                                                <span className="read-time">
                                                    Lido às {formatReadTime(message.visualizado_hora)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* File Preview */}
                        {showFilePreview && selectedFiles.length > 0 && (
                            <div className="file-preview-container">
                                <div className="file-preview-header">
                                    <span>Arquivos selecionados ({selectedFiles.length})</span>
                                    <button 
                                        onClick={() => {
                                            setSelectedFiles([]);
                                            setShowFilePreview(false);
                                        }}
                                        className="close-preview-button"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="file-preview-list">
                                    {selectedFiles.map((fileUpload, index) => (
                                        <div key={index} className="file-preview-item">
                                            {fileUpload.type === 'image' && fileUpload.preview ? (
                                                <img 
                                                    src={fileUpload.preview} 
                                                    alt={fileUpload.file.name}
                                                    className="file-preview-image"
                                                />
                                            ) : (
                                                <div className="file-preview-document">
                                                    {getFileIcon(fileUpload.file.name)}
                                                </div>
                                            )}
                                            <div className="file-preview-info">
                                                <span className="file-preview-name">{fileUpload.file.name}</span>
                                                <span className="file-preview-size">{formatFileSize(fileUpload.file.size)}</span>
                                            </div>
                                            <button 
                                                onClick={() => removeFile(index)}
                                                className="remove-file-button"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="input-area">
                            <div className="input-container">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                />
                                <button 
                                    className="attachment-button"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Paperclip />
                                </button>
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
                                    disabled={!newMessage.trim() && selectedFiles.length === 0}
                                    className="send-button"
                                >
                                    <Send />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="no-conversation-selected">
                        <p>Selecione um contato na lista para iniciar uma conversa.</p>
                    </div>
                )}
            </div>
        </div>
    );
};