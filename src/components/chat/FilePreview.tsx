import React from 'react';
import { X, AlertCircle } from 'lucide-react';

interface FileUpload {
    file: File;
    preview?: string;
    type: 'image' | 'document';
    uploading?: boolean;
    uploadProgress?: number;
    error?: string;
}

interface FilePreviewProps {
    showFilePreview: boolean;
    selectedFiles: FileUpload[];
    onRemoveFile: (index: number) => void;
    onClosePreview: () => void;
    isUploading: boolean;
    formatFileSize: (bytes: number) => string;
    getFileIcon: (fileName: string) => React.ReactNode;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
    showFilePreview,
    selectedFiles,
    onRemoveFile,
    onClosePreview,
    isUploading,
    formatFileSize,
    getFileIcon
}) => {
    if (!showFilePreview || selectedFiles.length === 0) {
        return null;
    }

    return (
        <div className="file-preview-container">
            <div className="file-preview-header">
                <span>Arquivos selecionados ({selectedFiles.length})</span>
                <button 
                    onClick={onClosePreview}
                    className="close-preview-button"
                    disabled={isUploading}
                >
                    <X size={16} />
                </button>
            </div>
            <div className="file-preview-list">
                {selectedFiles.map((fileUpload, index) => (
                    <div key={index} className="file-preview-item">
                        {fileUpload.type === 'image' && fileUpload.preview ? (
                            <img 
                                src={fileUpload.preview} 
                                alt={fileUpload.file.name}
                                className="file-preview-image"
                            />
                        ) : (
                            <div className="file-preview-document">
                                {getFileIcon(fileUpload.file.name)}
                            </div>
                        )}
                        <div className="file-preview-info">
                            <span className="file-preview-name">{fileUpload.file.name}</span>
                            <span className="file-preview-size">{formatFileSize(fileUpload.file.size)}</span>
                            {fileUpload.uploading && (
                                <div className="upload-progress">
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill" 
                                            style={{ width: `${fileUpload.uploadProgress || 0}%` }}
                                        />
                                    </div>
                                    <span className="progress-text">{fileUpload.uploadProgress || 0}%</span>
                                </div>
                            )}
                            {fileUpload.error && (
                                <div className="upload-error">
                                    <AlertCircle size={14} />
                                    <span>{fileUpload.error}</span>
                                </div>
                            )}
                        </div>
                        {!fileUpload.uploading && (
                            <button 
                                onClick={() => onRemoveFile(index)}
                                className="remove-file-button"
                                disabled={isUploading}
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

