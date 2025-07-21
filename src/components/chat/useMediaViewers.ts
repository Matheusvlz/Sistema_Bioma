import { useState, useCallback, useEffect } from 'react';

export const useMediaViewers = () => {
    // Estados para visualizador de imagens
    const [imageViewerOpen, setImageViewerOpen] = useState(false);
    const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
    const [currentImageName, setCurrentImageName] = useState<string>('');
    const [imageZoom, setImageZoom] = useState(1);
    const [imageRotation, setImageRotation] = useState(0);

    // Estados para visualizador de PDF
    const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
    const [currentPdfUrl, setCurrentPdfUrl] = useState<string>('');
    const [currentPdfName, setCurrentPdfName] = useState<string>('');

    // Funções para visualizador de imagens
    const openImageViewer = useCallback((imageUrl: string, imageName: string) => {
        setCurrentImageUrl(imageUrl);
        setCurrentImageName(imageName);
        setImageZoom(1);
        setImageRotation(0);
        setImageViewerOpen(true);
    }, []);

    const closeImageViewer = useCallback(() => {
        setImageViewerOpen(false);
        setCurrentImageUrl('');
        setCurrentImageName('');
        setImageZoom(1);
        setImageRotation(0);
    }, []);

    const zoomIn = useCallback(() => {
        setImageZoom(prev => Math.min(prev + 0.25, 3));
    }, []);

    const zoomOut = useCallback(() => {
        setImageZoom(prev => Math.max(prev - 0.25, 0.25));
    }, []);

    const rotateImage = useCallback(() => {
        setImageRotation(prev => (prev + 90) % 360);
    }, []);

    const resetImageView = useCallback(() => {
        setImageZoom(1);
        setImageRotation(0);
    }, []);

    // Funções para visualizador de PDF
    const openPdfViewer = useCallback((pdfUrl: string, pdfName: string) => {
        setCurrentPdfUrl(pdfUrl);
        setCurrentPdfName(pdfName);
        setPdfViewerOpen(true);
    }, []);

    const closePdfViewer = useCallback(() => {
        setPdfViewerOpen(false);
        setCurrentPdfUrl('');
        setCurrentPdfName('');
    }, []);

    // Fechar modais com ESC
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (imageViewerOpen) {
                    closeImageViewer();
                } else if (pdfViewerOpen) {
                    closePdfViewer();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [imageViewerOpen, pdfViewerOpen, closeImageViewer, closePdfViewer]);

    return {
        // Image viewer
        imageViewerOpen,
        currentImageUrl,
        currentImageName,
        imageZoom,
        imageRotation,
        openImageViewer,
        closeImageViewer,
        zoomIn,
        zoomOut,
        rotateImage,
        resetImageView,
        
        // PDF viewer
        pdfViewerOpen,
        currentPdfUrl,
        currentPdfName,
        openPdfViewer,
        closePdfViewer
    };
};

