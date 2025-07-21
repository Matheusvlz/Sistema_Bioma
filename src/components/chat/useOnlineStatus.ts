import { useState, useCallback, useEffect } from 'react';

interface OnlineUser {
    user_id: number;
    user_name: string;
    status: 'online' | 'offline' | 'away' | 'typing';
    last_activity: string;
}

interface UserOnlineStatus {
    user_id: number;
    user_name: string;
    is_online: boolean;
    last_seen?: string;
}

interface UseOnlineStatusProps {
    currentUserId: number;
    selectedConversation: any;
}

export const useOnlineStatus = ({ currentUserId, selectedConversation }: UseOnlineStatusProps) => {
    const [onlineUsers, setOnlineUsers] = useState<Map<number, OnlineUser>>(new Map());
    const [chatOnlineUsers, setChatOnlineUsers] = useState<OnlineUser[]>([]);

    // Atualizar status online de um usuário
    const updateUserOnlineStatus = useCallback((statusUpdate: UserOnlineStatus) => {
        setOnlineUsers(prev => {
            const newMap = new Map(prev);
            
            if (statusUpdate.is_online) {
                newMap.set(statusUpdate.user_id, {
                    user_id: statusUpdate.user_id,
                    user_name: statusUpdate.user_name,
                    status: 'online',
                    last_activity: new Date().toISOString()
                });
            } else {
                // Manter o usuário na lista mas marcar como offline
                const existingUser = newMap.get(statusUpdate.user_id);
                if (existingUser) {
                    newMap.set(statusUpdate.user_id, {
                        ...existingUser,
                        status: 'offline',
                        last_activity: statusUpdate.last_seen || existingUser.last_activity
                    });
                } else {
                    newMap.set(statusUpdate.user_id, {
                        user_id: statusUpdate.user_id,
                        user_name: statusUpdate.user_name,
                        status: 'offline',
                        last_activity: statusUpdate.last_seen || new Date().toISOString()
                    });
                }
            }
            
            return newMap;
        });
    }, []);

    // Atualizar lista de usuários online em um chat específico
    const updateChatOnlineUsers = useCallback((users: OnlineUser[]) => {
        setChatOnlineUsers(users);
        
        // Também atualizar o mapa global
        setOnlineUsers(prev => {
            const newMap = new Map(prev);
            users.forEach(user => {
                newMap.set(user.user_id, user);
            });
            return newMap;
        });
    }, []);

    // Atualizar status de um usuário específico em um chat
    const updateUserStatusInChat = useCallback((chatId: number, userId: number, status: 'online' | 'offline' | 'away' | 'typing', userName: string) => {
        // Atualizar no mapa global
        setOnlineUsers(prev => {
            const newMap = new Map(prev);
            const existingUser = newMap.get(userId);
            
            newMap.set(userId, {
                user_id: userId,
                user_name: userName,
                status,
                last_activity: existingUser?.last_activity || new Date().toISOString()
            });
            
            return newMap;
        });

        // Se for o chat atual, atualizar também a lista do chat
        if (selectedConversation && selectedConversation.chatId === chatId) {
            setChatOnlineUsers(prev => {
                const updated = prev.map(user => 
                    user.user_id === userId 
                        ? { ...user, status, user_name: userName }
                        : user
                );
                
                // Se o usuário não estava na lista, adicionar
                if (!updated.find(user => user.user_id === userId)) {
                    updated.push({
                        user_id: userId,
                        user_name: userName,
                        status,
                        last_activity: new Date().toISOString()
                    });
                }
                
                return updated;
            });
        }
    }, [selectedConversation]);

    // Verificar se um usuário está online
    const isUserOnline = useCallback((userId: number): boolean => {
        const user = onlineUsers.get(userId);
        return user?.status === 'online' || user?.status === 'typing';
    }, [onlineUsers]);

    // Obter status de um usuário
    const getUserStatus = useCallback((userId: number): 'online' | 'offline' | 'away' | 'typing' => {
        const user = onlineUsers.get(userId);
        return user?.status || 'offline';
    }, [onlineUsers]);

    // Obter última atividade de um usuário
    const getUserLastActivity = useCallback((userId: number): string | null => {
        const user = onlineUsers.get(userId);
        return user?.last_activity || null;
    }, [onlineUsers]);

    // Obter usuários online no chat atual
    const getCurrentChatOnlineUsers = useCallback((): OnlineUser[] => {
        return chatOnlineUsers.filter(user => user.user_id !== currentUserId);
    }, [chatOnlineUsers, currentUserId]);

    // Obter contagem de usuários online no chat atual
    const getCurrentChatOnlineCount = useCallback((): number => {
        return chatOnlineUsers.filter(user => 
            user.user_id !== currentUserId && 
            (user.status === 'online' || user.status === 'typing')
        ).length;
    }, [chatOnlineUsers, currentUserId]);

    // Limpar dados quando mudar de chat
    useEffect(() => {
        if (selectedConversation) {
            setChatOnlineUsers([]);
        }
    }, [selectedConversation?.chatId]);

    return {
        onlineUsers,
        chatOnlineUsers,
        updateUserOnlineStatus,
        updateChatOnlineUsers,
        updateUserStatusInChat,
        isUserOnline,
        getUserStatus,
        getUserLastActivity,
        getCurrentChatOnlineUsers,
        getCurrentChatOnlineCount
    };
};