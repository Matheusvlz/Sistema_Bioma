import React, { useState, useRef, useEffect } from 'react';
import { 
    Phone, 
    Video, 
    PhoneOff, 
    VideoOff, 
    Mic, 
    MicOff, 
    Monitor, 
    MonitorOff,
    Volume2,
    VolumeX,
    Maximize2,
    Minimize2,
    Users,
    X
} from 'lucide-react';
import './style/VideoCall.css';

interface VideoCallProps {
    chatId: number;
    userId: number;
    userName: string;
    recipientId: number;
    recipientName: string;
    onClose: () => void;
    initialType: 'audio' | 'video';
    isIncoming?: boolean;
    incomingOffer?: any;
}

interface IceServer {
    urls: string | string[];
    username?: string;
    credential?: string;
}

export const VideoCallComponent: React.FC<VideoCallProps> = ({
    chatId,
    userId,
    userName,
    recipientId,
    recipientName,
    onClose,
    initialType,
    isIncoming = false,
    incomingOffer = null
}) => {
    // Estados de mídia
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(initialType === 'video');
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    
    // Estados da chamada
    const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'connected' | 'ended' | 'rejected'>('connecting');
    const [callDuration, setCallDuration] = useState(0);
    const [isMinimized, setIsMinimized] = useState(false);
    
    // Refs para elementos de vídeo e conexão
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const screenPreviewRef = useRef<HTMLVideoElement>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const callTimerRef = useRef<NodeJS.Timeout | null>(null);
    const iceCandidatesQueue = useRef<RTCIceCandidate[]>([]);

    // Configuração de servidores ICE (STUN/TURN)
    const iceServers: IceServer[] = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
    ];

    // Inicializar conexão WebSocket para sinalização
    useEffect(() => {
        initializeWebSocket();
        return () => {
            cleanup();
        };
    }, []);

    // Timer da chamada
    useEffect(() => {
        if (callStatus === 'connected') {
            callTimerRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (callTimerRef.current) {
                clearInterval(callTimerRef.current);
            }
        };
    }, [callStatus]);

    // Garantir que streams sejam atribuídas aos vídeos
    useEffect(() => {
        if (localStreamRef.current && localVideoRef.current && !isScreenSharing) {
            localVideoRef.current.srcObject = localStreamRef.current;
            localVideoRef.current.play().catch(e => {
                console.warn('⚠️ Erro ao dar play no vídeo local:', e);
            });
        }
    }, [localStreamRef.current, isScreenSharing]);

    useEffect(() => {
        if (isScreenSharing && screenStreamRef.current && screenPreviewRef.current) {
            console.log('🔄 Atualizando preview de compartilhamento de tela');
            screenPreviewRef.current.srcObject = screenStreamRef.current;
            screenPreviewRef.current.play().catch(e => {
                console.warn('⚠️ Erro ao dar play no preview:', e);
            });
        }
    }, [isScreenSharing, screenStreamRef.current]);

    const initializeWebSocket = async () => {
        try {
            const wsUrl = `ws://192.168.15.60:8082/ws/call/${userId}`;
            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                console.log('✅ WebSocket conectado para chamada');
                if (isIncoming && incomingOffer) {
                    handleIncomingCall(incomingOffer);
                } else {
                    startCall();
                }
            };

            wsRef.current.onmessage = async (event) => {
                try {
                    const data = JSON.parse(event.data);
                    await handleSignalingMessage(data);
                } catch (error) {
                    console.error('❌ Erro ao processar mensagem:', error);
                }
            };

            wsRef.current.onerror = (error) => {
                console.error('❌ Erro no WebSocket:', error);
                setCallStatus('ended');
            };

            wsRef.current.onclose = () => {
                console.log('🔌 WebSocket desconectado');
            };
        } catch (error) {
            console.error('❌ Erro ao inicializar WebSocket:', error);
            setCallStatus('ended');
        }
    };

    const handleIncomingCall = async (offer: any) => {
        try {
            console.log('📞 Processando chamada recebida...');
            await getLocalMedia();
            createPeerConnection();
            
            if (peerConnectionRef.current && offer) {
                await peerConnectionRef.current.setRemoteDescription(
                    new RTCSessionDescription(offer)
                );
                
                // Processar candidatos ICE que estavam na fila
                while (iceCandidatesQueue.current.length > 0) {
                    const candidate = iceCandidatesQueue.current.shift();
                    if (candidate) {
                        await peerConnectionRef.current.addIceCandidate(candidate);
                    }
                }
                
                const answer = await peerConnectionRef.current.createAnswer();
                await peerConnectionRef.current.setLocalDescription(answer);
                
                sendSignalingMessage({
                    type: 'call-answer',
                    from: userId,
                    to: recipientId,
                    answer: answer
                });
                
                setCallStatus('connected');
            }
        } catch (error) {
            console.error('❌ Erro ao processar chamada recebida:', error);
            rejectCall();
        }
    };

    const startCall = async () => {
        try {
            console.log('📞 Iniciando chamada...');
            await getLocalMedia();
            createPeerConnection();
            
            if (peerConnectionRef.current) {
                const offer = await peerConnectionRef.current.createOffer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true // SEMPRE true para receber vídeo do outro lado
                });
                
                await peerConnectionRef.current.setLocalDescription(offer);
                
                setCallStatus('ringing');
                sendSignalingMessage({
                    type: 'call-offer',
                    from: userId,
                    to: recipientId,
                    chat_id: chatId,
                    call_type: isVideoEnabled ? 'video' : 'audio',
                    user_name: userName,
                    offer: offer
                });
            }
        } catch (error) {
            console.error('❌ Erro ao iniciar chamada:', error);
            alert('Erro ao acessar câmera/microfone. Verifique as permissões.');
            onClose();
        }
    };

    const getLocalMedia = async () => {
        try {
            const constraints: MediaStreamConstraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: isVideoEnabled ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                } : false
            };

            console.log('🎥 Solicitando mídia com constraints:', constraints);
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            localStreamRef.current = stream;

            console.log('✅ Mídia local obtida:', {
                audioTracks: stream.getAudioTracks().length,
                videoTracks: stream.getVideoTracks().length
            });

            // Atribuir stream ao elemento de vídeo local
            if (localVideoRef.current && isVideoEnabled) {
                localVideoRef.current.srcObject = stream;
                await localVideoRef.current.play();
                console.log('✅ Vídeo local sendo exibido');
            }
        } catch (error) {
            console.error('❌ Erro ao obter mídia local:', error);
            throw error;
        }
    };

    const createPeerConnection = () => {
        const config: RTCConfiguration = {
            iceServers: iceServers,
            // Adicionar configurações para melhorar conectividade
            iceCandidatePoolSize: 10,
            bundlePolicy: 'max-bundle',
            rtcpMuxPolicy: 'require'
        };

        peerConnectionRef.current = new RTCPeerConnection(config);

        // CRÍTICO: Adicionar tracks locais à conexão ANTES de criar offer/answer
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                if (localStreamRef.current && peerConnectionRef.current) {
                    const sender = peerConnectionRef.current.addTrack(track, localStreamRef.current);
                    console.log('➕ Track adicionado ao peer:', {
                        kind: track.kind,
                        enabled: track.enabled,
                        readyState: track.readyState,
                        label: track.label
                    });
                }
            });
        }

        // Lidar com tracks remotos
        peerConnectionRef.current.ontrack = (event) => {
            console.log('📥 Track remoto recebido:', {
                kind: event.track.kind,
                streams: event.streams.length,
                track: event.track
            });
            
            if (remoteVideoRef.current && event.streams[0]) {
                remoteVideoRef.current.srcObject = event.streams[0];
                remoteVideoRef.current.play().catch(e => {
                    console.error('❌ Erro ao dar play no vídeo remoto:', e);
                });
                
                if (callStatus !== 'connected') {
                    setCallStatus('connected');
                }
                
                console.log('✅ Stream remoto atribuído ao vídeo');
            }
        };

        // Lidar com candidatos ICE
        peerConnectionRef.current.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('🧊 ICE candidate gerado:', event.candidate.type);
                sendSignalingMessage({
                    type: 'ice-candidate',
                    candidate: event.candidate,
                    from: userId,
                    to: recipientId
                });
            } else {
                console.log('✅ Todos os ICE candidates foram coletados');
            }
        };

        // Monitorar estado da conexão
        peerConnectionRef.current.onconnectionstatechange = () => {
            const state = peerConnectionRef.current?.connectionState;
            console.log('🔄 Estado da conexão:', state);
            
            if (state === 'connected') {
                setCallStatus('connected');
                console.log('✅ Conexão WebRTC estabelecida!');
            } else if (state === 'disconnected' || state === 'failed') {
                console.error('❌ Conexão falhou ou desconectou:', state);
                // Tentar reconectar antes de desistir
                if (state === 'failed') {
                    endCall();
                }
            } else if (state === 'closed') {
                endCall();
            }
        };

        // Monitorar estado ICE
        peerConnectionRef.current.oniceconnectionstatechange = () => {
            const state = peerConnectionRef.current?.iceConnectionState;
            console.log('🧊 Estado ICE:', state);
            
            if (state === 'failed') {
                console.error('❌ Falha na conexão ICE - possível problema de firewall/NAT');
            }
        };

        // Monitorar estado de gathering ICE
        peerConnectionRef.current.onicegatheringstatechange = () => {
            const state = peerConnectionRef.current?.iceGatheringState;
            console.log('🔍 Estado de coleta ICE:', state);
        };

        // Monitorar estado de sinalização
        peerConnectionRef.current.onsignalingstatechange = () => {
            const state = peerConnectionRef.current?.signalingState;
            console.log('📡 Estado de sinalização:', state);
        };

        // Log de negociação
        peerConnectionRef.current.onnegotiationneeded = async () => {
            console.log('🔄 Negociação necessária');
        };

        console.log('✅ Peer connection criada com configuração:', config);
    };

    const handleSignalingMessage = async (data: any) => {
        try {
            console.log('📨 Mensagem de sinalização recebida:', data.type);
            
            switch (data.type) {
                case 'call-answer':
                    await handleCallAnswer(data);
                    break;
                
                case 'call-offer':
                    await handleCallOffer(data);
                    break;
                
                case 'ice-candidate':
                    await handleIceCandidate(data);
                    break;
                
                case 'call-rejected':
                    setCallStatus('rejected');
                    alert('Chamada rejeitada');
                    setTimeout(() => onClose(), 2000);
                    break;
                
                case 'call-ended':
                    endCall();
                    break;

                case 'call-busy':
                    alert('Usuário ocupado em outra chamada');
                    setCallStatus('ended');
                    setTimeout(() => onClose(), 2000);
                    break;
            }
        } catch (error) {
            console.error('❌ Erro ao processar mensagem de sinalização:', error);
        }
    };

    const handleCallOffer = async (data: any) => {
        try {
            console.log('📨 Processando oferta recebida');
            if (peerConnectionRef.current && data.offer) {
                await peerConnectionRef.current.setRemoteDescription(
                    new RTCSessionDescription(data.offer)
                );
                console.log('✅ Remote description definida (offer)');
                
                // Processar candidatos ICE enfileirados
                while (iceCandidatesQueue.current.length > 0) {
                    const candidate = iceCandidatesQueue.current.shift();
                    if (candidate) {
                        await peerConnectionRef.current.addIceCandidate(candidate);
                        console.log('✅ ICE candidate da fila processado');
                    }
                }
                
                const answer = await peerConnectionRef.current.createAnswer();
                await peerConnectionRef.current.setLocalDescription(answer);
                console.log('✅ Answer criada e local description definida');
                
                sendSignalingMessage({
                    type: 'call-answer',
                    from: userId,
                    to: data.from,
                    answer: answer
                });
            }
        } catch (error) {
            console.error('❌ Erro ao processar oferta:', error);
        }
    };

    const handleCallAnswer = async (data: any) => {
        try {
            console.log('📨 Processando resposta recebida');
            if (peerConnectionRef.current && data.answer) {
                await peerConnectionRef.current.setRemoteDescription(
                    new RTCSessionDescription(data.answer)
                );
                console.log('✅ Remote description definida (answer)');
                
                // Processar candidatos ICE enfileirados
                while (iceCandidatesQueue.current.length > 0) {
                    const candidate = iceCandidatesQueue.current.shift();
                    if (candidate) {
                        await peerConnectionRef.current.addIceCandidate(candidate);
                        console.log('✅ ICE candidate da fila processado');
                    }
                }
            }
        } catch (error) {
            console.error('❌ Erro ao processar resposta:', error);
        }
    };

    const handleIceCandidate = async (data: any) => {
        try {
            if (data.candidate) {
                const candidate = new RTCIceCandidate(data.candidate);
                
                if (peerConnectionRef.current?.remoteDescription) {
                    await peerConnectionRef.current.addIceCandidate(candidate);
                    console.log('✅ ICE candidate adicionado:', candidate.type);
                } else {
                    // Enfileirar candidatos se ainda não temos descrição remota
                    iceCandidatesQueue.current.push(candidate);
                    console.log('⏳ ICE candidate enfileirado (aguardando remote description)');
                }
            }
        } catch (error) {
            console.error('❌ Erro ao adicionar candidato ICE:', error);
        }
    };

    const sendSignalingMessage = (message: any) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
            console.log('📤 Mensagem de sinalização enviada:', message.type);
        } else {
            console.error('❌ WebSocket não está conectado, não é possível enviar:', message.type);
        }
    };

    // Controles de mídia
    const toggleAudio = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioEnabled(audioTrack.enabled);
                console.log(audioTrack.enabled ? '🎤 Áudio ligado' : '🔇 Áudio desligado');
            }
        }
    };

    const toggleVideo = async () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);
                console.log(videoTrack.enabled ? '📹 Vídeo ligado' : '📷 Vídeo desligado');
            } else if (!isVideoEnabled) {
                // Se não há track de vídeo, tentar adicionar
                try {
                    const videoStream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            width: { ideal: 1280 },
                            height: { ideal: 720 },
                            frameRate: { ideal: 30 }
                        }
                    });
                    
                    const videoTrack = videoStream.getVideoTracks()[0];
                    localStreamRef.current.addTrack(videoTrack);
                    
                    // Adicionar à conexão peer
                    if (peerConnectionRef.current) {
                        const sender = peerConnectionRef.current.addTrack(videoTrack, localStreamRef.current);
                        console.log('➕ Track de vídeo adicionado dinamicamente');
                    }
                    
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = localStreamRef.current;
                        await localVideoRef.current.play();
                    }
                    
                    setIsVideoEnabled(true);
                } catch (error) {
                    console.error('❌ Erro ao adicionar vídeo:', error);
                    alert('Não foi possível ativar a câmera');
                }
            }
        }
    };

    const toggleScreenShare = async () => {
        if (!isScreenSharing) {
            try {
                // Solicitar compartilhamento de tela
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: {
                        cursor: 'always',
                        displaySurface: 'monitor'
                    },
                    audio: false
                });

                screenStreamRef.current = screenStream;
                
                // Obter track de vídeo da tela
                const screenTrack = screenStream.getVideoTracks()[0];
                
                // Encontrar o sender de vídeo atual
                const sender = peerConnectionRef.current?.getSenders().find(s => 
                    s.track?.kind === 'video'
                );

                if (sender) {
                    // Substituir track da câmera pela da tela
                    await sender.replaceTrack(screenTrack);
                    console.log('✅ Track de vídeo substituído por compartilhamento de tela');
                }

                // Atualizar preview
                if (screenPreviewRef.current) {
                    screenPreviewRef.current.srcObject = screenStream;
                    await screenPreviewRef.current.play();
                }

                // Detectar quando usuário para o compartilhamento
                screenTrack.onended = () => {
                    stopScreenShare();
                };

                setIsScreenSharing(true);
                console.log('🖥️ Compartilhamento de tela iniciado');
            } catch (error) {
                console.error('❌ Erro ao compartilhar tela:', error);
                alert('Não foi possível compartilhar a tela');
            }
        } else {
            stopScreenShare();
        }
    };

    const stopScreenShare = async () => {
        if (!screenStreamRef.current) return;

        // Parar tracks de compartilhamento
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;

        // Limpar preview
        if (screenPreviewRef.current) {
            screenPreviewRef.current.srcObject = null;
        }

        // Voltar para câmera
        if (localStreamRef.current && isVideoEnabled) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            const sender = peerConnectionRef.current?.getSenders().find(s => 
                s.track?.kind === 'video'
            );

            if (sender && videoTrack) {
                await sender.replaceTrack(videoTrack);
                console.log('✅ Voltou para câmera');
            }
        } else {
            // Se não tem vídeo habilitado, remover track de vídeo
            const sender = peerConnectionRef.current?.getSenders().find(s => 
                s.track?.kind === 'video'
            );
            if (sender) {
                await sender.replaceTrack(null);
            }
        }

        setIsScreenSharing(false);
        console.log('🖥️ Compartilhamento de tela encerrado');
    };

    const toggleSpeaker = () => {
        if (remoteVideoRef.current) {
            remoteVideoRef.current.muted = !isSpeakerOn;
            setIsSpeakerOn(!isSpeakerOn);
            console.log(isSpeakerOn ? '🔇 Som desligado' : '🔊 Som ligado');
        }
    };

    const rejectCall = () => {
        sendSignalingMessage({
            type: 'call-rejected',
            from: userId,
            to: recipientId
        });
        
        cleanup();
        onClose();
    };

    const endCall = () => {
        console.log('📴 Encerrando chamada');
        setCallStatus('ended');
        
        sendSignalingMessage({
            type: 'call-ended',
            from: userId,
            to: recipientId
        });
        
        cleanup();
        
        setTimeout(() => {
            onClose();
        }, 1000);
    };

    const cleanup = () => {
        console.log('🧹 Iniciando limpeza...');
        
        // Parar todas as tracks locais
        localStreamRef.current?.getTracks().forEach(track => {
            track.stop();
            console.log('⏹️ Track local parado:', track.kind);
        });
        
        // Parar tracks de compartilhamento
        screenStreamRef.current?.getTracks().forEach(track => {
            track.stop();
            console.log('⏹️ Track de tela parado:', track.kind);
        });
        
        // Limpar elementos de vídeo
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
        }
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
        if (screenPreviewRef.current) {
            screenPreviewRef.current.srcObject = null;
        }
        
        // Fechar conexão peer
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
            console.log('❌ Peer connection fechada');
        }
        
        // Fechar WebSocket
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.close();
            wsRef.current = null;
            console.log('❌ WebSocket fechado');
        }
        
        // Limpar timer
        if (callTimerRef.current) {
            clearInterval(callTimerRef.current);
            callTimerRef.current = null;
        }

        console.log('✅ Limpeza concluída');
    };

    const formatDuration = (seconds: number): string => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hrs > 0) {
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`video-call-container ${isMinimized ? 'minimized' : ''}`}>
            {/* Header */}
            <div className="call-header">
                <div className="call-info">
                    <h3>{recipientName}</h3>
                    <span className="call-status">
                        {callStatus === 'connecting' && '🔄 Conectando...'}
                        {callStatus === 'ringing' && '📞 Chamando...'}
                        {callStatus === 'connected' && `⏱️ ${formatDuration(callDuration)}`}
                        {callStatus === 'ended' && '📴 Chamada encerrada'}
                        {callStatus === 'rejected' && '❌ Chamada rejeitada'}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                        className="minimize-button"
                        onClick={() => setIsMinimized(!isMinimized)}
                        title={isMinimized ? 'Maximizar' : 'Minimizar'}
                    >
                        {isMinimized ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
                    </button>
                    <button 
                        className="close-button"
                        onClick={endCall}
                        title="Fechar"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Vídeos */}
            {!isMinimized && (
                <div className="video-container">
                    {/* Vídeo remoto (principal) */}
                    <div className="remote-video-wrapper">
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="remote-video"
                        />
                        
                        {/* Placeholder quando vídeo remoto não está disponível */}
                        {callStatus !== 'connected' && (
                            <div className="video-placeholder">
                                <Users size={64} />
                                <p>{recipientName}</p>
                                <span className="status-text">
                                    {callStatus === 'connecting' && 'Conectando...'}
                                    {callStatus === 'ringing' && 'Chamando...'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Vídeo local (picture-in-picture) */}
                    {isVideoEnabled && !isScreenSharing && (
                        <div className="local-video-wrapper">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="local-video"
                            />
                        </div>
                    )}

                    {/* Preview do compartilhamento de tela */}
                    {isScreenSharing && (
                        <div className="local-video-wrapper screen-preview">
                            <video
                                ref={screenPreviewRef}
                                autoPlay
                                playsInline
                                muted
                                className="local-video"
                            />
                            <div className="screen-sharing-indicator">
                                <Monitor size={16} />
                                <span>Compartilhando tela</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Controles */}
            <div className="call-controls">
                <button
                    className={`control-button ${!isAudioEnabled ? 'disabled' : ''}`}
                    onClick={toggleAudio}
                    title={isAudioEnabled ? 'Desligar microfone' : 'Ligar microfone'}
                >
                    {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
                </button>

                {initialType === 'video' && (
                    <button
                        className={`control-button ${!isVideoEnabled ? 'disabled' : ''}`}
                        onClick={toggleVideo}
                        title={isVideoEnabled ? 'Desligar câmera' : 'Ligar câmera'}
                    >
                        {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
                    </button>
                )}

                <button
                    className={`control-button ${isScreenSharing ? 'active' : ''}`}
                    onClick={toggleScreenShare}
                    title={isScreenSharing ? 'Parar compartilhamento' : 'Compartilhar tela'}
                >
                    {isScreenSharing ? <MonitorOff size={24} /> : <Monitor size={24} />}
                </button>

                <button
                    className={`control-button ${!isSpeakerOn ? 'disabled' : ''}`}
                    onClick={toggleSpeaker}
                    title={isSpeakerOn ? 'Desligar som' : 'Ligar som'}
                >
                    {isSpeakerOn ? <Volume2 size={24} /> : <VolumeX size={24} />}
                </button>

                <button
                    className="control-button end-call"
                    onClick={endCall}
                    title="Encerrar chamada"
                >
                    <PhoneOff size={24} />
                </button>
            </div>
        </div>
    );
};