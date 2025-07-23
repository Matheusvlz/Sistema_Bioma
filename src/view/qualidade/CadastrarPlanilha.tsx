import React, { useState, useCallback, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

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
  Maximize2,
  Minimize2,
  Merge,
  Square,
  X,
  GalleryHorizontal,
  Calculator,
  CheckCircle,
  AlertCircle,
  Info,
  Printer
} from 'lucide-react';
import styles from './styles/cadastrarplanilha.module.css';

interface CellStyle {
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  backgroundColor?: string;
  color?: string;
  fontSize?: string;
  fontFamily?: string;
  border?: string;
  borderTop?: string;
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;
  borderRadius?: string;
  padding?: string;
  margin?: string;
  width?: number;
  height?: number;
  verticalAlign?: 'top' | 'middle' | 'bottom';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  letterSpacing?: string;
  lineHeight?: string;
  textShadow?: string;
  boxShadow?: string;
  opacity?: number;
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
  merged?: boolean;
  formula?: string | null;
  computed_value?: string | null;
  error?: string | null;
  is_formula?: boolean;
  masterCell?: { row: number; col: number };
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

interface XlsxImportResult {
  success: boolean;
  data?: CellData[][];
  rows?: number;
  cols?: number;
  column_widths?: number[];
  row_heights?: number[];
  error?: string;
  sheet_names?: string[];
  imported_sheet?: string;
}

interface CellSelection {
  row: number;
  col: number;
}

interface CellRange {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}
interface FormulaResult {
  success: boolean;
  value: string;
  error?: string;
  dependencies: string[];
  formula_type: string;
}

interface FormulaSuggestion {
  function_name: string;
  display_text: string;
  description: string;
  insert_text: string;
}

interface FormulaFunction {
  name: string;
  description: string;
  syntax: string;
  example: string;
  category: string;
}



export const CadastrarPlanilha: React.FC = () => {
  const [spreadsheetName, setSpreadsheetName] = useState('Nova Planilha');
  const [rows, setRows] = useState(20);
  const [cols, setCols] = useState(10);
  const [selectedCells, setSelectedCells] = useState<CellSelection[]>([]);
  const [selectionRange, setSelectionRange] = useState<CellRange | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [columnWidths, setColumnWidths] = useState<number[]>(() => Array(10).fill(100));
  const [rowHeights, setRowHeights] = useState<number[]>(() => Array(20).fill(32));
  const [isResizing, setIsResizing] = useState<{type: 'col' | 'row', index: number} | null>(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio' | 'link' | 'table'>('image');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [data, setData] = useState<CellData[][]>(() => 
    Array(20).fill(null).map((_, rowIndex) =>
      Array(10).fill(null).map((_, colIndex) => ({
        value: '',
        id: `cell-${rowIndex}-${colIndex}`,
        formula: null,
        computed_value: null,
        error: null,
        is_formula: false,
        style: {}
      }))
    )
  );
    const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [autofillStartCell, setAutofillStartCell] = useState<CellSelection | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const xlsxInputRef = useRef<HTMLInputElement>(null); // Novo ref para arquivos XLSX
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const resizeStartRef = useRef<{x: number, y: number, initialSize: number}>({x: 0, y: 0, initialSize: 0});
  const spreadsheetRef = useRef<HTMLDivElement>(null);
  const [formulaBarValue, setFormulaBarValue] = useState('');
  const [isEditingFormula, setIsEditingFormula] = useState(false);
  const [formulaSuggestions, setFormulaSuggestions] = useState<FormulaSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [formulaValidation, setFormulaValidation] = useState<{isValid: boolean, error?: string} | null>(null);
  const [allFormulas, setAllFormulas] = useState<FormulaFunction[]>([]);
  const [formulaCategories, setFormulaCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
    const formulaBarRef = useRef<HTMLInputElement>(null);
  const addToHistory = useCallback((action: string, details: string) => {
    const newEntry: HistoryEntry = {
      timestamp: new Date(),
      action,
      details
    };
    setHistory(prev => [newEntry, ...prev].slice(0, 50));
  }, []);

   const updateCell = useCallback(async (rowIndex: number, colIndex: number, value: string, isFormula: boolean = false) => {
    const cellRef = getCellReference(rowIndex, colIndex);
    const oldCell = data[rowIndex][colIndex];
    
    try {
      if (isFormula || value.startsWith('=')) {
        // É uma fórmula
        const formulaValue = value.startsWith('=') ? value.substring(1) : value;
        
        // Preparar dados das células para o backend
        const cellData: Record<string, string> = {};
        data.forEach((row, r) => {
          row.forEach((cell, c) => {
            const ref = getCellReference(r, c);
            cellData[ref] = cell.computed_value || cell.value;
          });
        });

        // Criar dados da planilha
        const spreadsheetData = {
          cells: Object.fromEntries(
            data.flatMap((row, r) =>
              row.map((cell, c) => [
                getCellReference(r, c),
                {
                  value: cell.value,
                  formula: cell.formula,
                  computed_value: cell.computed_value,
                  error: cell.error,
                  is_formula: cell.is_formula || false
                }
              ])
            )
          ),
          rows,
          cols
        };

        const result = await invoke<[FormulaResult, Array<[string, FormulaResult]>]>('update_spreadsheet_cell', {
          cellRef,
          value: formulaValue,
          isFormula: true,
          spreadsheetData
        });

        const [mainResult, dependentResults] = result;

        setData(prevData => {
          const newData = prevData.map(row => [...row]);
          
          // Atualizar célula principal
          newData[rowIndex][colIndex] = {
            ...oldCell,
            value: value,
            formula: formulaValue,
            computed_value: mainResult.value,
            error: mainResult.error || null,
            is_formula: true
          };

          // Atualizar células dependentes
          dependentResults.forEach(([depCellRef, depResult]) => {
            const depPos = parseCellReference(depCellRef);
            if (depPos) {
              const { row: depRow, col: depCol } = depPos;
              if (newData[depRow] && newData[depRow][depCol]) {
                newData[depRow][depCol] = {
                  ...newData[depRow][depCol],
                  computed_value: depResult.value,
                  error: depResult.error || null
                };
              }
            }
          });

          return newData;
        });

        if (mainResult.success) {
          addToHistory('Fórmula Adicionada', `Célula ${cellRef}: ${value} = ${mainResult.value}`);
        } else {
          addToHistory('Erro de Fórmula', `Célula ${cellRef}: ${mainResult.error}`);
        }
      } else {
        // É um valor simples
        setData(prevData => {
          const newData = prevData.map(row => [...row]);
          newData[rowIndex][colIndex] = {
            ...oldCell,
            value: value,
            formula: null,
            computed_value: null,
            error: null,
            is_formula: false
          };
          return newData;
        });

        if (oldCell.value !== value) {
          addToHistory('Edição de Célula', `Célula ${cellRef}: "${oldCell.value}" → "${value}"`);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar célula:', error);
      setData(prevData => {
        const newData = prevData.map(row => [...row]);
        newData[rowIndex][colIndex] = {
          ...oldCell,
          value: value,
          formula: null,
          computed_value: null,
          error: `Erro: ${error}`,
          is_formula: false
        };
        return newData;
      });
    }
  }, [data, rows, cols, addToHistory]);

  const handleFormulaBarChange = useCallback(async (value: string) => {
    setFormulaBarValue(value);
    
    if (value.startsWith('=')) {
      setIsEditingFormula(true);
      
      // Validar fórmula em tempo real
      try {
        const result = await invoke<FormulaResult>('validate_formula', { formula: value });
        setFormulaValidation({
          isValid: result.success,
          error: result.error
        });
      } catch (error) {
        setFormulaValidation({
          isValid: false,
          error: `Erro: ${error}`
        });
      }

      // Buscar sugestões de funções
      const lastWord = value.split(/[^A-Z_]/i).pop() || '';
      if (lastWord.length > 0) {
        try {
          const suggestions = await invoke<FormulaSuggestion[]>('get_formula_suggestions', { 
            partialFormula: lastWord 
          });
          setFormulaSuggestions(suggestions);
          setShowSuggestions(suggestions.length > 0);
        } catch (error) {
          console.error('Erro ao buscar sugestões:', error);
          setShowSuggestions(false);
        }
      } else {
        setShowSuggestions(false);
      }
    } else {
      setIsEditingFormula(false);
      setShowSuggestions(false);
      setFormulaValidation(null);
    }
  }, []);

  const handleFormulaBarSubmit = useCallback(async () => {
    if (selectedCells.length === 1) {
      const { row, col } = selectedCells[0];
      const isFormula = formulaBarValue.startsWith('=');
      await updateCell(row, col, formulaBarValue, isFormula);
      setIsEditingFormula(false);
      setShowSuggestions(false);
      setFormulaValidation(null);
    }
  }, [selectedCells, formulaBarValue, updateCell]);

  const insertSuggestion = useCallback((suggestion: FormulaSuggestion) => {
    const currentValue = formulaBarValue;
    const lastFunctionStart = currentValue.lastIndexOf(suggestion.function_name.substring(0, 1));
    const beforeFunction = currentValue.substring(0, lastFunctionStart);
    const newValue = beforeFunction + suggestion.insert_text;
    
    setFormulaBarValue(newValue);
    setShowSuggestions(false);
    
    // Focar na barra de fórmulas
    if (formulaBarRef.current) {
      formulaBarRef.current.focus();
      formulaBarRef.current.setSelectionRange(newValue.length - 1, newValue.length - 1);
    }
  }, [formulaBarValue]);

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
  useEffect(() => {
    loadAvailableFormulas();
    loadFormulaCategories();
  }, []);

  // Atualizar barra de fórmulas quando seleção muda
  useEffect(() => {
    if (selectedCells.length === 1) {
      const cell = data[selectedCells[0].row][selectedCells[0].col];
      if (cell.is_formula && cell.formula) {
        setFormulaBarValue('=' + cell.formula);
      } else {
        setFormulaBarValue(cell.value);
      }
    } else if (selectedCells.length === 0) {
      setFormulaBarValue('');
    } else {
      setFormulaBarValue('');
    }
  }, [selectedCells, data]);

  const loadAvailableFormulas = async () => {
    try {
      const formulas = await invoke<FormulaFunction[]>('get_all_formula_functions');
      setAllFormulas(formulas);
    } catch (error) {
      console.error('Erro ao carregar fórmulas:', error);
    }
  };

    const getCellReference = (rowIndex: number, colIndex: number): string => {
    return `${getColumnLabel(colIndex)}${rowIndex + 1}`;
  };

  const parseCellReference = (reference: string): { row: number; col: number } | null => {
    const match = reference.match(/^([A-Z]+)(\d+)$/);
    if (!match) return null;
    
    const colStr = match[1];
    const rowStr = match[2];
    
    let col = 0;
    for (let i = 0; i < colStr.length; i++) {
      col = col * 26 + (colStr.charCodeAt(i) - 64);
    }
    col -= 1; // Convert to 0-based index
    
    const row = parseInt(rowStr) - 1; // Convert to 0-based index
    
    return { row, col };
  };

  const loadFormulaCategories = async () => {
    try {
      const categories = await invoke<string[]>('get_formula_categories');
      setFormulaCategories(['Todas', ...categories]);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };
  const updateSelectedCellsStyle = useCallback((styleUpdate: Partial<CellStyle>) => {
    if (selectedCells.length === 0) return;

    setData(prevData => {
      const newData = prevData.map(row => [...row]);
      
      selectedCells.forEach(({ row, col }) => {
        if (newData[row] && newData[row][col]) {
          newData[row][col].style = {
            ...newData[row][col].style,
            ...styleUpdate
          };
        }
      });
      
      return newData;
    });

    const cellsText = selectedCells.length === 1 
      ? `Célula ${getColumnLabel(selectedCells[0].col)}${selectedCells[0].row + 1}`
      : `${selectedCells.length} células`;
    
    addToHistory('Formatação de Células', `${cellsText} formatadas`);
  }, [selectedCells, addToHistory]);

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

  const isCellSelected = useCallback((rowIndex: number, colIndex: number): boolean => {
    return selectedCells.some(cell => cell.row === rowIndex && cell.col === colIndex);
  }, [selectedCells]);

  const isCellInRange = useCallback((rowIndex: number, colIndex: number): boolean => {
    if (!selectionRange) return false;
    
    const { startRow, startCol, endRow, endCol } = selectionRange;
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);
    
    return rowIndex >= minRow && rowIndex <= maxRow && colIndex >= minCol && colIndex <= maxCol;
  }, [selectionRange]);

  const handleCellMouseDown = useCallback((rowIndex: number, colIndex: number, event: React.MouseEvent) => {
    if (event.ctrlKey && formulaBarRef.current === document.activeElement) {
      event.preventDefault();
      const cellRef = getCellReference(rowIndex, colIndex);
      setFormulaBarValue(prev => prev + cellRef);
      return;
    }
    setIsSelecting(true);
    setSelectedCells([{ row: rowIndex, col: colIndex }]);
    setSelectionRange({ startRow: rowIndex, startCol: colIndex, endRow: rowIndex, endCol: colIndex });
  }, [formulaBarRef, getCellReference]);

  const handleCellMouseEnter = useCallback((rowIndex: number, colIndex: number) => {
    if (isSelecting && selectionRange) {
      setSelectionRange(prev => {
        if (!prev) return null;
        return { ...prev, endRow: rowIndex, endCol: colIndex };
      });

      const minRow = Math.min(selectionRange.startRow, rowIndex);
      const maxRow = Math.max(selectionRange.startRow, rowIndex);
      const minCol = Math.min(selectionRange.startCol, colIndex);
      const maxCol = Math.max(selectionRange.startCol, colIndex);

      const newSelectedCells: CellSelection[] = [];
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          newSelectedCells.push({ row: r, col: c });
        }
      }
      setSelectedCells(newSelectedCells);
    }
  }, [isSelecting, selectionRange]);

  const handleMouseUp = useCallback(() => {
    setIsSelecting(false);
    setSelectionRange(null);
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseUp]);

  const handleCellKeyDown = useCallback((event: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
    if (event.key === 'Enter') {
      // Mover para a próxima linha
      if (rowIndex < rows - 1) {
        setSelectedCells([{ row: rowIndex + 1, col: colIndex }]);
      }
    } else if (event.key === 'Tab') {
      event.preventDefault();
      // Mover para a próxima coluna
      if (colIndex < cols - 1) {
        setSelectedCells([{ row: rowIndex, col: colIndex + 1 }]);
      } else if (rowIndex < rows - 1) {
        setSelectedCells([{ row: rowIndex + 1, col: 0 }]);
      }
    }
  }, [rows, cols]);

  const addRow = useCallback(() => {
    setData(prevData => {
      const newRow = Array(cols).fill(null).map((_, colIndex) => ({
        value: '',
        id: `cell-${rows}-${colIndex}`,
        formula: null,
        computed_value: null,
        error: null,
        is_formula: false,
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
              { 
          value: '', 
          id: `cell-${rowIndex}-${cols}`, 
          formula: null,
          computed_value: null,
          error: null,
          is_formula: false,
          style: {} 
        }
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
                    row.map(cell => ({ 
            ...cell, 
            value: '', 
            formula: null,
            computed_value: null,
            error: null,
            is_formula: false,
            media: undefined 
          }))
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

  // Nova função para importar XLSX usando input de arquivo
  const importXLSX = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verificar se é um arquivo Excel
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      alert('Por favor, selecione um arquivo Excel válido (.xlsx ou .xls)');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        
        console.log('Arquivo carregado:', file.name, 'Tamanho:', uint8Array.length, 'bytes');

        // Chamar função Rust para importar o arquivo usando bytes
        const result = await invoke<XlsxImportResult>('import_xlsx_from_bytes', {
          fileBytes: Array.from(uint8Array),
          fileName: file.name,
          sheetName: null
        });

        console.log('Resultado da importação:', result);

        if (result.success && result.data && result.rows && result.cols) {
          // Atualizar estado da planilha com os dados importados
          setRows(result.rows);
          setCols(result.cols);
          setData(result.data);
          
          // Atualizar dimensões das colunas e linhas se disponíveis
          if (result.column_widths) {
            setColumnWidths(result.column_widths);
          } else {
            setColumnWidths(Array(result.cols).fill(100));
          }
          
          if (result.row_heights) {
            setRowHeights(result.row_heights);
          } else {
            setRowHeights(Array(result.rows).fill(32));
          }

          // Atualizar nome da planilha
          if (result.imported_sheet) {
            setSpreadsheetName(`Importado - ${result.imported_sheet}`);
          } else {
            setSpreadsheetName(`Importado - ${file.name.replace(/\.[^/.]+$/, "")}`);
          }

          // Adicionar ao histórico
          addToHistory(
            'Importar XLSX',
            `Arquivo "${file.name}" importado com ${result.rows} linhas e ${result.cols} colunas${result.imported_sheet ? ` da planilha "${result.imported_sheet}"` : ''}`
          );

          alert(`Arquivo XLSX importado com sucesso!\nArquivo: ${file.name}\nLinhas: ${result.rows}\nColunas: ${result.cols}${result.imported_sheet ? `\nPlanilha: ${result.imported_sheet}` : ''}`);
        } else {
          const errorMsg = result.error || 'Erro desconhecido ao importar arquivo XLSX';
          console.error('Erro na importação:', errorMsg);
          alert(`Erro ao importar arquivo XLSX: ${errorMsg}`);
        }
      } catch (error) {
        console.error('Erro ao processar arquivo XLSX:', error);
        alert(`Erro ao processar arquivo XLSX: ${error}`);
      }
    };

    reader.onerror = () => {
      alert('Erro ao ler o arquivo. Tente novamente.');
    };

    // Ler o arquivo como ArrayBuffer
    reader.readAsArrayBuffer(file);
    
    // Limpar o input para permitir selecionar o mesmo arquivo novamente
    event.target.value = '';
  }, [addToHistory]);

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
       let value = cell.computed_value || cell.value;
        
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

        addToHistory('Salvar Template', `Template "${spreadsheetName}" salvo como JSON`);
  }, [data, spreadsheetName, addToHistory]);

  // Funções de formatação
  const toggleBold = useCallback(() => {
    if (selectedCells.length === 0) return;
    const firstCell = selectedCells[0];
    const currentStyle = data[firstCell.row][firstCell.col].style;
    const newWeight = currentStyle?.fontWeight === 'bold' ? 'normal' : 'bold';
    updateSelectedCellsStyle({ fontWeight: newWeight });
  }, [selectedCells, data, updateSelectedCellsStyle]);

  const toggleItalic = useCallback(() => {
    if (selectedCells.length === 0) return;
    const firstCell = selectedCells[0];
    const currentStyle = data[firstCell.row][firstCell.col].style;
    const newStyle = currentStyle?.fontStyle === 'italic' ? 'normal' : 'italic';
    updateSelectedCellsStyle({ fontStyle: newStyle });
  }, [selectedCells, data, updateSelectedCellsStyle]);

  const toggleUnderline = useCallback(() => {
    if (selectedCells.length === 0) return;
    const firstCell = selectedCells[0];
    const currentStyle = data[firstCell.row][firstCell.col].style;
    const newDecoration = currentStyle?.textDecoration === 'underline' ? 'none' : 'underline';
    updateSelectedCellsStyle({ textDecoration: newDecoration });
  }, [selectedCells, data, updateSelectedCellsStyle]);

  const toggleStrikethrough = useCallback(() => {
    if (selectedCells.length === 0) return;
    const firstCell = selectedCells[0];
    const currentStyle = data[firstCell.row][firstCell.col].style;
    const newDecoration = currentStyle?.textDecoration === 'line-through' ? 'none' : 'line-through';
    updateSelectedCellsStyle({ textDecoration: newDecoration });
  }, [selectedCells, data, updateSelectedCellsStyle]);

  const setAlignment = useCallback((align: 'left' | 'center' | 'right' | 'justify') => {
    if (selectedCells.length === 0) return;
    updateSelectedCellsStyle({ textAlign: align });
  }, [selectedCells, updateSelectedCellsStyle]);

  const setBackgroundColor = useCallback((color: string) => {
    if (selectedCells.length === 0) return;
    updateSelectedCellsStyle({ backgroundColor: color });
  }, [selectedCells, updateSelectedCellsStyle]);

  const setTextColor = useCallback((color: string) => {
    if (selectedCells.length === 0) return;
    updateSelectedCellsStyle({ color: color });
  }, [selectedCells, updateSelectedCellsStyle]);

  const setBorder = useCallback((borderStyle: string) => {
    if (selectedCells.length === 0) return;
    updateSelectedCellsStyle({ border: borderStyle });
  }, [selectedCells, updateSelectedCellsStyle]);

  const setTextTransform = useCallback((transform: 'none' | 'uppercase' | 'lowercase' | 'capitalize') => {
    if (selectedCells.length === 0) return;
    updateSelectedCellsStyle({ textTransform: transform });
  }, [selectedCells, updateSelectedCellsStyle]);

  // Funções de mídia
  const openMediaModal = useCallback((type: 'image' | 'video' | 'audio' | 'link' | 'table') => {
    if (selectedCells.length === 0) {
      alert('Selecione uma célula primeiro');
      return;
    }
    setMediaType(type);
    setShowMediaModal(true);
  }, [selectedCells]);

  const handleMediaUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || selectedCells.length === 0) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as string;
      const media: CellMedia = {
        type: mediaType,
        data: data,
        alt: file.name,
        title: file.name
      };
      
      const firstCell = selectedCells[0];
      updateCellMedia(firstCell.row, firstCell.col, media);
      setShowMediaModal(false);
    };
    reader.readAsDataURL(file);
  }, [selectedCells, mediaType, updateCellMedia]);

  const addMediaURL = useCallback((url: string) => {
    if (selectedCells.length === 0) return;

    const media: CellMedia = {
      type: mediaType,
      url: url,
      title: url
    };
    
    const firstCell = selectedCells[0];
    updateCellMedia(firstCell.row, firstCell.col, media);
    setShowMediaModal(false);
  }, [selectedCells, mediaType, updateCellMedia]);

  const createTable = useCallback((tableData: string[][]) => {
    if (selectedCells.length === 0) return;

    const media: CellMedia = {
      type: 'table',
      tableData: tableData
    };
    
    const firstCell = selectedCells[0];
    updateCellMedia(firstCell.row, firstCell.col, media);
    setShowMediaModal(false);
  }, [selectedCells, updateCellMedia]);

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
    const cell = data[rowIndex]?.[colIndex];
    if (!cell) return {};

    if (cell.merged && cell.masterCell) {
      const masterCell = data[cell.masterCell.row][cell.masterCell.col];
      if (masterCell && masterCell.merged) {
        // This cell is part of a merged range, and not the master cell
        return { display: 'none' };
      }
    }

    const cellStyle = cell.style || {};
    return {
      fontWeight: cellStyle.fontWeight || 'normal',
      fontStyle: cellStyle.fontStyle || 'normal',
      textDecoration: cellStyle.textDecoration || 'none',
      textAlign: cellStyle.textAlign || 'left',
      backgroundColor: cellStyle.backgroundColor || 'transparent',
      color: cellStyle.color || '#374151',
      fontSize: cellStyle.fontSize || '0.875rem',
      fontFamily: cellStyle.fontFamily || 'inherit',
      border: cellStyle.border || undefined,
      borderTop: cellStyle.borderTop || undefined,
      borderRight: cellStyle.borderRight || undefined,
      borderBottom: cellStyle.borderBottom || undefined,
      borderLeft: cellStyle.borderLeft || undefined,
      borderRadius: cellStyle.borderRadius || undefined,
      padding: cellStyle.padding || undefined,
      margin: cellStyle.margin || undefined,
      width: columnWidths[colIndex] || 100,
      height: rowHeights[rowIndex] || 32,
      minWidth: columnWidths[colIndex] || 100,
      minHeight: rowHeights[rowIndex] || 32,
      verticalAlign: cellStyle.verticalAlign || 'middle',
      textTransform: cellStyle.textTransform || 'none',
      letterSpacing: cellStyle.letterSpacing || 'normal',
      lineHeight: cellStyle.lineHeight || 'normal',
      textShadow: cellStyle.textShadow || 'none',
      boxShadow: cellStyle.boxShadow || 'none',
      opacity: cellStyle.opacity || 1,
      ...(cell.merged && cell.masterCell && cell.masterCell.row === rowIndex && cell.masterCell.col === colIndex ? {
        gridColumnEnd: `span ${selectionRange ? Math.abs(selectionRange.endCol - selectionRange.startCol) + 1 : 1}`,
        gridRowEnd: `span ${selectionRange ? Math.abs(selectionRange.endRow - selectionRange.startRow) + 1 : 1}`,
      } : {})
    };
  };

  const renderCellContent = (rowIndex: number, colIndex: number) => {
    const cell = data[rowIndex]?.[colIndex];
    if (!cell || (cell.merged && cell.masterCell && (cell.masterCell.row !== rowIndex || cell.masterCell.col !== colIndex))) return null;

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
                         <span style={{ fontSize: '0.7rem' }}>{cell.computed_value || cell.value}</span>
            </div>
          );
        case 'video':
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <Video size={24} color="#16a34a" />
             
              <span style={{ fontSize: '0.7rem' }}>{cell.computed_value || cell.value || 'Vídeo'}</span>
            </div>
          );
        case 'audio':
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <Music size={24} color="#16a34a" />
                            <span style={{ fontSize: '0.7rem' }}>{cell.computed_value || cell.value || 'Áudio'}</span>
            </div>
          );
        case 'link':
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <Link size={24} color="#16a34a" />
                  <span style={{ fontSize: '0.7rem' }}>{cell.computed_value || cell.value || 'Link'}</span>
            </div>
          );
        case 'table':
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <Table size={24} color="#16a34a" />
                           <span style={{ fontSize: '0.7rem' }}>{cell.computed_value || cell.value || 'Tabela'}</span>
            </div>
          );
      }
    }
    if (cell.error) {
      return (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px',
          color: '#dc2626',
          fontSize: '0.75rem'
        }}>
          <AlertCircle size={16} />
          <span>{cell.error}</span>
        </div>
      );
    }

    // Mostrar ícone de fórmula se for uma fórmula
    const displayValue = cell.computed_value || cell.value;
    return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}>
        {cell.is_formula && (
          <Info size={12} color="#16a34a" style={{ flexShrink: 0 }} />
        )}
        <input
          type="text"
          className={styles["cell-input"]}
          value={displayValue || ''}
          onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
          onKeyDown={(e) => handleCellKeyDown(e, rowIndex, colIndex)}
          style={{
            fontWeight: cell.style?.fontWeight || 'normal',
            fontStyle: cell.style?.fontStyle || 'normal',
            textDecoration: cell.style?.textDecoration || 'none',
            textAlign: cell.style?.textAlign || 'left',
            color: cell.style?.color || '#374151',
            fontSize: cell.style?.fontSize || '0.875rem',
            textTransform: cell.style?.textTransform || 'none',
            letterSpacing: cell.style?.letterSpacing || 'normal',
            lineHeight: cell.style?.lineHeight || 'normal'
          }}
          placeholder=""
        />
      </div>
    );
  };
    const getFilteredFormulas = (): FormulaFunction[] => {
    if (selectedCategory === 'Todas') {
      return allFormulas;
    }
    return allFormulas.filter(f => f.category === selectedCategory);
  };

  const getSelectionInfo = (): string => {
    if (selectedCells.length === 0) return '';
    if (selectedCells.length === 1) {
      const cell = selectedCells[0];
      return `${getColumnLabel(cell.col)}${cell.row + 1}`;
    }
    return `${selectedCells.length} células selecionadas`;
  };

  const mergeCells = useCallback(() => {
    if (!selectionRange || selectedCells.length < 2) {
      alert('Selecione pelo menos duas células para mesclar.');
      return;
    }

    const { startRow, startCol, endRow, endCol } = selectionRange;
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);

    setData(prevData => {
      const newData = prevData.map(row => [...row]);
      const masterCell = newData[minRow][minCol];

      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          if (r === minRow && c === minCol) {
            newData[r][c] = { ...masterCell, merged: true, masterCell: { row: minRow, col: minCol } };
          } else {
            newData[r][c] = { ...newData[r][c], merged: true, masterCell: { row: minRow, col: minCol } };
          }
        }
      }
      return newData;
    });
    addToHistory('Mesclar Células', `Células de ${getColumnLabel(minCol)}${minRow + 1} a ${getColumnLabel(maxCol)}${maxRow + 1} mescladas.`);
  }, [selectionRange, selectedCells, addToHistory]);

  const unmergeCells = useCallback(() => {
    if (selectedCells.length === 0) {
      alert('Selecione uma célula mesclada para desmesclar.');
      return;
    }

    const firstCell = data[selectedCells[0].row][selectedCells[0].col];
    if (!firstCell.merged || !firstCell.masterCell) {
      alert('A célula selecionada não faz parte de uma célula mesclada.');
      return;
    }

    const { row: masterRow, col: masterCol } = firstCell.masterCell;

    setData(prevData => {
      const newData = prevData.map(row => [...row]);
      
      // Desmesclar todas as células que fazem parte do grupo mesclado
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = newData[r][c];
          if (cell.merged && cell.masterCell && cell.masterCell.row === masterRow && cell.masterCell.col === masterCol) {
            newData[r][c] = { ...cell, merged: false, masterCell: undefined };
          }
        }
      }

      return newData;
    });
    addToHistory('Desmesclar Células', `Células desmescladas a partir de ${getColumnLabel(masterCol)}${masterRow + 1}.`);
  }, [selectedCells, data, addToHistory, rows, cols]);

  const printSpreadsheet = useCallback(() => {
    setShowPrintModal(true);
    addToHistory('Visualizar Impressão', `Modal de impressão aberto para planilha "${spreadsheetName}"`);
  }, [spreadsheetName, addToHistory]);

  const handlePrint = useCallback(() => {
    window.print();
    setShowPrintModal(false);
    addToHistory('Imprimir Planilha', `Planilha "${spreadsheetName}" enviada para impressão`);
  }, [spreadsheetName, addToHistory]);

  const generatePrintContent = useCallback(() => {
    return (
      <div style={{ 
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        color: '#000',
        backgroundColor: '#fff',
        padding: '20px'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '20px',
          borderBottom: '2px solid #333',
          paddingBottom: '10px'
        }}>
          <h1 style={{ margin: 0, fontSize: '18px', color: '#333' }}>{spreadsheetName}</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '12px' }}>
            Impresso em: {new Date().toLocaleString('pt-BR')}
          </p>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '12px' }}>
            Dimensões: {rows} linhas × {cols} colunas
          </p>
        </div>
        
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginTop: '10px'
        }}>
          <thead>
            <tr>
              <th style={{
                border: '1px solid #ccc',
                padding: '4px 6px',
                backgroundColor: '#f5f5f5',
                fontWeight: 'bold',
                textAlign: 'center',
                width: '40px'
              }}>#</th>
              {Array(cols).fill(null).map((_, colIndex) => (
                <th key={colIndex} style={{
                  border: '1px solid #ccc',
                  padding: '4px 6px',
                  backgroundColor: '#f5f5f5',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                  {getColumnLabel(colIndex)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array(rows).fill(null).map((_, rowIndex) => (
              <tr key={rowIndex}>
                <td style={{
                  border: '1px solid #ccc',
                  padding: '4px 6px',
                  backgroundColor: '#f9f9f9',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  width: '40px'
                }}>
                  {rowIndex + 1}
                </td>
                {Array(cols).fill(null).map((_, colIndex) => {
                  const cell = data[rowIndex]?.[colIndex];
                  if (!cell) return <td key={colIndex} style={{ border: '1px solid #ccc', padding: '4px 6px' }}></td>;
                  
                  let cellContent = cell.computed_value || cell.value || '';
                  let cellStyle: React.CSSProperties = {
                    border: '1px solid #ccc',
                    padding: '4px 6px',
                    textAlign: 'left',
                    verticalAlign: 'top',
                    wordWrap: 'break-word',
                    maxWidth: '120px'
                  };
                  
                  if (cell.error) {
                    cellStyle.backgroundColor = '#ffe6e6';
                    cellStyle.color = '#d32f2f';
                    cellContent = cell.error;
                  } else if (cell.is_formula) {
                    cellStyle.backgroundColor = '#e8f5e8';
                  } else if (cell.media) {
                    cellStyle.backgroundColor = '#f0f8ff';
                    cellStyle.fontStyle = 'italic';
                    cellContent = `[${cell.media.type.toUpperCase()}] ${cellContent}`;
                  }
                  
                  // Aplicar estilos da célula
                  if (cell.style) {
                    const style = cell.style;
                    if (style.fontWeight) cellStyle.fontWeight = style.fontWeight;
                    if (style.fontStyle) cellStyle.fontStyle = style.fontStyle;
                    if (style.textDecoration) cellStyle.textDecoration = style.textDecoration;
                    if (style.textAlign) cellStyle.textAlign = style.textAlign;
                    if (style.backgroundColor) cellStyle.backgroundColor = style.backgroundColor;
                    if (style.color) cellStyle.color = style.color;
                    if (style.fontSize) cellStyle.fontSize = style.fontSize;
                    if (style.fontFamily) cellStyle.fontFamily = style.fontFamily;
                    if (style.textTransform) cellStyle.textTransform = style.textTransform;
                  }
                  
                  return (
                    <td key={colIndex} style={cellStyle}>
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }, [spreadsheetName, rows, cols, data, getColumnLabel]);

  return (
    <div className={`${styles["container"]} ${styles["maximized"]}`}>
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
            <FileSpreadsheet size={16} />
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
          
          <button className={`${styles["button"]} ${styles["secondary"]}`} onClick={() => xlsxInputRef.current?.click()}>
            <FileSpreadsheet size={16} />
            Importar XLSX
          </button>
          
          <button className={styles["button"]} onClick={exportToCSV}>
            <Download size={16} />
            Exportar CSV
          </button>
          
          <button className={styles["button"]} onClick={printSpreadsheet}>
            <Printer size={16} />
            Imprimir Planilha
          </button>
          
          <button className={`${styles["button"]} ${styles["danger"]}`} onClick={clearSpreadsheet}>
            <Trash2 size={16} />
            Limpar Tudo
          </button>

          <button className={styles["button"]} onClick={() => setShowHistoryModal(true)}>
            <History size={16} />
            Ver Histórico
          </button>

          <button className={styles["button"]} onClick={() => setShowFormulaModal(true)}>
            <Calculator size={16} />
            Fórmulas
          </button>

        </div>
        {/* Barra de Fórmulas */}
        <div className={styles["formula-bar"]}>
          <div className={styles["formula-bar-input-container"]}>
            <input
              ref={formulaBarRef}
              type="text"
              className={`${styles["formula-bar-input"]} ${
                formulaValidation?.isValid === false ? styles["formula-error"] : ''
              }`}
              value={formulaBarValue}
              onChange={(e) => handleFormulaBarChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleFormulaBarSubmit();
                } else if (e.key === 'Escape') {
                  setIsEditingFormula(false);
                  setShowSuggestions(false);
                }
              }}
              placeholder="Digite um valor ou fórmula (comece com =)"
            />
            {formulaValidation && (
              <div className={styles["formula-validation"]}>
                {formulaValidation.isValid ? (
                  <CheckCircle size={16} color="#16a34a" />
                ) : (
                  <AlertCircle size={16} color="#dc2626" />
                )}
                {formulaValidation.error && (
                  <span className={styles["formula-error-text"]}>
                    {formulaValidation.error}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Sugestões de Fórmulas */}
          {showSuggestions && formulaSuggestions.length > 0 && (
            <div className={styles["formula-suggestions"]}>
              {formulaSuggestions.slice(0, 5).map((suggestion, index) => (
                <div
                  key={index}
                  className={styles["formula-suggestion"]}
                  onClick={() => insertSuggestion(suggestion)}
                >
                  <strong>{suggestion.display_text}</strong>
                  <span>{suggestion.description}</span>
                </div>
              ))}
            </div>
          )}
          </div>
        {/* Barra de ferramentas de formatação */}
        <div className={styles["formatting-toolbar"]}>
          <div className={styles["format-group"]}>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginRight: '0.5rem' }}>
              {getSelectionInfo()}
            </span>
          </div>

          <div className={styles["format-group"]}>
            <button 
              className={`${styles["format-button"]} ${selectedCells.length > 0 && data[selectedCells[0].row][selectedCells[0].col].style?.fontWeight === 'bold' ? styles["active"] : ''}`}
              onClick={toggleBold}
              disabled={selectedCells.length === 0}
              title="Negrito"
            >
              <Bold size={16} />
            </button>
            <button 
              className={`${styles["format-button"]} ${selectedCells.length > 0 && data[selectedCells[0].row][selectedCells[0].col].style?.fontStyle === 'italic' ? styles["active"] : ''}`}
              onClick={toggleItalic}
              disabled={selectedCells.length === 0}
              title="Itálico"
            >
              <Italic size={16} />
            </button>
            <button 
              className={`${styles["format-button"]} ${selectedCells.length > 0 && data[selectedCells[0].row][selectedCells[0].col].style?.textDecoration === 'underline' ? styles["active"] : ''}`}
              onClick={toggleUnderline}
              disabled={selectedCells.length === 0}
              title="Sublinhado"
            >
              <Underline size={16} />
            </button>
            <button 
              className={`${styles["format-button"]} ${selectedCells.length > 0 && data[selectedCells[0].row][selectedCells[0].col].style?.textDecoration === 'line-through' ? styles["active"] : ''}`}
              onClick={toggleStrikethrough}
              disabled={selectedCells.length === 0}
              title="Tachado"
            >
              <GalleryHorizontal size={16} />
            </button>
          </div>

          <div className={styles["format-group"]}>
            <button 
              className={styles["format-button"]}
              onClick={() => setAlignment('left')}
              disabled={selectedCells.length === 0}
              title="Alinhar à esquerda"
            >
              <AlignLeft size={16} />
            </button>
            <button 
              className={styles["format-button"]}
              onClick={() => setAlignment('center')}
              disabled={selectedCells.length === 0}
              title="Centralizar"
            >
              <AlignCenter size={16} />
            </button>
            <button 
              className={styles["format-button"]}
              onClick={() => setAlignment('right')}
              disabled={selectedCells.length === 0}
              title="Alinhar à direita"
            >
              <AlignRight size={16} />
            </button>
          </div>

          <div className={styles["format-group"]}>
            <input
              type="color"
              onChange={(e) => setBackgroundColor(e.target.value)}
              disabled={selectedCells.length === 0}
              title="Cor de fundo"
              style={{ width: '32px', height: '32px', border: 'none', borderRadius: '4px' }}
            />
            <input
              type="color"
              onChange={(e) => setTextColor(e.target.value)}
              disabled={selectedCells.length === 0}
              title="Cor do texto"
              style={{ width: '32px', height: '32px', border: 'none', borderRadius: '4px' }}
            />
          </div>

          <div className={styles["format-group"]}>
            <select 
              className={styles["format-select"]}
              onChange={(e) => selectedCells.length > 0 && updateSelectedCellsStyle({ fontSize: e.target.value })}
              disabled={selectedCells.length === 0}
              title="Tamanho da fonte"
            >
              <option value="0.75rem">10px</option>
              <option value="0.875rem">12px</option>
              <option value="1rem">14px</option>
              <option value="1.125rem">16px</option>
              <option value="1.25rem">18px</option>
              <option value="1.5rem">20px</option>
              <option value="1.75rem">24px</option>
              <option value="2rem">28px</option>
            </select>
            
            <select 
              className={styles["format-select"]}
              onChange={(e) => selectedCells.length > 0 && updateSelectedCellsStyle({ fontFamily: e.target.value })}
              disabled={selectedCells.length === 0}
              title="Fonte"
            >
              <option value="inherit">Padrão</option>
              <option value="Arial, sans-serif">Arial</option>
              <option value="'Times New Roman', serif">Times New Roman</option>
              <option value="'Courier New', monospace">Courier New</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="Verdana, sans-serif">Verdana</option>
            </select>
          </div>

          <div className={styles["format-group"]}>
            <select 
              className={styles["format-select"]}
              onChange={(e) => selectedCells.length > 0 && setTextTransform(e.target.value as any)}
              disabled={selectedCells.length === 0}
              title="Transformação de texto"
            >
              <option value="none">Normal</option>
              <option value="uppercase">MAIÚSCULA</option>
              <option value="lowercase">minúscula</option>
              <option value="capitalize">Primeira Maiúscula</option>
            </select>
          </div>

          <div className={styles["format-group"]}>
            <button 
              className={styles["format-button"]}
              onClick={() => setBorder('1px solid #000')}
              disabled={selectedCells.length === 0}
              title="Adicionar borda"
            >
              <Square size={16} />
            </button>
            <button 
              className={styles["format-button"]}
              onClick={() => setBorder('none')}
              disabled={selectedCells.length === 0}
              title="Remover borda"
            >
              <Minimize2 size={16} />
            </button>
          </div>

          <div className={styles["format-group"]}>
            <button 
              className={styles["format-button"]}
              onClick={mergeCells}
              disabled={selectedCells.length < 2}
              title="Mesclar Células"
            >
              <Merge size={16} />
            </button>
            <button 
              className={styles["format-button"]}
              onClick={unmergeCells}
              disabled={selectedCells.length === 0 || !data[selectedCells[0].row][selectedCells[0].col].merged}
              title="Desmesclar Células"
            >
              <X size={16} />
            </button>
          </div>

          {/* Grupo de mídia */}
          <div className={styles["format-group"]}>
            <button 
              className={styles["format-button"]}
              onClick={() => openMediaModal('image')}
              disabled={selectedCells.length === 0}
              title="Adicionar Imagem"
            >
              <Image size={16} />
            </button>
            <button 
              className={styles["format-button"]}
              onClick={() => openMediaModal('video')}
              disabled={selectedCells.length === 0}
              title="Adicionar Vídeo"
            >
              <Video size={16} />
            </button>
            <button 
              className={styles["format-button"]}
              onClick={() => openMediaModal('audio')}
              disabled={selectedCells.length === 0}
              title="Adicionar Áudio"
            >
              <Music size={16} />
            </button>
            <button 
              className={styles["format-button"]}
              onClick={() => openMediaModal('link')}
              disabled={selectedCells.length === 0}
              title="Adicionar Link"
            >
              <Link size={16} />
            </button>
            <button 
              className={styles["format-button"]}
              onClick={() => openMediaModal('table')}
              disabled={selectedCells.length === 0}
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

        {/* Novo input para arquivos XLSX */}
        <input
          ref={xlsxInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={importXLSX}
          style={{ display: 'none' }}
        />

        <input
          ref={mediaInputRef}
          type="file"
          accept="image/*,video/*,audio/*"
          onChange={handleMediaUpload}
          style={{ display: 'none' }}
        />

        <div ref={spreadsheetRef} className={styles["spreadsheet-container"]}>
          <div 
            className={styles["spreadsheet-scroll-area"]}
            onMouseLeave={handleMouseUp} // Stop selecting if mouse leaves the grid
          >
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
                  {getSelectionInfo()}
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
                      className={`${styles["cell"]} ${
                        isCellSelected(rowIndex, colIndex) ? styles["selected"] : ''
                      } ${
                        isCellInRange(rowIndex, colIndex) ? styles["in-range"] : ''
                      }${
                        data[rowIndex]?.[colIndex]?.is_formula ? styles["formula-cell"] : ''
                      }`}
                      style={getCellStyle(rowIndex, colIndex)}
                      onMouseDown={(e) => handleCellMouseDown(rowIndex, colIndex, e)}
                      onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
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
          <div className={styles["modal-overlay"]}>
            <div className={styles["modal-content"]}>
              <h3 className={styles["modal-header"]}>
                Adicionar {mediaType === 'image' ? 'Imagem' :
                          mediaType === 'video' ? 'Vídeo' :
                          mediaType === 'audio' ? 'Áudio' :
                          mediaType === 'link' ? 'Link' : 'Tabela'}
              </h3>
              
              {mediaType !== 'table' && mediaType !== 'link' && (
                <div className={styles["input-group"]}>
                  <button 
                    className={styles["button"]}
                    onClick={() => mediaInputRef.current?.click()}
                  >
                    Fazer Upload de Arquivo
                  </button>
                </div>
              )}
              
              {mediaType === 'link' && (
                <div className={styles["input-group"]}>
                  <input
                    type="url"
                    placeholder="Digite a URL do link"
                    className={styles["input-field"]}
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
                <div className={styles["input-group"]}>
                  <p>Funcionalidade de tabela será implementada em breve.</p>
                </div>
              )}
              
              <div className={styles["modal-actions"]}>
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
        {/* Modal de Fórmulas */}
        {showFormulaModal && (
          <div className={styles["modal-overlay"]}>
            <div className={styles["modal-content"]} style={{ maxWidth: '800px', maxHeight: '80vh' }}>
              <h3 className={styles["modal-header"]}>
                <Calculator size={20} />
                Fórmulas Disponíveis
              </h3>
              
              <div className={styles["formula-modal-content"]}>
                <div className={styles["formula-categories"]}>
                  {formulaCategories.map(category => (
                    <button
                      key={category}
                      className={`${styles["category-button"]} ${
                        selectedCategory === category ? styles["active"] : ''
                      }`}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                
                <div className={styles["formula-list"]}>
                  {getFilteredFormulas().map((formula, index) => (
                    <div key={index} className={styles["formula-item"]}>
                      <div className={styles["formula-header"]}>
                        <strong>{formula.name}</strong>
                        <span className={styles["formula-category"]}>{formula.category}</span>
                      </div>
                      <p className={styles["formula-description"]}>{formula.description}</p>
                      <div className={styles["formula-syntax"]}>
                        <strong>Sintaxe:</strong> <code>{formula.syntax}</code>
                      </div>
                      <div className={styles["formula-example"]}>
                        <strong>Exemplo:</strong> <code>{formula.example}</code>
                      </div>
                      <button
                        className={styles["insert-formula-button"]}
                        onClick={() => {
                          setFormulaBarValue(`=${formula.name}()`);
                          setShowFormulaModal(false);
                          if (formulaBarRef.current) {
                            formulaBarRef.current.focus();
                          }
                        }}
                      >
                        Inserir
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className={styles["modal-actions"]}>
                <button 
                  className={`${styles["button"]} ${styles["secondary"]}`}
                  onClick={() => setShowFormulaModal(false)}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Modal de Histórico */}
        {showHistoryModal && (
          <div className={styles["modal-overlay"]}>
            <div className={styles["modal-content"]}>
              <h3 className={styles["modal-header"]}>
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
              <div className={styles["modal-actions"]}>
                <button 
                  className={`${styles["button"]} ${styles["secondary"]}`}
                  onClick={() => setShowHistoryModal(false)}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Impressão */}
        {showPrintModal && (
          <div className={styles["modal-overlay"]}>
            <div className={styles["modal-content"]} style={{ maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }}>
              <h3 className={styles["modal-header"]}>
                <Printer size={20} />
                Visualizar Impressão - {spreadsheetName}
              </h3>
              
              <div style={{ 
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: '600', color: '#495057' }}>
                  Prévia da Impressão
                </p>
                <p style={{ margin: '0', fontSize: '14px', color: '#6c757d' }}>
                  Esta é uma prévia de como sua planilha será impressa. 
                  Clique em "Imprimir" para abrir o diálogo de impressão do navegador.
                </p>
              </div>

              <div style={{
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: '#fff',
                maxHeight: '60vh',
                overflow: 'auto'
              }}>
                {generatePrintContent()}
              </div>
              
              <div className={styles["modal-actions"]} style={{ marginTop: '20px' }}>
                <button 
                  className={styles["button"]}
                  onClick={handlePrint}
                  style={{ marginRight: '10px' }}
                >
                  <Printer size={16} />
                  Imprimir
                </button>
                <button 
                  className={`${styles["button"]} ${styles["secondary"]}`}
                  onClick={() => setShowPrintModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};