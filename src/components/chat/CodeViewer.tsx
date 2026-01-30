import React, { useEffect, useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import {
  Download,
  Copy,
  X,
  Maximize2,
  Minimize2,
  Code,
  Check,
  Sun,
  Moon,
  Search,
  Settings,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import './style/CodeViewer.css';

interface CodeViewerProps {
  fileUrl: string;
  fileName: string;
  language: string;
  onClose: () => void;
  readOnly?: boolean;
  initialContent?: string;
}

const CodeViewer: React.FC<CodeViewerProps> = ({
  fileUrl,
  fileName,
  language,
  onClose,
  readOnly = true,
  initialContent,
}) => {
  const [code, setCode] = useState<string>(initialContent || '');
  const [loading, setLoading] = useState(!initialContent);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const [fontSize, setFontSize] = useState(14);
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>('off');
  const [showMinimap, setShowMinimap] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialContent) {
      loadCodeContent();
    }
  }, [fileUrl, initialContent]);

  useEffect(() => {
    if (isFullscreen && containerRef.current) {
      containerRef.current.requestFullscreen?.();
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.();
    }
  }, [isFullscreen]);

  const loadCodeContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Usar invoke do Tauri para buscar o conteudo
      const { invoke } = await import('@tauri-apps/api/core');
      const content = await invoke<string>('get_code_file_content', {
        appHandle: (window as any).__TAURI__,
        fileUrl,
      });
      
      setCode(content);
    } catch (err) {
      setError(`Erro ao carregar o arquivo: ${err}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Adicionar atalhos de teclado personalizados
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleDownload();
    });
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      editor.trigger('', 'actions.find');
    });
  };

  const handleCopyCode = async () => {
    if (editorRef.current) {
      const content = editorRef.current.getValue();
      try {
        await navigator.clipboard.writeText(content);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Erro ao copiar codigo:', err);
      }
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleTheme = () => {
    setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark');
  };

  const increaseFontSize = () => {
    setFontSize((prev) => Math.min(prev + 2, 32));
  };

  const decreaseFontSize = () => {
    setFontSize((prev) => Math.max(prev - 2, 10));
  };

  const resetFontSize = () => {
    setFontSize(14);
  };

  const toggleWordWrap = () => {
    setWordWrap(wordWrap === 'on' ? 'off' : 'on');
  };

  const toggleMinimap = () => {
    setShowMinimap(!showMinimap);
  };

  const getLanguageIcon = (lang: string) => {
    const icons: Record<string, string> = {
      rust: '🦀',
      javascript: '📜',
      typescript: '🔷',
      python: '🐍',
      java: '☕',
      cpp: '⚙️',
      csharp: '#️⃣',
      php: '🐘',
      go: '🐹',
      ruby: '💎',
      swift: '🦅',
    };
    return icons[lang] || '📄';
  };

  if (loading) {
    return (
      <div className="code-viewer-loading">
        <div className="spinner"></div>
        <p>Carregando codigo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="code-viewer-error">
        <X size={48} color="#ef4444" />
        <p>{error}</p>
        <button onClick={onClose} className="error-close-btn">
          Fechar
        </button>
      </div>
    );
  }

  const stats = {
    lines: code.split('\n').length,
    chars: code.length,
    words: code.split(/\s+/).filter(Boolean).length,
    size: new Blob([code]).size,
  };

  return (
    <div
      ref={containerRef}
      className={`code-viewer ${isFullscreen ? 'fullscreen' : ''}`}
    >
      {/* Header */}
      <div className="code-viewer-header">
        <div className="header-left">
          <span className="file-icon">{getLanguageIcon(language)}</span>
          <Code className="code-icon" size={18} />
          <span className="file-name">{fileName}</span>
          <span className="language-badge">{language.toUpperCase()}</span>
        </div>

        <div className="header-actions">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="toolbar-btn"
            title={theme === 'vs-dark' ? 'Tema claro' : 'Tema escuro'}
          >
            {theme === 'vs-dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Font Size */}
          <div className="font-size-group">
            <button onClick={decreaseFontSize} className="toolbar-btn" title="Diminuir fonte">
              <ZoomOut size={18} />
            </button>
            <span className="font-size-display">{fontSize}px</span>
            <button onClick={increaseFontSize} className="toolbar-btn" title="Aumentar fonte">
              <ZoomIn size={18} />
            </button>
            <button onClick={resetFontSize} className="toolbar-btn" title="Resetar fonte">
              <RotateCcw size={16} />
            </button>
          </div>

          {/* Settings Menu */}
          <div className="settings-dropdown">
            <button className="toolbar-btn" title="Configuracoes">
              <Settings size={18} />
            </button>
            <div className="settings-menu">
              <label className="settings-item">
                <input
                  type="checkbox"
                  checked={wordWrap === 'on'}
                  onChange={toggleWordWrap}
                />
                <span>Quebra de linha</span>
              </label>
              <label className="settings-item">
                <input
                  type="checkbox"
                  checked={showMinimap}
                  onChange={toggleMinimap}
                />
                <span>Minimapa</span>
              </label>
            </div>
          </div>

          {/* Copy */}
          <button
            onClick={handleCopyCode}
            className={`toolbar-btn ${copySuccess ? 'success' : ''}`}
            title="Copiar codigo"
          >
            {copySuccess ? <Check size={18} /> : <Copy size={18} />}
          </button>

          {/* Download */}
          <button onClick={handleDownload} className="toolbar-btn" title="Baixar arquivo">
            <Download size={18} />
          </button>

          {/* Search */}
          <button
            onClick={() => {
              if (editorRef.current) {
                editorRef.current.trigger('', 'actions.find');
              }
            }}
            className="toolbar-btn"
            title="Buscar (Ctrl+F)"
          >
            <Search size={18} />
          </button>

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="toolbar-btn" title="Tela cheia">
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          {/* Close */}
          <button onClick={onClose} className="toolbar-btn close-btn" title="Fechar">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="editor-container">
        <Editor
          height="100%"
          defaultLanguage={language}
          value={code}
          onChange={(value) => !readOnly && setCode(value || '')}
          theme={theme}
          onMount={handleEditorDidMount}
          options={{
            readOnly,
            minimap: { enabled: showMinimap },
            fontSize,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap,
            formatOnPaste: true,
            formatOnType: true,
            folding: true,
            renderLineHighlight: 'all',
            bracketPairColorization: { enabled: true },
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            contextmenu: true,
            mouseWheelZoom: true,
            padding: { top: 16, bottom: 16 },
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              useShadows: true,
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
            suggest: {
              enabled: !readOnly,
            },
            quickSuggestions: !readOnly,
          }}
        />
      </div>

      {/* Footer */}
      <div className="code-viewer-footer">
        <div className="stats">
          <span className="stat-item">📏 {stats.lines} linhas</span>
          <span className="stat-item">✏️ {stats.words} palavras</span>
          <span className="stat-item">📊 {stats.chars} caracteres</span>
          <span className="stat-item">
            💾 {(stats.size / 1024).toFixed(2)} KB
          </span>
        </div>
        <div className="mode-indicator">
          {readOnly ? (
            <span className="readonly-badge">🔒 Somente leitura</span>
          ) : (
            <span className="edit-badge">✏️ Modo de edicao</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeViewer;