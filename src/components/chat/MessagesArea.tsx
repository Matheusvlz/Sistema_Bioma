import React, { useRef, useEffect } from 'react';
import { Paperclip, Check, CheckCheck, ZoomIn, Download, Search, File } from 'lucide-react';

interface Message {
    id: number;
    user_id: number;
    content: string;
    timestamp: string;
    user_name: string;
    visualizado_hora: string | null;
    visualizado: boolean;
    visualizado_cont: number;
    arquivo: boolean | null;
    arquivo_nome?: string;
    arquivo_tipo?: string;
    arquivo_tamanho?: number;
    arquivo_url?: string;
}

interface MessagesAreaProps {
    messages: Message[];
    currentUserId: number;
    isDragging: boolean;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onOpenImageViewer: (imageUrl: string, imageName: string) => void;
    onOpenPdfViewer: (pdfUrl: string, pdfName: string) => void;
    onDownloadFile: (url: string, fileName: string) => void;
    formatMessageTime: (timestamp: string) => string;
    formatReadTime: (timestamp: string | null) => string | null;
    formatFileSize: (bytes: number) => string;
    getFileIcon: (fileName: string) => React.ReactNode;
}

export const MessagesArea: React.FC<MessagesAreaProps> = ({
    messages,
    currentUserId,
    isDragging,
    onDragOver,
    onDragLeave,
    onDrop,
    onOpenImageViewer,
    onOpenPdfViewer,
    onDownloadFile,
    formatMessageTime,
    formatReadTime,
    formatFileSize,
    getFileIcon
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div 
            className={`messages-area ${isDragging ? 'dragging' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            {isDragging && (
                <div className="drag-overlay">
                    <div className="drag-message">
                        <Paperclip size={48} />
                        <p>Solte os arquivos aqui para enviar</p>
                    </div>
                </div>
            )}
            
            {messages.map((message) => (
                <div
                    key={message.id}
                    className={`message-container ${message.user_id === currentUserId ? 'user' : 'other'}`}
                >
                    <div className={`message ${message.user_id === currentUserId ? 'user' : 'other'}`}>
                        {message.user_id !== currentUserId && (
                            <div className="message-sender">{message.user_name}</div>
                        )}
                        
                        {message.arquivo && message.arquivo_tipo?.startsWith('image/') && message.arquivo_url ? (
                            <div className="message-image">
                                <img 
                                    src={message.arquivo_url} 
                                    alt={message.arquivo_nome}
                                    className="message-image-content"
                                    onClick={() => onOpenImageViewer(message.arquivo_url!, message.arquivo_nome || 'Imagem')}
                                    style={{ cursor: 'pointer' }}
                                />
                                <div className="message-image-info">
                                    <span>{message.arquivo_nome}</span>
                                    <span>{message.arquivo_tamanho ? formatFileSize(message.arquivo_tamanho) : ''}</span>
                                </div>
                                <div className="message-image-actions">
                                    <button 
                                        className="image-action-button"
                                        onClick={() => onOpenImageViewer(message.arquivo_url!, message.arquivo_nome || 'Imagem')}
                                        title="Ver em tela cheia"
                                    >
                                        <ZoomIn size={16} />
                                    </button>
                                    <button 
                                        className="image-action-button"
                                        onClick={() => onDownloadFile(message.arquivo_url!, message.arquivo_nome || 'imagem')}
                                        title="Baixar arquivo"
                                    >
                                        <Download size={16} />
                                    </button>
                                </div>
                            </div>
                        ) : message.arquivo ? (
                            <div className="message-file">
                                <div className="message-file-icon">
                                    {getFileIcon(message.arquivo_nome || '')}
                                </div>
                                <div className="message-file-info">
                                    <span className="file-name">{message.arquivo_nome}</span>
                                    <span className="file-size">
                                        {message.arquivo_tamanho ? formatFileSize(message.arquivo_tamanho) : ''}
                                    </span>
                                </div>
                                <div className="message-file-actions">
                                    {message.arquivo_tipo === 'application/pdf' && message.arquivo_url && (
                                        <button 
                                            className="file-action-button"
                                            onClick={() => onOpenPdfViewer(message.arquivo_url!, message.arquivo_nome || 'PDF')}
                                            title="Visualizar PDF"
                                        >
                                            <Search size={16} />
                                        </button>
                                    )}
                                    <button 
                                        className="file-action-button"
                                        onClick={() => onDownloadFile(message.arquivo_url!, message.arquivo_nome || 'arquivo')}
                                        title="Baixar arquivo"
                                    >
                                        <Download size={16} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="message-text">{message.content}</p>
                        )}
                        
                        <div className={`message-footer ${message.user_id === currentUserId ? 'user' : 'other'}`}>
                            <span className="message-time">{formatMessageTime(message.timestamp)}</span>
                            {message.user_id === currentUserId && (
                                <div className="status-checkmarks">
                                    {message.visualizado ? (
                                        <CheckCheck size={16} color="#3b82f6" />
                                    ) : (
                                        <Check size={16} color="#6b7280" />
                                    )}
                                </div>
                            )}
                            {message.user_id === currentUserId && message.visualizado_hora && (
                                <span className="read-time">
                                    Lido às {formatReadTime(message.visualizado_hora)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
};

