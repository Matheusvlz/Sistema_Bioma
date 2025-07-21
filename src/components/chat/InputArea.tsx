import React, { useRef } from 'react';
import { Send, Paperclip, Smile, Upload } from 'lucide-react';

interface InputAreaProps {
    newMessage: string;
    setNewMessage: (message: string) => void;
    onSendMessage: () => void;
    onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
    isUploading: boolean;
    selectedFilesCount: number;
}

export const InputArea: React.FC<InputAreaProps> = ({
    newMessage,
    setNewMessage,
    onSendMessage,
    onFileSelect,
    isUploading,
    selectedFilesCount
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSendMessage();
        }
    };

    return (
        <div className="input-area">
            <div className="input-container">
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                    onChange={onFileSelect}
                    style={{ display: 'none' }}
                />
                <button 
                    className="attachment-button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                >
                    {isUploading ? <Upload className="animate-pulse" /> : <Paperclip />}
                </button>
                <div className="input-wrapper">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Digite sua mensagem..."
                        className="message-input"
                        disabled={isUploading}
                    />
                    <button className="emoji-button" disabled={isUploading}>
                        <Smile />
                    </button>
                </div>
                <button
                    onClick={onSendMessage}
                    disabled={(!newMessage.trim() && selectedFilesCount === 0) || isUploading}
                    className="send-button"
                >
                    {isUploading ? <Upload className="animate-pulse" /> : <Send />}
                </button>
            </div>
        </div>
    );
};
