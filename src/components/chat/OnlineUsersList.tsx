import React from 'react';
import { OnlineStatusIndicator } from './OnlineStatusIndicator';

interface OnlineUser {
    user_id: number;
    user_name: string;
    status: 'online' | 'offline' | 'away' | 'typing';
    last_activity: string;
}

interface OnlineUsersListProps {
    users: OnlineUser[];
    currentUserId: number;
    isVisible: boolean;
    onClose: () => void;
}

export const OnlineUsersList: React.FC<OnlineUsersListProps> = ({
    users,
    currentUserId,
    isVisible,
    onClose
}) => {
    if (!isVisible) {
        return null;
    }

    const onlineUsers = users.filter(user => 
        user.user_id !== currentUserId && 
        (user.status === 'online' || user.status === 'typing')
    );

    const offlineUsers = users.filter(user => 
        user.user_id !== currentUserId && 
        user.status === 'offline'
    );

    return (
        <div className="online-users-overlay">
            <div className="online-users-modal">
                <div className="online-users-header">
                    <h3>Usuários no Chat</h3>
                    <button onClick={onClose} className="close-button">
                        ×
                    </button>
                </div>
                
                <div className="online-users-content">
                    {onlineUsers.length > 0 && (
                        <div className="users-section">
                            <h4 className="section-title">Online ({onlineUsers.length})</h4>
                            <div className="users-list">
                                {onlineUsers.map(user => (
                                    <div key={user.user_id} className="user-item">
                                        <div className="user-avatar">
                                            <img 
                                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_name)}&background=random`}
                                                alt={user.user_name}
                                            />
                                            <div className="status-indicator">
                                                <OnlineStatusIndicator 
                                                    isOnline={true}
                                                    status={user.status}
                                                    size="small"
                                                />
                                            </div>
                                        </div>
                                        <div className="user-info">
                                            <span className="user-name">{user.user_name}</span>
                                            <span className="user-status">
                                                {user.status === 'typing' ? 'Digitando...' : 'Online'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {offlineUsers.length > 0 && (
                        <div className="users-section">
                            <h4 className="section-title">Offline ({offlineUsers.length})</h4>
                            <div className="users-list">
                                {offlineUsers.map(user => (
                                    <div key={user.user_id} className="user-item offline">
                                        <div className="user-avatar">
                                            <img 
                                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_name)}&background=random`}
                                                alt={user.user_name}
                                            />
                                            <div className="status-indicator">
                                                <OnlineStatusIndicator 
                                                    isOnline={false}
                                                    status="offline"
                                                    size="small"
                                                    lastSeen={user.last_activity}
                                                />
                                            </div>
                                        </div>
                                        <div className="user-info">
                                            <span className="user-name">{user.user_name}</span>
                                            <span className="user-status">
                                                <OnlineStatusIndicator 
                                                    isOnline={false}
                                                    status="offline"
                                                    size="small"
                                                    showText={true}
                                                    lastSeen={user.last_activity}
                                                />
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {users.length === 0 && (
                        <div className="empty-state">
                            <p>Nenhum usuário encontrado neste chat.</p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .online-users-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    animation: fadeIn 0.2s ease-out;
                }

                .online-users-modal {
                    background: white;
                    border-radius: 12px;
                    width: 90%;
                    max-width: 400px;
                    max-height: 80vh;
                    overflow: hidden;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                    animation: slideIn 0.2s ease-out;
                }

                .online-users-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                    border-bottom: 1px solid #e5e7eb;
                    background: #f9fafb;
                }

                .online-users-header h3 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: #1f2937;
                }

                .close-button {
                    background: none;
                    border: none;
                    font-size: 24px;
                    color: #6b7280;
                    cursor: pointer;
                    padding: 0;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 6px;
                    transition: all 0.2s;
                }

                .close-button:hover {
                    background: #e5e7eb;
                    color: #374151;
                }

                .online-users-content {
                    padding: 16px 20px;
                    max-height: 60vh;
                    overflow-y: auto;
                }

                .users-section {
                    margin-bottom: 20px;
                }

                .users-section:last-child {
                    margin-bottom: 0;
                }

                .section-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: #374151;
                    margin: 0 0 12px 0;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .users-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .user-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px;
                    border-radius: 8px;
                    transition: background 0.2s;
                }

                .user-item:hover {
                    background: #f3f4f6;
                }

                .user-item.offline {
                    opacity: 0.7;
                }

                .user-avatar {
                    position: relative;
                    width: 40px;
                    height: 40px;
                }

                .user-avatar img {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    object-fit: cover;
                }

                .status-indicator {
                    position: absolute;
                    bottom: -2px;
                    right: -2px;
                }

                .user-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .user-name {
                    font-weight: 500;
                    color: #1f2937;
                    font-size: 14px;
                }

                .user-status {
                    font-size: 12px;
                    color: #6b7280;
                }

                .empty-state {
                    text-align: center;
                    padding: 40px 20px;
                    color: #6b7280;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95) translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};