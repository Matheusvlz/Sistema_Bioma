import React, { useState, useEffect } from 'react';
import './css/KanbanNotification.css';

interface SavedKanbanCard {
    id: number;
    urgencia: number;
    cardType: string;
    title: string;
    description?: string;
    userId?: number;
    userPhotoUrl?: string;
    tags: string;
    cardColor?: string;
}

interface KanbanNotificationPayload {
    type: string;
    title?: string;
    description?: string;
    icon?: string;
    isNew?: boolean;
    data?: SavedKanbanCard;
}

interface KanbanNotificationProps {
    notification: KanbanNotificationPayload;
    onClose: () => void;
    onViewTask?: (taskId: number) => void;
    onAcceptTask?: (taskId: number) => void;
}

export const KanbanNotification: React.FC<KanbanNotificationProps> = ({ 
    notification, 
    onClose, 
    onViewTask,
    onAcceptTask 
}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation on mount
        const timer = setTimeout(() => setIsVisible(true), 100);
        
        // Auto-close after 8 seconds (longer for Kanban notifications)
        const autoCloseTimer = setTimeout(() => {
            handleClose();
        }, 8000);

        return () => {
            clearTimeout(timer);
            clearTimeout(autoCloseTimer);
        };
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to complete
    };

    const handleViewTask = () => {
        if (onViewTask && notification.data) {
            onViewTask(notification.data.id);
        }
        handleClose();
    };

    const handleAcceptTask = () => {
        if (onAcceptTask && notification.data) {
            onAcceptTask(notification.data.id);
        }
        handleClose();
    };

    const getUrgencyColor = (urgency: number) => {
        switch (urgency) {
            case 1: return '#3b82f6'; // blue
            case 2: return '#22c55e'; // green
            case 3: return '#f59e0b'; // orange
            case 4: return '#ef4444'; // red
            default: return '#6b7280'; // gray
        }
    };

    const getUrgencyLabel = (urgency: number) => {
        switch (urgency) {
            case 1: return 'Baixa';
            case 2: return 'Média';
            case 3: return 'Alta';
            case 4: return 'Muito Alta';
            default: return 'Normal';
        }
    };

    const getUrgencyIcon = (urgency: number) => {
        switch (urgency) {
            case 1:
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="8"></circle>
                    </svg>
                );
            case 2:
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="6" y="6" width="12" height="12" rx="2" ry="2"></rect>
                    </svg>
                );
            case 3:
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L3 18h18z"></path>
                        <line x1="12" y1="6" x2="12" y2="10"></line>
                    </svg>
                );
            case 4:
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="1" x2="12" y2="6"></line>
                        <line x1="12" y1="8" x2="12" y2="13"></line>
                        <line x1="12" y1="15" x2="12.01" y2="15"></line>
                    </svg>
                );
            default:
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                    </svg>
                );
        }
    };

    const formatTime = () => {
        const now = new Date();
        return now.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const getUserAvatar = () => {
        if (notification.data?.userPhotoUrl) {
            return `http://192.168.15.26:8082${notification.data.userPhotoUrl}`;
        }
        return `https://ui-avatars.com/api/?name=Usuario&background=random&color=fff&size=32`;
    };

    const truncateText = (text: string, maxLength: number = 80) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    return (
        <div 
            className={`kanban-notification ${isVisible ? 'visible' : ''} ${notification.isNew ? 'new' : ''}`}
        >
            <div className="kanban-notification-header">
                <div className="task-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                    </svg>
                </div>
                <div className="notification-meta">
                    <span className="notification-type">Nova Tarefa</span>
                    <span className="notification-time">{formatTime()}</span>
                </div>
                <button 
                    className="close-notification"
                    onClick={handleClose}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            <div className="kanban-notification-body">
                <div className="task-info">
                    <h3 className="task-title">
                        {notification.data?.title || notification.title || 'Nova Tarefa'}
                    </h3>
                    
                    {notification.data?.description && (
                        <p className="task-description">
                            {truncateText(notification.data.description)}
                        </p>
                    )}

                    <div className="task-details">
                        <div className="urgency-badge" style={{ color: getUrgencyColor(notification.data?.urgencia || 1) }}>
                            {getUrgencyIcon(notification.data?.urgencia || 1)}
                            <span>{getUrgencyLabel(notification.data?.urgencia || 1)}</span>
                        </div>
                        
                        {notification.data?.cardType && (
                            <div className="card-type">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 6L9 17l-5-5"></path>
                                </svg>
                                <span>{notification.data.cardType}</span>
                            </div>
                        )}
                    </div>

                    {notification.data?.tags && (
                        <div className="task-tags">
                            {notification.data.tags.split(',').map((tag, index) => (
                                <span key={index} className="tag">
                                    {tag.trim()}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="task-assignee">
                    <img 
                        src={getUserAvatar()} 
                        alt="Usuário"
                        className="user-avatar"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://ui-avatars.com/api/?name=Usuario&background=6366f1&color=fff&size=32`;
                        }}
                    />
                </div>
            </div>

            <div className="kanban-notification-actions">
                <button 
                    className="action-btn secondary"
                    onClick={handleViewTask}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    Visualizar
                </button>
                
                <button 
                    className="action-btn primary"
                    onClick={handleAcceptTask}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5"></path>
                    </svg>
                    Aceitar
                </button>
            </div>
        </div>
    );
};

export default KanbanNotification;

