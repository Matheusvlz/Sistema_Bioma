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
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isReconnectingRef = useRef(false);
    
    // Estado para modal de chamada recebida
    const [incomingCallInfo, setIncomingCallInfo] = useState<any>(null);

    // Limpar timeout de reconexão
    const clearReconnectTimeout = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
    }, []);

    // Inicializar WebSocket de chamadas
    const initializeCallWebSocket = useCallback(() => {
        // Evitar múltiplas conexões simultâneas
        if (callWsRef.current?.readyState === WebSocket.OPEN || 
            callWsRef.current?.readyState === WebSocket.CONNECTING) {
            console.log('⚠️ WebSocket já está conectado ou conectando');
            return;
        }

        // Evitar reconexões durante reconexão
        if (isReconnectingRef.current) {
            console.log('⚠️ Já está tentando reconectar');
            return;
        }

        isReconnectingRef.current = true;
        clearReconnectTimeout();

        try {
            const wsUrl = `ws://192.168.15.60:8082/ws/call/${userId}`;
            console.log('🔄 Conectando ao WebSocket de chamadas:', wsUrl);
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log('✅ WebSocket de chamadas conectado');
                setIsCallWsConnected(true);
                isReconnectingRef.current = false;
                clearReconnectTimeout();
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
            };

            ws.onclose = (event) => {
                console.log('🔌 WebSocket de chamadas desconectado', event.code, event.reason);
                setIsCallWsConnected(false);
                callWsRef.current = null;
                isReconnectingRef.current = false;
                
                // Tentar reconectar apenas se não foi um fechamento intencional
                if (event.code !== 1000) {
                    console.log('🔄 Tentando reconectar em 3 segundos...');
                    reconnectTimeoutRef.current = setTimeout(() => {
                        initializeCallWebSocket();
                    }, 3000);
                }
            };

            callWsRef.current = ws;
        } catch (error) {
            console.error('❌ Erro ao inicializar WebSocket de chamadas:', error);
            isReconnectingRef.current = false;
        }
    }, [userId, clearReconnectTimeout]);

    // Processar sinalizações de chamada
    const handleCallSignaling = useCallback((data: any) => {
        console.log('📨 Sinalização de chamada recebida:', data.type);

        switch (data.type) {
            case 'call-offer':
                console.log('📞 Chamada recebida de:', data.user_name);
                // Disparar evento customizado para o Layout
                window.dispatchEvent(new CustomEvent('incoming-call', { detail: data }));
                setIncomingCallInfo(data);
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

    // Aceitar chamada recebida
    const acceptIncomingCall = useCallback((data: any) => {
        console.log('✅ Aceitando chamada de:', data.user_name);
        setCallState({
            isCallActive: true,
            callType: data.call_type as 'audio' | 'video',
            recipientId: data.from,
            recipientName: data.user_name,
            isIncoming: true,
            incomingCallData: data.offer,
        });
        setIncomingCallInfo(null);
    }, []);

    // Rejeitar chamada recebida
    const rejectIncomingCall = useCallback((data: any) => {
        console.log('❌ Rejeitando chamada de:', data.user_name);
        if (callWsRef.current && callWsRef.current.readyState === WebSocket.OPEN) {
            callWsRef.current.send(JSON.stringify({
                type: 'call-rejected',
                from: userId,
                to: data.from,
            }));
        }
        setIncomingCallInfo(null);
    }, [userId]);

    // Iniciar chamada de áudio
    const startAudioCall = useCallback((recipientId: number, recipientName: string, chatId: number) => {
        console.log('📞 Iniciando chamada de áudio para:', recipientName);
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
        console.log('📹 Iniciando chamada de vídeo para:', recipientName);
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
        console.log('🔴 Encerrando chamada');
        
        // Enviar mensagem de encerramento se houver um destinatário
        if (callState.recipientId && callWsRef.current?.readyState === WebSocket.OPEN) {
            callWsRef.current.send(JSON.stringify({
                type: 'call-ended',
                from: userId,
                to: callState.recipientId,
            }));
        }
        
        setCallState({
            isCallActive: false,
            callType: null,
            recipientId: null,
            recipientName: null,
            isIncoming: false,
            incomingCallData: null,
        });
    }, [callState.recipientId, userId]);

    // Verificar se usuário pode receber chamada
    const checkUserAvailability = useCallback(async (targetUserId: number): Promise<boolean> => {
        try {
            const response = await fetch(`http://192.168.15.60:8082/api/call/check/${targetUserId}`);
            const data = await response.json();
            return data.available;
        } catch (error) {
            console.error('❌ Erro ao verificar disponibilidade:', error);
            return false;
        }
    }, []);

    // Enviar mensagem de sinalização
    const sendSignalingMessage = useCallback((message: any) => {
        if (callWsRef.current && callWsRef.current.readyState === WebSocket.OPEN) {
            callWsRef.current.send(JSON.stringify(message));
            console.log('📤 Mensagem de sinalização enviada:', message.type);
        } else {
            console.error('❌ WebSocket não está conectado');
        }
    }, []);

    // Inicializar WebSocket quando o componente montar
    useEffect(() => {
        initializeCallWebSocket();

        return () => {
            clearReconnectTimeout();
            if (callWsRef.current) {
                callWsRef.current.close(1000, 'Component unmounting');
                callWsRef.current = null;
            }
        };
    }, [initializeCallWebSocket, clearReconnectTimeout]);

    return {
        callState,
        isCallWsConnected,
        incomingCallInfo,
        acceptIncomingCall,
        rejectIncomingCall,
        startAudioCall,
        startVideoCall,
        endCall,
        checkUserAvailability,
        sendSignalingMessage,
        callWsRef,
    };
};