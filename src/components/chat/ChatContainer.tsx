import React, { useState, useRef, useEffect } from 'react';
import { FileCode, Send, Paperclip, Smile, MoreVertical, Phone, Video, Search, Menu, Check, CheckCheck, X, File, Download, Upload, AlertCircle, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import './style/ChatContainer.css';
import { useVideoCall } from '../../hooks/useVideoCall';
import { VideoCallComponent } from './VideoCallComponent';
import { IncomingCallModal } from './IncomingCallModal';
import { AttentionButton } from './AttentionButton';
import './style/AttentionAnimations.css';
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
    logado?: boolean; // Campo opcional para status de login
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
    uploading?: boolean;
    uploadProgress?: number;
    error?: string;
}


// Interface para notificação de mensagem de chat
interface ChatMessageNotification {
    type: string;
    sender_id: number;
    chat_id: number;
    sender_name: string;
    sender_avatar: string | null;
    content: string;
    timestamp: string;
}

// Interface para mensagem de chat via WebSocket
interface ChatMessageWebSocket {
    type: string;
    chat_id: number;
    message: Message;
}

// Interface para informações de usuário online
interface OnlineUserInfo {
    user_id: number;
    user_name: string;
    last_activity: string;
}

// Interface para lista de usuários online
interface OnlineUsersListMessage {
    type: string;
    online_users: OnlineUserInfo[];
}

// Interface para mudança de status online
interface UserOnlineStatusChangedMessage {
    type: string;
    user_id: number;
    user_name: string;
    is_online: boolean;
}

