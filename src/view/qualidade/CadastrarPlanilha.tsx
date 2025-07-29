import React, { useState, useCallback, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { CellMergeUtils, CellReferenceUtils } from './SpreadsheetUtils'; // Importe as classes necessárias

import {
  Save,
  Plus,
  Minus,
  Download,
  Upload,
  History,
  FileSpreadsheet,
  Trash2,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Link,
  Table,
  Minimize2,
  TableCellsMerge,
  Square,
  X,
  GalleryHorizontal,
  Calculator,
  CheckCircle,
  AlertCircle,
  Info,
  Printer,
  MousePointer,
  Target,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Database,
  Edit3,
  Lock,
  User
  
} from 'lucide-react';
import styles from './styles/cadastrarplanilha.module.css';
import './styles/print-area-styles.css';
import { listen } from '@tauri-apps/api/event';
import { emit } from '@tauri-apps/api/event';
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
interface TemplateData2 {
  id?: number;
  caminho_arquivo: string;
  nome_arquivo: string;
  tag?: string;
  tipo: string;
  json_data_base64?: string;
  updated_at: string | null; // O backend pode retornar uma string de data ou null
}

interface SaveTemplateData {
  tipo: 'template' | 'planilha_padrao';
  tag: string;
  nomeArquivo: string;
  caminhoArquivo: string;
  jsonData: string;
  updated_at: string | null; 
}

interface ReponseType {
type: String;
templateData?: TemplateData2; 
}

interface CellMedia {
  type: 'image' | 'video' | 'audio' | 'link' | 'table';
  url?: string;
  data?: string; // Base64 para imagens/vídeos locais
  alt?: string;
  title?: string;
  tableData?: string[][]; // Para tabelas
  x?: number; // Posição X da imagem dentro da célula (em pixels ou porcentagem)
  y?: number; // Posição Y da imagem dentro da célula (em pixels ou porcentagem)
  width?: number; // Largura da imagem (em pixels ou porcentagem)
  height?: number; // Altura da imagem (em pixels ou porcentagem)
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
  mergeRange?: { startRow: number; startCol: number; endRow: number; endCol: number };
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

interface PrintArea {
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

interface UserValidation {
  usuario: string;
  senha: string;
}

export const CadastrarPlanilha: React.FC = () => {
  const [spreadsheetName, setSpreadsheetName] = useState('Nova Planilha');
  const [rows, setRows] = useState(20);
  const [cols, setCols] = useState(20);
  const [selectedCells, setSelectedCells] = useState<CellSelection[]>([]);
  const [selectionRange, setSelectionRange] = useState<CellRange | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  
  // Estados para área de impressão
  const [printArea, setPrintArea] = useState<PrintArea | null>(null);
  const [isPrintAreaMode, setIsPrintAreaMode] = useState(false);
  const [isSelectingPrintArea, setIsSelectingPrintArea] = useState(false);
  const [printAreaRange, setPrintAreaRange] = useState<CellRange | null>(null);
  
  
  const [columnWidths, setColumnWidths] = useState<number[]>(() => Array(20).fill(100));
  const [rowHeights, setRowHeights] = useState<number[]>(() => Array(20).fill(32));
  const [isResizing, setIsResizing] = useState<{type: 'col' | 'row', index: number} | null>(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio' | 'link' | 'table'>('image');
  const [typeResponse, setTypeResponse] = useState<ReponseType>();
    const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [saveTemplateData, setSaveTemplateData] = useState<SaveTemplateData>({
    tipo: 'template',
    tag: '',
    nomeArquivo: '',
    caminhoArquivo: '',
    jsonData: '',
    updated_at: ''
  });
  const [availableTags, setAvailableTags] = useState<string[]>([
    'Financeiro',
    'Vendas',
    'Estoque',
    'RH',
    'Marketing',
    'Produção',
    'Relatório',
    'Dashboard'
  ]);
  const [newTag, setNewTag] = useState('');
  const [isAddingNewTag, setIsAddingNewTag] = useState(false);
    const [showUserValidationModal, setShowUserValidationModal] = useState(false);
  const [userValidation, setUserValidation] = useState<UserValidation>({
    usuario: '',
    senha: ''
  });
  const [validationError, setValidationError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  // Estados para configuração de tabela
  const [tableConfig, setTableConfig] = useState({
    rows: 3,
    cols: 3,
    selectedTemplate: 0
  });

  // Templates de estilo para tabelas
  const tableTemplates = [
    {
      name: 'Light',
      headerStyle: { backgroundColor: '#f8f9fa', color: '#212529', fontWeight: 'bold' as const, border: '1px solid #dee2e6' },
      cellStyle: { backgroundColor: '#ffffff', color: '#212529', border: '1px solid #dee2e6' },
      alternateRowStyle: { backgroundColor: '#f8f9fa', color: '#212529', border: '1px solid #dee2e6' }
    },
    {
      name: 'Blue',
      headerStyle: { backgroundColor: '#0d6efd', color: '#ffffff', fontWeight: 'bold' as const, border: '1px solid #0d6efd' },
      cellStyle: { backgroundColor: '#ffffff', color: '#212529', border: '1px solid #dee2e6' },
      alternateRowStyle: { backgroundColor: '#e7f1ff', color: '#212529', border: '1px solid #dee2e6' }
    },
    {
      name: 'Green',
      headerStyle: { backgroundColor: '#198754', color: '#ffffff', fontWeight: 'bold' as const, border: '1px solid #198754' },
      cellStyle: { backgroundColor: '#ffffff', color: '#212529', border: '1px solid #dee2e6' },
      alternateRowStyle: { backgroundColor: '#d1e7dd', color: '#212529', border: '1px solid #dee2e6' }
    },
    {
      name: 'Orange',
      headerStyle: { backgroundColor: '#fd7e14', color: '#ffffff', fontWeight: 'bold' as const, border: '1px solid #fd7e14' },
      cellStyle: { backgroundColor: '#ffffff', color: '#212529', border: '1px solid #dee2e6' },
      alternateRowStyle: { backgroundColor: '#fff3cd', color: '#212529', border: '1px solid #dee2e6' }
    },
    {
      name: 'Red',
      headerStyle: { backgroundColor: '#dc3545', color: '#ffffff', fontWeight: 'bold' as const, border: '1px solid #dc3545' },
      cellStyle: { backgroundColor: '#ffffff', color: '#212529', border: '1px solid #dee2e6' },
      alternateRowStyle: { backgroundColor: '#f8d7da', color: '#212529', border: '1px solid #dee2e6' }
    },
    {
      name: 'Purple',
      headerStyle: { backgroundColor: '#6f42c1', color: '#ffffff', fontWeight: 'bold' as const, border: '1px solid #6f42c1' },
      cellStyle: { backgroundColor: '#ffffff', color: '#212529', border: '1px solid #dee2e6' },
      alternateRowStyle: { backgroundColor: '#e2d9f3', color: '#212529', border: '1px solid #dee2e6' }
    },
    {
      name: 'Dark',
      headerStyle: { backgroundColor: '#212529', color: '#ffffff', fontWeight: 'bold' as const, border: '1px solid #212529' },
      cellStyle: { backgroundColor: '#ffffff', color: '#212529', border: '1px solid #dee2e6' },
      alternateRowStyle: { backgroundColor: '#f8f9fa', color: '#212529', border: '1px solid #dee2e6' }
    },
    {
      name: 'Teal',
      headerStyle: { backgroundColor: '#20c997', color: '#ffffff', fontWeight: 'bold' as const, border: '1px solid #20c997' },
      cellStyle: { backgroundColor: '#ffffff', color: '#212529', border: '1px solid #dee2e6' },
      alternateRowStyle: { backgroundColor: '#d1ecf1', color: '#212529', border: '1px solid #dee2e6' }
    }
  ];
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1); // Estado para controle de zoom
  const [rowHeaderWidth, setRowHeaderWidth] = useState(60);
  const [columnHeaderHeight, setColumnHeaderHeight] = useState(32);
  // Estados para formatação
  const [currentFontSize, setCurrentFontSize] = useState("0.875rem");
  const [currentFontFamily, setCurrentFontFamily] = useState("inherit");
  const [draggedImage, setDraggedImage] = useState<{ media: CellMedia; fromCell: { row: number; col: number } } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isResizingImage, setIsResizingImage] = useState<{ row: number; col: number; startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);
  
  const [data, setData] = useState<CellData[][]>(() => 
    Array(20).fill(null).map((_, rowIndex) =>
      Array(20).fill(null).map((_, colIndex) => ({
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
    const [isHistoryEditMode, setIsHistoryEditMode] = useState(false);
  const [editingHistoryIndex, setEditingHistoryIndex] = useState<number | null>(null);
const [selectedHistoryItems, setSelectedHistoryItems] = useState<number[]>([]);
const [bulkEditDate, setBulkEditDate] = useState('');
const [showBulkDateEdit, setShowBulkDateEdit] = useState(false);

// E atualize o tipo do editingHistoryField:
const [editingHistoryField, setEditingHistoryField] = useState<'action' | 'details' | 'timestamp' | null>(null);
  const [editingHistoryValue, setEditingHistoryValue] = useState('');
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  
  // Estados para modal de mensagens
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageModal, setMessageModal] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({
    type: 'info',
    title: '',
    message: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const xlsxInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const resizeStartRef = useRef<{x: number, y: number, initialSize: number}>({x: 0, y: 0, initialSize: 0});
  const spreadsheetRef = useRef<HTMLDivElement>(null);
  const printContentRef = useRef<HTMLDivElement>(null);
  const [formulaBarValue, setFormulaBarValue] = useState("");
  const [formulaSuggestions, setFormulaSuggestions] = useState<FormulaSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [formulaValidation, setFormulaValidation] = useState<{isValid: boolean, error?: string} | null>(null);
  const [allFormulas, setAllFormulas] = useState<FormulaFunction[]>([]);
  const [formulaCategories, setFormulaCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const formulaBarRef = useRef<HTMLInputElement>(null);
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.ctrlKey && event.shiftKey && event.key === 'B' && showHistoryModal) {
      event.preventDefault();
      setIsHistoryEditMode(prev => !prev);
      if (isHistoryEditMode) {
        // Sair do modo de edição
        setEditingHistoryIndex(null);
        setEditingHistoryField(null);
        setEditingHistoryValue('');
      }
    }
  }, [showHistoryModal, isHistoryEditMode]);

  // Adicionar listener para o atalho de teclado
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Função para salvar edição do histórico
  // Função para cancelar edição do histórico
  const cancelHistoryEdit = useCallback(() => {
    setEditingHistoryIndex(null);
    setEditingHistoryField(null);
    setEditingHistoryValue('');
  }, []);
  const addToHistory = useCallback(async (action: string, details: string) => {
    try {
      const usuario = await invoke<string>('get_usuario_nome');
      const detailsWithUser = usuario ? `${details} - Usuário: ${usuario}` : details;
      
      const newEntry: HistoryEntry = {
        timestamp: new Date(),
        action,
        details: detailsWithUser
      };
      
      setHistory(prev => [newEntry, ...prev].slice(0, 50));
    } catch (error) {
      console.error('Erro ao obter nome do usuário:', error);
      
      // Fallback: adiciona entrada sem o nome do usuário
      const newEntry: HistoryEntry = {
        timestamp: new Date(),
        action,
        details
      };
      
      setHistory(prev => [newEntry, ...prev].slice(0, 50));
    }
  }, []);
    const validateUser = useCallback(async (usuario: string, senha: string): Promise<boolean> => {
    try {
      setIsValidating(true);
      setValidationError('');
      
      // Aqui você pode implementar a lógica de validação
      // Por exemplo, chamar uma função do backend
      const isValid = await invoke<boolean>('validate_user_credentials', {
        usuario,
        senha
      });
      
      return isValid;
    } catch (error) {
      console.error('Erro na validação:', error);
      setValidationError('Erro ao validar credenciais. Tente novamente.');
      return false;
    } finally {
      setIsValidating(false);
    }
  }, []);
  
  // Função para obter o estilo atual das células selecionadas
  const getCurrentCellStyle = useCallback((): CellStyle => {
    if (selectedCells.length === 0) return {};
    const firstCell = selectedCells[0];
    return data[firstCell.row][firstCell.col].style || {};
  }, [selectedCells, data]);
  const generateSpreadsheetJSON = useCallback((): string => {
    const spreadsheetData: SpreadsheetData = {
      name: spreadsheetName,
      rows,
      cols,
      data,
      history,
      columnWidths,
      rowHeights,
      globalStyles: {}
    };
    
    return JSON.stringify(spreadsheetData, null, 2);
  }, [spreadsheetName, rows, cols, data, history, columnWidths, rowHeights]);

  // Função para abrir modal de salvar template
  const openSaveTemplateModal = useCallback(() => {
    const jsonData = generateSpreadsheetJSON();
    setSaveTemplateData({
      tipo: 'template',
      tag: '',
      nomeArquivo: spreadsheetName || 'Nova Planilha',
      caminhoArquivo: `templates/${spreadsheetName || 'nova_planilha'}.json`,
      jsonData,
      updated_at: ''
    });
    setShowSaveTemplateModal(true);
  }, [generateSpreadsheetJSON, spreadsheetName]);

  // Funções para controlar o modal de mensagens
  const showMessage = useCallback((type: 'success' | 'error' | 'info', title: string, message: string) => {
    setMessageModal({ type, title, message });
    setShowMessageModal(true);
  }, []);

  const closeMessageModal = useCallback(() => {
    setShowMessageModal(false);
  }, []);

    const openUserValidationModal = useCallback(() => {
    setUserValidation({ usuario: '', senha: '' });
    setValidationError('');
    setShowUserValidationModal(true);
  }, []);

  // Função para fechar modal de validação
  const closeUserValidationModal = useCallback(() => {
    setShowUserValidationModal(false);
    setUserValidation({ usuario: '', senha: '' });
    setValidationError('');
  }, []);

  // Função para confirmar validação
  const confirmUserValidation = useCallback(async () => {
    if (!userValidation.usuario.trim() || !userValidation.senha.trim()) {
      setValidationError('Por favor, preencha usuário e senha.');
      return;
    }

    const isValid = await validateUser(userValidation.usuario, userValidation.senha);
    
    if (isValid) {
      closeUserValidationModal();
      // Continuar com a lógica original do saveTemplate
      await executeSaveTemplate();
    } else {
      setValidationError('Usuário ou senha inválidos.');
    }
  }, [userValidation, validateUser, closeUserValidationModal]);

  const renderUserValidationModal = () => {
    if (!showUserValidationModal) return null;
        return (
      <div className={styles["modal-overlay"]}>
        <div className={styles["modal-content"]} style={{ maxWidth: '400px' }}>
          <div className={styles.modalHeader}>
            <h3>
              <Lock size={20} />
              Validação de Usuário
            </h3>
            <button 
              className={styles.closeButton}
              onClick={closeUserValidationModal}
              disabled={isValidating}
            >
              <X size={20} />
            </button>
          </div>
          
          <div className={styles.modalBody}>
            <p style={{ marginBottom: '20px', color: '#6c757d' }}>
              Para continuar, por favor valide suas credenciais:
            </p>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px', 
                fontWeight: 'bold',
                color: '#495057'
                }}>
                <User size={16} style={{ marginRight: '5px' }} />
                Usuário:
              </label>
              <input
                type="text"
                value={userValidation.usuario}
                onChange={(e) => setUserValidation(prev => ({ ...prev, usuario: e.target.value }))}
                placeholder="Digite seu usuário"
                disabled={isValidating}
                style={{
                  width: '100%',
                                    padding: '10px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    confirmUserValidation();
                  }
                }}
              />
                          </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px', 
                fontWeight: 'bold',
                color: '#495057'
              }}>
                <Lock size={16} style={{ marginRight: '5px' }} />
                Senha:
              </label>
              <input
                type="password"
                value={userValidation.senha}
                onChange={(e) => setUserValidation(prev => ({ ...prev, senha: e.target.value }))}
                placeholder="Digite sua senha"
                disabled={isValidating}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    confirmUserValidation();
                  }
                }}
              />
                          </div>
            
            {validationError && (
              <div style={{
                padding: '10px',
                backgroundColor: '#f8d7da',
                border: '1px solid #f5c6cb',
                borderRadius: '4px',
                color: '#721c24',
                marginBottom: '15px',
                fontSize: '14px'
              }}>
                <AlertCircle size={16} style={{ marginRight: '5px' }} />
                                {validationError}
              </div>
            )}
          </div>
          
          <div className={styles.modalFooter}>
            <button 
              className={styles.button}
              onClick={closeUserValidationModal}
              disabled={isValidating}
              style={{ marginRight: '10px' }}
            >
              Cancelar
            </button>
            <button 
              className={`${styles.button} ${styles.primaryButton}`}
              onClick={confirmUserValidation}
              disabled={isValidating || !userValidation.usuario.trim() || !userValidation.senha.trim()}
              style={{
                backgroundColor: isValidating ? '#6c757d' : '#007bff',
                cursor: isValidating ? 'not-allowed' : 'pointer'
              }}
            >
              {isValidating ? 'Validando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const addNewTag = useCallback(() => {
    if (newTag.trim() && !availableTags.includes(newTag.trim())) {
      setAvailableTags(prev => [...prev, newTag.trim()]);
      setSaveTemplateData(prev => ({ ...prev, tag: newTag.trim() }));
      setNewTag('');
      setIsAddingNewTag(false);
      addToHistory('Nova Tag', `Tag "${newTag.trim()}" adicionada`);
    }
  }, [newTag, availableTags, addToHistory]);
// Primeiro, você precisa atualizar o tipo do estado editingHistoryField:
// const [editingHistoryField, setEditingHistoryField] = useState<'action' | 'details' | 'timestamp' | null>(null);

// Atualizar o tipo para incluir timestamp como editável
// IMPORTANTE: Você precisa atualizar a declaração do estado no seu componente:
// const [editingHistoryField, setEditingHistoryField] = useState<'action' | 'details' | 'timestamp' | null>(null);

// Atualizar o tipo para incluir timestamp como editável
// IMPORTANTE: Você precisa atualizar a declaração do estado no seu componente:
// const [editingHistoryField, setEditingHistoryField] = useState<'action' | 'details' | 'timestamp' | null>(null);

// Atualizar o tipo para incluir timestamp como editável
const toggleItemSelection = useCallback((index: number) => {
  if (!isHistoryEditMode) return;
  
  setSelectedHistoryItems(prev => {
    if (prev.includes(index)) {
      return prev.filter(i => i !== index);
    } else {
      return [...prev, index];
    }
  });
}, [isHistoryEditMode]);

const selectAllItems = useCallback(() => {
  if (!isHistoryEditMode) return;
  setSelectedHistoryItems(history.map((_, index) => index));
}, [isHistoryEditMode, history]);

const clearSelection = useCallback(() => {
  setSelectedHistoryItems([]);
  setShowBulkDateEdit(false);
  setBulkEditDate('');
}, []);

const startBulkDateEdit = useCallback(() => {
  if (selectedHistoryItems.length === 0) return;
  
  // Usar a data do primeiro item selecionado como padrão
  const firstSelectedItem = history[selectedHistoryItems[0]];
  const date = firstSelectedItem.timestamp;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
  
  setBulkEditDate(localDateTime);
  setShowBulkDateEdit(true);
}, [selectedHistoryItems, history]);

const applyBulkDateEdit = useCallback(() => {
  if (!bulkEditDate || selectedHistoryItems.length === 0) return;
  
  const newDate = new Date(bulkEditDate);
  
  setHistory(prev => {
    const newHistory = [...prev];
    selectedHistoryItems.forEach(index => {
      newHistory[index] = {
        ...newHistory[index],
        timestamp: new Date(newDate)
      };
    });
    return newHistory;
  });
  
  // Limpar seleção e fechar editor em lote
  clearSelection();
}, [bulkEditDate, selectedHistoryItems]);

const cancelBulkDateEdit = useCallback(() => {
  setShowBulkDateEdit(false);
  setBulkEditDate('');
}, []);

// Atualizar o tipo para incluir timestamp como editável
const startEditingHistory = useCallback((index: number, field: 'action' | 'details' | 'timestamp') => {
  if (!isHistoryEditMode) return;
  setEditingHistoryIndex(index);
  setEditingHistoryField(field);
  
  // Para timestamp, converter para formato de input datetime-local
  if (field === 'timestamp') {
    const date = history[index][field];
    // Converter para o timezone local e formato YYYY-MM-DDTHH:mm
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    setEditingHistoryValue(localDateTime);
  } else {
    setEditingHistoryValue(history[index][field]);
  }
}, [isHistoryEditMode, history]);

// Atualizar a função de salvar para lidar com timestamp
const saveHistoryEdit = useCallback(() => {
  if (editingHistoryIndex === null || editingHistoryField === null) return;
  
  setHistory(prev => {
    const newHistory = [...prev];
    
    if (editingHistoryField === 'timestamp') {
      // Converter de volta para Date object mantendo o timezone local
      const newDate = new Date(editingHistoryValue);
      newHistory[editingHistoryIndex] = {
        ...newHistory[editingHistoryIndex],
        timestamp: newDate
      };
    } else {
      newHistory[editingHistoryIndex] = {
        ...newHistory[editingHistoryIndex],
        [editingHistoryField]: editingHistoryValue
      };
    }
    
    return newHistory;
  });
  
  setEditingHistoryIndex(null);
  setEditingHistoryField(null);
  setEditingHistoryValue('');
}, [editingHistoryIndex, editingHistoryField, editingHistoryValue]);

// Componente do modal atualizado
const renderHistoryModal = () => {
  if (!showHistoryModal) return null;

  return (
    <div className={styles["modal-overlay"]}>
      <div className={styles["modal-content"]}>
        <div className={styles.modalHeader}>
          <h3>
            <History size={20} />
            Histórico de Alterações
            {isHistoryEditMode && (
              <span style={{ 
                marginLeft: '10px', 
                fontSize: '14px', 
                color: '#007bff',
                fontWeight: 'normal'
              }}>
                <Edit3 size={16} style={{ marginRight: '5px' }} />
                Modo de Edição Ativo
              </span>
            )}
          </h3>
          <button 
            className={styles.closeButton}
            onClick={() => {
              setShowHistoryModal(false);
              setIsHistoryEditMode(false);
              cancelHistoryEdit();
            }}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className={styles.modalBody} style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {isHistoryEditMode && (
            <div style={{ 
              padding: '10px', 
              backgroundColor: '#e7f3ff', 
              borderRadius: '4px', 
              marginBottom: '15px',
              fontSize: '14px',
              color: '#0066cc'
            }}>
              <Edit3 size={16} style={{ marginRight: '5px' }} />
              Modo de edição ativo. Clique em qualquer campo para editar. Pressione <kbd>Ctrl + Shift + B</kbd> novamente para sair.
              
              {/* Controles de seleção múltipla */}
              <div style={{ 
                marginTop: '10px', 
                paddingTop: '10px', 
                borderTop: '1px solid #b3d9ff',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  <button
                    onClick={selectAllItems}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    Selecionar Todos
                  </button>
                  <button
                    onClick={clearSelection}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    Limpar Seleção
                  </button>
                </div>
                
                {selectedHistoryItems.length > 0 && (
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px' }}>
                      {selectedHistoryItems.length} item(s) selecionado(s)
                    </span>
                    <button
                      onClick={startBulkDateEdit}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      Alterar Data/Hora
                    </button>
                  </div>
                )}
              </div>
              
              {/* Editor de data em lote */}
              {showBulkDateEdit && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: '#d4edda',
                  borderRadius: '4px',
                  border: '1px solid #c3e6cb'
                }}>
                  <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: 'bold', color: '#155724' }}>
                    Alterar data/hora para {selectedHistoryItems.length} item(s) selecionado(s):
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="datetime-local"
                      value={bulkEditDate}
                      onChange={(e) => setBulkEditDate(e.target.value)}
                      style={{
                        padding: '4px 6px',
                        fontSize: '12px',
                        border: '1px solid #28a745',
                        borderRadius: '3px',
                        backgroundColor: '#fff'
                      }}
                    />
                    <button
                      onClick={applyBulkDateEdit}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      Aplicar
                    </button>
                    <button
                      onClick={cancelBulkDateEdit}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {history.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6c757d', fontStyle: 'italic' }}>
              Nenhuma alteração registrada ainda.
            </p>
          ) : (
            <div className={styles.historyList}>
              {history.map((entry, index) => (
                <div key={index} className={styles.historyItem} style={{
                  padding: '12px',
                  border: selectedHistoryItems.includes(index) 
                    ? '2px solid #007bff' 
                    : '1px solid #dee2e6',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  backgroundColor: selectedHistoryItems.includes(index) 
                    ? '#f8f9ff' 
                    : '#fff',
                  position: 'relative'
                }}>
                  {/* Checkbox para seleção múltipla */}
                  {isHistoryEditMode && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      zIndex: 1
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedHistoryItems.includes(index)}
                        onChange={() => toggleItemSelection(index)}
                        style={{
                          width: '16px',
                          height: '16px',
                          cursor: 'pointer'
                        }}
                      />
                    </div>
                  )}
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginLeft: isHistoryEditMode ? '30px' : '0'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: '5px' }}>
                        <strong style={{ color: '#495057' }}>Ação: </strong>
                        {editingHistoryIndex === index && editingHistoryField === 'action' ? (
                          <input
                            type="text"
                            value={editingHistoryValue}
                            onChange={(e) => setEditingHistoryValue(e.target.value)}
                            onBlur={saveHistoryEdit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveHistoryEdit();
                              if (e.key === 'Escape') {
                                e.preventDefault();
                                saveHistoryEdit();
                              }
                            }}
                            autoFocus
                            style={{
                              border: '2px solid #007bff',
                              borderRadius: '3px',
                              padding: '2px 5px',
                              fontSize: '14px',
                              width: '100%'
                            }}
                          />
                        ) : (
                          <span 
                            onClick={() => startEditingHistory(index, 'action')}
                            style={{ 
                              cursor: isHistoryEditMode ? 'pointer' : 'default',
                              padding: isHistoryEditMode ? '2px 5px' : '0',
                              borderRadius: '3px',
                              backgroundColor: isHistoryEditMode ? '#f8f9fa' : 'transparent',
                              border: isHistoryEditMode ? '1px dashed #ccc' : 'none'
                            }}
                          >
                            {entry.action}
                          </span>
                        )}
                      </div>
                      <div style={{ marginBottom: '5px' }}>
                        <strong style={{ color: '#495057' }}>Detalhes: </strong>
                        {editingHistoryIndex === index && editingHistoryField === 'details' ? (
                          <textarea
                            value={editingHistoryValue}
                            onChange={(e) => setEditingHistoryValue(e.target.value)}
                            onBlur={saveHistoryEdit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                saveHistoryEdit();
                              }
                              if (e.key === 'Escape') {
                                e.preventDefault();
                                saveHistoryEdit();
                              }
                            }}
                            autoFocus
                            style={{
                              border: '2px solid #007bff',
                              borderRadius: '3px',
                              padding: '5px',
                              fontSize: '14px',
                              width: '100%',
                              minHeight: '60px',
                              resize: 'vertical'
                            }}
                          />
                        ) : (
                          <span 
                            onClick={() => startEditingHistory(index, 'details')}
                            style={{ 
                              cursor: isHistoryEditMode ? 'pointer' : 'default',
                              padding: isHistoryEditMode ? '2px 5px' : '0',
                              borderRadius: '3px',
                              backgroundColor: isHistoryEditMode ? '#f8f9fa' : 'transparent',
                              border: isHistoryEditMode ? '1px dashed #ccc' : 'none',
                              display: 'block',
                              minHeight: isHistoryEditMode ? '20px' : 'auto'
                            }}
                          >
                            {entry.details}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#6c757d', 
                      marginLeft: '15px',
                      textAlign: 'right',
                      minWidth: '120px'
                    }}>
                      {editingHistoryIndex === index && editingHistoryField === 'timestamp' ? (
                        <input
                          type="datetime-local"
                          value={editingHistoryValue}
                          onChange={(e) => setEditingHistoryValue(e.target.value)}
                          onBlur={saveHistoryEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveHistoryEdit();
                            if (e.key === 'Escape') {
                              e.preventDefault();
                              saveHistoryEdit();
                            }
                          }}
                          autoFocus
                          style={{
                            border: '2px solid #007bff',
                            borderRadius: '3px',
                            padding: '4px 6px',
                            fontSize: '12px',
                            width: '180px',
                            backgroundColor: '#fff'
                          }}
                        />
                      ) : (
                        <span 
                          onClick={() => startEditingHistory(index, 'timestamp')}
                          style={{ 
                            cursor: isHistoryEditMode ? 'pointer' : 'default',
                            padding: isHistoryEditMode ? '2px 5px' : '0',
                            borderRadius: '3px',
                            backgroundColor: isHistoryEditMode ? '#f8f9fa' : 'transparent',
                            border: isHistoryEditMode ? '1px dashed #ccc' : 'none',
                            display: 'block'
                          }}
                        >
                          {entry.timestamp.toLocaleString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className={styles.modalFooter}>
          <button 
            className={styles.button}
            onClick={() => {
              setShowHistoryModal(false);
              setIsHistoryEditMode(false);
              cancelHistoryEdit();
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
 const executeSaveTemplate = useCallback(async () => {
    try {
      // Gerar dados JSON atualizados
      
      const jsonData = generateSpreadsheetJSON();
      
      // Validar se os dados JSON não estão vazios
      if (!jsonData || jsonData.trim() === '' || jsonData === '{}') {
        showMessage('error', 'Erro ao Salvar', 'Dados JSON não podem estar vazios');
        return;
      }

      if(typeResponse?.type === "Editar")
      {
       setSaveTemplateData(prev => ({
      ...prev,
      tipo: 'template',
      tag: prev.tag || '',
      nomeArquivo: prev.nomeArquivo || 'Nova Planilha',
      caminhoArquivo: prev.caminhoArquivo || `templates/${spreadsheetName || 'nova_planilha'}.json`,
      jsonData: jsonData,
      updated_at: prev.updated_at || ''
    }));
          const jsonBase64 = btoa(unescape(encodeURIComponent(jsonData)));

      const templateData = {
        id: typeResponse?.templateData?.id,
        caminho_arquivo: typeResponse?.templateData?.caminho_arquivo,
        nome_arquivo: typeResponse?.templateData?.nome_arquivo,
        tag: saveTemplateData.tag,
        tipo: typeResponse?.templateData?.tipo,
        json_data: jsonBase64,
        updated_at: null
      };

      
        await invoke('update_template', {
        templateData: {
          ...templateData,
          json_data_base64: jsonBase64
        }
      });
  }
  else
  {
          if (!saveTemplateData.nomeArquivo.trim()) {
        showMessage('error', 'Campo Obrigatório', 'Por favor, insira um nome para o arquivo.');
        return;
      }
      
      if (!saveTemplateData.tag.trim()) {
        showMessage('error', 'Campo Obrigatório', 'Por favor, selecione ou adicione uma tag.');
        return;
      }

      const jsonBase64 = btoa(unescape(encodeURIComponent(saveTemplateData.jsonData)));

      // Preparar dados para envio
      const templateData = {
        caminho_arquivo: saveTemplateData.caminhoArquivo,
        nome_arquivo: saveTemplateData.nomeArquivo,
        tag: saveTemplateData.tag,
        tipo: saveTemplateData.tipo,
        json_data: saveTemplateData.jsonData,
        updated_at: null
      };

      await invoke("save_template", {
        templateData: {
          ...templateData,
          json_data_base64: jsonBase64
        }
      });
  }

      // Fechar modal e mostrar sucesso
      setShowSaveTemplateModal(false);
      showMessage('success', 'Sucesso!', 'Template salvo com sucesso!');
      
      // Adicionar ao histórico
      addToHistory('Template Salvo', `Template "${saveTemplateData.nomeArquivo}" foi salvo com a tag "${saveTemplateData.tag}"`);
      
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      showMessage('error', 'Erro ao Salvar', 'Erro ao salvar template. Verifique os dados e tente novamente.');
    }
  }, [generateSpreadsheetJSON, typeResponse, saveTemplateData, spreadsheetName, addToHistory]);
 const saveTemplate = useCallback(async () => {
    // Abrir modal de validação antes de continuar
    setShowSaveTemplateModal(false)
    openUserValidationModal();
  }, [openUserValidationModal]);


  // Atualizar estados de formatação quando a seleção muda
  useEffect(() => {
    if (selectedCells.length > 0) {
      const currentStyle = getCurrentCellStyle();
      setCurrentFontSize(currentStyle.fontSize || '0.875rem');
      setCurrentFontFamily(currentStyle.fontFamily || 'inherit');
    }
  }, [selectedCells, getCurrentCellStyle]);

  // Funções de controle de zoom
    const zoomIn = useCallback(() => {
    setZoomLevel(prev => {
      const newLevel = Math.min(prev + 0.1, 3); // Máximo 300%
      const zoomFactor = newLevel / prev;
      addToHistory('Zoom In', `Zoom aumentado para ${Math.round(newLevel * 100)}%`);
      
      // Ajustar dimensões das colunas e linhas baseado no zoom
      setColumnWidths(prevWidths => prevWidths.map(width => width * zoomFactor));
      setRowHeights(prevHeights => prevHeights.map(height => height * zoomFactor));
      setRowHeaderWidth(prev => prev * zoomFactor);
      setColumnHeaderHeight(prev => prev * zoomFactor);
      
      return newLevel;
    });
  }, [addToHistory]);

   const zoomOut = useCallback(() => {
    setZoomLevel(prev => {
      const newLevel = Math.max(prev - 0.1, 0.3); // Mínimo 30%
      const zoomFactor = newLevel / prev;
      addToHistory('Zoom Out', `Zoom reduzido para ${Math.round(newLevel * 100)}%`);
      
      // Ajustar dimensões das colunas e linhas baseado no zoom
      setColumnWidths(prevWidths => prevWidths.map(width => width * zoomFactor));
      setRowHeights(prevHeights => prevHeights.map(height => height * zoomFactor));
      setRowHeaderWidth(prev => prev * zoomFactor);
      setColumnHeaderHeight(prev => prev * zoomFactor);
      
      return newLevel;
    });
  }, [addToHistory]);

   const resetZoom = useCallback(() => {
    const currentLevel = zoomLevel;
    setZoomLevel(1);
    
    // Resetar dimensões das colunas e linhas para o tamanho original
    const resetFactor = 1 / currentLevel;
    setColumnWidths(prevWidths => prevWidths.map(width => width * resetFactor));
    setRowHeights(prevHeights => prevHeights.map(height => height * resetFactor));
    setRowHeaderWidth(prev => prev * resetFactor);
    setColumnHeaderHeight(prev => prev * resetFactor);
    
    addToHistory('Reset Zoom', 'Zoom resetado para 100%');
  }, [addToHistory, zoomLevel]);
  // Função para ativar modo de seleção de área de impressão
  const activatePrintAreaMode = useCallback(() => {
    setIsPrintAreaMode(true);
    setSelectedCells([]);
    setSelectionRange(null);
    addToHistory('Modo Área de Impressão', 'Modo de seleção de área de impressão ativado');
  }, [addToHistory]);

  // Função para desativar modo de seleção de área de impressão
  const deactivatePrintAreaMode = useCallback(() => {
    setIsPrintAreaMode(false);
    setIsSelectingPrintArea(false);
    setPrintAreaRange(null);
    addToHistory('Modo Área de Impressão', 'Modo de seleção de área de impressão desativado');
  }, [addToHistory]);

  // Função para confirmar área de impressão selecionada
  const confirmPrintArea = useCallback(() => {
    if (printAreaRange) {
      const { startRow, startCol, endRow, endCol } = printAreaRange;
      const minRow = Math.min(startRow, endRow);
      const maxRow = Math.max(startRow, endRow);
      const minCol = Math.min(startCol, endCol);
      const maxCol = Math.max(startCol, endCol);
      
      setPrintArea({
        startRow: minRow,
        startCol: minCol,
        endRow: maxRow,
        endCol: maxCol
      });
      
      setIsPrintAreaMode(false);
      setIsSelectingPrintArea(false);
      setPrintAreaRange(null);
      
      const areaInfo = `${getColumnLabel(minCol)}${minRow + 1}:${getColumnLabel(maxCol)}${maxRow + 1}`;
      addToHistory('Área de Impressão Definida', `Área selecionada: ${areaInfo}`);
    }
  }, [printAreaRange, addToHistory]);

  // Função para limpar área de impressão
  const clearPrintArea = useCallback(() => {
    setPrintArea(null);
    addToHistory('Área de Impressão', 'Área de impressão removida - impressão completa');
  }, [addToHistory]);

  // Função para verificar se uma célula está na área de impressão
  const isCellInPrintArea = useCallback((rowIndex: number, colIndex: number): boolean => {
    if (!printArea) return false;
    return rowIndex >= printArea.startRow && 
           rowIndex <= printArea.endRow && 
           colIndex >= printArea.startCol && 
           colIndex <= printArea.endCol;
  }, [printArea]);

  // Função para verificar se uma célula está na área de impressão sendo selecionada
  const isCellInPrintAreaRange = useCallback((rowIndex: number, colIndex: number): boolean => {
    if (!printAreaRange) return false;
    
    const { startRow, startCol, endRow, endCol } = printAreaRange;
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);
    
    return rowIndex >= minRow && rowIndex <= maxRow && colIndex >= minCol && colIndex <= maxCol;
  }, [printAreaRange]);

  // Modificar handleCellMouseDown para suportar seleção de área de impressão
  const handleCellMouseDown = useCallback((rowIndex: number, colIndex: number, event: React.MouseEvent) => {
    if (isPrintAreaMode) {
      // Modo de seleção de área de impressão
      setIsSelectingPrintArea(true);
      setPrintAreaRange({ startRow: rowIndex, startCol: colIndex, endRow: rowIndex, endCol: colIndex });
      return;
    }

    if (event.ctrlKey && formulaBarRef.current === document.activeElement) {
      event.preventDefault();
      const cellRef = getCellReference(rowIndex, colIndex);
      setFormulaBarValue(prev => prev + cellRef);
      return;
    }
    setIsSelecting(true);
        if (event.ctrlKey) {
      setSelectedCells(prev => {
        const exists = prev.some(cell => cell.row === rowIndex && cell.col === colIndex);
        if (exists) {
          // Remove se já existe
          return prev.filter(cell => !(cell.row === rowIndex && cell.col === colIndex));
        } else {
          // Adiciona à seleção
          return [...prev, { row: rowIndex, col: colIndex }];
        }
      });
    } else {
      // Seleção normal - substitui a seleção atual
      setSelectedCells([{ row: rowIndex, col: colIndex }]);
      setSelectionRange({ startRow: rowIndex, startCol: colIndex, endRow: rowIndex, endCol: colIndex });
    }
    setSelectedCells([{ row: rowIndex, col: colIndex }]);
    setSelectionRange({ startRow: rowIndex, startCol: colIndex, endRow: rowIndex, endCol: colIndex });
  }, [isPrintAreaMode, formulaBarRef]);

  // Modificar handleCellMouseEnter para suportar seleção de área de impressão
  const handleCellMouseEnter = useCallback((rowIndex: number, colIndex: number) => {
    if (isSelectingPrintArea && printAreaRange) {
      setPrintAreaRange(prev => {
        if (!prev) return null;
        return { ...prev, endRow: rowIndex, endCol: colIndex };
      });
      return;
    }

       if (isSelecting && selectionRange) {
      // Atualizar o range de seleção
      const newRange = { 
        ...selectionRange, 
        endRow: rowIndex, 
        endCol: colIndex 
      };
      setSelectionRange(newRange);


      const minRow = Math.min(newRange.startRow, newRange.endRow);
      const maxRow = Math.max(newRange.startRow, newRange.endRow);
      const minCol = Math.min(newRange.startCol, newRange.endCol);
      const maxCol = Math.max(newRange.startCol, newRange.endCol);

      const newSelectedCells: CellSelection[] = [];
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          newSelectedCells.push({ row: r, col: c });
        }
      }
      setSelectedCells(newSelectedCells);
    }
  }, [isSelectingPrintArea, printAreaRange, isSelecting, selectionRange]);


   useEffect(() => {
      let unlisten: (() => void) | undefined;
  
      const setupListener = async () => {
        try {
          unlisten = await listen('window-data', (event) => {
            console.log('Dados recebidos da janela pai:', event.payload);
            const dados = event.payload as ReponseType;

            if (dados)
            {
              
              switch(dados.type)
                 {
                    case "Template":
                          if (dados.templateData?.json_data_base64) 
                          {
                              setTypeResponse(dados);
                              loadTemplateFromBase64(dados.templateData?.json_data_base64);
                          }
                          
                    break;

                    case "Editar":
                       if (dados.templateData?.json_data_base64)
                          {
               
                              setTypeResponse(dados);
                              loadTemplateFromBase64(dados.templateData?.json_data_base64)
                          }
                    break;

                    case "Criar":
                   
                              setTypeResponse(dados);
                    break;

                    case "Duplicar":
                          if (dados.templateData?.json_data_base64)
                          {
               
                              setTypeResponse(dados);
                              loadTemplateFromBase64(dados.templateData?.json_data_base64)
                          }
                    break;

                    default:
                
                             setTypeResponse(dados);
                      break;
                 }

            }
          });
  
          await emit('window-ready');
        } catch (error) {
          console.error('Erro ao configurar listener:', error);
        }
      };
  
      setupListener();
  
      return () => {
        if (unlisten) {
          unlisten();
        }
      };
    }, []);

  const handleImageResizeStart = useCallback((e: React.MouseEvent, rowIndex: number, colIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    const cell = data[rowIndex][colIndex];
    if (cell.media && cell.media.type === 'image') {
      setIsResizingImage({
        row: rowIndex,
        col: colIndex,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: cell.media.width || 80,
        startHeight: cell.media.height || 60,
      });
    }
  }, [data]);
  const handleCellDrop = useCallback((targetRow: number, targetCol: number, event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (draggedImage) {
      const { media, fromCell } = draggedImage;
      
      // Verificar se não está tentando mover para a mesma célula
      if (fromCell.row === targetRow && fromCell.col === targetCol) {
        setDraggedImage(null);
        return;
      }
      
      // Limpar a célula de origem
      setData(prevData => {
        const newData = prevData.map(row => [...row]);
        newData[fromCell.row][fromCell.col] = {
          ...newData[fromCell.row][fromCell.col],
          media: undefined,
        };
        
        // Adicionar a imagem à célula de destino
        newData[targetRow][targetCol] = {
          ...newData[targetRow][targetCol],
          media: { ...media, x: undefined, y: undefined }, // Resetar posição para o centro da nova célula
        };
        
        return newData;
      });

      addToHistory(
        'Mover Imagem',
        `Imagem movida de ${getColumnLabel(fromCell.col)}${fromCell.row + 1} para ${getColumnLabel(targetCol)}${targetRow + 1}`
      );
      setDraggedImage(null);
    }
  }, [draggedImage, addToHistory]);

  // Função para lidar com mouse up global
  const handleMouseUp = useCallback(() => {
    setIsSelecting(false);
    setSelectionRange(null);
    setIsSelectingPrintArea(false);
  }, []);

  // Função para obter informações da área de impressão
  const getPrintAreaInfo = useCallback((): string => {
    if (!printArea) return 'Planilha completa';
    const { startRow, startCol, endRow, endCol } = printArea;
    return `${getColumnLabel(startCol)}${startRow + 1}:${getColumnLabel(endCol)}${endRow + 1}`;
  }, [printArea]);

  // Resto das funções existentes (mantendo todas as funções originais)
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

      setShowSuggestions(false);
      setFormulaValidation(null);
    }
  }, []);

  const handleFormulaBarSubmit = useCallback(async () => {
    if (selectedCells.length === 1) {
      const { row, col } = selectedCells[0];
      const isFormula = formulaBarValue.startsWith('=');
      await updateCell(row, col, formulaBarValue, isFormula);

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

  const handleCellKeyDown = useCallback((event: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
    // Navegação com setas do teclado
    if (event.key === 'ArrowUp') {
      event.preventDefault(); // Evita o scroll da página
      if (rowIndex > 0) {
        setSelectedCells([{ row: rowIndex - 1, col: colIndex }]);
        // Focar na nova célula
        setTimeout(() => {
          const newCellInput = document.querySelector(`[data-cell="${rowIndex - 1}-${colIndex}"]`) as HTMLInputElement;
          if (newCellInput) {
            newCellInput.focus();
          }
        }, 0);
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault(); // Evita o scroll da página
      if (rowIndex < rows - 1) {
        setSelectedCells([{ row: rowIndex + 1, col: colIndex }]);
        // Focar na nova célula
        setTimeout(() => {
          const newCellInput = document.querySelector(`[data-cell="${rowIndex + 1}-${colIndex}"]`) as HTMLInputElement;
          if (newCellInput) {
            newCellInput.focus();
          }
        }, 0);
      }
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault(); // Evita o scroll da página
      if (colIndex > 0) {
        setSelectedCells([{ row: rowIndex, col: colIndex - 1 }]);
        // Focar na nova célula
        setTimeout(() => {
          const newCellInput = document.querySelector(`[data-cell="${rowIndex}-${colIndex - 1}"]`) as HTMLInputElement;
          if (newCellInput) {
            newCellInput.focus();
          }
        }, 0);
      }
    } else if (event.key === 'ArrowRight') {
      event.preventDefault(); // Evita o scroll da página
      if (colIndex < cols - 1) {
        setSelectedCells([{ row: rowIndex, col: colIndex + 1 }]);
        // Focar na nova célula
        setTimeout(() => {
          const newCellInput = document.querySelector(`[data-cell="${rowIndex}-${colIndex + 1}"]`) as HTMLInputElement;
          if (newCellInput) {
            newCellInput.focus();
          }
        }, 0);
      }
    } else if (event.key === 'Enter') {
      // Mover para a próxima linha
      if (rowIndex < rows - 1) {
        setSelectedCells([{ row: rowIndex + 1, col: colIndex }]);
        // Focar na nova célula
        setTimeout(() => {
          const newCellInput = document.querySelector(`[data-cell="${rowIndex + 1}-${colIndex}"]`) as HTMLInputElement;
          if (newCellInput) {
            newCellInput.focus();
          }
        }, 0);
      }
    } else if (event.key === 'Tab') {
      event.preventDefault();
      // Mover para a próxima coluna
      if (colIndex < cols - 1) {
        setSelectedCells([{ row: rowIndex, col: colIndex + 1 }]);
        // Focar na nova célula
        setTimeout(() => {
          const newCellInput = document.querySelector(`[data-cell="${rowIndex}-${colIndex + 1}"]`) as HTMLInputElement;
          if (newCellInput) {
            newCellInput.focus();
          }
        }, 0);
      } else if (rowIndex < rows - 1) {
        setSelectedCells([{ row: rowIndex + 1, col: 0 }]);
        // Focar na nova célula
        setTimeout(() => {
          const newCellInput = document.querySelector(`[data-cell="${rowIndex + 1}-0"]`) as HTMLInputElement;
          if (newCellInput) {
            newCellInput.focus();
          }
        }, 0);
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

  // Nova função para importar XLSX usando input de arquivo
  const importXLSX = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verificar se é um arquivo Excel
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      showMessage('error', 'Arquivo Inválido', 'Por favor, selecione um arquivo Excel válido (.xlsx ou .xls)');
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

          showMessage('success', 'Importação Concluída', `Arquivo XLSX importado com sucesso!\nArquivo: ${file.name}\nLinhas: ${result.rows}\nColunas: ${result.cols}${result.imported_sheet ? `\nPlanilha: ${result.imported_sheet}` : ''}`);
        } else {
          const errorMsg = result.error || 'Erro desconhecido ao importar arquivo XLSX';
          console.error('Erro na importação:', errorMsg);
          showMessage('error', 'Erro na Importação', `Erro ao importar arquivo XLSX: ${errorMsg}`);
        }
      } catch (error) {
        console.error('Erro ao processar arquivo XLSX:', error);
        showMessage('error', 'Erro de Processamento', `Erro ao processar arquivo XLSX: ${error}`);
      }
    };

    reader.onerror = () => {
      showMessage('error', 'Erro de Leitura', 'Erro ao ler o arquivo. Tente novamente.');
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
        
        // Corrigir o histórico para converter strings de data em objetos Date
        const historyWithDates = template.history.map(entry => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));

        setSpreadsheetName(template.name);
        setRows(template.rows);
        setCols(template.cols);
        setData(template.data);
        setHistory(historyWithDates || []);
        setColumnWidths(template.columnWidths || Array(template.cols).fill(100));
        setRowHeights(template.rowHeights || Array(template.rows).fill(32));
        
        addToHistory('Carregar Template', `Template "${template.name}" carregado`);
      } catch (error) {
        showMessage('error', 'Erro ao Carregar', 'Erro ao carregar o arquivo. Verifique se é um template válido.');
      }
    };
    reader.readAsText(file);
  }, [addToHistory]);



 async function loadTemplateFromBase64(base64String: string) {
  try {
   
    const template: SpreadsheetData = await invoke('decode_base64_to_json', { encodedString: base64String });

    // Corrigir o histórico para converter strings de data em objetos Date
    const historyWithDates = template.history.map(entry => ({
      ...entry,
      timestamp: new Date(entry.timestamp)
    }));

    // Se a decodificação e o parseamento forem bem-sucedidos, você pode usar os dados:
    setSpreadsheetName(template.name);
    setRows(template.rows);
    setCols(template.cols);
    setData(template.data);
    setHistory(historyWithDates || []);
    setColumnWidths(template.columnWidths || Array(template.cols).fill(100));
    setRowHeights(template.rowHeights || Array(template.rows).fill(32));

    addToHistory('Carregar Template', `Template "${template.name}" carregado`);

  } catch (error) {
    // O erro virá do backend Rust se algo der errado (decodificação ou parse)
    showMessage('error', 'Erro ao Carregar', `Erro ao carregar o arquivo: ${error}. Verifique se é um template válido e se o Base64 está correto.`);
  }
}


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
        showMessage('error', 'Erro na Importação', 'Erro ao importar CSV. Verifique se o arquivo está no formato correto.');
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

  // Função corrigida para alterar tamanho da fonte
  const setFontSize = useCallback((fontSize: string) => {
    if (selectedCells.length === 0) return;
    setCurrentFontSize(fontSize);
    updateSelectedCellsStyle({ fontSize: fontSize });
  }, [selectedCells, updateSelectedCellsStyle]);

  // Função corrigida para alterar família da fonte
  const setFontFamily = useCallback((fontFamily: string) => {
    if (selectedCells.length === 0) return;
    setCurrentFontFamily(fontFamily);
    updateSelectedCellsStyle({ fontFamily: fontFamily });
  }, [selectedCells, updateSelectedCellsStyle]);

  // Funções de mídia
  const openMediaModal = useCallback((type: 'image' | 'video' | 'audio' | 'link' | 'table') => {
    if (selectedCells.length === 0) {
      showMessage('info', 'Seleção Necessária', 'Selecione uma célula primeiro');
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

  const createTable = useCallback(() => {
    if (selectedCells.length === 0) return;

    const template = tableTemplates[tableConfig.selectedTemplate];
    const { rows: tableRows, cols: tableCols } = tableConfig;
    
    // Criar dados da tabela com o template selecionado
    const styledTableData: string[][] = [];
    
    for (let row = 0; row < tableRows; row++) {
      const rowData: string[] = [];
      for (let col = 0; col < tableCols; col++) {
        if (row === 0) {
          // Primeira linha (cabeçalho)
          rowData.push(`Cabeçalho ${col + 1}`);
        } else {
          // Linhas de dados
          rowData.push(`Linha ${row}, Col ${col + 1}`);
        }
      }
      styledTableData.push(rowData);
    }

    const media: CellMedia = {
      type: 'table',
      tableData: styledTableData
    };
    
    const firstCell = selectedCells[0];
    updateCellMedia(firstCell.row, firstCell.col, media);
    
    // Aplicar estilos às células da tabela na planilha
    const startRow = firstCell.row;
    const startCol = firstCell.col;
    
    for (let row = 0; row < tableRows && startRow + row < data.length; row++) {
      for (let col = 0; col < tableCols && startCol + col < data[0].length; col++) {
        const targetRow = startRow + row;
        const targetCol = startCol + col;
        
        let cellStyle: CellStyle;
        
        if (row === 0) {
          // Estilo do cabeçalho
          cellStyle = template.headerStyle;
        } else if (row % 2 === 0) {
          // Linhas pares
          cellStyle = template.cellStyle;
        } else {
          // Linhas ímpares
          cellStyle = template.alternateRowStyle;
        }
        
        // Atualizar a célula com o valor e estilo
        setData(prevData => {
          const newData = prevData.map(r => [...r]);
          if (newData[targetRow] && newData[targetRow][targetCol]) {
            newData[targetRow][targetCol] = {
              ...newData[targetRow][targetCol],
   
              style: { ...newData[targetRow][targetCol].style, ...cellStyle }
            };
          }
          return newData;
        });
      }
    }
    
    setShowMediaModal(false);
    addToHistory('Tabela Criada', `Tabela ${tableRows}x${tableCols} criada com template ${template.name}`);
  }, [selectedCells, updateCellMedia, tableConfig, tableTemplates, data, addToHistory]);

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
      if (isResizing) 
        {
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
      }
            if (isResizingImage) {
        const { row, col, startX, startY, startWidth, startHeight } = isResizingImage;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        const newWidth = Math.max(20, startWidth + deltaX);
        const newHeight = Math.max(20, startHeight + deltaY);
        
        setData(prevData => {
          const newData = prevData.map(row => [...row]);
          if (newData[row][col].media) {
            newData[row][col].media = {
              ...newData[row][col].media!,
              width: newWidth,
              height: newHeight,
            };
          }
          return newData;
        });
      }
    };

    const handleMouseUp = () => {
      if (isResizing) {
        addToHistory('Redimensionar', `${isResizing.type === 'col' ? 'Coluna' : 'Linha'} ${isResizing.index + 1} redimensionada`);
        setIsResizing(null);
      }
      if (isResizingImage) {
        addToHistory('Redimensionar Imagem', `Imagem na célula ${getColumnLabel(isResizingImage.col)}${isResizingImage.row + 1} redimensionada`);
        setIsResizingImage(null);
      }
    };

    if (isResizing || isResizingImage) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, isResizingImage, addToHistory, getColumnLabel]);



  const getCellStyle = (rowIndex: number, colIndex: number): React.CSSProperties => {
    const cell = data[rowIndex]?.[colIndex];
    if (!cell) return {};

    const { colspan, rowspan, shouldRender } = CellMergeUtils.getCellSpan(data, rowIndex, colIndex);

    if (!shouldRender) {
      return { display: 'none' };
    }

    const cellStyle = cell.style || {};
    let additionalStyles: React.CSSProperties = {};

    // Adicionar estilos para área de impressão
    if (printArea && isCellInPrintArea(rowIndex, colIndex)) {
      additionalStyles.boxShadow = '0 0 0 2px #10b981';
      additionalStyles.backgroundColor = additionalStyles.backgroundColor || '#ecfdf5';
    }

    // Adicionar estilos para área de impressão sendo selecionada
    if (isPrintAreaMode && isCellInPrintAreaRange(rowIndex, colIndex)) {
      additionalStyles.boxShadow = '0 0 0 2px #3b82f6';
      additionalStyles.backgroundColor = '#dbeafe';
    }

    // Estilos base da célula
    const baseStyles: React.CSSProperties = {
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
      verticalAlign: cellStyle.verticalAlign || 'middle',
      textTransform: cellStyle.textTransform || 'none',
      letterSpacing: cellStyle.letterSpacing || 'normal',
      lineHeight: cellStyle.lineHeight || 'normal',
      textShadow: cellStyle.textShadow || 'none',
      boxShadow: cellStyle.boxShadow || 'none',
      opacity: cellStyle.opacity || 1,
      ...additionalStyles,
    };

    // Para células mescladas, aplicar colspan e rowspan
    if (cell.merged && colspan > 1 || rowspan > 1) {
      baseStyles.gridColumn = `span ${colspan}`;
      baseStyles.gridRow = `span ${rowspan}`;
      baseStyles.zIndex = cell.masterCell && (cell.masterCell.row === rowIndex && cell.masterCell.col === colIndex) ? 4 : 3;
      
      // Garantir que a célula mestre ocupe o espaço total
      if (cell.masterCell && (cell.masterCell.row === rowIndex && cell.masterCell.col === colIndex)) {
        // Calcular largura e altura total baseada no colspan e rowspan
        const totalWidth = Array.from({ length: colspan }, (_, i) => columnWidths[colIndex + i] || 100).reduce((sum, width) => sum + width, 0);
        const totalHeight = Array.from({ length: rowspan }, (_, i) => rowHeights[rowIndex + i] || 32).reduce((sum, height) => sum + height, 0);
        
        baseStyles.width = totalWidth;
        baseStyles.height = totalHeight;
        baseStyles.minWidth = totalWidth;
        baseStyles.minHeight = totalHeight;
        baseStyles.maxWidth = totalWidth;
        baseStyles.maxHeight = totalHeight;
      }
    } else {
      // Para células normais
      baseStyles.width = columnWidths[colIndex] || 100;
      baseStyles.height = rowHeights[rowIndex] || 32;
      baseStyles.minWidth = columnWidths[colIndex] || 100;
      baseStyles.minHeight = rowHeights[rowIndex] || 32;
    }

    return baseStyles;
  };

  const renderCellContent = (rowIndex: number, colIndex: number) => {
    const cell = data[rowIndex]?.[colIndex];
    if (!cell || (cell.merged && cell.masterCell && (cell.masterCell.row !== rowIndex || cell.masterCell.col !== colIndex))) return null;

    if (cell.media) {
      switch (cell.media.type) {
        case 'image':
          return (
            <div
              className={styles["image-container"]}
              draggable
              onDragStart={(e) => {
                if (cell.media) {
                  setDraggedImage({ media: cell.media, fromCell: { row: rowIndex, col: colIndex } });
                  e.dataTransfer.setData("text/plain", cell.id);
                  e.dataTransfer.effectAllowed = "move";
                  
                  // Criar uma imagem de preview para o drag
                  const dragImage = new Image();
                  dragImage.src = cell.media.data || cell.media.url || '';
                  dragImage.style.width = '50px';
                  dragImage.style.height = '50px';
                  dragImage.style.opacity = '0.7';
                  e.dataTransfer.setDragImage(dragImage, 25, 25);
                }
              }}
              onDragEnd={() => {
                setDraggedImage(null);
              }}
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'move',
                transition: 'opacity 0.2s ease',
                opacity: draggedImage && draggedImage.fromCell.row === rowIndex && draggedImage.fromCell.col === colIndex ? 0.5 : 1,
              }}
              title="Arraste para mover a imagem para outra célula"
            >
              {cell.media.data && (
                <div style={{ position: 'relative' }}>
                  <img 
                    ref={imageRef}
                    src={cell.media.data} 
                    alt={cell.media.alt || 'Imagem'} 
                    style={{
                      maxWidth: cell.media.width ? `${cell.media.width}px` : '80px',
                      maxHeight: cell.media.height ? `${cell.media.height}px` : '60px',
                      objectFit: 'contain',
                      position: 'absolute',
                      left: cell.media.x !== undefined ? `${cell.media.x}px` : '50%',
                      top: cell.media.y !== undefined ? `${cell.media.y}px` : '50%',
                      transform: cell.media.x !== undefined && cell.media.y !== undefined ? 'none' : 'translate(-50%, -50%)',
                      pointerEvents: 'none', // Evita interferência com o drag
                    }}
                  />
                  <div
                    className={styles["resize-handle"]}
                    onMouseDown={(e) => handleImageResizeStart(e, rowIndex, colIndex)}
                    style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      width: '10px',
                      height: '10px',
                      backgroundColor: '#16a34a',
                      cursor: 'se-resize',
                      borderRadius: '2px',
                      zIndex: 10,
                    }}
                    title="Arraste para redimensionar"
                  />
                </div>
              )}
              {cell.media.url && !cell.media.data && (
                <div style={{ position: 'relative' }}>
                  <img 
                    ref={imageRef}
                    src={cell.media.url} 
                    alt={cell.media.alt || 'Imagem'} 
                    style={{
                      maxWidth: cell.media.width ? `${cell.media.width}px` : '80px',
                      maxHeight: cell.media.height ? `${cell.media.height}px` : '60px',
                      objectFit: 'contain',
                      position: 'absolute',
                      left: cell.media.x !== undefined ? `${cell.media.x}px` : '50%',
                      top: cell.media.y !== undefined ? `${cell.media.y}px` : '50%',
                      transform: cell.media.x !== undefined && cell.media.y !== undefined ? 'none' : 'translate(-50%, -50%)',
                      pointerEvents: 'none', // Evita interferência com o drag
                    }}
                  />
                  <div
                    className={styles["resize-handle"]}
                    onMouseDown={(e) => handleImageResizeStart(e, rowIndex, colIndex)}
                    style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      width: '10px',
                      height: '10px',
                      backgroundColor: '#16a34a',
                      cursor: 'se-resize',
                      borderRadius: '2px',
                      zIndex: 10,
                    }}
                    title="Arraste para redimensionar"
                  />
                </div>
              )}
              <span style={{ fontSize: '0.7rem', position: 'relative', zIndex: 1, pointerEvents: 'none' }}>
                {cell.computed_value || cell.value}
              </span>
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
          data-cell={`${rowIndex}-${colIndex}`}
          style={{
            fontWeight: cell.style?.fontWeight || 'normal',
            fontStyle: cell.style?.fontStyle || 'normal',
            textDecoration: cell.style?.textDecoration || 'none',
            textAlign: cell.style?.textAlign || 'left',
            color: cell.style?.color || '#374151',
            fontSize: cell.style?.fontSize || '0.875rem',
            fontFamily: cell.style?.fontFamily || 'inherit',
            textTransform: cell.style?.textTransform || 'none',
            letterSpacing: cell.style?.letterSpacing || 'normal',
            lineHeight: cell.style?.lineHeight || 'normal'
          }}
          placeholder=""
          disabled={isPrintAreaMode} // Desabilitar edição no modo de seleção de área
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
    if (isPrintAreaMode) {
      if (printAreaRange) {
        const { startRow, startCol, endRow, endCol } = printAreaRange;
        const minRow = Math.min(startRow, endRow);
        const maxRow = Math.max(startRow, endRow);
        const minCol = Math.min(startCol, endCol);
        const maxCol = Math.max(startCol, endCol);
        return `Selecionando: ${getColumnLabel(minCol)}${minRow + 1}:${getColumnLabel(maxCol)}${maxRow + 1}`;
      }
      return 'Modo: Selecionar área de impressão';
    }
    
    if (selectedCells.length === 0) return '';
    if (selectedCells.length === 1) {
      const cell = selectedCells[0];
      return `${getColumnLabel(cell.col)}${cell.row + 1}`;
    }
    return `${selectedCells.length} células selecionadas`;
  };

  const mergeCells = useCallback(() => {
    if (selectedCells.length < 2) {
      showMessage('info', 'Seleção Insuficiente', 'Selecione pelo menos duas células para mesclar.');
      return;
    }

    const rows = selectedCells.map(c => c.row);
    const cols = selectedCells.map(c => c.col);
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);

    setData(prevData => {
      const newData = prevData.map(row => [...row]);
      const result = CellMergeUtils.mergeCells(newData, minRow, minCol, maxRow, maxCol);

      if (result.success) {
        const rangeStr = `${CellReferenceUtils.getCellReference(minRow, minCol)}:${CellReferenceUtils.getCellReference(maxRow, maxCol)}`;
        addToHistory('Mesclar Células', `Células mescladas no intervalo ${rangeStr}`);
        setSelectedCells([{ row: minRow, col: minCol }]);
        return newData;
      } else {
        showMessage('error', 'Erro na Mesclagem', `Erro ao mesclar células: ${result.error}`);
        return prevData;
      }
    });
  }, [selectedCells, addToHistory]);

  const unmergeCells = useCallback(() => {
    if (selectedCells.length === 0) return;

    const { row, col } = selectedCells[0];
    const cell = data[row]?.[col];

    if (!cell || !cell.merged) {
      showMessage('info', 'Célula Não Mesclada', 'A célula selecionada não está mesclada.');
      return;
    }

    setData(prevData => {
      const newData = prevData.map(r => [...r]);
      const result = CellMergeUtils.unmergeCells(newData, row, col);

      if (result.success) {
        const rangeStr = `${CellReferenceUtils.getCellReference(result.mergeRange.startRow, result.mergeRange.startCol)}:${CellReferenceUtils.getCellReference(result.mergeRange.endRow, result.mergeRange.endCol)}`;
        addToHistory('Desmesclar Células', `Células desmescladas no intervalo ${rangeStr}`);
        setSelectedCells([{ row: result.masterCell.row, col: result.masterCell.col }]);
        return newData;
      } else {
        showMessage('error', 'Erro na Desmesclagem', `Erro ao desmesclar células: ${result.error}`);
        return prevData;
      }
    });
  }, [selectedCells, data, addToHistory]);

  const printSpreadsheet = useCallback(() => {
    setShowPrintModal(true);
    addToHistory('Visualizar Impressão', `Modal de impressão aberto para planilha "${spreadsheetName}"`);
  }, [spreadsheetName, addToHistory]);

  const handlePrint = useCallback(() => {
    if (printContentRef.current) {
      // Criar estilos de impressão
      const printStyles = `
        @media print {
          body * {
            visibility: hidden;
          }
          
          .print-content, .print-content * {
            visibility: visible;
          }
          
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          
          @page {
            size: A4 landscape;
            margin: 1cm;
          }
          
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            font-size: 12px;
          }
          
          .print-header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
          
          .print-header h1 {
            margin: 0;
            font-size: 18px;
            color: #333;
          }
          
          .print-header p {
            margin: 5px 0 0 0;
            color: #666;
            font-size: 12px;
          }
          
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          
          .print-table th,
          .print-table td {
            border: 1px solid #ccc;
            padding: 4px 6px;
            text-align: left;
            vertical-align: top;
            word-wrap: break-word;
            max-width: 120px;
          }
          
          .print-table th {
            background-color: #f5f5f5;
            font-weight: bold;
            text-align: center;
          }
          
          .print-table .row-header {
            background-color: #f9f9f9;
            font-weight: bold;
            text-align: center;
            width: 40px;
          }
          
          .formula-cell {
            background-color: #e8f5e8;
          }
          
          .error-cell {
            background-color: #ffe6e6;
            color: #d32f2f;
          }
          
          .media-cell {
            background-color: #f0f8ff;
            font-style: italic;
          }
          
          .print-table {
            font-size: 8px;
          }
          
          .print-table th,
          .print-table td {
            padding: 2px 4px;
            max-width: 80px;
          }
        }
        
        @media screen {
          .print-content {
            display: none;
          }
        }
      `;

      // Criar container temporário para impressão
      const printContainer = document.createElement('div');
      printContainer.className = 'print-content';
      printContainer.innerHTML = printContentRef.current.innerHTML;
      
      // Criar elemento de estilo
      const styleElement = document.createElement('style');
      styleElement.id = 'tauri-print-styles';
      styleElement.innerHTML = printStyles;
      
      // Adicionar elementos ao DOM
      document.head.appendChild(styleElement);
      document.body.appendChild(printContainer);
      
      // Executar impressão
      setTimeout(() => {
        window.print();
        
        // Limpar após impressão (dar tempo para o diálogo de impressão aparecer)
        setTimeout(() => {
          const existingStyle = document.getElementById('tauri-print-styles');
          const existingContainer = document.querySelector('.print-content');
          
          if (existingStyle) {
            document.head.removeChild(existingStyle);
          }
          if (existingContainer) {
            document.body.removeChild(existingContainer);
          }
        }, 500);
      }, 100);
      
      setShowPrintModal(false);
      const areaInfo = printArea ? ` (Área: ${getPrintAreaInfo()})` : ' (Planilha completa)';
      addToHistory("Imprimir Planilha", `Planilha "${spreadsheetName}" enviada para impressão${areaInfo}`);
    }
  }, [spreadsheetName, addToHistory, printArea, getPrintAreaInfo]);

  // Função modificada para gerar conteúdo de impressão com área selecionada
  const generatePrintContent = useCallback(() => {
    // Determinar área a ser impressa
    let startRow = 0, endRow = rows - 1, startCol = 0, endCol = cols - 1;
    
    if (printArea) {
      startRow = printArea.startRow;
      endRow = printArea.endRow;
      startCol = printArea.startCol;
      endCol = printArea.endCol;
    }

    const printRows = endRow - startRow + 1;
    const printCols = endCol - startCol + 1;

    return (
      <div className="print-content" style={{ 
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        color: '#000',
        backgroundColor: '#fff',
        padding: '20px'
      }}>
      
        <table className="print-table" style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginTop: '10px'
        }}>
         
          <tbody>
            {Array(printRows).fill(null).map((_, rowIndex) => (
              <tr key={rowIndex}>
                
                {Array(printCols).fill(null).map((_, colIndex) => {
                  const actualRowIndex = startRow + rowIndex;
                  const actualColIndex = startCol + colIndex;
                  const cell = data[actualRowIndex]?.[actualColIndex];
                  if (!cell) return <td key={colIndex} style={{ border: '1px solid #ccc', padding: '4px 6px' }}></td>;
                  
                  let cellContent = cell.computed_value || cell.value || '';
                  let cellClass = '';
                  let cellStyle: React.CSSProperties = {
                    border: '1px solid #ccc',
                    padding: '4px 6px',
                    textAlign: 'left',
                    verticalAlign: 'top',
                    wordWrap: 'break-word',
                    maxWidth: '120px'
                  };
                  
                  if (cell.error) {
                    cellClass = 'error-cell';
                    cellStyle.backgroundColor = '#ffe6e6';
                    cellStyle.color = '#d32f2f';
                    cellContent = cell.error;
                  } else if (cell.is_formula) {
                    cellClass = 'formula-cell';
                    cellStyle.backgroundColor = '#e8f5e8';
                  } else if (cell.media) {
                    cellClass = 'media-cell';
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
                    <td key={colIndex} className={cellClass} style={cellStyle}>
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
  }, [spreadsheetName, rows, cols, data, getColumnLabel, printArea, getPrintAreaInfo]);

  // Event listener global para prevenir scroll com setas do teclado na planilha
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsSelecting(false);
      setSelectionRange(null);
      setIsSelectingPrintArea(false);
      if (isResizing) {
        addToHistory("Redimensionar", `${isResizing.type === 'col' ? 'Coluna' : 'Linha'} ${isResizing.index + 1} redimensionada`);
        setIsResizing(null);
      }
      if (isResizingImage) {
        addToHistory("Redimensionar Imagem", `Imagem na célula ${getColumnLabel(isResizingImage.col)}${isResizingImage.row + 1} redimensionada`);
        setIsResizingImage(null);
      }
    };

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isResizingImage) {
          setIsResizingImage(null);
          addToHistory("Redimensionar Imagem", "Redimensionamento de imagem cancelado");
        }
        if (isResizing) {
          setIsResizing(null);
          addToHistory("Redimensionar", "Redimensionamento de coluna/linha cancelado");
        }
        // Se o foco estiver na barra de fórmulas e o modal de sugestões estiver aberto, fechar sugestões
        if (formulaBarRef.current === document.activeElement && showSuggestions) {
          setShowSuggestions(false);
        }
      }
      // Verificar se o foco está em uma célula da planilha
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && activeElement.hasAttribute('data-cell')) {
        // Se for uma tecla de seta, prevenir o comportamento padrão
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
          event.preventDefault();
        }
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isResizing, isResizingImage, addToHistory, showSuggestions]);

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
          
          {/* Controles de Zoom */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px', borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>
            <button className={styles["button"]} onClick={zoomOut} title="Diminuir zoom">
              <ZoomOut size={16} />
            </button>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', minWidth: '50px', textAlign: 'center' }}>
              {Math.round(zoomLevel * 100)}%
            </span>
            <button className={styles["button"]} onClick={zoomIn} title="Aumentar zoom">
              <ZoomIn size={16} />
            </button>
            <button className={`${styles["button"]} ${styles["secondary"]}`} onClick={resetZoom} title="Resetar zoom">
              <RotateCw size={16} />
            </button>
          </div>
      
          {typeResponse && typeResponse?.type === "Criar"  && (
                <button className={styles["button"]} onClick={openSaveTemplateModal}>
                 <Save size={16} />
                 Salvar 
              </button>
              )}

                 {typeResponse && typeResponse?.type === "Duplicar"  && (
                <button className={styles["button"]} onClick={openSaveTemplateModal}>
                 <Save size={16} />
                 Salvar 
              </button>
              )}

               {typeResponse && typeResponse?.type === "Editar" && (
                <button className={styles["button"]} onClick={saveTemplate}>
                 <Save size={16} />
                 Salvar Edições
              </button>
              )}
              
          <button className={styles["button"]} onClick={saveAsTemplate}>
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
          
          {/* Botões para área de impressão */}
          {!isPrintAreaMode ? (
            <>
              <button 
                className={`${styles["button"]} ${printArea ? styles["success"] : ''}`} 
                onClick={activatePrintAreaMode}
                title="Selecionar área específica para impressão"
              >
                <Target size={16} />
                {printArea ? 'Alterar Área' : 'Selecionar Área'}
              </button>
              
              {printArea && (
                <button 
                  className={`${styles["button"]} ${styles["secondary"]}`} 
                  onClick={clearPrintArea}
                  title="Remover área de impressão - imprimir planilha completa"
                >
                  <X size={16} />
                  Limpar Área
                </button>
              )}
            </>
          ) : (
            <>
              <button 
                className={`${styles["button"]} ${styles["success"]}`} 
                onClick={confirmPrintArea}
                disabled={!printAreaRange}
                title="Confirmar área selecionada"
              >
                <CheckCircle size={16} />
                Confirmar Área
              </button>
              
              <button 
                className={`${styles["button"]} ${styles["secondary"]}`} 
                onClick={deactivatePrintAreaMode}
                title="Cancelar seleção de área"
              >
                <X size={16} />
                Cancelar
              </button>
            </>
          )}
          
          <button className={styles["button"]} onClick={printSpreadsheet}>
            <Printer size={16} />
            {printArea ? 'Imprimir Área' : 'Imprimir Planilha'}
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

        {/* Indicador de área de impressão */}
        {printArea && (
          <div style={{
            padding: '8px 16px',
            backgroundColor: '#ecfdf5',
            border: '1px solid #10b981',
            borderRadius: '6px',
            margin: '8px 0',
            fontSize: '14px',
            color: '#065f46'
          }}>
            <strong>Área de impressão definida:</strong> {getPrintAreaInfo()}
          </div>
        )}
        {renderUserValidationModal()}
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

                  setShowSuggestions(false);
                }
              }}
              placeholder="Digite um valor ou fórmula (comece com =)"
              disabled={isPrintAreaMode}
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

          {!isPrintAreaMode && (
            <>
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
                  value={currentFontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  disabled={selectedCells.length === 0}
                  title="Tamanho da fonte"
                >
                  <option value="0.5rem">8px</option>
                  <option value="0.625rem">9px</option>
                  <option value="0.75rem">10px</option>
                  <option value="0.8125rem">11px</option>
                  <option value="0.875rem">12px</option>
                  <option value="0.9375rem">13px</option>
                  <option value="1rem">14px</option>
                  <option value="1.0625rem">15px</option>
                  <option value="1.125rem">16px</option>
                  <option value="1.1875rem">17px</option>
                  <option value="1.25rem">18px</option>
                  <option value="1.375rem">19px</option>
                  <option value="1.5rem">20px</option>
                  <option value="1.625rem">22px</option>
                  <option value="1.75rem">24px</option>
                  <option value="1.875rem">26px</option>
                  <option value="2rem">28px</option>
                  <option value="2.25rem">30px</option>
                  <option value="2.5rem">32px</option>
                  <option value="2.75rem">36px</option>
                  <option value="3rem">40px</option>
                  <option value="3.5rem">48px</option>
                  <option value="4rem">56px</option>
                  <option value="4.5rem">64px</option>
                  <option value="5rem">72px</option>
                  <option value="6rem">96px</option>
                </select>
                
                <select 
                  className={styles["format-select"]}
                  value={currentFontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  disabled={selectedCells.length === 0}
                  title="Fonte"
                >
                      <option value="inherit">Padrão</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="'Times New Roman', serif">Times New Roman</option>
                  <option value="'Courier New', monospace">Courier New</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="Verdana, sans-serif">Verdana</option>
                  <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
                  <option value="Helvetica, sans-serif">Helvetica</option>
                  <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                  <option value="'Arial Black', sans-serif">Arial Black</option>
                  <option value="Impact, sans-serif">Impact</option>
                  <option value="'Lucida Console', monospace">Lucida Console</option>
                  <option value="'Palatino Linotype', serif">Palatino Linotype</option>
                  <option value="Tahoma, sans-serif">Tahoma</option>
                  <option value="'Century Gothic', sans-serif">Century Gothic</option>
                  <option value="'Book Antiqua', serif">Book Antiqua</option>
                  <option value="'Arial Narrow', sans-serif">Arial Narrow</option>
                  <option value="'Brush Script MT', cursive">Brush Script MT</option>
                  <option value="Garamond, serif">Garamond</option>
                  <option value="'MS Sans Serif', sans-serif">MS Sans Serif</option>
                  <option value="'Lucida Sans Unicode', sans-serif">Lucida Sans Unicode</option>
                  <option value="Monaco, monospace">Monaco</option>
                  <option value="'Segoe UI', sans-serif">Segoe UI</option>
                  <option value="Calibri, sans-serif">Calibri</option>
                  <option value="Cambria, serif">Cambria</option>
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
                  <TableCellsMerge size={16} />
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
                  <ImageIcon size={16} />
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
            </>
          )}
        </div>
                {/* Modal de Salvar Template */}
        {showSaveTemplateModal && (
          <div className={styles["modal-overlay"]}>
            <div className={styles["modal"]} >
              <div className={styles["modal-header"]}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={20} />
                  Salvar Template
                </h3>
                                <button 
                  className={styles["close-button"]}
                  onClick={() => setShowSaveTemplateModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
                <div className={styles["modal-content"]} style={{ padding: '24px' }}>
                {/* Nome do Arquivo */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Nome do Arquivo:
                  </label>
                  <input
                    type="text"
                    value={saveTemplateData.nomeArquivo}
                    onChange={(e) => setSaveTemplateData(prev => ({ 
                      ...prev, 
                      nomeArquivo: e.target.value,
                      caminhoArquivo: `templates/${e.target.value.replace(/\s+/g, '_').toLowerCase()}.json`
                    }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    placeholder="Digite o nome do arquivo"
                  />
                </div>

                {/* Tipo de Documento */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Tipo de Documento:
                  </label>
                  <select
                    value={saveTemplateData.tipo}
                    onChange={(e) => setSaveTemplateData(prev => ({ 
                      ...prev, 
                      tipo: e.target.value as 'template' | 'planilha_padrao'
                    }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: '#fff'
                    }}
                  >
                    <option value="template">Template</option>
                    <option value="planilha_padrao">Planilha Padrão</option>
                  </select>
                </div>
                                {/* Tags */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Tag:
                  </label>
                  
                  {!isAddingNewTag ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select
                        value={saveTemplateData.tag}
                        onChange={(e) => setSaveTemplateData(prev => ({ ...prev, tag: e.target.value }))}
                        style={{
                          flex: 1,
                          padding: '12px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          backgroundColor: '#fff'
                        }}
                      >
                        <option value="">Selecione uma tag</option>
                        {availableTags.map((tag, index) => (
                          <option key={index} value={tag}>{tag}</option>
                        ))}
                      </select>
                      <button
                        className={styles["button"]}
                        onClick={() => setIsAddingNewTag(true)}
                        style={{ padding: '12px' }}
                        title="Adicionar nova tag"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            addNewTag();
                          } else if (e.key === 'Escape') {
                            setIsAddingNewTag(false);
                            setNewTag('');
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '12px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                        placeholder="Digite uma nova tag"
                        autoFocus
                      />
                      <button
                        className={styles["button"]}
                        onClick={addNewTag}
                        style={{ padding: '12px' }}
                        title="Confirmar nova tag"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        className={`${styles["button"]} ${styles["secondary"]}`}
                        onClick={() => {
                          setIsAddingNewTag(false);
                          setNewTag('');
                        }}
                        style={{ padding: '12px' }}
                        title="Cancelar"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
                                {/* Informações do JSON */}
                <div style={{ 
                  marginBottom: '24px',
                  padding: '16px',
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #0ea5e9',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Info size={16} color="#0ea5e9" />
                    <span style={{ fontWeight: '600', color: '#0c4a6e' }}>
                      Informações do Template
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#0c4a6e' }}>
                    <p style={{ margin: '4px 0' }}>
                      <strong>Planilha:</strong> {spreadsheetName}
                    </p>
                    <p style={{ margin: '4px 0' }}>
                      <strong>Dimensões:</strong> {rows} linhas × {cols} colunas
                    </p>
                    <p style={{ margin: '4px 0' }}>
                      <strong>Tamanho do JSON:</strong> {(saveTemplateData.jsonData.length / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                    <div className={styles["modal-footer"]}>
                <button 
                  className={`${styles["button"]} ${styles["secondary"]}`}
                  onClick={() => setShowSaveTemplateModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  className={styles["button"]}
                  onClick={saveTemplate}
                  disabled={!saveTemplateData.nomeArquivo.trim() || !saveTemplateData.tag.trim()}
                >
                  <Save size={16} />
                  Salvar Template
                </button>
              </div>
              </div>
              
          
            </div>
          </div>
        )}
        


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
            onMouseLeave={handleMouseUp}
           
          >
            <div 
              className={styles["spreadsheet-grid"]}
              style={{
                               gridTemplateColumns: `${rowHeaderWidth}px ${columnWidths.map(w => `${w}px`).join(' ')}`,
                gridTemplateRows: `${columnHeaderHeight}px ${rowHeights.map(h => `${h}px`).join(' ')}`
              }}
            >
              {/* Célula do canto superior esquerdo */}
              <div className={`${styles["cell"]} ${styles["header"]} ${styles["corner"]}`}>
                <div className={styles["position-indicator"]}>
                  {isPrintAreaMode ? (
                    <MousePointer size={16} color="#3b82f6" />
                  ) : (
                    getSelectionInfo()
                  )}
                </div>
              </div>
              
              {/* Headers das colunas */}
              {Array(cols).fill(null).map((_, colIndex) => (
                <div 
                  key={`col-header-${colIndex}`} 
                  className={`${styles["cell"]} ${styles["header"]} ${styles["column-header"]} ${
                    printArea && colIndex >= printArea.startCol && colIndex <= printArea.endCol ? styles["print-area-header"] : ''
                  }`}
                                    style={{ 
                    width: columnWidths[colIndex], 
                    minWidth: columnWidths[colIndex],
                    height: columnHeaderHeight,
                    minHeight: columnHeaderHeight
                  }}
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
                    className={`${styles["cell"]} ${styles["header"]} ${styles["row-header"]} ${
                      printArea && rowIndex >= printArea.startRow && rowIndex <= printArea.endRow ? styles["print-area-header"] : ''
                    }`}
                         style={{ height: rowHeights[rowIndex], minHeight: rowHeights[rowIndex], width: rowHeaderWidth, minWidth: rowHeaderWidth }}
                  >
                    {rowIndex + 1}
                    <div
                      className={`${styles["row-resizer"]} ${isResizing?.type === 'row' && isResizing.index === rowIndex ? styles["resizing"] : ''}`}
                      onMouseDown={(e) => handleMouseDown(e, 'row', rowIndex)}
                    />
                  </div>
                  
                  {/* Células da linha */}
                  {Array(cols).fill(null).map((_, colIndex) => {
                    const cell = data[rowIndex]?.[colIndex];
                    const { shouldRender } = CellMergeUtils.getCellSpan(data, rowIndex, colIndex);
                    
                    if (!shouldRender) {
                      return null;
                    }

                    const isMasterCell = cell?.merged && cell?.masterCell && 
                                       cell.masterCell.row === rowIndex && 
                                       cell.masterCell.col === colIndex;

                    return (
                      <div 
                        key={`cell-${rowIndex}-${colIndex}`} 
                        className={`${styles["cell"]} ${
                          isCellSelected(rowIndex, colIndex) ? styles["selected"] : ''
                        } ${
                          isCellInRange(rowIndex, colIndex) ? styles["in-range"] : ''
                        } ${
                          data[rowIndex]?.[colIndex]?.is_formula ? styles["formula-cell"] : ''
                        } ${
                          isCellInPrintArea(rowIndex, colIndex) ? styles["print-area-cell"] : ''
                        } ${
                          isCellInPrintAreaRange(rowIndex, colIndex) ? styles["print-area-selecting"] : ''
                        } ${
                          draggedImage ? styles["drop-target"] : ''
                        }  ${
                          isMasterCell ? styles["master"] : ''
                        }`}
                        style={getCellStyle(rowIndex, colIndex)}
                        onMouseDown={(e) => handleCellMouseDown(rowIndex, colIndex, e)}
                        onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (draggedImage) {
                            e.currentTarget.style.backgroundColor = '#e0f2fe';
                            e.currentTarget.style.border = '2px dashed #0284c7';
                          }
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (draggedImage) {
                            e.currentTarget.style.backgroundColor = '';
                            e.currentTarget.style.border = '';
                          }
                        }}
                        onDrop={(e) => {
                          handleCellDrop(rowIndex, colIndex, e);
                          e.currentTarget.style.backgroundColor = '';
                          e.currentTarget.style.border = '';
                        }}
                      >
                        {renderCellContent(rowIndex, colIndex)}
                      </div>
                    );
                  })}
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
                <div className={styles["table-config-container"]}>
                  <div className={styles["table-size-section"]}>
                    <h4>Tamanho da Tabela</h4>
                    <div className={styles["size-inputs"]}>
                      <div className={styles["input-group"]}>
                        <label>Linhas:</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={tableConfig.rows}
                          onChange={(e) => setTableConfig(prev => ({ ...prev, rows: parseInt(e.target.value) || 1 }))}
                          className={styles["size-input"]}
                        />
                      </div>
                      <div className={styles["input-group"]}>
                        <label>Colunas:</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={tableConfig.cols}
                          onChange={(e) => setTableConfig(prev => ({ ...prev, cols: parseInt(e.target.value) || 1 }))}
                          className={styles["size-input"]}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles["table-templates-section"]}>
                    <h4>Templates de Estilo</h4>
                    <div className={styles["templates-grid"]}>
                      {tableTemplates.map((template, index) => (
                        <div
                          key={index}
                          className={`${styles["template-preview"]} ${tableConfig.selectedTemplate === index ? styles["selected"] : ''}`}
                          onClick={() => setTableConfig(prev => ({ ...prev, selectedTemplate: index }))}
                        >
                          <div className={styles["template-name"]}>{template.name}</div>
                          <div className={styles["preview-table"]}>
                            <div className={styles["preview-header"]} style={template.headerStyle}>
                              Cabeçalho
                            </div>
                            <div className={styles["preview-row"]} style={template.cellStyle}>
                              Dados
                            </div>
                            <div className={styles["preview-row"]} style={template.alternateRowStyle}>
                              Dados
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className={styles["table-preview-section"]}>
                    <h4>Prévia da Tabela</h4>
                    <div className={styles["table-preview"]}>
                      <table className={styles["preview-full-table"]}>
                        <tbody>
                          {Array(Math.min(tableConfig.rows, 5)).fill(null).map((_, rowIndex) => (
                            <tr key={rowIndex}>
                              {Array(Math.min(tableConfig.cols, 5)).fill(null).map((_, colIndex) => {
                                const template = tableTemplates[tableConfig.selectedTemplate];
                                let cellStyle;
                                
                                if (rowIndex === 0) {
                                  cellStyle = template.headerStyle;
                                } else if (rowIndex % 2 === 0) {
                                  cellStyle = template.cellStyle;
                                } else {
                                  cellStyle = template.alternateRowStyle;
                                }
                                
                                return (
                                  <td key={colIndex} style={cellStyle}>
                                    {rowIndex === 0 ? `Col ${colIndex + 1}` : `R${rowIndex}C${colIndex + 1}`}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {(tableConfig.rows > 5 || tableConfig.cols > 5) && (
                        <p className={styles["preview-note"]}>
                          Mostrando apenas {Math.min(tableConfig.rows, 5)}x{Math.min(tableConfig.cols, 5)} células da tabela {tableConfig.rows}x{tableConfig.cols}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    className={styles["button"]}
                    onClick={() => createTable()}
                  >
                    Criar Tabela
                  </button>
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
      {renderHistoryModal()}


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
                  {printArea 
                    ? `Será impressa apenas a área selecionada: ${getPrintAreaInfo()}`
                    : 'Será impressa a planilha completa.'
                  }
                  {' '}Clique em "Imprimir" para abrir o diálogo de impressão do navegador.
                </p>
              </div>

              <div 
                ref={printContentRef}
                style={{
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  padding: '20px',
                  backgroundColor: '#fff',
                  maxHeight: '60vh',
                  overflow: 'auto'
                }}
              >
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
      
      {/* Modal de Mensagens */}
      {showMessageModal && (
        <div className={styles["modal-overlay"]}>
          <div className={styles["modal-content"]} style={{ maxWidth: '500px' }}>
            <div className={styles.modalHeader}>
              <h3 style={{ 
                display: 'flex', 
                alignItems: 'center', 
                color: messageModal.type === 'success' ? '#198754' : 
                       messageModal.type === 'error' ? '#dc3545' : '#0d6efd'
              }}>
                {messageModal.type === 'success' && <CheckCircle size={20} style={{ marginRight: '8px' }} />}
                {messageModal.type === 'error' && <AlertCircle size={20} style={{ marginRight: '8px' }} />}
                {messageModal.type === 'info' && <Info size={20} style={{ marginRight: '8px' }} />}
                {messageModal.title}
              </h3>
              <button 
                className={styles.closeButton}
                onClick={closeMessageModal}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div style={{
                padding: '20px',
                backgroundColor: messageModal.type === 'success' ? '#d1e7dd' : 
                                 messageModal.type === 'error' ? '#f8d7da' : '#cff4fc',
                border: `1px solid ${messageModal.type === 'success' ? '#badbcc' : 
                                     messageModal.type === 'error' ? '#f5c2c7' : '#b6effb'}`,
                borderRadius: '8px',
                color: messageModal.type === 'success' ? '#0f5132' : 
                       messageModal.type === 'error' ? '#842029' : '#055160',
                fontSize: '16px',
                lineHeight: '1.5'
              }}>
                {messageModal.message}
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              <button 
                className={`${styles.button} ${styles.primaryButton}`}
                onClick={closeMessageModal}
                style={{
                  backgroundColor: messageModal.type === 'success' ? '#198754' : 
                                   messageModal.type === 'error' ? '#dc3545' : '#0d6efd'
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};