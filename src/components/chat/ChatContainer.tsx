import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { Users } from 'lucide-react';
import './style/ChatContainer.css';

// Componentes modularizados
import { Sidebar } from './Sidebar';
import { ChatHeader } from './ChatHeader';
import { MessagesArea } from './MessagesArea';
import { InputArea } from './InputArea';
import { FilePreview } from './FilePreview';
import { ImageViewer } from './ImageViewer';
import { PdfViewer } from './PdfViewer';
import { OnlineStatusIndicator } from './OnlineStatusIndicator';
import { TypingIndicator } from './TypingIndicator';
import { OnlineUsersList } from './OnlineUsersList';

// Hooks customizados
import { useChatWebSocket} from './useChatWebSocket';
import { useFileManagement } from './useFileManagement';
import { useMediaViewers } from './useMediaViewers';
import { useOnlineStatus } from './useOnlineStatus';
import { useTypingStatus } from './useTypingStatus';

// Utilitários
import { formatTime, formatMessageTime, formatReadTime, formatFileSize } from './formatters';
import { getFileIcon } from './fileIcons';

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
    const [isUploading, setIsUploading] = useState(false);
    const [isConnectedToWebSocket, setIsConnectedToWebSocket] = useState(false);
    const [showOnlineUsersList, setShowOnlineUsersList] = useState(false);

    // Hooks customizados para status online e digitação
    const {
        onlineUsers,
        chatOnlineUsers,
        updateUserOnlineStatus,
        updateChatOnlineUsers,
        updateUserStatusInChat,
        isUserOnline,
        getUserStatus,
        getCurrentChatOnlineUsers,
        getCurrentChatOnlineCount
    } = useOnlineStatus({ currentUserId, selectedConversation });

    const {
        typingUsers,
        isCurrentUserTyping,
        updateUserTypingStatus,
        handleTyping,
        stopTypingImmediately,
        getTypingText,
        isSomeoneTypingInCurrentChat
    } = useTypingStatus({ currentUserId, selectedConversation });

    // Hooks customizados existentes
    const {
        selectedFiles,
        showFilePreview,
        isDragging,
        handleFileSelect,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        removeFile,
        uploadFile,
        downloadFile,
        clearFiles
    } = useFileManagement({ selectedConversation, currentUserId });

    const {
        imageViewerOpen,
        currentImageUrl,
        currentImageName,
        imageZoom,
        imageRotation,
        openImageViewer,
        closeImageViewer,
        zoomIn,
        zoomOut,
        rotateImage,
        resetImageView,
        pdfViewerOpen,
        currentPdfUrl,
        currentPdfName,
        openPdfViewer,
        closePdfViewer
    } = useMediaViewers();

    // Função para buscar mensagens do chat
    const fetchChatMessages = useCallback(async (chatId: number) => {
        try {
            const response = await invoke<GetMessagesResponse>('get_chat_messages', { chatId });
            console.log('Mensagens recebidas do backend:', response.messages);
            setMessages(response.messages);
        } catch (error) {
            console.error('Erro ao buscar mensagens:', error);
        }
    }, []);

    // Hook WebSocket aprimorado
    const { initializeWebSocketConnection } = useChatWebSocket({
        currentUserId,
        selectedConversation,
        setMessages,
        setConversations,
        setIsConnectedToWebSocket,
        fetchChatMessages,
        onUserOnlineStatusUpdate: updateUserOnlineStatus,
        onChatOnlineUsersUpdate: updateChatOnlineUsers,
        onUserStatusInChatUpdate: updateUserStatusInChat,
        onUserTypingUpdate: updateUserTypingStatus
    });

    // Função para buscar o usuário logado
    const fetchCurrentUser = useCallback(async () => {
        try {
            const user: Usuario | null = await invoke('usuario_logado');
            if (user) {
                setCurrentUserId(user.id);
                setCurrentUserName(user.nome);
                
                // Inicializar conexão WebSocket após obter o usuário
                await initializeWebSocketConnection(user.id);
            }
        } catch (error) {
            console.error('Erro ao buscar usuário logado:', error);
        }
    }, [initializeWebSocketConnection]);

    const fetchUsers = useCallback(async () => {
        try {
            const response = await invoke<GetUsersResponse>('get_users');
            console.log('Usuários recebidos do backend:', response.usuarios);
            setUsers(response.usuarios);
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
        }
    }, []);

    const fetchUserChats = useCallback(async () => {
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
    }, [currentUserId]);

    const handleSelectUserAndStartChat = useCallback(async (targetUser: BackendUser) => {
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
    }, [conversations, currentUserId]);

    const handleSendMessage = useCallback(async () => {
        if (!selectedConversation) return;

        const hasTextMessage = newMessage.trim().length > 0;
        const hasFiles = selectedFiles.length > 0;

        if (!hasTextMessage && !hasFiles) return;

        // Parar de digitar imediatamente ao enviar mensagem
        stopTypingImmediately();

        setIsUploading(true);
        const now = new Date();

        try {
            // Send text message if present
            if (hasTextMessage) {
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
                        content: messageContent
                    });

                    setMessages(prev => 
                        prev.map(msg => 
                            msg.id === tempMessage.id ? response : msg
                        )
                    );
                } catch (error) {
                    console.error('Erro ao enviar mensagem:', error);
                    // Remove the temporary message on error
                    setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
                }
            }

            // Send files if present
            if (hasFiles) {
                const uploadPromises = selectedFiles.map(fileUpload => uploadFile(fileUpload));
                const uploadResults = await Promise.allSettled(uploadPromises);

                const successfulUploads: Message[] = [];
                uploadResults.forEach((result, index) => {
                    if (result.status === 'fulfilled' && result.value) {
                        successfulUploads.push(result.value);
                    }
                });

                if (successfulUploads.length > 0) {
                    setMessages(prev => [...prev, ...successfulUploads]);
                }

                // Clear files after upload attempt
                clearFiles();
            }

            // Update conversation list
            const lastMessageContent = hasFiles ? '📎 Arquivo' : (hasTextMessage ? newMessage.trim() : '');
            setConversations(prevConversations => {
                const updatedConversations = prevConversations.map(conv => {
                    if (conv.chatId === selectedConversation.chatId) {
                        return {
                            ...conv,
                            lastMessage: lastMessageContent,
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

        } catch (error) {
            console.error('Erro ao enviar mensagem/arquivo:', error);
        } finally {
            setIsUploading(false);
        }
    }, [selectedConversation, newMessage, selectedFiles, currentUserId, currentUserName, uploadFile, clearFiles, stopTypingImmediately]);

    // Função para lidar com mudanças no input de mensagem
    const handleMessageInputChange = useCallback((value: string) => {
        setNewMessage(value);
        
        // Gerenciar status de digitação
        if (value.trim().length > 0) {
            handleTyping();
        }
    }, [handleTyping]);

    // --- Effects ---
    useEffect(() => {
        fetchCurrentUser();
    }, [fetchCurrentUser]);

    useEffect(() => {
        if (currentUserId > 0) {
            fetchUsers();
            fetchUserChats();
        }
    }, [currentUserId, fetchUsers, fetchUserChats]);

    useEffect(() => {
        if (selectedConversation) {
            fetchChatMessages(selectedConversation.chatId);
        }
    }, [selectedConversation, fetchChatMessages]);

    // Memoized filtered and sorted users
    const filteredAndSortedUsers = useMemo(() => {
        return users
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
    }, [users, currentUserId, searchQuery, conversations]);

    // Handlers
    const handleToggleSidebar = useCallback(() => {
        setSidebarOpen(prev => !prev);
    }, []);

    // Componente do cabeçalho do chat aprimorado
    const EnhancedChatHeader = useCallback(() => {
        if (!selectedConversation) return null;

        const otherUser = selectedConversation.members.find(member => member.id !== currentUserId);
        const isOnline = otherUser ? isUserOnline(otherUser.id) : false;
        const userStatus = otherUser ? getUserStatus(otherUser.id) : 'offline';
        const onlineCount = getCurrentChatOnlineCount();

        return (
            <div className="chat-header">
                <button 
                    className="sidebar-toggle"
                    onClick={handleToggleSidebar}
                >
                    ☰
                </button>
                
                <div className="chat-header-info">
                    <div className="chat-avatar-container">
                        <img 
                            src={selectedConversation.avatar} 
                            alt={selectedConversation.name}
                            className="chat-avatar"
                        />
                        {otherUser && (
                            <div className="avatar-status-indicator">
                                <OnlineStatusIndicator 
                                    isOnline={isOnline}
                                    status={userStatus}
                                    size="small"
                                />
                            </div>
                        )}
                    </div>
                    
                    <div className="chat-info">
                        <h3 className="chat-name">{selectedConversation.name}</h3>
                        <div className="chat-status">
                            {otherUser && (
                                <OnlineStatusIndicator 
                                    isOnline={isOnline}
                                    status={userStatus}
                                    size="small"
                                    showText={true}
                                />
                            )}
                        </div>
                    </div>
                </div>

                <div className="chat-header-actions">
                    {onlineCount > 0 && (
                        <button 
                            className="online-users-button"
                            onClick={() => setShowOnlineUsersList(true)}
                            title={`${onlineCount} usuário(s) online`}
                        >
                            <Users size={20} />
                            <span className="online-count">{onlineCount}</span>
                        </button>
                    )}
                </div>
            </div>
        );
    }, [selectedConversation, currentUserId, isUserOnline, getUserStatus, getCurrentChatOnlineCount, handleToggleSidebar]);

    return (
        <div className="chat-container">
            {/* Sidebar */}
            <Sidebar
                sidebarOpen={sidebarOpen}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filteredAndSortedUsers={filteredAndSortedUsers}
                conversations={conversations}
                selectedConversation={selectedConversation}
                onSelectUser={handleSelectUserAndStartChat}
                formatTime={formatTime}
                isUserOnline={isUserOnline}
                getUserStatus={getUserStatus}
            />

            {/* Main Chat Area */}
            <div className="chat-main">
                {selectedConversation ? (
                    <>
                        {/* Chat Header Aprimorado */}
                        <EnhancedChatHeader />

                        {/* Messages Area */}
                        <MessagesArea
                            messages={messages}
                            currentUserId={currentUserId}
                            isDragging={isDragging}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onOpenImageViewer={openImageViewer}
                            onOpenPdfViewer={openPdfViewer}
                            onDownloadFile={downloadFile}
                            formatMessageTime={formatMessageTime}
                            formatReadTime={formatReadTime}
                            formatFileSize={formatFileSize}
                            getFileIcon={getFileIcon}
                        />

                        {/* Indicador de Digitação */}
                        <TypingIndicator 
                            typingText={getTypingText()}
                            isVisible={isSomeoneTypingInCurrentChat()}
                        />

                        {/* File Preview */}
                        <FilePreview
                            showFilePreview={showFilePreview}
                            selectedFiles={selectedFiles}
                            onRemoveFile={removeFile}
                            onClosePreview={clearFiles}
                            isUploading={isUploading}
                            formatFileSize={formatFileSize}
                            getFileIcon={getFileIcon}
                        />

                        {/* Input Area */}
                        <InputArea
                            newMessage={newMessage}
                            setNewMessage={handleMessageInputChange}
                            onSendMessage={handleSendMessage}
                            onFileSelect={handleFileSelect}
                            isUploading={isUploading}
                            selectedFilesCount={selectedFiles.length}
                            isTyping={isCurrentUserTyping}
                        />
                    </>
                ) : (
                    <div className="no-conversation-selected">
                        <p>Selecione um contato na lista para iniciar uma conversa.</p>
                    </div>
                )}
            </div>

            {/* Lista de Usuários Online */}
            <OnlineUsersList
                users={getCurrentChatOnlineUsers()}
                currentUserId={currentUserId}
                isVisible={showOnlineUsersList}
                onClose={() => setShowOnlineUsersList(false)}
            />

            {/* Visualizador de Imagens */}
            <ImageViewer
                isOpen={imageViewerOpen}
                imageUrl={currentImageUrl}
                imageName={currentImageName}
                zoom={imageZoom}
                rotation={imageRotation}
                onClose={closeImageViewer}
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
                onRotate={rotateImage}
                onReset={resetImageView}
                onDownload={downloadFile}
            />

            {/* Visualizador de PDF */}
            <PdfViewer
                isOpen={pdfViewerOpen}
                pdfUrl={currentPdfUrl}
                pdfName={currentPdfName}
                onClose={closePdfViewer}
                onDownload={downloadFile}
            />

      
        </div>
    );
};

