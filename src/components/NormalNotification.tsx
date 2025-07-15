import React, { useState, useEffect } from 'react';
import './css/NormalNotification.css';

interface NormalNotificationPayload {
    type: string;
    title?: string;
    description?: string;
    icon?: string;
    isNew?: boolean;
}

interface NormalNotificationProps {
    notification: NormalNotificationPayload;
    onClose: () => void;
    onAction?: () => void;
}

export const NormalNotification: React.FC<NormalNotificationProps> = ({ 
    notification, 
    onClose, 
    onAction 
}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation on mount
        const timer = setTimeout(() => setIsVisible(true), 100);
        
        // Auto-close after 6 seconds
        const autoCloseTimer = setTimeout(() => {
            handleClose();
        }, 6000);

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
        if (onAction) {
            onAction();
        }
        handleClose();
    };

    const getNotificationIcon = () => {
        switch (notification.icon) {
            case 'info':
                return (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                );
            case 'alert':
                return (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                );
            case 'success':
                return (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22,4 12,14.01 9,11.01"></polyline>
                    </svg>
                );
            case 'error':
                return (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                );
            default:
                return (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                );
        }
    };

    const getNotificationColor = () => {
        switch (notification.icon) {
            case 'success':
                return 'success';
            case 'error':
                return 'error';
            case 'alert':
                return 'warning';
            case 'info':
            default:
                return 'info';
        }
    };

    const formatTime = () => {
        const now = new Date();
        return now.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    return (
        <div 
            className={`normal-notification ${getNotificationColor()} ${isVisible ? 'visible' : ''} ${notification.isNew ? 'new' : ''}`}
            onClick={handleClick}
        >
            <div className="notification-icon-container">
                {getNotificationIcon()}
                {notification.isNew && <div className="new-indicator"></div>}
            </div>
            
            <div className="notification-content">
                <div className="notification-header">
                    <span className="notification-title">
                        {notification.title || 'Notificação'}
                    </span>
                    <span className="notification-time">{formatTime()}</span>
                </div>
                <div className="notification-description">
                    {notification.description || 'Nova notificação recebida'}
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

export default NormalNotification;

