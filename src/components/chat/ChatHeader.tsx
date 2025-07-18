import React from 'react';
import { Menu, Search, Phone, Video, MoreVertical } from 'lucide-react';

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

interface ChatHeaderProps {
    selectedConversation: Conversation;
    onToggleSidebar: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
    selectedConversation,
    onToggleSidebar
}) => {
    return (
        <div className="chat-header">
            <div className="chat-header-left">
                <button
                    onClick={onToggleSidebar}
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
    );
};

