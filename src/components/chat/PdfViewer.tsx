import React from 'react';
import { X, Download } from 'lucide-react';

interface PdfViewerProps {
    isOpen: boolean;
    pdfUrl: string;
    pdfName: string;
    onClose: () => void;
    onDownload: (url: string, fileName: string) => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
    isOpen,
    pdfUrl,
    pdfName,
    onClose,
    onDownload
}) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="pdf-viewer-overlay" onClick={onClose}>
            <div className="pdf-viewer-container" onClick={(e) => e.stopPropagation()}>
                <div className="pdf-viewer-header">
                    <h3 className="pdf-viewer-title">{pdfName}</h3>
                    <div className="pdf-viewer-controls">
                        <button 
                            onClick={() => onDownload(pdfUrl, pdfName)} 
                            className="viewer-control-button" 
                            title="Baixar"
                        >
                            <Download size={20} />
                        </button>
                        <button onClick={onClose} className="viewer-close-button" title="Fechar">
                            <X size={24} />
                        </button>
                    </div>
                </div>
                <div className="pdf-viewer-content">
                    <iframe
                        src={pdfUrl}
                        className="pdf-viewer-iframe"
                        title={pdfName}
                    />
                </div>
            </div>
        </div>
    );
};

