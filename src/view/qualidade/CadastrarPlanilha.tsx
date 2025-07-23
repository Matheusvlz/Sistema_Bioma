import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Save, 
  Plus, 
  Minus, 
  RotateCcw, 
  Download, 
  Upload,
  Grid3X3,
  History,
  FileSpreadsheet,
  Trash2,
  Copy,
  Edit3,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Type,
  FileText,
  Image,
  Video,
  Music,
  Link,
  Table,
  FileJson
} from 'lucide-react';
import styles from './styles/cadastrarplanilha.module.css';

interface CellStyle {
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  textAlign?: 'left' | 'center' | 'right';
  backgroundColor?: string;
  color?: string;
  fontSize?: string;
  fontFamily?: string;
  border?: string;
  width?: number;
  height?: number;
}

interface CellMedia {
  type: 'image' | 'video' | 'audio' | 'link' | 'table';
  url?: string;
  data?: string; // Base64 para imagens/vídeos locais
  alt?: string;
  title?: string;
  tableData?: string[][]; // Para tabelas
}

interface CellData {
  value: string;
  id: string;
  style?: CellStyle;
  media?: CellMedia;
}

interface HistoryEntry {
  timestamp: Date;
  action: string;
  details: string;
}

interface SpreadsheetData {
  name: string;
  rows: number;
  cols: number;
  data: CellData[][];
  history: HistoryEntry[];
  columnWidths: number[];
  rowHeights: number[];
  globalStyles: CellStyle;
}

export const CadastrarPlanilha: React.FC = () => {
  const [spreadsheetName, setSpreadsheetName] = useState('Nova Planilha');
  const [rows, setRows] = useState(20);
  const [cols, setCols] = useState(10);
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [columnWidths, setColumnWidths] = useState<number[]>(() => Array(10).fill(100));
  const [rowHeights, setRowHeights] = useState<number[]>(() => Array(20).fill(32));
  const [isResizing, setIsResizing] = useState<{type: 'col' | 'row', index: number} | null>(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio' | 'link' | 'table'>('image');
  const [data, setData] = useState<CellData[][]>(() => 
    Array(20).fill(null).map((_, rowIndex) =>
      Array(10).fill(null).map((_, colIndex) => ({
        value: '',
        id: `cell-${rowIndex}-${colIndex}`,
        style: {}
      }))
    )
  );
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const resizeStartRef = useRef<{x: number, y: number, initialSize: number}>({x: 0, y: 0, initialSize: 0});

  const addToHistory = useCallback((action: string, details: string) => {
    const newEntry: HistoryEntry = {
      timestamp: new Date(),
      action,
      details
    };
    setHistory(prev => [newEntry, ...prev].slice(0, 50));
  }, []);

  const updateCell = useCallback((rowIndex: number, colIndex: number, value: string) => {
    setData(prevData => {
      const newData = prevData.map(row => [...row]);
      const oldValue = newData[rowIndex][colIndex].value;
      newData[rowIndex][colIndex].value = value;
      
      if (oldValue !== value) {
        addToHistory(
          'Edição de Célula',
          `Célula ${getColumnLabel(colIndex)}${rowIndex + 1}: "${oldValue}" → "${value}"`
        );
      }
      
      return newData;
    });
  }, [addToHistory]);

  const updateCellStyle = useCallback((rowIndex: number, colIndex: number, styleUpdate: Partial<CellStyle>) => {
    setData(prevData => {
      const newData = prevData.map(row => [...row]);
      newData[rowIndex][colIndex].style = {
        ...newData[rowIndex][colIndex].style,
        ...styleUpdate
      };
      
      addToHistory(
        'Formatação de Célula',
        `Célula ${getColumnLabel(colIndex)}${rowIndex + 1} formatada`
      );
      
      return newData;
    });
  }, [addToHistory]);

  const updateCellMedia = useCallback((rowIndex: number, colIndex: number, media: CellMedia) => {
    setData(prevData => {
      const newData = prevData.map(row => [...row]);
      newData[rowIndex][colIndex].media = media;
      
      addToHistory(
        'Mídia Adicionada',
        `${media.type} adicionada à célula ${getColumnLabel(colIndex)}${rowIndex + 1}`
      );
      
      return newData;
    });
  }, [addToHistory]);

  const getColumnLabel = (index: number): string => {
    let label = '';
    let num = index;
    while (num >= 0) {
      label = String.fromCharCode(65 + (num % 26)) + label;
      num = Math.floor(num / 26) - 1;
    }
    return label;
  };

  const addRow = useCallback(() => {
    setData(prevData => {
      const newRow = Array(cols).fill(null).map((_, colIndex) => ({
        value: '',
        id: `cell-${rows}-${colIndex}`,
        style: {}
      }));
      addToHistory('Adicionar Linha', `Nova linha ${rows + 1} adicionada`);
      return [...prevData, newRow];
    });
    setRows(prev => prev + 1);
    setRowHeights(prev => [...prev, 32]);
  }, [cols, rows, addToHistory]);

  const addColumn = useCallback(() => {
    setData(prevData => {
      const newData = prevData.map((row, rowIndex) => [
        ...row,
        { value: '', id: `cell-${rowIndex}-${cols}`, style: {} }
      ]);
      addToHistory('Adicionar Coluna', `Nova coluna ${getColumnLabel(cols)} adicionada`);
      return newData;
    });
    setCols(prev => prev + 1);
    setColumnWidths(prev => [...prev, 100]);
  }, [cols, addToHistory]);

  const removeRow = useCallback(() => {
    if (rows > 1) {
      setData(prevData => {
        const newData = prevData.slice(0, -1);
        addToHistory('Remover Linha', `Linha ${rows} removida`);
        return newData;
      });
      setRows(prev => prev - 1);
      setRowHeights(prev => prev.slice(0, -1));
    }
  }, [rows, addToHistory]);

  const removeColumn = useCallback(() => {
    if (cols > 1) {
      setData(prevData => {
        const newData = prevData.map(row => row.slice(0, -1));
        addToHistory('Remover Coluna', `Coluna ${getColumnLabel(cols - 1)} removida`);
        return newData;
      });
      setCols(prev => prev - 1);
      setColumnWidths(prev => prev.slice(0, -1));
    }
  }, [cols, addToHistory]);

  const clearSpreadsheet = useCallback(() => {
    if (confirm('Tem certeza que deseja limpar toda a planilha?')) {
      setData(prevData => 
        prevData.map(row => 
          row.map(cell => ({ ...cell, value: '', media: undefined }))
        )
      );
      addToHistory('Limpar Planilha', 'Todos os dados foram removidos');
    }
  }, [addToHistory]);

  const saveAsTemplate = useCallback(() => {
    const template: SpreadsheetData = {
      name: spreadsheetName,
      rows,
      cols,
      data,
      history,
      columnWidths,
      rowHeights,
      globalStyles: {}
    };

    const jsonData = JSON.stringify(template, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${spreadsheetName.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToHistory('Salvar Template', `Template "${spreadsheetName}" salvo como JSON`);
  }, [spreadsheetName, rows, cols, data, history, columnWidths, rowHeights, addToHistory]);

  const exportJSONWithStyles = useCallback(() => {
    const template: SpreadsheetData = {
      name: spreadsheetName,
      rows,
      cols,
      data,
      history,
      columnWidths,
      rowHeights,
      globalStyles: {}
    };

    const jsonData = JSON.stringify(template, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${spreadsheetName.replace(/\s+/g, '_')}_com_estilos.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToHistory('Exportar JSON com Estilos', `Planilha exportada com todos os estilos e mídias`);
  }, [spreadsheetName, rows, cols, data, history, columnWidths, rowHeights, addToHistory]);

  const loadTemplate = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const template: SpreadsheetData = JSON.parse(e.target?.result as string);
        
        setSpreadsheetName(template.name);
        setRows(template.rows);
        setCols(template.cols);
        setData(template.data);
        setHistory(template.history || []);
        setColumnWidths(template.columnWidths || Array(template.cols).fill(100));
        setRowHeights(template.rowHeights || Array(template.rows).fill(32));
        
        addToHistory('Carregar Template', `Template "${template.name}" carregado`);
      } catch (error) {
        alert('Erro ao carregar o arquivo. Verifique se é um template válido.');
      }
    };
    reader.readAsText(file);
  }, [addToHistory]);

  const importCSV = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string;
        const lines = csvContent.split('\n').filter(line => line.trim());
        const csvData = lines.map(line => {
          const cells = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              cells.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          cells.push(current.trim());
          return cells;
        });

        const maxCols = Math.max(...csvData.map(row => row.length));
        const newRows = csvData.length;
        const newCols = Math.max(maxCols, cols);

        setRows(newRows);
        setCols(newCols);
        setColumnWidths(Array(newCols).fill(100));
        setRowHeights(Array(newRows).fill(32));

        const newData = Array(newRows).fill(null).map((_, rowIndex) =>
          Array(newCols).fill(null).map((_, colIndex) => ({
            value: csvData[rowIndex]?.[colIndex] || '',
            id: `cell-${rowIndex}-${colIndex}`,
            style: {}
          }))
        );

        setData(newData);
        addToHistory('Importar CSV', `Arquivo CSV importado com ${newRows} linhas e ${newCols} colunas`);
      } catch (error) {
        alert('Erro ao importar CSV. Verifique se o arquivo está no formato correto.');
      }
    };
    reader.readAsText(file);
  }, [cols, addToHistory]);

  const exportToCSV = useCallback(() => {
    const csvContent = data.map(row => 
      row.map(cell => {
        let value = cell.value.toString();
        
        // Se há mídia, incluir informação no CSV
        if (cell.media) {
          value += ` [${cell.media.type.toUpperCase()}]`;
          if (cell.media.url) value += ` ${cell.media.url}`;
        }
        
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${spreadsheetName.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToHistory('Exportar CSV', `Planilha exportada como CSV`);
  }, [data, spreadsheetName, addToHistory]);

  // Funções de formatação
  const toggleBold = useCallback(() => {
    if (selectedCell) {
      const currentStyle = data[selectedCell.row][selectedCell.col].style;
      const newWeight = currentStyle?.fontWeight === 'bold' ? 'normal' : 'bold';
      updateCellStyle(selectedCell.row, selectedCell.col, { fontWeight: newWeight });
    }
  }, [selectedCell, data, updateCellStyle]);

  const toggleItalic = useCallback(() => {
    if (selectedCell) {
      const currentStyle = data[selectedCell.row][selectedCell.col].style;
      const newStyle = currentStyle?.fontStyle === 'italic' ? 'normal' : 'italic';
      updateCellStyle(selectedCell.row, selectedCell.col, { fontStyle: newStyle });
    }
  }, [selectedCell, data, updateCellStyle]);

  const toggleUnderline = useCallback(() => {
    if (selectedCell) {
      const currentStyle = data[selectedCell.row][selectedCell.col].style;
      const newDecoration = currentStyle?.textDecoration === 'underline' ? 'none' : 'underline';
      updateCellStyle(selectedCell.row, selectedCell.col, { textDecoration: newDecoration });
    }
  }, [selectedCell, data, updateCellStyle]);

  const setAlignment = useCallback((align: 'left' | 'center' | 'right') => {
    if (selectedCell) {
      updateCellStyle(selectedCell.row, selectedCell.col, { textAlign: align });
    }
  }, [selectedCell, updateCellStyle]);

  const setBackgroundColor = useCallback((color: string) => {
    if (selectedCell) {
      updateCellStyle(selectedCell.row, selectedCell.col, { backgroundColor: color });
    }
  }, [selectedCell, updateCellStyle]);

  const setTextColor = useCallback((color: string) => {
    if (selectedCell) {
      updateCellStyle(selectedCell.row, selectedCell.col, { color: color });
    }
  }, [selectedCell, updateCellStyle]);

  // Funções de mídia
  const openMediaModal = useCallback((type: 'image' | 'video' | 'audio' | 'link' | 'table') => {
    if (!selectedCell) {
      alert('Selecione uma célula primeiro');
      return;
    }
    setMediaType(type);
    setShowMediaModal(true);
  }, [selectedCell]);

  const handleMediaUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedCell) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as string;
      const media: CellMedia = {
        type: mediaType,
        data: data,
        alt: file.name,
        title: file.name
      };
      
      updateCellMedia(selectedCell.row, selectedCell.col, media);
      setShowMediaModal(false);
    };
    reader.readAsDataURL(file);
  }, [selectedCell, mediaType, updateCellMedia]);

  const addMediaURL = useCallback((url: string) => {
    if (!selectedCell) return;

    const media: CellMedia = {
      type: mediaType,
      url: url,
      title: url
    };
    
    updateCellMedia(selectedCell.row, selectedCell.col, media);
    setShowMediaModal(false);
  }, [selectedCell, mediaType, updateCellMedia]);

  const createTable = useCallback((tableData: string[][]) => {
    if (!selectedCell) return;

    const media: CellMedia = {
      type: 'table',
      tableData: tableData
    };
    
    updateCellMedia(selectedCell.row, selectedCell.col, media);
    setShowMediaModal(false);
  }, [selectedCell, updateCellMedia]);

  // Funções de redimensionamento
  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'col' | 'row', index: number) => {
    e.preventDefault();
    setIsResizing({ type, index });
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialSize: type === 'col' ? columnWidths[index] : rowHeights[index]
    };
  }, [columnWidths, rowHeights]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const { type, index } = isResizing;
      const { x, y, initialSize } = resizeStartRef.current;
      
      if (type === 'col') {
        const deltaX = e.clientX - x;
        const newWidth = Math.max(50, initialSize + deltaX);
        setColumnWidths(prev => {
          const newWidths = [...prev];
          newWidths[index] = newWidth;
          return newWidths;
        });
      } else {
        const deltaY = e.clientY - y;
        const newHeight = Math.max(20, initialSize + deltaY);
        setRowHeights(prev => {
          const newHeights = [...prev];
          newHeights[index] = newHeight;
          return newHeights;
        });
      }
    };

    const handleMouseUp = () => {
      if (isResizing) {
        addToHistory('Redimensionar', `${isResizing.type === 'col' ? 'Coluna' : 'Linha'} ${isResizing.index + 1} redimensionada`);
        setIsResizing(null);
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, addToHistory]);

  const formatTimestamp = (timestamp: Date): string => {
    return timestamp.toLocaleString('pt-BR');
  };

  const getCellStyle = (rowIndex: number, colIndex: number): React.CSSProperties => {
    const cellStyle = data[rowIndex]?.[colIndex]?.style || {};
    return {
      fontWeight: cellStyle.fontWeight || 'normal',
      fontStyle: cellStyle.fontStyle || 'normal',
      textDecoration: cellStyle.textDecoration || 'none',
      textAlign: cellStyle.textAlign || 'left',
      backgroundColor: cellStyle.backgroundColor || 'transparent',
      color: cellStyle.color || '#374151',
      fontSize: cellStyle.fontSize || '0.875rem',
      fontFamily: cellStyle.fontFamily || 'inherit',
      width: columnWidths[colIndex] || 100,
      height: rowHeights[rowIndex] || 32,
      minWidth: columnWidths[colIndex] || 100,
      minHeight: rowHeights[rowIndex] || 32
    };
  };

  const renderCellContent = (rowIndex: number, colIndex: number) => {
    const cell = data[rowIndex]?.[colIndex];
    if (!cell) return null;

    if (cell.media) {
      switch (cell.media.type) {
        case 'image':
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              {cell.media.data && (
                <img 
                  src={cell.media.data} 
                  alt={cell.media.alt || 'Imagem'} 
                  style={{ maxWidth: '80px', maxHeight: '60px', objectFit: 'cover' }}
                />
              )}
              {cell.media.url && !cell.media.data && (
                <img 
                  src={cell.media.url} 
                  alt={cell.media.alt || 'Imagem'} 
                  style={{ maxWidth: '80px', maxHeight: '60px', objectFit: 'cover' }}
                />
              )}
              <span style={{ fontSize: '0.7rem' }}>{cell.value}</span>
            </div>
          );
        case 'video':
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <Video size={24} color="#16a34a" />
              <span style={{ fontSize: '0.7rem' }}>{cell.value || 'Vídeo'}</span>
            </div>
          );
        case 'audio':
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <Music size={24} color="#16a34a" />
              <span style={{ fontSize: '0.7rem' }}>{cell.value || 'Áudio'}</span>
            </div>
          );
        case 'link':
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <Link size={24} color="#16a34a" />
              <span style={{ fontSize: '0.7rem' }}>{cell.value || 'Link'}</span>
            </div>
          );
        case 'table':
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <Table size={24} color="#16a34a" />
              <span style={{ fontSize: '0.7rem' }}>{cell.value || 'Tabela'}</span>
            </div>
          );
      }
    }

    return (
      <input
        type="text"
        className={styles["cell-input"]}
        value={cell.value || ''}
        onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
        style={{
          fontWeight: cell.style?.fontWeight || 'normal',
          fontStyle: cell.style?.fontStyle || 'normal',
          textDecoration: cell.style?.textDecoration || 'none',
          textAlign: cell.style?.textAlign || 'left',
          color: cell.style?.color || '#374151',
          fontSize: cell.style?.fontSize || '0.875rem'
        }}
        placeholder=""
      />
    );
  };

  return (
    <div className={styles["container"]}>
      <div className={styles["header"]}>
        <div>
          <h1 className={styles["title"]}>Cadastrar Planilha</h1>
          <p className={styles["subtitle"]}>
            Crie e edite planilhas personalizadas com controle total
          </p>
        </div>
      </div>

      <div className={styles["main-content"]}>
        <div className={styles["toolbar"]}>
          <input
            type="text"
            value={spreadsheetName}
            onChange={(e) => setSpreadsheetName(e.target.value)}
            style={{
              padding: '0.75rem',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              color: '#166534',
              minWidth: '200px'
            }}
            placeholder="Nome da planilha"
          />
          
          <button className={styles["button"]} onClick={addRow}>
            <Plus size={16} />
            Adicionar Linha
          </button>
          
          <button className={styles["button"]} onClick={addColumn}>
            <Plus size={16} />
            Adicionar Coluna
          </button>
          
          <button className={`${styles["button"]} ${styles["secondary"]}`} onClick={removeRow}>
            <Minus size={16} />
            Remover Linha
          </button>
          
          <button className={`${styles["button"]} ${styles["secondary"]}`} onClick={removeColumn}>
            <Minus size={16} />
            Remover Coluna
          </button>
          
          <button className={styles["button"]} onClick={saveAsTemplate}>
            <Save size={16} />
            Salvar Template
          </button>

          <button className={styles["button"]} onClick={exportJSONWithStyles}>
            <FileJson size={16} />
            Exportar JSON com Estilos
          </button>
          
          <button className={`${styles["button"]} ${styles["secondary"]}`} onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} />
            Carregar Template
          </button>
          
          <button className={`${styles["button"]} ${styles["secondary"]}`} onClick={() => csvInputRef.current?.click()}>
            <FileText size={16} />
            Importar CSV
          </button>
          
          <button className={`${styles["button"]} ${styles["secondary"]}`} onClick={exportToCSV}>
            <Download size={16} />
            Exportar CSV
          </button>
          
          <button className={`${styles["button"]} ${styles["danger"]}`} onClick={clearSpreadsheet}>
            <Trash2 size={16} />
            Limpar Tudo
          </button>
        </div>

        {/* Barra de ferramentas de formatação */}
        <div className={styles["formatting-toolbar"]}>
          <div className={styles["format-group"]}>
            <button 
              className={`${styles["format-button"]} ${selectedCell && data[selectedCell.row][selectedCell.col].style?.fontWeight === 'bold' ? styles["active"] : ''}`}
              onClick={toggleBold}
              disabled={!selectedCell}
            >
              <Bold size={16} />
            </button>
            <button 
              className={`${styles["format-button"]} ${selectedCell && data[selectedCell.row][selectedCell.col].style?.fontStyle === 'italic' ? styles["active"] : ''}`}
              onClick={toggleItalic}
              disabled={!selectedCell}
            >
              <Italic size={16} />
            </button>
            <button 
              className={`${styles["format-button"]} ${selectedCell && data[selectedCell.row][selectedCell.col].style?.textDecoration === 'underline' ? styles["active"] : ''}`}
              onClick={toggleUnderline}
              disabled={!selectedCell}
            >
              <Underline size={16} />
            </button>
          </div>

          <div className={styles["format-group"]}>
            <button 
              className={styles["format-button"]}
              onClick={() => setAlignment('left')}
              disabled={!selectedCell}
            >
              <AlignLeft size={16} />
            </button>
            <button 
              className={styles["format-button"]}
              onClick={() => setAlignment('center')}
              disabled={!selectedCell}
            >
              <AlignCenter size={16} />
            </button>
            <button 
              className={styles["format-button"]}
              onClick={() => setAlignment('right')}
              disabled={!selectedCell}
            >
              <AlignRight size={16} />
            </button>
          </div>

          <div className={styles["format-group"]}>
            <input
              type="color"
              onChange={(e) => setBackgroundColor(e.target.value)}
              disabled={!selectedCell}
              title="Cor de fundo"
              style={{ width: '32px', height: '32px', border: 'none', borderRadius: '4px' }}
            />
            <input
              type="color"
              onChange={(e) => setTextColor(e.target.value)}
              disabled={!selectedCell}
              title="Cor do texto"
              style={{ width: '32px', height: '32px', border: 'none', borderRadius: '4px' }}
            />
          </div>

          <div className={styles["format-group"]}>
            <select 
              className={styles["format-select"]}
              onChange={(e) => selectedCell && updateCellStyle(selectedCell.row, selectedCell.col, { fontSize: e.target.value })}
              disabled={!selectedCell}
            >
              <option value="0.75rem">10px</option>
              <option value="0.875rem">12px</option>
              <option value="1rem">14px</option>
              <option value="1.125rem">16px</option>
              <option value="1.25rem">18px</option>
              <option value="1.5rem">20px</option>
            </select>
          </div>

          {/* Grupo de mídia */}
          <div className={styles["format-group"]}>
            <button 
              className={styles["format-button"]}
              onClick={() => openMediaModal('image')}
              disabled={!selectedCell}
              title="Adicionar Imagem"
            >
              <Image size={16} />
            </button>
            <button 
              className={styles["format-button"]}
              onClick={() => openMediaModal('video')}
              disabled={!selectedCell}
              title="Adicionar Vídeo"
            >
              <Video size={16} />
            </button>
            <button 
              className={styles["format-button"]}
              onClick={() => openMediaModal('audio')}
              disabled={!selectedCell}
              title="Adicionar Áudio"
            >
              <Music size={16} />
            </button>
            <button 
              className={styles["format-button"]}
              onClick={() => openMediaModal('link')}
              disabled={!selectedCell}
              title="Adicionar Link"
            >
              <Link size={16} />
            </button>
            <button 
              className={styles["format-button"]}
              onClick={() => openMediaModal('table')}
              disabled={!selectedCell}
              title="Criar Tabela"
            >
              <Table size={16} />
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={loadTemplate}
          style={{ display: 'none' }}
        />

        <input
          ref={csvInputRef}
          type="file"
          accept=".csv"
          onChange={importCSV}
          style={{ display: 'none' }}
        />

        <input
          ref={mediaInputRef}
          type="file"
          accept="image/*,video/*,audio/*"
          onChange={handleMediaUpload}
          style={{ display: 'none' }}
        />

        <div className={styles["spreadsheet-container"]}>
          <div className={styles["spreadsheet-scroll-area"]}>
            <div 
              className={styles["spreadsheet-grid"]}
              style={{
                gridTemplateColumns: `60px ${columnWidths.map(w => `${w}px`).join(' ')}`,
                gridTemplateRows: `32px ${rowHeights.map(h => `${h}px`).join(' ')}`
              }}
            >
              {/* Célula do canto superior esquerdo */}
              <div className={`${styles["cell"]} ${styles["header"]} ${styles["corner"]}`}>
                <div className={styles["position-indicator"]}>
                  {selectedCell ? `${getColumnLabel(selectedCell.col)}${selectedCell.row + 1}` : ''}
                </div>
              </div>
              
              {/* Headers das colunas */}
              {Array(cols).fill(null).map((_, colIndex) => (
                <div 
                  key={`col-header-${colIndex}`} 
                  className={`${styles["cell"]} ${styles["header"]} ${styles["column-header"]}`}
                  style={{ width: columnWidths[colIndex], minWidth: columnWidths[colIndex] }}
                >
                  {getColumnLabel(colIndex)}
                  <div
                    className={`${styles["column-resizer"]} ${isResizing?.type === 'col' && isResizing.index === colIndex ? styles["resizing"] : ''}`}
                    onMouseDown={(e) => handleMouseDown(e, 'col', colIndex)}
                  />
                </div>
              ))}
              
              {/* Linhas da planilha */}
              {Array(rows).fill(null).map((_, rowIndex) => (
                <React.Fragment key={`row-${rowIndex}`}>
                  {/* Header da linha */}
                  <div 
                    className={`${styles["cell"]} ${styles["header"]} ${styles["row-header"]}`}
                    style={{ height: rowHeights[rowIndex], minHeight: rowHeights[rowIndex] }}
                  >
                    {rowIndex + 1}
                    <div
                      className={`${styles["row-resizer"]} ${isResizing?.type === 'row' && isResizing.index === rowIndex ? styles["resizing"] : ''}`}
                      onMouseDown={(e) => handleMouseDown(e, 'row', rowIndex)}
                    />
                  </div>
                  
                  {/* Células da linha */}
                  {Array(cols).fill(null).map((_, colIndex) => (
                    <div 
                      key={`cell-${rowIndex}-${colIndex}`} 
                      className={`${styles["cell"]} ${selectedCell?.row === rowIndex && selectedCell?.col === colIndex ? styles["selected"] : ''}`}
                      style={getCellStyle(rowIndex, colIndex)}
                      onClick={() => setSelectedCell({ row: rowIndex, col: colIndex })}
                    >
                      {renderCellContent(rowIndex, colIndex)}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Modal de mídia */}
        {showMediaModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '12px',
              minWidth: '400px',
              maxWidth: '600px'
            }}>
              <h3 style={{ marginTop: 0, color: '#166534' }}>
                Adicionar {mediaType === 'image' ? 'Imagem' : 
                          mediaType === 'video' ? 'Vídeo' : 
                          mediaType === 'audio' ? 'Áudio' : 
                          mediaType === 'link' ? 'Link' : 'Tabela'}
              </h3>
              
              {mediaType !== 'table' && mediaType !== 'link' && (
                <div style={{ marginBottom: '1rem' }}>
                  <button 
                    className={styles["button"]}
                    onClick={() => mediaInputRef.current?.click()}
                  >
                    Fazer Upload de Arquivo
                  </button>
                </div>
              )}
              
              {mediaType === 'link' && (
                <div style={{ marginBottom: '1rem' }}>
                  <input
                    type="url"
                    placeholder="Digite a URL do link"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      marginBottom: '1rem'
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addMediaURL((e.target as HTMLInputElement).value);
                      }
                    }}
                  />
                  <button 
                    className={styles["button"]}
                    onClick={() => {
                      const input = document.querySelector('input[type="url"]') as HTMLInputElement;
                      if (input?.value) addMediaURL(input.value);
                    }}
                  >
                    Adicionar Link
                  </button>
                </div>
              )}
              
              {mediaType === 'table' && (
                <div style={{ marginBottom: '1rem' }}>
                  <p>Funcionalidade de tabela será implementada em breve.</p>
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  className={`${styles["button"]} ${styles["secondary"]}`}
                  onClick={() => setShowMediaModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={styles["history-section"]}>
          <h3 className={styles["history-title"]}>
            <History size={20} />
            Histórico de Alterações
          </h3>
          <div className={styles["history-list"]}>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                Nenhuma alteração registrada ainda
              </div>
            ) : (
              history.map((entry, index) => (
                <div key={index} className={styles["history-item"]}>
                  <span className={styles["history-timestamp"]}>
                    {formatTimestamp(entry.timestamp)}
                  </span>
                  <strong>{entry.action}:</strong> {entry.details}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
