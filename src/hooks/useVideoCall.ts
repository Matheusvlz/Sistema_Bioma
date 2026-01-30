// useVideoCall.ts - Hook para gerenciar chamadas de vídeo

import { useState, useRef, useCallback, useEffect } from 'react';

interface CallState {
    isCallActive: boolean;
    callType: 'audio' | 'video' | null;
    recipientId: number | null;
    recipientName: string | null;
    isIncoming: boolean;
    incomingCallData: any | null;
}

export const useVideoCall = (userId: number, userName: string) => {
    const [callState, setCallState] = useState<CallState>({
        isCallActive: false,
        callType: null,
        recipientId: null,
        recipientName: null,
        isIncoming: false,
        incomingCallData: null,
    });

    const callWsRef = useRef<WebSocket | null>(null);
    const [isCallWsConnected, setIsCallWsConnected] = useState(false);

    // Inicializar WebSocket de chamadas
    const initializeCallWebSocket = useCallback(() => {
        if (callWsRef.current) {
            return; // Já está conectado
        }

        try {
            const wsUrl = `ws://localhost:8082/ws/call/${userId}`;
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log('✅ WebSocket de chamadas conectado');
                setIsCallWsConnected(true);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    handleCallSignaling(data);
                } catch (error) {
                    console.error('❌ Erro ao processar mensagem de chamada:', error);
                }
            };

            ws.onerror = (error) => {
                console.error('❌ Erro no WebSocket de chamadas:', error);
                setIsCallWsConnected(false);
            };

            ws.onclose = () => {
                console.log('🔌 WebSocket de chamadas desconectado');
                setIsCallWsConnected(false);
                callWsRef.current = null;
                
                // Tentar reconectar após 3 segundos
                setTimeout(() => {
                    if (!callWsRef.current) {
                        initializeCallWebSocket();
                    }
                }, 3000);
            };

            callWsRef.current = ws;
        } catch (error) {
            console.error('❌ Erro ao inicializar WebSocket de chamadas:', error);
        }
    }, [userId]);

    // Processar sinalizações de chamada
    const handleCallSignaling = useCallback((data: any) => {
        console.log('📨 Sinalização de chamada recebida:', data.type);

        switch (data.type) {
            case 'call-offer':
                // Chamada recebida
                handleIncomingCall(data);
                break;
            
            case 'call-busy':
                alert('Usuário está ocupado em outra chamada');
                setCallState(prev => ({ ...prev, isCallActive: false }));
                break;
            
            case 'call-rejected':
                alert('Chamada rejeitada');
                setCallState(prev => ({ ...prev, isCallActive: false }));
                break;
            
            case 'call-ended':
                setCallState(prev => ({ ...prev, isCallActive: false }));
                break;
        }
    }, []);

    // Lidar com chamada recebida
    const handleIncomingCall = useCallback((data: any) => {
        // Mostrar notificação ou modal de chamada recebida
        const shouldAccept = window.confirm(
            `${data.user_name} está chamando você (${data.call_type}). Aceitar?`
        );

        if (shouldAccept) {
            acceptIncomingCall(data);
        } else {
            rejectIncomingCall(data);
        }
    }, []);

    // Aceitar chamada recebida
    const acceptIncomingCall = useCallback((data: any) => {
        setCallState({
            isCallActive: true,
            callType: data.call_type as 'audio' | 'video',
            recipientId: data.from,
            recipientName: data.user_name,
            isIncoming: true,
            incomingCallData: data.offer,
        });
    }, []);

    // Rejeitar chamada recebida
    const rejectIncomingCall = useCallback((data: any) => {
        if (callWsRef.current && callWsRef.current.readyState === WebSocket.OPEN) {
            callWsRef.current.send(JSON.stringify({
                type: 'call-rejected',
                from: userId,
                to: data.from,
            }));
        }
    }, [userId]);

    // Iniciar chamada de áudio
    const startAudioCall = useCallback((recipientId: number, recipientName: string, chatId: number) => {
        setCallState({
            isCallActive: true,
            callType: 'audio',
            recipientId,
            recipientName,
            isIncoming: false,
            incomingCallData: null,
        });
    }, []);

    // Iniciar chamada de vídeo
    const startVideoCall = useCallback((recipientId: number, recipientName: string, chatId: number) => {
        setCallState({
            isCallActive: true,
            callType: 'video',
            recipientId,
            recipientName,
            isIncoming: false,
            incomingCallData: null,
        });
    }, []);

    // Encerrar chamada
    const endCall = useCallback(() => {
        setCallState({
            isCallActive: false,
            callType: null,
            recipientId: null,
            recipientName: null,
            isIncoming: false,
            incomingCallData: null,
        });
    }, []);

    // Verificar se usuário pode receber chamada
    const checkUserAvailability = useCallback(async (targetUserId: number): Promise<boolean> => {
        try {
            const response = await fetch(`http://localhost:8082/api/call/check/${targetUserId}`);
            const data = await response.json();
            return data.available;
        } catch (error) {
            console.error('❌ Erro ao verificar disponibilidade:', error);
            return false;
        }
    }, []);

    // Inicializar WebSocket quando o componente montar
    useEffect(() => {
        initializeCallWebSocket();

        return () => {
            if (callWsRef.current) {
                callWsRef.current.close();
                callWsRef.current = null;
            }
        };
    }, [initializeCallWebSocket]);

    return {
        callState,
        isCallWsConnected,
        startAudioCall,
        startVideoCall,
        endCall,
        checkUserAvailability,
    };
};