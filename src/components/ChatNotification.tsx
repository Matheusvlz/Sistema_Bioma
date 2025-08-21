import React, { useState, useEffect } from 'react';
import './css/ChatNotification.css';

interface MessageNotificationPayload {
    message_type?: string;
    sender_id: number;
    chat_id: number;
    sender_name: string;
    sender_avatar: string | null;
    content: string;
    timestamp: string;
}

interface ChatNotificationProps {
    notification: MessageNotificationPayload;
    onClose: () => void;
    onOpenChat?: (chatId: number) => void;
}

export const ChatNotification: React.FC<ChatNotificationProps> = ({ 
    notification, 
    onClose, 
    onOpenChat 
}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation on mount
        const timer = setTimeout(() => setIsVisible(true), 100);
        
        // Auto-close after 5 seconds
        const autoCloseTimer = setTimeout(() => {
            handleClose();
        }, 5000);

        return () => {
            clearTimeout(timer);
            clearTimeout(autoCloseTimer);
        };
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to complete
    };

    const handleClick = () => {
        if (onOpenChat) {
            onOpenChat(notification.chat_id);
        }
        handleClose();
    };

    const getAvatarUrl = () => {
        if (notification.sender_avatar) {
            return `http://127.0.0.1:8082${notification.sender_avatar}`;
        }
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(notification.sender_name)}&background=random&color=fff&size=64`;
    };

    const formatTime = () => {
        const date = new Date(notification.timestamp);
        return date.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const truncateMessage = (message: string, maxLength: number = 60) => {
        if (message.length <= maxLength) return message;
        return message.substring(0, maxLength) + '...';
    };

    return (
        <div 
            className={`whatsapp-notification ${isVisible ? 'visible' : ''}`}
            onClick={handleClick}
        >
            <div className="notification-avatar">
                <img 
                    src={getAvatarUrl()} 
                    alt={notification.sender_name}
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(notification.sender_name)}&background=25D366&color=fff&size=64`;
                    }}
                />
                <div className="online-indicator"></div>
            </div>
            
            <div className="notification-content">
                <div className="notification-header">
                    <span className="sender-name">{notification.sender_name}</span>
                    <span className="timestamp">{formatTime()}</span>
                </div>
                <div className="message-preview">
                    {truncateMessage(notification.content)}
                </div>
            </div>
            
            <button 
                className="close-notification"
                onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    );
};

export default ChatNotification;