export const ChatContainer: React.FC = () => {
    // --- State Hooks ---
    // Estados para visualizador de código
    const [isShaking, setIsShaking] = useState(false);
const [highlightChatId, setHighlightChatId] = useState<number | null>(null);

    const [codeViewerOpen, setCodeViewerOpen] = useState(false);
    const [codeContent, setCodeContent] = useState<string>('');
    const [codeLanguage, setCodeLanguage] = useState<string>('text');
    const [currentCodeName, setCurrentCodeName] = useState<string>('');
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
    const [isUploading, setIsUploading] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());

    // Estados para visualizadores
    const [imageViewerOpen, setImageViewerOpen] = useState(false);
    const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
    const [currentImageName, setCurrentImageName] = useState<string>('');
    const [imageZoom, setImageZoom] = useState(1);
    const [imageRotation, setImageRotation] = useState(0);
    const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
    const [currentPdfUrl, setCurrentPdfUrl] = useState<string>('');
    const [currentPdfName, setCurrentPdfName] = useState<string>('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

        const {
        callState,
        isCallWsConnected,
        incomingCallInfo,        // NOVO
        acceptIncomingCall,      // NOVO
        rejectIncomingCall,      // NOVO
        startAudioCall,
        startVideoCall,
        endCall,
        checkUserAvailability,
        sendSignalingMessage,    // NOVO
        callWsRef,               // NOVO
    } = useVideoCall(currentUserId, currentUserName);
    


    VideoCallComponent
    useEffect(() => {
        if (!callWsRef.current) return;

        const ws = callWsRef.current;
        
        const handleMessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                
                // Disparar evento customizado para VideoCallComponent
                const customEvent = new CustomEvent('call-signaling-message', {
                    detail: data
                });
                window.dispatchEvent(customEvent);
            } catch (error) {
                console.error('Erro ao processar mensagem WebSocket:', error);
            }
        };

        ws.addEventListener('message', handleMessage);

        return () => {
            ws.removeEventListener('message', handleMessage);
        };
    }, [callWsRef.current]);

     const handleStartAudioCall = async () => {
        if (!selectedConversation) return;

        const recipientId = selectedConversation.members.find(
            (m: any) => m.id !== currentUserId
        )?.id;
        
        if (!recipientId) {
            alert('Não foi possível identificar o destinatário');
            return;
        }

        // Verificar disponibilidade
        const available = await checkUserAvailability(recipientId);
       

        const recipientName = selectedConversation.members.find(
            (m: any) => m.id !== currentUserId
        )?.nome || 'Usuário';

        startAudioCall(recipientId, recipientName, selectedConversation.chatId);
    };

    // Função para iniciar chamada de vídeo
    const handleStartVideoCall = async () => {
        if (!selectedConversation) return;

        const recipientId = selectedConversation.members.find(
            (m: any) => m.id !== currentUserId
        )?.id;
        
        if (!recipientId) {
            alert('Não foi possível identificar o destinatário');
            return;
        }

        // Verificar disponibilidade
        const available = await checkUserAvailability(recipientId);
      

        const recipientName = selectedConversation.members.find(
            (m: any) => m.id !== currentUserId
        )?.nome || 'Usuário';

        startVideoCall(recipientId, recipientName, selectedConversation.chatId);
    };

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
                
                // Inicializar conexão WebSocket após obter o usuário
                await initializeWebSocketConnection(user.id);
            }
        } catch (error) {
            console.error('Erro ao buscar usuário logado:', error);
        }
    };

    // Função para inicializar a conexão WebSocket
    const initializeWebSocketConnection = async (userId: number) => {
        try {
            // Enviar mensagem de identificação via WebSocket
            const identificationMessage = `user_id:${userId}`;
            await invoke('send_ws_message', { message: identificationMessage });
            console.log('Mensagem de identificação enviada via WebSocket:', identificationMessage);
        } catch (error) {
            console.error('Erro ao enviar mensagem de identificação WebSocket:', error);
        }
    };

    // Listener para eventos WebSocket
    useEffect(() => {
        const setupWebSocketListener = async () => {
            try {
                // Escutar eventos de nova mensagem WebSocket
                const unlistenWebSocket = await listen<string>('nova_mensagem_ws', (event) => {
                    console.log('Evento WebSocket recebido:', event.payload);
                    
                    try {
                        // Tentar parsear como JSON primeiro
                        const parsedMessage = JSON.parse(event.payload);
                        handleWebSocketMessage(parsedMessage);
                    } catch (jsonError) {
                        // Se não for JSON, tratar como mensagem de texto simples
                        handleWebSocketTextMessage(event.payload);
                    }
                });

                // Cleanup function
                return () => {
                    unlistenWebSocket();
                };
            } catch (error) {
                console.error('Erro ao configurar listener WebSocket:', error);
            }
        };

        setupWebSocketListener();
    }, [selectedConversation, currentUserId]);

    // Função para lidar com mensagens WebSocket estruturadas
    const handleWebSocketMessage = (message: any) => {
        console.log('Processando mensagem WebSocket estruturada:', message);

        // Verificar se é uma lista de usuários online
        if (message.type === 'OnlineUsersList') {
            const onlineListMessage = message as OnlineUsersListMessage;
            const onlineUserIds = new Set(onlineListMessage.online_users.map(user => user.user_id));
            setOnlineUsers(onlineUserIds);
            console.log('Lista de usuários online recebida:', onlineUserIds);
        }
        
        // Verificar se é uma mudança de status online
        else if (message.type === 'UserOnlineStatusChanged') {
            const statusMessage = message as UserOnlineStatusChangedMessage;
            setOnlineUsers(prevOnlineUsers => {
                const newOnlineUsers = new Set(prevOnlineUsers);
                if (statusMessage.is_online) {
                    newOnlineUsers.add(statusMessage.user_id);
                } else {
                    newOnlineUsers.delete(statusMessage.user_id);
                }
                console.log(`Usuário ${statusMessage.user_name} (ID: ${statusMessage.user_id}) está agora ${statusMessage.is_online ? 'online' : 'offline'}`);
                return newOnlineUsers;
            });
        }

        // Verificar se é uma notificação de mensagem de chat
        else if (message.type === 'chat_message_notification') {
            const notification = message as ChatMessageNotification;
            
            // Verificar se a notificação é para o chat atualmente selecionado
            if (selectedConversation && notification.chat_id === selectedConversation.chatId) {
                // Recarregar mensagens do chat atual
                 fetchChatMessages(selectedConversation.chatId);
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

    // Função para lidar com mensagens de texto simples do WebSocket
    const handleWebSocketTextMessage = (message: string) => {
        console.log('Processando mensagem WebSocket de texto:', message);
        
        // Verificar se é uma mensagem de confirmação de conexão
        if (message.includes('Conectado como usuário') && message.includes('Bem-vindo ao sistema!')) {
   
            console.log('Conexão WebSocket confirmada!');
            
            // Mostrar notificação de conexão (opcional)
            showConnectionNotification('Conectado ao sistema de chat em tempo real!');
        }
    };

    // Função para atualizar conversa com nova mensagem (notificação)
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
    // Detectar linguagem baseada na extensão
    const getLanguageFromFilename = (filename: string): string => {
        const ext = filename.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'rs': return 'rust';
            case 'ts': case 'tsx': return 'typescript';
            case 'js': case 'jsx': return 'javascript';
            case 'java': return 'java';
            case 'php': return 'php';
            case 'c': return 'c';
            case 'cpp': case 'h': return 'cpp';
            case 'cs': return 'csharp';
            case 'kt': case 'kts': return 'kotlin';
            case 'py': return 'python';
            case 'html': return 'html';
            case 'css': return 'css';
            case 'json': return 'json';
            case 'sql': return 'sql';
            default: return 'text';
        }
    };

    // Verificar se é arquivo de código
    const isCodeFile = (filename: string): boolean => {
        const extensions = ['rs', 'ts', 'tsx', 'js', 'jsx', 'java', 'php', 'c', 'cpp', 'cs', 'kt', 'py', 'html', 'css', 'json', 'sql', 'xml'];
        const ext = filename.split('.').pop()?.toLowerCase();
        return extensions.includes(ext || '');
    };

    // Abrir o visualizador de código (Faz fetch do conteúdo)
    const openCodeViewer = async (url: string, filename: string) => {
        try {
            // Mostrar loading ou algo similar se necessário
            const response = await fetch(url);
            const text = await response.text();
            
            setCodeContent(text);
            setCurrentCodeName(filename);
            setCodeLanguage(getLanguageFromFilename(filename));
            setCodeViewerOpen(true);
        } catch (error) {
            console.error("Erro ao carregar código:", error);
            alert("Não foi possível carregar o código fonte.");
        }
    };

    const closeCodeViewer = () => {
        setCodeViewerOpen(false);
        setCodeContent('');
    };

    // Função para atualizar conversa com mensagem direta
    const updateConversationWithDirectMessage = (chatMessage: ChatMessageWebSocket) => {
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
    };

    // Função para mostrar notificação de chat
    const showChatNotification = (notification: ChatMessageNotification) => {
        // Não mostrar notificação se for do próprio usuário
        if (notification.sender_id === currentUserId) return;
        
        // Criar elemento de notificação
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
        
        // Remover após 5 segundos
        setTimeout(() => {
            if (document.body.contains(notificationElement)) {
                document.body.removeChild(notificationElement);
            }
        }, 5000);
    };

    // Função para mostrar notificação de conexão
    const showConnectionNotification = (message: string) => {
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
        
        // Remover após 3 segundos
        setTimeout(() => {
            if (document.body.contains(notificationElement)) {
                document.body.removeChild(notificationElement);
            }
        }, 3000);
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
                        ? `http://127.0.0.1:8082${chatAvatar}`
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
            if(selectedConversation?.chatId === chatId)
            {
                console.log("value:", selectedConversation?.chatId );
                  const response = await invoke<GetMessagesResponse>('get_chat_messages', { chatId });
                console.log('Mensagens recebidas do backend:', response.messages);
            setMessages(response.messages);
            }
          
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
                        ? `http://127.0.0.1:8082${targetUser.profile_photo_path}`
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
   const validateFile = (file: File): string | null => {
        // Permitir tudo que for código ou texto, além das imagens e docs
        // Lógica simplificada: se não for muito grande, passa.
        // O backend fará a validação final de segurança.
        
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            return `Arquivo muito grande. Tamanho máximo: 50MB`;
        }
        return null;
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            handleFiles(Array.from(files));
        }
        // Reset input value to allow selecting the same file again
        event.target.value = '';
    };

    const handleFiles = (files: File[]) => {
        const newFiles: FileUpload[] = [];

        files.forEach(file => {
            const validationError = validateFile(file);
            if (validationError) {
                console.error(validationError);
                // You could show a toast notification here
                return;
            }

            const isImage = file.type.startsWith('image/');
            const fileUpload: FileUpload = {
                file,
                type: isImage ? 'image' : 'document',
                uploading: false,
                uploadProgress: 0,
                error: undefined
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
        if (isCodeFile(fileName)) {
            return <FileCode className="text-purple-500" size={24} />;
        }
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

    // Funções para download de arquivos usando Tauri
    const downloadFile = async (url: string, fileName: string) => {
        try {
            // Mostrar indicador de loading
            const loadingToast = document.createElement('div');
            loadingToast.textContent = 'Baixando arquivo...';
            loadingToast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #3b82f6;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                z-index: 1000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            `;
            document.body.appendChild(loadingToast);

            // Usar a função que salva na pasta Downloads
            const filePath = await invoke('download_file_to_downloads', {
                url: url,
                fileName: fileName
            });
            
            console.log('Arquivo baixado com sucesso:', filePath);
            
            // Remover loading e mostrar sucesso
            document.body.removeChild(loadingToast);
            
            const successToast = document.createElement('div');
            successToast.textContent = 'Arquivo baixado com sucesso!';
            successToast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #10b981;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                z-index: 1000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            `;
            document.body.appendChild(successToast);
            
            setTimeout(() => {
                if (document.body.contains(successToast)) {
                    document.body.removeChild(successToast);
                }
            }, 3000);
            
        } catch (error) {
            console.error('Erro ao fazer download do arquivo:', error);
            
            // Remover loading se existir
            const loadingToast = document.querySelector('div[style*="Baixando arquivo"]');
            if (loadingToast) {
                document.body.removeChild(loadingToast);
            }
            
            // Mostrar erro
            const errorToast = document.createElement('div');
            errorToast.textContent = 'Erro ao fazer download do arquivo';
            errorToast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ef4444;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                z-index: 1000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            `;
            document.body.appendChild(errorToast);
            
            setTimeout(() => {
                if (document.body.contains(errorToast)) {
                    document.body.removeChild(errorToast);
                }
            }, 3000);
        }
    };

    // Funções para visualizador de imagens
    const openImageViewer = (imageUrl: string, imageName: string) => {
        setCurrentImageUrl(imageUrl);
        setCurrentImageName(imageName);
        setImageZoom(1);
        setImageRotation(0);
        setImageViewerOpen(true);
    };

    const closeImageViewer = () => {
        setImageViewerOpen(false);
        setCurrentImageUrl('');
        setCurrentImageName('');
        setImageZoom(1);
        setImageRotation(0);
    };

    const zoomIn = () => {
        setImageZoom(prev => Math.min(prev + 0.25, 3));
    };

    const zoomOut = () => {
        setImageZoom(prev => Math.max(prev - 0.25, 0.25));
    };

    const rotateImage = () => {
        setImageRotation(prev => (prev + 90) % 360);
    };

    const resetImageView = () => {
        setImageZoom(1);
        setImageRotation(0);
    };

    // Funções para visualizador de PDF
    const openPdfViewer = (pdfUrl: string, pdfName: string) => {
        setCurrentPdfUrl(pdfUrl);
        setCurrentPdfName(pdfName);
        setPdfViewerOpen(true);
    };

    const closePdfViewer = () => {
        setPdfViewerOpen(false);
        setCurrentPdfUrl('');
        setCurrentPdfName('');
    };

    const uploadFile = async (fileUpload: FileUpload): Promise<Message | null> => {
        try {
            // Update file upload state
            setSelectedFiles(prev => 
                prev.map(f => 
                    f.file === fileUpload.file 
                        ? { ...f, uploading: true, uploadProgress: 0, error: undefined }
                        : f
                )
            );

            const reader = new FileReader();
            return new Promise((resolve, reject) => {
                reader.onload = async (e) => {
                    try {
                        const base64Content = e.target?.result as string;
                        const base64Data = base64Content.split(',')[1]; // Remove the prefix 'data:image/png;base64,'

                        // Simulate progress updates
                        for (let progress = 10; progress <= 90; progress += 20) {
                            setSelectedFiles(prev => 
                                prev.map(f => 
                                    f.file === fileUpload.file 
                                        ? { ...f, uploadProgress: progress }
                                        : f
                                )
                            );
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }

                        const response = await invoke<Message>('send_file_message', {
                            chatId: selectedConversation!.chatId,
                            userId: currentUserId,
                            fileName: fileUpload.file.name,
                            fileType: fileUpload.file.type,
                            fileSize: fileUpload.file.size,
                            fileContent: base64Data
                        });

                        // Update to 100% progress
                        setSelectedFiles(prev => 
                            prev.map(f => 
                                f.file === fileUpload.file 
                                    ? { ...f, uploading: false, uploadProgress: 100 }
                                    : f
                            )
                        );

                        resolve(response);
                    } catch (error) {
                        console.error('Erro ao enviar arquivo:', error);
                        setSelectedFiles(prev => 
                            prev.map(f => 
                                f.file === fileUpload.file 
                                    ? { ...f, uploading: false, error: 'Erro ao enviar arquivo' }
                                    : f
                            )
                        );
                        reject(error);
                    }
                };
                reader.onerror = () => {
                    setSelectedFiles(prev => 
                        prev.map(f => 
                            f.file === fileUpload.file 
                                ? { ...f, uploading: false, error: 'Erro ao ler arquivo' }
                                : f
                        )
                    );
                    reject(new Error('Erro ao ler arquivo'));
                };
                reader.readAsDataURL(fileUpload.file);
            });
        } catch (error) {
            console.error('Erro no upload:', error);
            return null;
        }
    };

    const handleSendMessage = async () => {
        if (!selectedConversation) return;

        const hasTextMessage = newMessage.trim().length > 0;
        const hasFiles = selectedFiles.length > 0;

        if (!hasTextMessage && !hasFiles) return;

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
                uploadResults.forEach((result) => {
                    if (result.status === 'fulfilled' && result.value) {
                        successfulUploads.push(result.value);
                    }
                });

                if (successfulUploads.length > 0) {
                    setMessages(prev => [...prev, ...successfulUploads]);
                }

                // Clear files after upload attempt
                setSelectedFiles([]);
                setShowFilePreview(false);
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

    // Fechar modais com ESC
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (imageViewerOpen) {
                    closeImageViewer();
                } else if (pdfViewerOpen) {
                    closePdfViewer();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [imageViewerOpen, pdfViewerOpen]);

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

    // Listener para eventos de atenção
    const triggerShakeAnimation = () => {
  setIsShaking(true);
  
  try {
    const audio = new Audio('/notification.mp3');
    audio.play().catch(e => console.log('Som não disponível'));
  } catch (e) {
    console.log('Som não disponível');
  }
  
  setTimeout(() => {
    setIsShaking(false);
  }, 2000);
};

useEffect(() => {
  const setupAttentionListener = async () => {
    const unlisten = await listen<{ chatId?: number }>('trigger-attention', (event) => {
      const { chatId } = event.payload;
      
      console.log('[Chat] Evento de atenção recebido para chat:', chatId);
      
      triggerShakeAnimation();
      
      if (chatId) {
        setHighlightChatId(chatId);
        const conversation = conversations.find(c => c.chatId === chatId);
        if (conversation) {
          setSelectedConversation(conversation);
        }
        
        setTimeout(() => {
          setHighlightChatId(null);
        }, 5000);
      }
    });

    return unlisten;
  };

  let unlistenFunc: (() => void) | null = null;

  setupAttentionListener().then((unlisten) => {
    unlistenFunc = unlisten;
  });

  return () => {
    if (unlistenFunc) {
      unlistenFunc();
    }
  };
}, [conversations]);

// Verifica parâmetros da URL ao montar
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const attention = params.get('attention');
  const chatId = params.get('chatId');
  
  if (attention === 'true') {
    triggerShakeAnimation();
    
    if (chatId) {
      const chatIdNum = parseInt(chatId);
      setHighlightChatId(chatIdNum);
      const conversation = conversations.find(c => c.chatId === chatIdNum);
      if (conversation) {
        setSelectedConversation(conversation);
      }
      
      setTimeout(() => {
        setHighlightChatId(null);
      }, 5000);
    }
  }
}, []);

    return (
        <div className={`chat-container ${isShaking ? 'chat-attention-shake' : ''}`}>
       

            {/* Sidebar */}
            <div className={`sidebar ${!sidebarOpen ? 'closed' : ''}`}>
                {/* Sidebar Header */}
                <div className="sidebar-header">
                    <div className="sidebar-header-top">
                        <h1 className="sidebar-title">Contatos</h1>
                    </div>
                    {/* Search Bar */}
                    <div className="search-container">
                  
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
                        // Considerar online se estiver conectado via WebSocket OU se o status no banco for true
                        const isOnline = onlineUsers.has(user.id) || (user.logado === true);

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
                                                ? `http://127.0.0.1:8082${user.profile_photo_path}`
                                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nome)}&background=random`
                                            }
                                            alt={user.nome}
                                            className="avatar"
                                        />
                                        <div className={`status-indicator ${isOnline ? 'status-online' : 'status-offline'}`}></div>
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
                                                {conversation?.lastMessage || user.cargo || (isOnline ? 'Online' : 'Offline')}
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
                                    {selectedConversation.members.length === 2 && (
                                        <div className={`status-indicator ${
                                            (() => {
                                                const otherMember = selectedConversation.members.find(m => m.id !== currentUserId);
                                                if (!otherMember) return 'status-offline';
                                                // Considerar online se estiver conectado via WebSocket OU se o status no banco for true
                                                const isOnline = onlineUsers.has(otherMember.id) || (otherMember.logado === true);
                                                return isOnline ? 'status-online' : 'status-offline';
                                            })()
                                        }`}></div>
                                    )}
                                </div>
                                <div className="chat-header-info">
                                    <h2>{selectedConversation.name}</h2>
                                    <p>
                                        {selectedConversation.members.length === 2 
                                            ? (() => {
                                                const otherMember = selectedConversation.members.find(m => m.id !== currentUserId);
                                                if (!otherMember) return 'Offline';
                                                // Considerar online se estiver conectado via WebSocket OU se o status no banco for true
                                                const isOnline = onlineUsers.has(otherMember.id) || (otherMember.logado === true);
                                                return isOnline ? 'Online' : 'Offline';
                                            })()
                                            : `${selectedConversation.members.length} membros`
                                        }
                                    </p>
                                </div>
                            </div>
                            <div className="chat-header-actions">
                                <button className="action-button"><Search /></button>
                                {selectedConversation && (
    <AttentionButton 
      chatId={selectedConversation.chatId} 
      disabled={!selectedConversation}
    />
  )}
                                 <button
                            className="call-button audio"
                            onClick={handleStartAudioCall}
                            disabled={!isCallWsConnected}
                            title="Chamada de áudio"
                        >
                            <Phone size={20} />
                        </button>
                        
                        {/* Botão de chamada de vídeo */}
                        <button
                            className="call-button video"
                            onClick={handleStartVideoCall}
                            disabled={!isCallWsConnected}
                            title="Chamada de vídeo"
                        >
                            <Video size={20} />
                        </button>
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
                                                    src={message.arquivo_url} 
                                                    alt={message.arquivo_nome}
                                                    className="message-image-content"
                                                    onClick={() => openImageViewer(message.arquivo_url!, message.arquivo_nome || 'Imagem')}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                                <div className="message-image-info">
                                                    <span>{message.arquivo_nome}</span>
                                                    <span>{message.arquivo_tamanho ? formatFileSize(message.arquivo_tamanho) : ''}</span>
                                                </div>
                                                <div className="message-image-actions">
                                                    <button 
                                                        className="image-action-button"
                                                        onClick={() => openImageViewer(message.arquivo_url!, message.arquivo_nome || 'Imagem')}
                                                        title="Ver em tela cheia"
                                                    >
                                                        <ZoomIn size={16} />
                                                    </button>
                                                    <button 
                                                        className="image-action-button"
                                                        onClick={() => downloadFile(message.arquivo_url!, message.arquivo_nome || 'imagem')}
                                                        title="Baixar arquivo"
                                                    >
                                                        <Download size={16} />
                                                    </button>
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
        <div className="message-file-actions">
            {/* Botão de Visualizar Código */}
            {message.arquivo_nome && isCodeFile(message.arquivo_nome) && message.arquivo_url && (
                <button 
                    className="file-action-button"
                    onClick={() => openCodeViewer(message.arquivo_url!, message.arquivo_nome!)}
                    title="Visualizar Código"
                >
                    <FileCode size={16} />
                </button>
            )}
            
            {/* Botão de Visualizar PDF (existente) */}
            {message.arquivo_tipo === 'application/pdf' && message.arquivo_url && (
                <button 
                    className="file-action-button"
                    onClick={() => openPdfViewer(message.arquivo_url!, message.arquivo_nome || 'PDF')}
                    title="Visualizar PDF"
                >
                    <Search size={16} />
                </button>
            )}
            
            {/* Download (existente) */}
            <button 
                className="file-action-button"
                onClick={() => downloadFile(message.arquivo_url!, message.arquivo_nome || 'arquivo')}
                title="Baixar arquivo"
            >
                <Download size={16} />
            </button>
        </div>
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
                            {incomingCallInfo && (
                <IncomingCallModal
                    callerName={incomingCallInfo.user_name}
                    callType={incomingCallInfo.call_type}
                    onAccept={() => acceptIncomingCall(incomingCallInfo)}
                    onReject={() => rejectIncomingCall(incomingCallInfo)}
                />
            )}   
                      {callState.isCallActive && callState.recipientId && callState.recipientName && (
                <VideoCallComponent
                    chatId={selectedConversation?.chatId || 0}
                    userId={currentUserId}
                    userName={currentUserName}
                    recipientId={callState.recipientId}
                    recipientName={callState.recipientName}
                    onClose={endCall}
                    initialType={callState.callType || 'audio'}
                    isIncoming={callState.isIncoming}
                    incomingOffer={callState.incomingCallData}
                    sendSignalingMessage={sendSignalingMessage} 
                />
            )}

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
                                        disabled={isUploading}
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
                                                {fileUpload.uploading && (
                                                    <div className="upload-progress">
                                                        <div className="progress-bar">
                                                            <div 
                                                                className="progress-fill" 
                                                                style={{ width: `${fileUpload.uploadProgress || 0}%` }}
                                                            />
                                                        </div>
                                                        <span className="progress-text">{fileUpload.uploadProgress || 0}%</span>
                                                    </div>
                                                )}
                                                {fileUpload.error && (
                                                    <div className="upload-error">
                                                        <AlertCircle size={14} />
                                                        <span>{fileUpload.error}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {!fileUpload.uploading && (
                                                <button 
                                                    onClick={() => removeFile(index)}
                                                    className="remove-file-button"
                                                    disabled={isUploading}
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
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
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                />
                                <button 
                                    className="attachment-button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    {isUploading ? <Upload className="animate-pulse" /> : <Paperclip />}
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
                                        disabled={isUploading}
                                    />
                                    <button className="emoji-button" disabled={isUploading}>
                                        <Smile />
                                    </button>
                                </div>
                                <button
                                    onClick={handleSendMessage}
                                    disabled={(!newMessage.trim() && selectedFiles.length === 0) || isUploading}
                                    className="send-button"
                                >
                                    {isUploading ? <Upload className="animate-pulse" /> : <Send />}
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

            {/* Visualizador de Imagens */}
            {imageViewerOpen && (
                <div className="image-viewer-overlay" onClick={closeImageViewer}>
                    <div className="image-viewer-container" onClick={(e) => e.stopPropagation()}>
                        <div className="image-viewer-header">
                            <h3 className="image-viewer-title">{currentImageName}</h3>
                            <div className="image-viewer-controls">
                                <button onClick={zoomOut} className="viewer-control-button" title="Diminuir zoom">
                                    <ZoomOut size={20} />
                                </button>
                                <span className="zoom-level">{Math.round(imageZoom * 100)}%</span>
                                <button onClick={zoomIn} className="viewer-control-button" title="Aumentar zoom">
                                    <ZoomIn size={20} />
                                </button>
                                <button onClick={rotateImage} className="viewer-control-button" title="Girar">
                                    <RotateCw size={20} />
                                </button>
                                <button onClick={resetImageView} className="viewer-control-button" title="Resetar">
                                    Resetar
                                </button>
                                <button 
                                    onClick={() => downloadFile(currentImageUrl, currentImageName)} 
                                    className="viewer-control-button" 
                                    title="Baixar"
                                >
                                    <Download size={20} />
                                </button>
                                <button onClick={closeImageViewer} className="viewer-close-button" title="Fechar">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                        <div className="image-viewer-content">
                            <img
                                src={currentImageUrl}
                                alt={currentImageName}
                                className="image-viewer-image"
                                style={{
                                    transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
                                    transition: 'transform 0.3s ease'
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
            {codeViewerOpen && (
    <div className="pdf-viewer-overlay" onClick={closeCodeViewer}>
        <div className="pdf-viewer-container" onClick={(e) => e.stopPropagation()}>
            <div className="pdf-viewer-header" style={{backgroundColor: '#1e1e1e', borderBottom: '1px solid #333'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <FileCode size={20} color="#61dafb" />
                    <h3 className="pdf-viewer-title" style={{color: '#d4d4d4'}}>{currentCodeName}</h3>
                    <span style={{fontSize: '12px', color: '#888', background: '#2d2d2d', padding: '2px 6px', borderRadius: '4px'}}>
                        {codeLanguage.toUpperCase()}
                    </span>
                </div>
                <div className="pdf-viewer-controls">
                    <button 
                        onClick={() => downloadFile(currentCodeName, currentCodeName)} // Ajuste a URL aqui se tiver salva em state separado
                        className="viewer-control-button" 
                        title="Baixar"
                        style={{background: '#333', color: '#fff', border: 'none'}}
                    >
                        <Download size={20} />
                    </button>
                    <button onClick={closeCodeViewer} className="viewer-close-button" title="Fechar">
                        <X size={24} />
                    </button>
                </div>
            </div>
            <div className="pdf-viewer-content" style={{backgroundColor: '#1e1e1e', overflow: 'auto', display: 'block'}}>
                <SyntaxHighlighter
                    language={codeLanguage}
                    style={vscDarkPlus}
                    showLineNumbers={true}
                    customStyle={{
                        margin: 0,
                        padding: '20px',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        backgroundColor: '#1e1e1e',
                        minHeight: '100%'
                    }}
                >
                    {codeContent}
                </SyntaxHighlighter>
            </div>
        </div>
    </div>
)}

            {/* Visualizador de PDF */}
            {pdfViewerOpen && (
                <div className="pdf-viewer-overlay" onClick={closePdfViewer}>
                    <div className="pdf-viewer-container" onClick={(e) => e.stopPropagation()}>
                        <div className="pdf-viewer-header">
                            <h3 className="pdf-viewer-title">{currentPdfName}</h3>
                            <div className="pdf-viewer-controls">
                                <button 
                                    onClick={() => downloadFile(currentPdfUrl, currentPdfName)} 
                                    className="viewer-control-button" 
                                    title="Baixar"
                                >
                                    <Download size={20} />
                                </button>
                                <button onClick={closePdfViewer} className="viewer-close-button" title="Fechar">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                        <div className="pdf-viewer-content">
                            <iframe
                                src={currentPdfUrl}
                                className="pdf-viewer-iframe"
                                title={currentPdfName}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

   
};