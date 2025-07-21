import React from 'react';

interface OnlineStatusIndicatorProps {
    isOnline: boolean;
    status?: 'online' | 'offline' | 'away' | 'typing';
    size?: 'small' | 'medium' | 'large';
    showText?: boolean;
    lastSeen?: string;
}

export const OnlineStatusIndicator: React.FC<OnlineStatusIndicatorProps> = ({
    isOnline,
    status = 'offline',
    size = 'medium',
    showText = false,
    lastSeen
}) => {
    const getStatusColor = () => {
        switch (status) {
            case 'online':
                return '#10b981'; // Verde
            case 'typing':
                return '#3b82f6'; // Azul
            case 'away':
                return '#f59e0b'; // Amarelo
            case 'offline':
            default:
                return '#6b7280'; // Cinza
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'online':
                return 'Online';
            case 'typing':
                return 'Digitando...';
            case 'away':
                return 'Ausente';
            case 'offline':
            default:
                if (lastSeen) {
                    const lastSeenDate = new Date(lastSeen);
                    const now = new Date();
                    const diffMs = now.getTime() - lastSeenDate.getTime();
                    const diffMins = Math.floor(diffMs / (1000 * 60));
                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                    if (diffMins < 1) {
                        return 'Visto agora';
                    } else if (diffMins < 60) {
                        return `Visto ${diffMins}m atrás`;
                    } else if (diffHours < 24) {
                        return `Visto ${diffHours}h atrás`;
                    } else if (diffDays < 7) {
                        return `Visto ${diffDays}d atrás`;
                    } else {
                        return lastSeenDate.toLocaleDateString('pt-BR');
                    }
                }
                return 'Offline';
        }
    };

    const getSizeClasses = () => {
        switch (size) {
            case 'small':
                return 'w-2 h-2';
            case 'large':
                return 'w-4 h-4';
            case 'medium':
            default:
                return 'w-3 h-3';
        }
    };

    const getTextSizeClasses = () => {
        switch (size) {
            case 'small':
                return 'text-xs';
            case 'large':
                return 'text-base';
            case 'medium':
            default:
                return 'text-sm';
        }
    };

    return (
        <div className="flex items-center gap-2">
            <div className="relative">
                <div
                    className={`${getSizeClasses()} rounded-full border-2 border-white`}
                    style={{ backgroundColor: getStatusColor() }}
                />
                {status === 'typing' && (
                    <div className="absolute inset-0 rounded-full animate-pulse bg-blue-400 opacity-50" />
                )}
            </div>
            {showText && (
                <span className={`${getTextSizeClasses()} text-gray-600`}>
                    {getStatusText()}
                </span>
            )}
        </div>
    );
};

