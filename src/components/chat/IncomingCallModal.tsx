// IncomingCallModal.tsx - Modal para aceitar/rejeitar chamadas

import React from 'react';
import { Phone, Video, PhoneOff, User } from 'lucide-react';
import './style/IncomingCallModal.css';

interface IncomingCallModalProps {
    callerName: string;
    callType: 'audio' | 'video';
    onAccept: () => void;
    onReject: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
    callerName,
    callType,
    onAccept,
    onReject,
}) => {
    return (
        <div className="incoming-call-overlay">
            <div className="incoming-call-modal">
                {/* Avatar/Ícone do usuário */}
                <div className="caller-avatar">
                    <User size={64} />
                </div>

                {/* Informações da chamada */}
                <div className="call-info">
                    <h2 className="caller-name">{callerName}</h2>
                    <p className="call-type-text">
                        {callType === 'video' ? (
                            <>
                                <Video size={20} />
                                <span>Chamada de vídeo</span>
                            </>
                        ) : (
                            <>
                                <Phone size={20} />
                                <span>Chamada de áudio</span>
                            </>
                        )}
                    </p>
                </div>

                {/* Animação de chamando */}
                <div className="calling-animation">
                    <div className="pulse-ring"></div>
                    <div className="pulse-ring delay-1"></div>
                    <div className="pulse-ring delay-2"></div>
                </div>

                {/* Botões de ação */}
                <div className="call-actions">
                    <button
                        className="call-action-button reject"
                        onClick={onReject}
                        title="Rejeitar"
                    >
                        <PhoneOff size={28} />
                    </button>
                    <button
                        className="call-action-button accept"
                        onClick={onAccept}
                        title="Aceitar"
                    >
                        {callType === 'video' ? (
                            <Video size={28} />
                        ) : (
                            <Phone size={28} />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};