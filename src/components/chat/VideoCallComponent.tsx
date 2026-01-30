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

    const initializeWebSocket = async () => {
        try {
            // URL do servidor WebSocket - ajuste conforme necessário
            const wsUrl = `ws://localhost:8082/ws/call/${userId}`;
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
                    offerToReceiveVideo: isVideoEnabled
                });
                
                await peerConnectionRef.current.setLocalDescription(offer);
                
                setCallStatus('ringing');
                sendSignalingMessage({
                    type: 'call-offer',
                    from: userId,
                    to: recipientId,
                    chatId: chatId,
                    callType: isVideoEnabled ? 'video' : 'audio',
                    userName: userName,
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

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            localStreamRef.current = stream;

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            console.log('✅ Mídia local obtida');
        } catch (error) {
            console.error('❌ Erro ao obter mídia local:', error);
            throw error;
        }
    };

    const createPeerConnection = () => {
        const config: RTCConfiguration = {
            iceServers: iceServers
        };

        peerConnectionRef.current = new RTCPeerConnection(config);

        // Adicionar tracks locais à conexão
        localStreamRef.current?.getTracks().forEach(track => {
            if (localStreamRef.current && peerConnectionRef.current) {
                peerConnectionRef.current.addTrack(track, localStreamRef.current);
                console.log('➕ Track adicionado:', track.kind);
            }
        });

        // Lidar com tracks remotos
        peerConnectionRef.current.ontrack = (event) => {
            console.log('📥 Track remoto recebido:', event.track.kind);
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
                if (callStatus !== 'connected') {
                    setCallStatus('connected');
                }
            }
        };

        // Lidar com candidatos ICE
        peerConnectionRef.current.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('🧊 ICE candidate gerado');
                sendSignalingMessage({
                    type: 'ice-candidate',
                    candidate: event.candidate,
                    from: userId,
                    to: recipientId
                });
            }
        };

        // Monitorar estado da conexão
        peerConnectionRef.current.onconnectionstatechange = () => {
            const state = peerConnectionRef.current?.connectionState;
            console.log('🔄 Estado da conexão:', state);
            
            if (state === 'connected') {
                setCallStatus('connected');
            } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
                endCall();
            }
        };

        // Monitorar estado ICE
        peerConnectionRef.current.oniceconnectionstatechange = () => {
            const state = peerConnectionRef.current?.iceConnectionState;
            console.log('🧊 Estado ICE:', state);
        };

        console.log('✅ Peer connection criada');
    };

    const handleSignalingMessage = async (data: any) => {
        try {
            console.log('📨 Mensagem recebida:', data.type);
            
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
            if (peerConnectionRef.current && data.offer) {
                await peerConnectionRef.current.setRemoteDescription(
                    new RTCSessionDescription(data.offer)
                );
                
                // Processar candidatos ICE enfileirados
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
            if (peerConnectionRef.current && data.answer) {
                await peerConnectionRef.current.setRemoteDescription(
                    new RTCSessionDescription(data.answer)
                );
                
                // Processar candidatos ICE enfileirados
                while (iceCandidatesQueue.current.length > 0) {
                    const candidate = iceCandidatesQueue.current.shift();
                    if (candidate) {
                        await peerConnectionRef.current.addIceCandidate(candidate);
                    }
                }
                
                console.log('✅ Resposta de chamada processada');
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
                    console.log('✅ ICE candidate adicionado');
                } else {
                    // Enfileirar candidatos se ainda não temos descrição remota
                    iceCandidatesQueue.current.push(candidate);
                    console.log('⏳ ICE candidate enfileirado');
                }
            }
        } catch (error) {
            console.error('❌ Erro ao adicionar candidato ICE:', error);
        }
    };

    const sendSignalingMessage = (message: any) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
            console.log('📤 Mensagem enviada:', message.type);
        } else {
            console.error('❌ WebSocket não está conectado');
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
                    
                    const newVideoTrack = videoStream.getVideoTracks()[0];
                    localStreamRef.current.addTrack(newVideoTrack);
                    
                    const sender = peerConnectionRef.current?.getSenders().find(s => 
                        s.track?.kind === 'video'
                    );
                    
                    if (sender) {
                        sender.replaceTrack(newVideoTrack);
                    } else {
                        peerConnectionRef.current?.addTrack(newVideoTrack, localStreamRef.current);
                    }
                    
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = localStreamRef.current;
                    }
                    
                    setIsVideoEnabled(true);
                } catch (error) {
                    console.error('❌ Erro ao ativar vídeo:', error);
                }
            }
        }
    };

    const toggleSpeaker = () => {
        if (remoteVideoRef.current) {
            remoteVideoRef.current.muted = !remoteVideoRef.current.muted;
            setIsSpeakerOn(!remoteVideoRef.current.muted);
            console.log(remoteVideoRef.current.muted ? '🔇 Som desligado' : '🔊 Som ligado');
        }
    };

    const toggleScreenShare = async () => {
        if (!isScreenSharing) {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { 
                        cursor: 'always',
                        displaySurface: 'monitor'
                    },
                    audio: false
                });

                screenStreamRef.current = screenStream;

                // Substituir track de vídeo
                const videoTrack = screenStream.getVideoTracks()[0];
                const sender = peerConnectionRef.current?.getSenders().find(s => 
                    s.track?.kind === 'video'
                );

                if (sender) {
                    sender.replaceTrack(videoTrack);
                }

                // Quando o usuário parar de compartilhar
                videoTrack.onended = () => {
                    stopScreenShare();
                };

                setIsScreenSharing(true);
                console.log('🖥️ Compartilhamento de tela iniciado');
            } catch (error) {
                console.error('❌ Erro ao compartilhar tela:', error);
            }
        } else {
            stopScreenShare();
        }
    };

    const stopScreenShare = async () => {
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
        }

        // Voltar para câmera
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            const sender = peerConnectionRef.current?.getSenders().find(s => 
                s.track?.kind === 'video'
            );

            if (sender && videoTrack) {
                sender.replaceTrack(videoTrack);
            }
        }

        setIsScreenSharing(false);
        console.log('🖥️ Compartilhamento de tela encerrado');
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
        // Parar todas as tracks
        localStreamRef.current?.getTracks().forEach(track => {
            track.stop();
            console.log('⏹️ Track parado:', track.kind);
        });
        screenStreamRef.current?.getTracks().forEach(track => track.stop());
        
        // Fechar conexão peer
        peerConnectionRef.current?.close();
        
        // Fechar WebSocket
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.close();
        }
        
        // Limpar timer
        if (callTimerRef.current) {
            clearInterval(callTimerRef.current);
        }

        console.log('🧹 Limpeza concluída');
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
                    {isVideoEnabled && (
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