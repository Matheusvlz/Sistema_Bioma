import React from 'react';
import { Bell } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

interface AttentionButtonProps {
    chatId: number;
    disabled?: boolean;
}

export const AttentionButton: React.FC<AttentionButtonProps> = ({ chatId, disabled = false }) => {
    const [isSending, setIsSending] = React.useState(false);

    const handleCallAttention = async () => {
        if (isSending || disabled) return;

        try {
            setIsSending(true);
            await invoke('send_attention_call', { chatId });
            console.log('Chamar atenção enviado com sucesso!');
        } catch (error) {
            console.error('Erro ao chamar atenção:', error);
            alert('Erro ao chamar atenção: ' + error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <button
            onClick={handleCallAttention}
            disabled={disabled || isSending}
            className="attention-button"
            title="Chamar atenção"
            style={{
                background: 'none',
                border: 'none',
                cursor: disabled || isSending ? 'not-allowed' : 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                transition: 'all 0.2s ease',
                opacity: disabled || isSending ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
                if (!disabled && !isSending) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 193, 7, 0.1)';
                }
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
            }}
        >
            <Bell 
                size={20} 
                color={isSending ? '#999' : '#FFC107'}
                style={{
                    animation: isSending ? 'shake 0.5s ease-in-out infinite' : 'none'
                }}
            />
        </button>
    );
};

// CSS para animação do sino
const styles = `
@keyframes shake {
    0%, 100% { transform: rotate(0deg); }
    10%, 30%, 50%, 70%, 90% { transform: rotate(-10deg); }
    20%, 40%, 60%, 80% { transform: rotate(10deg); }
}

.attention-button:active:not(:disabled) {
    transform: scale(0.95);
}
`;

// Injeta o CSS no documento
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}
