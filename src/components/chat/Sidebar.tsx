import React from 'react';
import { Search, Plus } from 'lucide-react';

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

interface SidebarProps {
    sidebarOpen: boolean;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    filteredAndSortedUsers: BackendUser[];
    conversations: Conversation[];
    selectedConversation: Conversation | null;
    onSelectUser: (user: BackendUser) => void;
    formatTime: (date: Date) => string;
}

export const Sidebar: React.FC<SidebarProps> = ({
    sidebarOpen,
    searchQuery,
    setSearchQuery,
    filteredAndSortedUsers,
    conversations,
    selectedConversation,
    onSelectUser,
    formatTime
}) => {
    return (
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
                            onClick={() => onSelectUser(user)}
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
    );
};

