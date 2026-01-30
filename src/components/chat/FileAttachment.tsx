import React, { useState } from 'react';
import {
  FileText,
  FileCode,
  Image as ImageIcon,
  FileArchive,
  FileAudio,
  FileVideo,
  File,
  Download,
  Eye,
  Code2,
  Database,
} from 'lucide-react';
import './style/FileAttachment.css';

interface FileAttachmentProps {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  isCode?: boolean;
  codeLanguage?: string;
  onViewCode?: () => void;
  onViewImage?: () => void;
  onViewPdf?: () => void;
}

const FileAttachment: React.FC<FileAttachmentProps> = ({
  fileName,
  fileType,
  fileSize,
  fileUrl,
  isCode = false,
  codeLanguage,
  onViewCode,
  onViewImage,
  onViewPdf,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getFileCategory = () => {
    if (isCode) return 'code';
    if (fileType.startsWith('image/')) return 'image';
    if (fileType.startsWith('video/')) return 'video';
    if (fileType.startsWith('audio/')) return 'audio';
    if (fileType.includes('pdf')) return 'pdf';
    if (
      fileType.includes('document') ||
      fileType.includes('word') ||
      fileType.includes('text')
    ) return 'document';
    if (
      fileType.includes('zip') ||
      fileType.includes('rar') ||
      fileType.includes('compressed')
    ) return 'archive';
    if (
      fileType.includes('spreadsheet') ||
      fileType.includes('excel')
    ) return 'spreadsheet';
    return 'other';
  };

  const getFileIcon = () => {
    const category = getFileCategory();
    const iconSize = 24;

    const icons: Record<string, JSX.Element> = {
      code: <FileCode size={iconSize} className="icon-code" />,
      image: <ImageIcon size={iconSize} className="icon-image" />,
      video: <FileVideo size={iconSize} className="icon-video" />,
      audio: <FileAudio size={iconSize} className="icon-audio" />,
      pdf: <FileText size={iconSize} className="icon-pdf" />,
      document: <FileText size={iconSize} className="icon-document" />,
      archive: <FileArchive size={iconSize} className="icon-archive" />,
      spreadsheet: <Database size={iconSize} className="icon-spreadsheet" />,
      other: <File size={iconSize} className="icon-other" />,
    };

    return icons[category] || icons.other;
  };

  const getLanguageIcon = (lang?: string) => {
    if (!lang) return '💻';
    
    const languageIcons: Record<string, string> = {
      rust: '🦀',
      javascript: '🟨',
      typescript: '🔷',
      python: '🐍',
      java: '☕',
      kotlin: '🟣',
      php: '🐘',
      cpp: '⚙️',
      c: '©️',
      csharp: '#️⃣',
      go: '🐹',
      ruby: '💎',
      swift: '🦅',
      html: '🌐',
      css: '🎨',
      json: '📋',
      xml: '📄',
      sql: '🗄️',
      bash: '💻',
      powershell: '⚡',
    };

    return languageIcons[lang.toLowerCase()] || '📝';
  };

  const handleView = () => {
    const category = getFileCategory();
    
    if (category === 'code' && onViewCode) {
      onViewCode();
    } else if (category === 'image' && onViewImage) {
      onViewImage();
    } else if (category === 'pdf' && onViewPdf) {
      onViewPdf();
    } else {
      // Download direto para outros tipos
      window.open(fileUrl, '_blank');
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = fileName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const category = getFileCategory();
  const canPreview = ['code', 'image', 'pdf'].includes(category);

  return (
    <div className={`file-attachment file-category-${category}`}>
      {/* Preview para imagens */}
      {category === 'image' && !imageError && (
        <div className="image-preview-container">
          {!imageLoaded && (
            <div className="image-loading">
              <div className="spinner-small"></div>
            </div>
          )}
          <img
            src={fileUrl}
            alt={fileName}
            className={`image-preview ${imageLoaded ? 'loaded' : ''}`}
            onError={() => setImageError(true)}
            onLoad={() => setImageLoaded(true)}
            onClick={handleView}
          />
        </div>
      )}

      {/* Informacoes do arquivo */}
      <div className="file-info">
        <div className="file-icon-wrapper">
          {getFileIcon()}
          {isCode && codeLanguage && (
            <span className="language-emoji">{getLanguageIcon(codeLanguage)}</span>
          )}
        </div>

        <div className="file-details">
          <div className="file-header">
            <span className="file-name" title={fileName}>
              {fileName}
            </span>
            {isCode && codeLanguage && (
              <span className="code-badge">{codeLanguage.toUpperCase()}</span>
            )}
          </div>
          
          <div className="file-meta">
            <span className="file-size">{formatFileSize(fileSize)}</span>
            {category !== 'other' && (
              <>
                <span className="separator">•</span>
                <span className="file-category-label">
                  {category === 'code' && '💻 Codigo'}
                  {category === 'image' && '🖼️ Imagem'}
                  {category === 'video' && '🎥 Video'}
                  {category === 'audio' && '🎵 Audio'}
                  {category === 'pdf' && '📄 PDF'}
                  {category === 'document' && '📝 Documento'}
                  {category === 'archive' && '📦 Arquivo'}
                  {category === 'spreadsheet' && '📊 Planilha'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Acoes */}
      <div className="file-actions">
        {canPreview && (
          <button
            onClick={handleView}
            className="file-action-btn view-btn"
            title={category === 'code' ? 'Ver codigo' : 'Visualizar'}
          >
            {category === 'code' ? (
              <Code2 size={18} />
            ) : (
              <Eye size={18} />
            )}
          </button>
        )}
        
        <button
          onClick={handleDownload}
          className="file-action-btn download-btn"
          title="Baixar"
        >
          <Download size={18} />
        </button>
      </div>

      {/* Badge de overlay para codigo */}
      {isCode && (
        <div className="code-overlay-badge">
          <FileCode size={14} />
          <span>CODIGO</span>
        </div>
      )}
    </div>
  );
};

export default FileAttachment;