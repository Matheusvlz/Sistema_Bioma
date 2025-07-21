import React from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react';

interface ImageViewerProps {
    isOpen: boolean;
    imageUrl: string;
    imageName: string;
    zoom: number;
    rotation: number;
    onClose: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onRotate: () => void;
    onReset: () => void;
    onDownload: (url: string, fileName: string) => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
    isOpen,
    imageUrl,
    imageName,
    zoom,
    rotation,
    onClose,
    onZoomIn,
    onZoomOut,
    onRotate,
    onReset,
    onDownload
}) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="image-viewer-overlay" onClick={onClose}>
            <div className="image-viewer-container" onClick={(e) => e.stopPropagation()}>
                <div className="image-viewer-header">
                    <h3 className="image-viewer-title">{imageName}</h3>
                    <div className="image-viewer-controls">
                        <button onClick={onZoomOut} className="viewer-control-button" title="Diminuir zoom">
                            <ZoomOut size={20} />
                        </button>
                        <span className="zoom-level">{Math.round(zoom * 100)}%</span>
                        <button onClick={onZoomIn} className="viewer-control-button" title="Aumentar zoom">
                            <ZoomIn size={20} />
                        </button>
                        <button onClick={onRotate} className="viewer-control-button" title="Girar">
                            <RotateCw size={20} />
                        </button>
                        <button onClick={onReset} className="viewer-control-button" title="Resetar">
                            Resetar
                        </button>
                        <button 
                            onClick={() => onDownload(imageUrl, imageName)} 
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
                <div className="image-viewer-content">
                    <img
                        src={imageUrl}
                        alt={imageName}
                        className="image-viewer-image"
                        style={{
                            transform: `scale(${zoom}) rotate(${rotation}deg)`,
                            transition: 'transform 0.3s ease'
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

