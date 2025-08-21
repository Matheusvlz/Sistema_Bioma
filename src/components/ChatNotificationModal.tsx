import React from 'react';
import './css/ChatNotificationModal.css';

interface MessageNotificationPayload {
    message_type?: string; 
    sender_id: number;
    chat_id: number;
    sender_name: string;
    sender_avatar: string | null;
    content: string;
    timestamp: string;
}

interface ChatNotificationModalProps {
    notification: MessageNotificationPayload;
    onClose: () => void;
    onReply?: (chatId: number) => void;
    onOpenChat?: (chatId: number) => void;
}

export const ChatNotificationModal: React.FC<ChatNotificationModalProps> = ({ 
    notification, 
    onClose, 
    onOpenChat 
}) => {
    const getAvatarUrl = () => {
        if (notification.sender_avatar) {
            return `http://127.0.0.1:8082${notification.sender_avatar}`;
        }
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(notification.sender_name)}&background=25D366&color=fff&size=80`;
    };

    const formatTime = () => {
        const date = new Date(notification.timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Agora';
        if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h atrás`;
        
        return date.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleOpenChat = () => {
        if (onOpenChat) {
            onOpenChat(notification.chat_id);
        }
        onClose();
    };



    return (
        <div className="chat-modal-overlay" onClick={onClose}>
            <div className="chat-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="chat-modal-header">
                    <div className="sender-info">
                        <div className="sender-avatar-container">
                            <img 
                                src={getAvatarUrl()} 
                                alt={notification.sender_name}
                                className="sender-avatar-large"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(notification.sender_name)}&background=25D366&color=fff&size=80`;
                                }}
                            />
                            <div className="status-indicator online"></div>
                        </div>
                        <div className="sender-details">
                            <h3 className="sender-name-large">{notification.sender_name}</h3>
                            <p className="message-time">{formatTime()}</p>
                        </div>
                    </div>
                    <button className="close-modal-btn" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                
                <div className="chat-modal-body">
                    <div className="message-bubble">
                        <div className="message-content">
                            {notification.content}
                        </div>
                        <div className="message-meta">
                            <span className="message-timestamp">
                                {new Date(notification.timestamp).toLocaleTimeString('pt-BR', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                })}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className="chat-modal-footer">
                    <button className="action-btn secondary" onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4"></path>
                            <polyline points="9,7 12,4 15,7"></polyline>
                            <line x1="12" y1="4" x2="12" y2="17"></line>
                        </svg>
                        Dispensar
                    </button>
                    
                    <button className="action-btn primary" onClick={handleOpenChat}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        Abrir Chat
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatNotificationModal;

