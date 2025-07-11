import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, MoreVertical, Phone, Video, Search, Plus, Menu } from 'lucide-react';
import './style/ChatContainer.css';
import { invoke } from "@tauri-apps/api/core";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'other';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

interface BackendUser {
  id: number;
  nome: string;
  ativo: boolean;
  profile_photo_path: string | null;
  // Outros campos como 'cargo' e 'nome_completo' estão disponíveis, mas não são usados no momento.
}
interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  status: 'online' | 'offline' | 'away';
  isTyping?: boolean;
}

export const ChatContainer: React.FC = () => { 
  const [conversations] = useState<Conversation[]>([
    {
      id: '1',
      name: 'Ana Silva',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      lastMessage: 'Ainda não! Conta pra mim 😊',
      lastMessageTime: new Date(Date.now() - 120000),
      unreadCount: 0,
      status: 'online'
    },
    {
      id: '2',
      name: 'João Santos',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      lastMessage: 'Perfeito! Vamos marcar para amanhã então',
      lastMessageTime: new Date(Date.now() - 3600000),
      unreadCount: 2,
      status: 'online'
    },
    {
      id: '3',
      name: 'Maria Oliveira',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      lastMessage: 'Obrigada pela ajuda! 🙏',
      lastMessageTime: new Date(Date.now() - 7200000),
      unreadCount: 0,
      status: 'away'
    },
    {
      id: '4',
      name: 'Pedro Costa',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      lastMessage: 'Vou verificar e te retorno',
      lastMessageTime: new Date(Date.now() - 86400000),
      unreadCount: 1,
      status: 'offline'
    },
    {
      id: '5',
      name: 'Carla Mendes',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
      lastMessage: 'Ótima ideia! Vamos implementar',
      lastMessageTime: new Date(Date.now() - 172800000),
      unreadCount: 0,
      status: 'online',
      isTyping: true
    }
  ]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Olá! Como você está?',
      sender: 'other',
      timestamp: new Date(Date.now() - 300000),
      status: 'read'
    },
    {
      id: '2',
      text: 'Oi! Estou bem, obrigado! E você?',
      sender: 'user',
      timestamp: new Date(Date.now() - 240000),
      status: 'read'
    },
    {
      id: '3',
      text: 'Estou ótimo! Trabalhando em alguns projetos interessantes. Você viu as novidades?',
      sender: 'other',
      timestamp: new Date(Date.now() - 180000),
      status: 'read'
    },
    {
      id: '4',
      text: 'Ainda não! Conta pra mim 😊',
      sender: 'user',
      timestamp: new Date(Date.now() - 120000),
      status: 'delivered'
    }
  ]);

  const [selectedConversation, setSelectedConversation] = useState<Conversation>(conversations[0]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
    const [conversations, setConversations] = useState<Conversation[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Invoca a função 'get_users' exposta pelo backend Rust via Tauri
        const response: { usuarios: BackendUser[] } = await invoke('get_users');
        
        // Mapeia a resposta do backend para o formato 'Conversation' do frontend
        const loadedConversations = response.usuarios.map(user => ({
          id: user.id.toString(),
          name: user.nome,
          // Usa a foto do perfil ou uma imagem padrão
          avatar: user.profile_photo_path || `https://i.pravatar.cc/150?u=${user.id}`,
          // Mapeia o status 'ativo' para 'online' ou 'offline'
          status: user.ativo ? 'online' : 'offline',
          // Preenche os campos restantes com valores padrão, pois não vêm da API de usuários
          lastMessage: "Clique para iniciar a conversa",
          lastMessageTime: new Date(),
          unreadCount: 0,
          isTyping: false,
        }));

        setConversations(loadedConversations);

        // Seleciona a primeira conversa da lista como ativa
        if (loadedConversations.length > 0) {
          setSelectedConversation(loadedConversations[0]);
        }
      } catch (error) {
        console.error("Falha ao buscar usuários:", error);
        // Em caso de erro, pode-se definir um estado de erro para exibir na UI
      }
    };

    fetchUsers();
  }, []);
  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        text: newMessage,
        sender: 'user',
        timestamp: new Date(),
        status: 'sending'
      };

      setMessages(prev => [...prev, message]);
      setNewMessage('');

      setTimeout(() => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === message.id 
              ? { ...msg, status: 'sent' }
              : msg
          )
        );
      }, 1000);

      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const responses = [
            'Que interessante! Conte-me mais sobre isso.',
            'Entendi! Faz muito sentido.',
            'Concordo totalmente com você.',
            'Isso é muito legal! 🎉'
          ];
          
          const autoReply: Message = {
            id: (Date.now() + 1).toString(),
            text: responses[Math.floor(Math.random() * responses.length)],
            sender: 'other',
            timestamp: new Date(),
            status: 'read'
          };
          
          setMessages(prev => [...prev, autoReply]);
        }, 2000);
      }, 1500);
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'agora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return date.toLocaleDateString('pt-BR', { weekday: 'short' });
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'sending': return '○';
      case 'sent': return '✓';
      case 'delivered': return '✓✓';
      case 'read': return '✓✓';
      default: return '';
    }
  };

  const getStatusClass = (status?: string) => {
    switch (status) {
      case 'sending': return 'status-sending';
      case 'sent': return 'status-sent';
      case 'delivered': return 'status-delivered';
      case 'read': return 'status-read';
      default: return '';
    }
  };

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className={`sidebar ${!sidebarOpen ? 'closed' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-header-top">
            <h1 className="sidebar-title">Conversas</h1>
            <button className="add-button">
              <Plus />
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Pesquisar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="conversations-list">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation)}
              className={`conversation-item ${selectedConversation.id === conversation.id ? 'selected' : ''}`}
            >
              <div className="conversation-content">
                <div className="avatar-container">
                  <img
                    src={conversation.avatar}
                    alt={conversation.name}
                    className="avatar"
                  />
                  <div className={`status-indicator ${
                    conversation.status === 'online' ? 'status-online' :
                    conversation.status === 'away' ? 'status-away' : 'status-offline'
                  }`}></div>
                </div>
                
                <div className="conversation-info">
                  <div className="conversation-header">
                    <h3 className="conversation-name">{conversation.name}</h3>
                    <span className="conversation-time">{formatTime(conversation.lastMessageTime)}</span>
                  </div>
                  
                  <div className="conversation-footer">
                    <p className={`conversation-message ${conversation.isTyping ? 'typing' : ''}`}>
                      {conversation.isTyping ? 'digitando...' : conversation.lastMessage}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <span className="unread-badge">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
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
                selectedConversation.status === 'online' ? 'status-online' :
                selectedConversation.status === 'away' ? 'status-away' : 'status-offline'
              }`}></div>
            </div>
            
            <div className="chat-header-info">
              <h2>{selectedConversation.name}</h2>
              <p>
                {selectedConversation.status === 'online' ? 'Online' : 'Visto por último há 5 min'}
              </p>
            </div>
          </div>
          
          <div className="chat-header-actions">
            <button className="action-button">
              <Search />
            </button>
            <button className="action-button">
              <Phone />
            </button>
            <button className="action-button">
              <Video />
            </button>
            <button className="action-button">
              <MoreVertical />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="messages-area">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message-container ${message.sender}`}
            >
              <div className={`message ${message.sender}`}>
                <p className="message-text">{message.text}</p>
                <div className={`message-footer ${message.sender}`}>
                  <span className="message-time">{formatMessageTime(message.timestamp)}</span>
                  {message.sender === 'user' && (
                    <div className={`message-status ${getStatusClass(message.status)}`}>
                      {getStatusIcon(message.status)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="typing-indicator">
              <div className="typing-bubble">
                <div className="typing-dots">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="input-area">
          <div className="input-container">
            <button className="attachment-button">
              <Paperclip />
            </button>
            
            <div className="input-wrapper">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Digite sua mensagem..."
                className="message-input"
              />
              <button className="emoji-button">
                <Smile />
              </button>
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
      </div>
    </div>
  );
};