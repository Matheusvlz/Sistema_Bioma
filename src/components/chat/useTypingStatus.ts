import { useState, useCallback, useRef, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";

interface TypingUser {
    user_id: number;
    user_name: string;
    chat_id: number;
}

interface UseTypingStatusProps {
    currentUserId: number;
    selectedConversation: any;
}

export const useTypingStatus = ({ currentUserId, selectedConversation }: UseTypingStatusProps) => {
    const [typingUsers, setTypingUsers] = useState<Map<number, TypingUser>>(new Map());
    const [isCurrentUserTyping, setIsCurrentUserTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastTypingStateRef = useRef<boolean>(false);

    // Adicionar usuário que está digitando
    const addTypingUser = useCallback((userId: number, userName: string, chatId: number) => {
        if (userId === currentUserId) return; // Não adicionar o próprio usuário
        
        setTypingUsers(prev => {
            const newMap = new Map(prev);
            newMap.set(userId, { user_id: userId, user_name: userName, chat_id: chatId });
            return newMap;
        });
    }, [currentUserId]);

    // Remover usuário que parou de digitar
    const removeTypingUser = useCallback((userId: number) => {
        setTypingUsers(prev => {
            const newMap = new Map(prev);
            newMap.delete(userId);
            return newMap;
        });
    }, []);

    // Atualizar status de digitação de um usuário
    const updateUserTypingStatus = useCallback((userId: number, userName: string, chatId: number, isTyping: boolean) => {
        if (isTyping) {
            addTypingUser(userId, userName, chatId);
        } else {
            removeTypingUser(userId);
        }
    }, [addTypingUser, removeTypingUser]);

    // Enviar status de digitação para o backend
    const sendTypingStatus = useCallback(async (isTyping: boolean) => {
        if (!selectedConversation) return;

        try {
            const message = {
                type: isTyping ? 'TypingStart' : 'TypingStop',
                chat_id: selectedConversation.chatId
            };

            await invoke('send_ws_message', { 
                message: JSON.stringify(message) 
            });

            console.log(`Status de digitação enviado: ${isTyping ? 'iniciou' : 'parou'} no chat ${selectedConversation.chatId}`);
        } catch (error) {
            console.error('Erro ao enviar status de digitação:', error);
        }
    }, [selectedConversation]);

    // Iniciar digitação
    const startTyping = useCallback(() => {
        if (!selectedConversation || isCurrentUserTyping) return;

        setIsCurrentUserTyping(true);
        sendTypingStatus(true);
        lastTypingStateRef.current = true;

        console.log('Usuário começou a digitar');
    }, [selectedConversation, isCurrentUserTyping, sendTypingStatus]);

    // Parar digitação
    const stopTyping = useCallback(() => {
        if (!selectedConversation || !isCurrentUserTyping) return;

        setIsCurrentUserTyping(false);
        sendTypingStatus(false);
        lastTypingStateRef.current = false;

        console.log('Usuário parou de digitar');
    }, [selectedConversation, isCurrentUserTyping, sendTypingStatus]);

    // Gerenciar timeout de digitação
    const handleTyping = useCallback(() => {
        if (!selectedConversation) return;

        // Se não estava digitando, começar a digitar
        if (!isCurrentUserTyping) {
            startTyping();
        }

        // Limpar timeout anterior
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Definir novo timeout para parar de digitar após 3 segundos de inatividade
        typingTimeoutRef.current = setTimeout(() => {
            stopTyping();
        }, 3000);
    }, [selectedConversation, isCurrentUserTyping, startTyping, stopTyping]);

    // Parar digitação imediatamente (quando enviar mensagem)
    const stopTypingImmediately = useCallback(() => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
        stopTyping();
    }, [stopTyping]);

    // Obter usuários que estão digitando no chat atual
    const getCurrentChatTypingUsers = useCallback((): TypingUser[] => {
        if (!selectedConversation) return [];
        
        return Array.from(typingUsers.values()).filter(
            user => user.chat_id === selectedConversation.chatId
        );
    }, [typingUsers, selectedConversation]);

    // Obter texto de usuários digitando
    const getTypingText = useCallback((): string => {
        const typingInCurrentChat = getCurrentChatTypingUsers();
        
        if (typingInCurrentChat.length === 0) return '';
        
        if (typingInCurrentChat.length === 1) {
            return `${typingInCurrentChat[0].user_name} está digitando...`;
        } else if (typingInCurrentChat.length === 2) {
            return `${typingInCurrentChat[0].user_name} e ${typingInCurrentChat[1].user_name} estão digitando...`;
        } else {
            return `${typingInCurrentChat[0].user_name} e mais ${typingInCurrentChat.length - 1} pessoas estão digitando...`;
        }
    }, [getCurrentChatTypingUsers]);

    // Verificar se alguém está digitando no chat atual
    const isSomeoneTypingInCurrentChat = useCallback((): boolean => {
        return getCurrentChatTypingUsers().length > 0;
    }, [getCurrentChatTypingUsers]);

    // Limpar dados quando mudar de chat
    useEffect(() => {
        // Parar de digitar no chat anterior
        if (lastTypingStateRef.current) {
            stopTypingImmediately();
        }
        
        // Limpar usuários digitando (manter apenas os do chat atual)
        if (selectedConversation) {
            setTypingUsers(prev => {
                const newMap = new Map();
                for (const [userId, user] of prev.entries()) {
                    if (user.chat_id === selectedConversation.chatId) {
                        newMap.set(userId, user);
                    }
                }
                return newMap;
            });
        } else {
            setTypingUsers(new Map());
        }
    }, [selectedConversation?.chatId, stopTypingImmediately]);

    // Cleanup ao desmontar componente
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (lastTypingStateRef.current) {
                stopTyping();
            }
        };
    }, [stopTyping]);

    return {
        typingUsers,
        isCurrentUserTyping,
        updateUserTypingStatus,
        handleTyping,
        stopTypingImmediately,
        getCurrentChatTypingUsers,
        getTypingText,
        isSomeoneTypingInCurrentChat,
        startTyping,
        stopTyping
    };
};