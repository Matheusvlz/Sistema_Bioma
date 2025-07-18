import { useState, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";

interface FileUpload {
    file: File;
    preview?: string;
    type: 'image' | 'document';
    uploading?: boolean;
    uploadProgress?: number;
    error?: string;
}

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

interface UseFileManagementProps {
    selectedConversation: any;
    currentUserId: number;
}

export const useFileManagement = ({ selectedConversation, currentUserId }: UseFileManagementProps) => {
    const [selectedFiles, setSelectedFiles] = useState<FileUpload[]>([]);
    const [showFilePreview, setShowFilePreview] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const validateFile = useCallback((file: File): string | null => {
        const allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain', 'text/csv'
        ];

        if (!allowedTypes.includes(file.type)) {
            return `Tipo de arquivo não permitido: ${file.type}`;
        }

        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            return `Arquivo muito grande. Tamanho máximo: 50MB`;
        }

        return null;
    }, []);

    const handleFiles = useCallback((files: File[]) => {
        const newFiles: FileUpload[] = [];

        files.forEach(file => {
            const validationError = validateFile(file);
            if (validationError) {
                console.error(validationError);
                return;
            }

            const isImage = file.type.startsWith('image/');
            const fileUpload: FileUpload = {
                file,
                type: isImage ? 'image' : 'document',
                uploading: false,
                uploadProgress: 0,
                error: undefined
            };

            if (isImage) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    fileUpload.preview = e.target?.result as string;
                    setSelectedFiles(prev => [...prev, fileUpload]);
                };
                reader.readAsDataURL(file);
            } else {
                newFiles.push(fileUpload);
            }
        });

        if (newFiles.length > 0) {
            setSelectedFiles(prev => [...prev, ...newFiles]);
        }

        setShowFilePreview(true);
    }, [validateFile]);

    const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            handleFiles(Array.from(files));
        }
        event.target.value = '';
    }, [handleFiles]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    }, [handleFiles]);

    const removeFile = useCallback((index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        if (selectedFiles.length <= 1) {
            setShowFilePreview(false);
        }
    }, [selectedFiles.length]);

    const uploadFile = useCallback(async (fileUpload: FileUpload): Promise<Message | null> => {
        try {
            setSelectedFiles(prev => 
                prev.map(f => 
                    f.file === fileUpload.file 
                        ? { ...f, uploading: true, uploadProgress: 0, error: undefined }
                        : f
                )
            );

            const reader = new FileReader();
            return new Promise((resolve, reject) => {
                reader.onload = async (e) => {
                    try {
                        const base64Content = e.target?.result as string;
                        const base64Data = base64Content.split(',')[1];

                        for (let progress = 10; progress <= 90; progress += 20) {
                            setSelectedFiles(prev => 
                                prev.map(f => 
                                    f.file === fileUpload.file 
                                        ? { ...f, uploadProgress: progress }
                                        : f
                                )
                            );
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }

                        const response = await invoke<Message>('send_file_message', {
                            chatId: selectedConversation!.chatId,
                            userId: currentUserId,
                            fileName: fileUpload.file.name,
                            fileType: fileUpload.file.type,
                            fileSize: fileUpload.file.size,
                            fileContent: base64Data
                        });

                        setSelectedFiles(prev => 
                            prev.map(f => 
                                f.file === fileUpload.file 
                                    ? { ...f, uploading: false, uploadProgress: 100 }
                                    : f
                            )
                        );

                        resolve(response);
                    } catch (error) {
                        console.error('Erro ao enviar arquivo:', error);
                        setSelectedFiles(prev => 
                            prev.map(f => 
                                f.file === fileUpload.file 
                                    ? { ...f, uploading: false, error: 'Erro ao enviar arquivo' }
                                    : f
                            )
                        );
                        reject(error);
                    }
                };
                reader.onerror = () => {
                    setSelectedFiles(prev => 
                        prev.map(f => 
                            f.file === fileUpload.file 
                                ? { ...f, uploading: false, error: 'Erro ao ler arquivo' }
                                : f
                        )
                    );
                    reject(new Error('Erro ao ler arquivo'));
                };
                reader.readAsDataURL(fileUpload.file);
            });
        } catch (error) {
            console.error('Erro no upload:', error);
            return null;
        }
    }, [selectedConversation, currentUserId]);

    const downloadFile = useCallback(async (url: string, fileName: string) => {
        try {
            const loadingToast = document.createElement('div');
            loadingToast.textContent = 'Baixando arquivo...';
            loadingToast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #3b82f6;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                z-index: 1000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            `;
            document.body.appendChild(loadingToast);

            const filePath = await invoke('download_file_to_downloads', {
                url: url,
                fileName: fileName
            });
            
            console.log('Arquivo baixado com sucesso:', filePath);
            
            document.body.removeChild(loadingToast);
            
            const successToast = document.createElement('div');
            successToast.textContent = 'Arquivo baixado com sucesso!';
            successToast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #10b981;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                z-index: 1000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            `;
            document.body.appendChild(successToast);
            
            setTimeout(() => {
                if (document.body.contains(successToast)) {
                    document.body.removeChild(successToast);
                }
            }, 3000);
            
        } catch (error) {
            console.error('Erro ao fazer download do arquivo:', error);
            
            const loadingToast = document.querySelector('div[style*="Baixando arquivo"]');
            if (loadingToast) {
                document.body.removeChild(loadingToast);
            }
            
            const errorToast = document.createElement('div');
            errorToast.textContent = 'Erro ao fazer download do arquivo';
            errorToast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ef4444;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                z-index: 1000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            `;
            document.body.appendChild(errorToast);
            
            setTimeout(() => {
                if (document.body.contains(errorToast)) {
                    document.body.removeChild(errorToast);
                }
            }, 3000);
        }
    }, []);

    const clearFiles = useCallback(() => {
        setSelectedFiles([]);
        setShowFilePreview(false);
    }, []);

    return {
        selectedFiles,
        showFilePreview,
        isDragging,
        handleFileSelect,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        removeFile,
        uploadFile,
        downloadFile,
        clearFiles,
        setSelectedFiles,
        setShowFilePreview
    };
};

