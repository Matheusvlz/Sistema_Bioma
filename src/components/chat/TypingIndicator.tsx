import React from 'react';

interface TypingIndicatorProps {
    typingText: string;
    isVisible: boolean;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
    typingText,
    isVisible
}) => {
    if (!isVisible || !typingText) {
        return null;
    }

    return (
        <div className="typing-indicator">
            <div className="typing-indicator-content">
                <div className="typing-dots">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                </div>
                <span className="typing-text">{typingText}</span>
            </div>
            
            <style jsx>{`
                .typing-indicator {
                    padding: 8px 16px;
                    background: #f3f4f6;
                    border-radius: 8px;
                    margin: 4px 0;
                    animation: fadeIn 0.3s ease-in-out;
                }

                .typing-indicator-content {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .typing-dots {
                    display: flex;
                    gap: 2px;
                }

                .typing-dot {
                    width: 4px;
                    height: 4px;
                    background: #6b7280;
                    border-radius: 50%;
                    animation: typingPulse 1.4s infinite ease-in-out;
                }

                .typing-dot:nth-child(1) {
                    animation-delay: 0s;
                }

                .typing-dot:nth-child(2) {
                    animation-delay: 0.2s;
                }

                .typing-dot:nth-child(3) {
                    animation-delay: 0.4s;
                }

                .typing-text {
                    font-size: 12px;
                    color: #6b7280;
                    font-style: italic;
                }

                @keyframes typingPulse {
                    0%, 60%, 100% {
                        transform: scale(1);
                        opacity: 0.5;
                    }
                    30% {
                        transform: scale(1.2);
                        opacity: 1;
                    }
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

