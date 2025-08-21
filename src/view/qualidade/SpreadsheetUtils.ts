import { invoke } from '@tauri-apps/api/core';

// Interfaces para tipos de dados
export interface CellData {
  value: string;
  id: string;
  formula?: string | null;
  computed_value?: string | null;
  error?: string | null;
  is_formula?: boolean;
  style?: CellStyle;
  media?: CellMedia;
  merged?: boolean;
  masterCell?: { row: number; col: number };
  mergeRange?: { startRow: number; startCol: number; endRow: number; endCol: number };
}

export interface CellStyle {
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

export interface CellMedia {
  type: 'image' | 'video' | 'audio' | 'link' | 'table';
  url?: string;
  data?: string;
  alt?: string;
  title?: string;
  tableData?: string[][];
  x?: number; // Posição X da imagem dentro da célula (em pixels ou porcentagem)
  y?: number; // Posição Y da imagem dentro da célula (em pixels ou porcentagem)
  width?: number; // Largura da imagem (em pixels ou porcentagem)
  height?: number; // Altura da imagem (em pixels ou porcentagem)
}

export interface FormulaResult {
  success: boolean;
  value: string;
  error?: string;
  dependencies: string[];
  formula_type: string;
}

export interface InsertionResult {
  success: boolean;
  error?: string;
  updatedMerges: Array<{
    oldRange: CellRange;
    newRange: CellRange;
    masterCell: CellPosition;
  }>;
  affectedCells: CellPosition[];
}

export interface FormulaSuggestion {
  function_name: string;
  display_text: string;
  description: string;
  insert_text: string;
}

export interface FormulaFunction {
  name: string;
  description: string;
  syntax: string;
  example: string;
  category: string;
}

export interface SpreadsheetData {
  cells: Record<string, {
    value: string;
    formula?: string;
    computed_value?: string;
    error?: string;
    is_formula: boolean;
  }>;
  rows: number;
  cols: number;
}

export interface CellPosition {
  row: number;
  col: number;
}

export interface CellRange {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface MergeResult {
  success: boolean;
  error?: string;
  mergedCells: CellPosition[];
  masterCell: CellPosition;
  mergeRange: CellRange;
}

export interface UndoRedoState {
  data: CellData[][];
  selectedCells: CellPosition[];
  columnWidths: number[];
  rowHeights: number[];
  timestamp: Date;
  action: string;
}

export interface UndoRedoOperation {
  type: 'cell_edit' | 'cell_style' | 'merge' | 'unmerge' | 'insert_row' | 'insert_col' | 'delete_row' | 'delete_col' | 'resize';
  description: string;
  beforeState: any;
  afterState: any;
  affectedCells: CellPosition[];
}

export class UndoRedoUtils {
  /**
   * Cria um snapshot do estado atual da planilha
   */
  static createSnapshot(
    data: CellData[][],
    selectedCells: CellPosition[],
    columnWidths: number[],
    rowHeights: number[],
    action: string
  ): UndoRedoState {
    return {
      data: JSON.parse(JSON.stringify(data)), // Deep copy
      selectedCells: [...selectedCells],
      columnWidths: [...columnWidths],
      rowHeights: [...rowHeights],
      timestamp: new Date(),
      action
    };
  }

  /**
   * Compara dois estados para verificar se são diferentes
   */
  static areStatesDifferent(state1: UndoRedoState, state2: UndoRedoState): boolean {
    // Comparação simples baseada em JSON
    return JSON.stringify(state1.data) !== JSON.stringify(state2.data) ||
           JSON.stringify(state1.columnWidths) !== JSON.stringify(state2.columnWidths) ||
           JSON.stringify(state1.rowHeights) !== JSON.stringify(state2.rowHeights);
  }

  /**
   * Otimiza o stack de undo removendo estados duplicados consecutivos
   */
  static optimizeUndoStack(stack: UndoRedoState[]): UndoRedoState[] {
    if (stack.length <= 1) return stack;

    const optimized: UndoRedoState[] = [stack[0]];
    
    for (let i = 1; i < stack.length; i++) {
      if (this.areStatesDifferent(stack[i], stack[i - 1])) {
        optimized.push(stack[i]);
      }
    }

    return optimized;
  }

  /**
   * Cria uma operação de undo/redo detalhada
   */
  static createOperation(
    type: UndoRedoOperation['type'],
    description: string,
    beforeState: any,
    afterState: any,
    affectedCells: CellPosition[]
  ): UndoRedoOperation {
    return {
      type,
      description,
      beforeState: JSON.parse(JSON.stringify(beforeState)),
      afterState: JSON.parse(JSON.stringify(afterState)),
      affectedCells: [...affectedCells]
    };
  }

  /**
   * Aplica uma operação de undo
   */
  static applyUndo(operation: UndoRedoOperation, data: CellData[][]): CellData[][] {
    const newData = JSON.parse(JSON.stringify(data));
    
    switch (operation.type) {
      case 'cell_edit':
        operation.affectedCells.forEach(pos => {
          if (newData[pos.row] && newData[pos.row][pos.col]) {
            newData[pos.row][pos.col] = { ...operation.beforeState };
          }
        });
        break;
      
      case 'cell_style':
        operation.affectedCells.forEach(pos => {
          if (newData[pos.row] && newData[pos.row][pos.col]) {
            newData[pos.row][pos.col].style = { ...operation.beforeState.style };
          }
        });
        break;
      
      // Adicionar mais casos conforme necessário
      default:
        console.warn(`Tipo de operação não suportado: ${operation.type}`);
    }

    return newData;
  }

  /**
   * Aplica uma operação de redo
   */
  static applyRedo(operation: UndoRedoOperation, data: CellData[][]): CellData[][] {
    const newData = JSON.parse(JSON.stringify(data));
    
    switch (operation.type) {
      case 'cell_edit':
        operation.affectedCells.forEach(pos => {
          if (newData[pos.row] && newData[pos.row][pos.col]) {
            newData[pos.row][pos.col] = { ...operation.afterState };
          }
        });
        break;
      
      case 'cell_style':
        operation.affectedCells.forEach(pos => {
          if (newData[pos.row] && newData[pos.row][pos.col]) {
            newData[pos.row][pos.col].style = { ...operation.afterState.style };
          }
        });
        break;
      
      // Adicionar mais casos conforme necessário
      default:
        console.warn(`Tipo de operação não suportado: ${operation.type}`);
    }

    return newData;
  }
}

// Utilitários para atalhos de teclado
export class KeyboardShortcutUtils {
  /**
   * Verifica se uma combinação de teclas corresponde a um atalho específico
   */
  static isShortcut(event: KeyboardEvent, shortcut: string): boolean {
    const keys = shortcut.toLowerCase().split('+');
    const pressedKeys: string[] = [];

    if (event.ctrlKey) pressedKeys.push('ctrl');
    if (event.shiftKey) pressedKeys.push('shift');
    if (event.altKey) pressedKeys.push('alt');
    if (event.metaKey) pressedKeys.push('meta');
    
    // Adicionar a tecla principal
    if (event.key && event.key !== 'Control' && event.key !== 'Shift' && event.key !== 'Alt' && event.key !== 'Meta') {
      pressedKeys.push(event.key.toLowerCase());
    }

    return keys.every(key => pressedKeys.includes(key)) && keys.length === pressedKeys.length;
  }

  /**
   * Lista de atalhos padrão da planilha
   */
  static getDefaultShortcuts(): Record<string, string> {
    return {
      'ctrl+z': 'Desfazer',
      'ctrl+y': 'Refazer',
      'ctrl+shift+z': 'Refazer',
      'ctrl+enter': 'Confirmar entrada',
      'escape': 'Cancelar/Voltar',
      'ctrl+s': 'Salvar',
      'ctrl+o': 'Abrir',
      'ctrl+n': 'Novo',
      'ctrl+c': 'Copiar',
      'ctrl+v': 'Colar',
      'ctrl+x': 'Recortar',
      'delete': 'Excluir conteúdo',
      'f2': 'Editar célula',
      'enter': 'Confirmar e mover para baixo',
      'tab': 'Mover para direita',
      'shift+tab': 'Mover para esquerda',
      'ctrl+a': 'Selecionar tudo',
      'ctrl+f': 'Localizar',
      'ctrl+h': 'Substituir'
    };
  }

  /**
   * Formata uma descrição de atalho para exibição
   */
  static formatShortcutDisplay(shortcut: string): string {
    return shortcut
      .split('+')
      .map(key => {
        switch (key.toLowerCase()) {
          case 'ctrl': return 'Ctrl';
          case 'shift': return 'Shift';
          case 'alt': return 'Alt';
          case 'meta': return 'Cmd';
          case 'enter': return 'Enter';
          case 'escape': return 'Esc';
          default: return key.toUpperCase();
        }
      })
      .join(' + ');
  }
}

// Utilitários para navegação
export class NavigationUtils {
  /**
   * Calcula a próxima célula baseada na direção
   */
  static getNextCell(
    currentRow: number,
    currentCol: number,
    direction: 'up' | 'down' | 'left' | 'right',
    maxRows: number,
    maxCols: number
  ): CellPosition | null {
    let newRow = currentRow;
    let newCol = currentCol;

    switch (direction) {
      case 'up':
        newRow = Math.max(0, currentRow - 1);
        break;
      case 'down':
        newRow = Math.min(maxRows - 1, currentRow + 1);
        break;
      case 'left':
        newCol = Math.max(0, currentCol - 1);
        break;
      case 'right':
        newCol = Math.min(maxCols - 1, currentCol + 1);
        break;
    }

    // Retornar null se não houve mudança (já está no limite)
    if (newRow === currentRow && newCol === currentCol) {
      return null;
    }

    return { row: newRow, col: newCol };
  }

  /**
   * Encontra a próxima célula não vazia em uma direção
   */
  static findNextNonEmptyCell(
    data: CellData[][],
    startRow: number,
    startCol: number,
    direction: 'up' | 'down' | 'left' | 'right'
  ): CellPosition | null {
    const maxRows = data.length;
    const maxCols = data[0]?.length || 0;
    
    let currentRow = startRow;
    let currentCol = startCol;

    while (true) {
      const nextCell = this.getNextCell(currentRow, currentCol, direction, maxRows, maxCols);
      if (!nextCell) break;

      currentRow = nextCell.row;
      currentCol = nextCell.col;

      const cell = data[currentRow]?.[currentCol];
      if (cell && cell.value.trim() !== '') {
        return { row: currentRow, col: currentCol };
      }
    }

    return null;
  }

  /**
   * Calcula o range de células visíveis baseado no scroll
   */
  static getVisibleCellRange(
    scrollTop: number,
    scrollLeft: number,
    containerHeight: number,
    containerWidth: number,
    rowHeights: number[],
    columnWidths: number[]
  ): CellRange {
    let startRow = 0;
    let endRow = 0;
    let startCol = 0;
    let endCol = 0;

    // Calcular linha inicial
    let currentHeight = 0;
    for (let i = 0; i < rowHeights.length; i++) {
      if (currentHeight + rowHeights[i] > scrollTop) {
        startRow = i;
        break;
      }
      currentHeight += rowHeights[i];
    }

    // Calcular linha final
    currentHeight = 0;
    for (let i = startRow; i < rowHeights.length; i++) {
      currentHeight += rowHeights[i];
      if (currentHeight > scrollTop + containerHeight) {
        endRow = i;
        break;
      }
    }
    if (endRow === 0) endRow = rowHeights.length - 1;

    // Calcular coluna inicial
    let currentWidth = 0;
    for (let i = 0; i < columnWidths.length; i++) {
      if (currentWidth + columnWidths[i] > scrollLeft) {
        startCol = i;
        break;
      }
      currentWidth += columnWidths[i];
    }

    // Calcular coluna final
    currentWidth = 0;
    for (let i = startCol; i < columnWidths.length; i++) {
      currentWidth += columnWidths[i];
      if (currentWidth > scrollLeft + containerWidth) {
        endCol = i;
        break;
      }
    }
    if (endCol === 0) endCol = columnWidths.length - 1;

    return { startRow, startCol, endRow, endCol };
  }
}


// Utilitários para referências de células
export class CellReferenceUtils {
  /**
   * Converte um índice de coluna (0-based) para uma label de coluna (A, B, C, ..., AA, AB, etc.)
   */
  static getColumnLabel(index: number): string {
    let label = '';
    let num = index;
    while (num >= 0) {
      label = String.fromCharCode(65 + (num % 26)) + label;
      num = Math.floor(num / 26) - 1;
    }
    return label;
  }

  /**
   * Converte uma label de coluna para um índice (0-based)
   */
  static getColumnIndex(label: string): number {
    let index = 0;
    for (let i = 0; i < label.length; i++) {
      index = index * 26 + (label.charCodeAt(i) - 64);
    }
    return index - 1;
  }

  /**
   * Gera uma referência de célula (ex: A1, B2, etc.)
   */
  static getCellReference(row: number, col: number): string {
    return `${this.getColumnLabel(col)}${row + 1}`;
  }

  /**
   * Converte uma referência de célula para posição (row, col)
   */
  static parseCellReference(reference: string): CellPosition | null {
    const match = reference.match(/^([A-Z]+)(\d+)$/);
    if (!match) return null;
    
    const colStr = match[1];
    const rowStr = match[2];
    
    const col = this.getColumnIndex(colStr);
    const row = parseInt(rowStr) - 1;
    
    return { row, col };
  }

  /**
   * Verifica se uma string é uma referência de célula válida
   */
  static isValidCellReference(reference: string): boolean {
    return /^[A-Z]+\d+$/.test(reference);
  }

  /**
   * Gera uma lista de referências de células em um intervalo
   */
  static expandRange(range: string): string[] {
    if (!range.includes(':')) {
      return this.isValidCellReference(range) ? [range] : [];
    }

    const [start, end] = range.split(':');
    const startPos = this.parseCellReference(start);
    const endPos = this.parseCellReference(end);

    if (!startPos || !endPos) return [];

    const cells: string[] = [];
    const minRow = Math.min(startPos.row, endPos.row);
    const maxRow = Math.max(startPos.row, endPos.row);
    const minCol = Math.min(startPos.col, endPos.col);
    const maxCol = Math.max(startPos.col, endPos.col);

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        cells.push(this.getCellReference(row, col));
      }
    }

    return cells;
  }

  /**
   * Verifica se uma célula está dentro de um intervalo
   */
  static isCellInRange(cellRef: string, range: string): boolean {
    const expandedRange = this.expandRange(range);
    return expandedRange.includes(cellRef);
  }
}

// Utilitários para fórmulas
export class FormulaUtils {
  /**
   * Verifica se um valor é uma fórmula (começa com =)
   */
  static isFormula(value: string): boolean {
    return typeof value === 'string' && value.trim().startsWith('=');
  }

  /**
   * Remove o prefixo = de uma fórmula
   */
  static cleanFormula(formula: string): string {
    return formula.trim().startsWith('=') ? formula.trim().substring(1) : formula.trim();
  }

  /**
   * Adiciona o prefixo = a uma fórmula se não estiver presente
   */
  static addFormulaPrefix(formula: string): string {
    const cleaned = formula.trim();
    return cleaned.startsWith('=') ? cleaned : `=${cleaned}`;
  }

  /**
   * Extrai referências de células de uma fórmula
   */
  static extractCellReferences(formula: string): string[] {
    const cleanedFormula = this.cleanFormula(formula);
    const cellRefPattern = /[A-Z]+\d+/g;
    const matches = cleanedFormula.match(cellRefPattern) || [];
    return [...new Set(matches)]; // Remove duplicatas
  }

  /**
   * Extrai intervalos de células de uma fórmula
   */
  static extractCellRanges(formula: string): string[] {
    const cleanedFormula = this.cleanFormula(formula);
    const rangePattern = /[A-Z]+\d+:[A-Z]+\d+/g;
    const matches = cleanedFormula.match(rangePattern) || [];
    return [...new Set(matches)]; // Remove duplicatas
  }

  /**
   * Valida a sintaxe básica de uma fórmula
   */
  static validateFormulaSyntax(formula: string): { isValid: boolean; error?: string } {
    const cleanedFormula = this.cleanFormula(formula);
    
    // Verificar parênteses balanceados
    let parenthesesCount = 0;
    for (const char of cleanedFormula) {
      if (char === '(') parenthesesCount++;
      if (char === ')') parenthesesCount--;
      if (parenthesesCount < 0) {
        return { isValid: false, error: 'Parênteses não balanceados' };
      }
    }
    
    if (parenthesesCount !== 0) {
      return { isValid: false, error: 'Parênteses não balanceados' };
    }

    // Verificar se não está vazia
    if (cleanedFormula.trim().length === 0) {
      return { isValid: false, error: 'Fórmula vazia' };
    }

    return { isValid: true };
  }

  /**
   * Substitui referências de células em uma fórmula
   */
  static replaceCellReferences(
    formula: string, 
    replacements: Record<string, string>
  ): string {
    let result = this.cleanFormula(formula);
    
    Object.entries(replacements).forEach(([oldRef, newRef]) => {
      const regex = new RegExp(`\\b${oldRef}\\b`, 'g');
      result = result.replace(regex, newRef);
    });
    
    return result;
  }

   static updateFormulaReferences(
    formula: string,
    insertionType: 'row' | 'column',
    insertionIndex: number
  ): string {
    if (!this.isFormula(formula)) return formula;

    const cleanedFormula = this.cleanFormula(formula);
    let updatedFormula = cleanedFormula;

    // Padrão para encontrar referências de células
    const cellRefPattern = /([A-Z]+)(\d+)/g;
    
    updatedFormula = updatedFormula.replace(cellRefPattern, (colStr, rowStr) => {
      const col = CellReferenceUtils.getColumnIndex(colStr);
      const row = parseInt(rowStr) - 1;

      let newRow = row;
      let newCol = col;

      if (insertionType === 'row' && row >= insertionIndex) {
        newRow = row + 1;
      } else if (insertionType === 'column' && col >= insertionIndex) {
        newCol = col + 1;
      }

      return CellReferenceUtils.getCellReference(newRow, newCol);
    });

    return this.addFormulaPrefix(updatedFormula);
  }
  
  static formatFormulaForDisplay(formula: string): string {
    return this.addFormulaPrefix(formula);
  }
}

// Utilitários para mesclagem de células
export class CellMergeUtils {
  /**
   * Valida se um intervalo de células pode ser mesclado
   */
  static validateMergeRange(
    data: CellData[][],
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number
  ): { isValid: boolean; error?: string } {
    // Verificar se as coordenadas são válidas
    if (startRow < 0 || startCol < 0 || endRow >= data.length || endCol >= data[0].length) {
      return { isValid: false, error: 'Coordenadas fora dos limites da planilha' };
    }

    // Verificar se é um intervalo válido (pelo menos 2 células)
    if (startRow === endRow && startCol === endCol) {
      return { isValid: false, error: 'Selecione pelo menos duas células para mesclar' };
    }

    // Verificar se alguma célula já está mesclada
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const cell = data[row]?.[col];
        if (cell?.merged) {
          return { 
            isValid: false, 
            error: `A célula ${CellReferenceUtils.getCellReference(row, col)} já está mesclada` 
          };
        }
      }
    }

    return { isValid: true };
    
  }

  /**
   * Mescla células em um intervalo especificado
   */
  static mergeCells(
    data: CellData[][],
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number
  ): MergeResult {
    // Normalizar coordenadas (garantir que start <= end)
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);

    // Validar o intervalo
    const validation = this.validateMergeRange(data, minRow, minCol, maxRow, maxCol);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
        mergedCells: [],
        masterCell: { row: minRow, col: minCol },
        mergeRange: { startRow: minRow, startCol: minCol, endRow: maxRow, endCol: maxCol }
      };
    }

    const masterCell = { row: minRow, col: minCol };
    const mergeRange = { startRow: minRow, startCol: minCol, endRow: maxRow, endCol: maxCol };
    const mergedCells: CellPosition[] = [];

    // Coletar valores de todas as células para combinar
    let combinedValue = '';
    let combinedFormula = '';
    let hasFormula = false;
    let masterStyle = data[minRow][minCol]?.style || {};
    let masterMedia = data[minRow][minCol]?.media;

    // Processar todas as células no intervalo
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const cell = data[row][col];
        mergedCells.push({ row, col });

        if (row === minRow && col === minCol) {
          // Célula master - manter seus dados
          combinedValue = cell.computed_value || cell.value || '';
          if (cell.is_formula && cell.formula) {
            combinedFormula = cell.formula;
            hasFormula = true;
          }
        } else {
          // Células secundárias - combinar valores se houver
          const cellValue = cell.computed_value || cell.value || '';
          if (cellValue.trim()) {
            if (combinedValue.trim()) {
              combinedValue += ' ' + cellValue;
            } else {
              combinedValue = cellValue;
            }
          }

          // Se não há fórmula na master cell mas há nesta célula, usar esta fórmula
          if (!hasFormula && cell.is_formula && cell.formula) {
            combinedFormula = cell.formula;
            hasFormula = true;
          }
        }
      }
    }

    // Atualizar as células
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        if (row === minRow && col === minCol) {
          // Célula master
          data[row][col] = {
            ...data[row][col],
            value: hasFormula ? `=${combinedFormula}` : combinedValue,
            formula: hasFormula ? combinedFormula : null,
            computed_value: hasFormula ? data[row][col].computed_value : null,
            is_formula: hasFormula,
            merged: true,
            masterCell: masterCell,
            mergeRange: mergeRange,
            style: masterStyle,
            media: masterMedia
          };
        } else {
          // Células secundárias
          data[row][col] = {
            ...data[row][col],
            value: '',
            formula: null,
            computed_value: null,
            is_formula: false,
            merged: true,
            masterCell: masterCell,
            mergeRange: mergeRange,
            style: {},
            media: undefined
          };
        }
      }
    }

    return {
      success: true,
      mergedCells,
      masterCell,
      mergeRange
    };
  }

  /**
   * Desmescla células
   */
  static unmergeCells(data: CellData[][], row: number, col: number): MergeResult {
    const cell = data[row]?.[col];
    
    if (!cell?.merged) {
      return {
        success: false,
        error: 'A célula selecionada não está mesclada',
        mergedCells: [],
        masterCell: { row, col },
        mergeRange: { startRow: row, startCol: col, endRow: row, endCol: col }
      };
    }

    // Encontrar a célula master e o intervalo de mesclagem
    let masterCell = cell.masterCell || { row, col };
    let mergeRange = cell.mergeRange;

    // Se não temos o range, tentar encontrar baseado na master cell
    if (!mergeRange) {
      const masterCellData = data[masterCell.row]?.[masterCell.col];
      mergeRange = masterCellData?.mergeRange;
    }

    if (!mergeRange) {
      return {
        success: false,
        error: 'Não foi possível encontrar o intervalo de mesclagem',
        mergedCells: [],
        masterCell,
        mergeRange: { startRow: row, startCol: col, endRow: row, endCol: col }
      };
    }

    const { startRow, startCol, endRow, endCol } = mergeRange;
    const unmergedCells: CellPosition[] = [];

    // Desmesclar todas as células no intervalo
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        unmergedCells.push({ row: r, col: c });
        
        if (r === masterCell.row && c === masterCell.col) {
          // Célula master - manter valor original
          data[r][c] = {
            ...data[r][c],
            merged: false,
            masterCell: undefined,
            mergeRange: undefined
          };
        } else {
          // Células secundárias - limpar e tornar independentes
          data[r][c] = {
            ...data[r][c],
            value: '',
            formula: null,
            computed_value: null,
            is_formula: false,
            merged: false,
            masterCell: undefined,
            mergeRange: undefined,
            style: {},
            media: undefined
          };
        }
      }
    }

    return {
      success: true,
      mergedCells: unmergedCells,
      masterCell,
      mergeRange
    };
  }

  /**
   * Verifica se uma célula está mesclada
   */
  static isCellMerged(data: CellData[][], row: number, col: number): boolean {
    const cell = data[row]?.[col];
    return cell?.merged || false;
  }

  /**
   * Obtém informações sobre a mesclagem de uma célula
   */
  static getMergeInfo(data: CellData[][], row: number, col: number): {
    isMerged: boolean;
    isMasterCell: boolean;
    masterCell?: CellPosition;
    mergeRange?: CellRange;
  } {
    const cell = data[row]?.[col];
    
    if (!cell?.merged) {
      return { isMerged: false, isMasterCell: false };
    }

    const masterCell = cell.masterCell || { row, col };
    const isMasterCell = masterCell.row === row && masterCell.col === col;

    return {
      isMerged: true,
      isMasterCell,
      masterCell,
      mergeRange: cell.mergeRange
    };
  }

  /**
   * Obtém todas as células mescladas em uma planilha
   */
  static getAllMergedCells(data: CellData[][]): Array<{
    masterCell: CellPosition;
    mergeRange: CellRange;
    cells: CellPosition[];
  }> {
    const mergedGroups = new Map<string, {
      masterCell: CellPosition;
      mergeRange: CellRange;
      cells: CellPosition[];
    }>();

    data.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell.merged && cell.masterCell && cell.mergeRange) {
          const key = `${cell.masterCell.row}-${cell.masterCell.col}`;
          
          if (!mergedGroups.has(key)) {
            mergedGroups.set(key, {
              masterCell: cell.masterCell,
              mergeRange: cell.mergeRange,
              cells: []
            });
          }
          
          mergedGroups.get(key)!.cells.push({ row: rowIndex, col: colIndex });
        }
      });
    });


    
    return Array.from(mergedGroups.values());
  }

  

  /**
   * Calcula o colspan e rowspan para uma célula mesclada (para renderização HTML)
   */
  static getCellSpan(data: CellData[][], row: number, col: number): {
    colspan: number;
    rowspan: number;
    shouldRender: boolean;
  } {
    const cell = data[row]?.[col];
    
    if (!cell?.merged) {
      return { colspan: 1, rowspan: 1, shouldRender: true };
    }

    const mergeInfo = this.getMergeInfo(data, row, col);
    
    if (!mergeInfo.isMasterCell) {
      // Células secundárias não devem ser renderizadas
      return { colspan: 1, rowspan: 1, shouldRender: false };
    }

    if (!mergeInfo.mergeRange) {
      return { colspan: 1, rowspan: 1, shouldRender: true };
    }

    const { startRow, startCol, endRow, endCol } = mergeInfo.mergeRange;
    const colspan = endCol - startCol + 1;
    const rowspan = endRow - startRow + 1;

    return { colspan, rowspan, shouldRender: true };
  }
}

// Utilitários para avaliação de fórmulas
export class FormulaEvaluationUtils {
  /**
   * Avalia uma fórmula usando o backend
   */
  static async evaluateFormula(
    formula: string, 
    cellData: Record<string, string>
  ): Promise<FormulaResult> {
    try {
      const result = await invoke<FormulaResult>('evaluate_formula', {
        formula: FormulaUtils.addFormulaPrefix(formula),
        cellData
      });
      return result;
    } catch (error) {
      return {
        success: false,
        value: '#ERROR',
        error: `Erro na avaliação: ${error}`,
        dependencies: [],
        formula_type: 'error'
      };
    }
  }

  /**
   * Atualiza uma célula da planilha com fórmula
   */
  static async updateSpreadsheetCell(
    cellRef: string,
    value: string,
    isFormula: boolean,
    spreadsheetData: SpreadsheetData
  ): Promise<{ mainResult: FormulaResult; dependentResults: Array<[string, FormulaResult]> }> {
    try {
      const result = await invoke<[FormulaResult, Array<[string, FormulaResult]>]>(
        'update_spreadsheet_cell',
        {
          cellRef,
          value,
          isFormula,
          spreadsheetData
        }
      );
      
      return {
        mainResult: result[0],
        dependentResults: result[1]
      };
    } catch (error) {
      return {
        mainResult: {
          success: false,
          value: '#ERROR',
          error: `Erro na atualização: ${error}`,
          dependencies: [],
          formula_type: 'error'
        },
        dependentResults: []
      };
    }
  }

  /**
   * Valida uma fórmula sem executá-la
   */
  static async validateFormula(formula: string): Promise<FormulaResult> {
    try {
      const result = await invoke<FormulaResult>('validate_formula', {
        formula: FormulaUtils.addFormulaPrefix(formula)
      });
      return result;
    } catch (error) {
      return {
        success: false,
        value: '#ERROR',
        error: `Erro na validação: ${error}`,
        dependencies: [],
        formula_type: 'error'
      };
    }
  }

  /**
   * Obtém sugestões de fórmulas
   */
  static async getFormulaSuggestions(partialFormula: string): Promise<FormulaSuggestion[]> {
    try {
      const suggestions = await invoke<FormulaSuggestion[]>('get_formula_suggestions', {
        partialFormula
      });
      return suggestions;
    } catch (error) {
      console.error('Erro ao obter sugestões:', error);
      return [];
    }
  }

  /**
   * Obtém todas as funções de fórmula disponíveis
   */
  static async getAllFormulaFunctions(): Promise<FormulaFunction[]> {
    try {
      const functions = await invoke<FormulaFunction[]>('get_all_formula_functions');
      return functions;
    } catch (error) {
      console.error('Erro ao obter funções:', error);
      return [];
    }
  }

  /**
   * Obtém categorias de fórmulas
   */
  static async getFormulaCategories(): Promise<string[]> {
    try {
      const categories = await invoke<string[]>('get_formula_categories');
      return categories;
    } catch (error) {
      console.error('Erro ao obter categorias:', error);
      return [];
    }
  }

  /**
   * Obtém funções por categoria
   */
  static async getFunctionsByCategory(category: string): Promise<FormulaFunction[]> {
    try {
      const functions = await invoke<FormulaFunction[]>('get_functions_by_category', {
        category
      });
      return functions;
    } catch (error) {
      console.error('Erro ao obter funções por categoria:', error);
      return [];
    }
  }

  /**
   * Calcula a soma de um intervalo
   */
  static async calculateRangeSum(
    range: string, 
    cellData: Record<string, string>
  ): Promise<FormulaResult> {
    try {
      const result = await invoke<FormulaResult>('calculate_range_sum', {
        range,
        cellData
      });
      return result;
    } catch (error) {
      return {
        success: false,
        value: '#ERROR',
        error: `Erro no cálculo: ${error}`,
        dependencies: [],
        formula_type: 'error'
      };
    }
  }

  /**
   * Obtém dependências de uma célula
   */
  static async getCellDependencies(
    cellRef: string, 
    spreadsheetData: SpreadsheetData
  ): Promise<string[]> {
    try {
      const dependencies = await invoke<string[]>('get_cell_dependencies', {
        cellRef,
        spreadsheetData
      });
      return dependencies;
    } catch (error) {
      console.error('Erro ao obter dependências:', error);
      return [];
    }
  }

  /**
   * Formata o resultado de uma fórmula
   */
  static async formatFormulaResult(value: string, formatType: string): Promise<string> {
    try {
      const formatted = await invoke<string>('format_formula_result', {
        value,
        formatType
      });
      return formatted;
    } catch (error) {
      console.error('Erro ao formatar resultado:', error);
      return value;
    }
  }
}

// Utilitários para manipulação de dados da planilha
export class SpreadsheetDataUtils {
  /**
   * Converte dados de células para o formato esperado pelo backend
   */
  static convertCellDataForBackend(data: CellData[][]): Record<string, string> {
    const cellData: Record<string, string> = {};
    
    data.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const cellRef = CellReferenceUtils.getCellReference(rowIndex, colIndex);
        cellData[cellRef] = cell.computed_value || cell.value || '';
      });
    });
    
    return cellData;
  }

  /**
   * Converte dados de células para SpreadsheetData
   */
  static convertToSpreadsheetData(data: CellData[][], rows: number, cols: number): SpreadsheetData {
    const cells: Record<string, any> = {};
    
    data.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const cellRef = CellReferenceUtils.getCellReference(rowIndex, colIndex);
        cells[cellRef] = {
          value: cell.value || '',
          formula: cell.formula || undefined,
          computed_value: cell.computed_value || undefined,
          error: cell.error || undefined,
          is_formula: cell.is_formula || false
        };
      });
    });
    
    return { cells, rows, cols };
  }

  /**
   * Atualiza dados da planilha com resultados de fórmulas
   */
  static updateDataWithFormulaResults(
    data: CellData[][],
    mainResult: FormulaResult,
    dependentResults: Array<[string, FormulaResult]>,
    targetRow: number,
    targetCol: number
  ): CellData[][] {
    const newData = data.map(row => [...row]);
    
    // Atualizar célula principal
    if (newData[targetRow] && newData[targetRow][targetCol]) {
      newData[targetRow][targetCol] = {
        ...newData[targetRow][targetCol],
        computed_value: mainResult.value,
        error: mainResult.error || null
      };
    }
    
    // Atualizar células dependentes
    dependentResults.forEach(([cellRef, result]) => {
      const position = CellReferenceUtils.parseCellReference(cellRef);
      if (position && newData[position.row] && newData[position.row][position.col]) {
        newData[position.row][position.col] = {
          ...newData[position.row][position.col],
          computed_value: result.value,
          error: result.error || null
        };
      }
    });
    
    return newData;
  }

  /**
   * Encontra todas as células que contêm fórmulas
   */
  static findFormulaCells(data: CellData[][]): Array<{ row: number; col: number; formula: string }> {
    const formulaCells: Array<{ row: number; col: number; formula: string }> = [];
    
    data.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell.is_formula && cell.formula) {
          formulaCells.push({
            row: rowIndex,
            col: colIndex,
            formula: cell.formula
          });
        }
      });
    });
    
    return formulaCells;
  }

  /**
   * Recalcula todas as fórmulas na planilha
   */
  static async recalculateAllFormulas(data: CellData[][], rows: number, cols: number): Promise<CellData[][]> {
    const formulaCells = this.findFormulaCells(data);
    let newData = data.map(row => [...row]);
    
    for (const { row, col, formula } of formulaCells) {
      try {
        const spreadsheetData = this.convertToSpreadsheetData(newData, rows, cols);
        
        const result = await FormulaEvaluationUtils.updateSpreadsheetCell(
          CellReferenceUtils.getCellReference(row, col),
          formula,
          true,
          spreadsheetData
        );
        
        newData = this.updateDataWithFormulaResults(
          newData,
          result.mainResult,
          result.dependentResults,
          row,
          col
        );
      } catch (error) {
        console.error(`Erro ao recalcular fórmula em ${CellReferenceUtils.getCellReference(row, col)}:`, error);
        newData[row][col] = {
          ...newData[row][col],
          error: `Erro: ${error}`,
          computed_value: '#ERROR'
        };
      }
    }
    
    return newData;
  }

  /**
   * Limpa erros de fórmulas
   */
  static clearFormulaErrors(data: CellData[][]): CellData[][] {
    return data.map(row =>
      row.map(cell => ({
        ...cell,
        error: null
      }))
    );
  }

  /**
   * Obtém estatísticas da planilha
   */
  static getSpreadsheetStats(data: CellData[][]): {
    totalCells: number;
    filledCells: number;
    formulaCells: number;
    errorCells: number;
    mergedCells: number;
  } {
    let totalCells = 0;
    let filledCells = 0;
    let formulaCells = 0;
    let errorCells = 0;
    let mergedCells = 0;
    
    data.forEach(row => {
      row.forEach(cell => {
        totalCells++;
        if (cell.value || cell.computed_value) filledCells++;
        if (cell.is_formula) formulaCells++;
        if (cell.error) errorCells++;
        if (cell.merged) mergedCells++;
      });
    });
    
    return { totalCells, filledCells, formulaCells, errorCells, mergedCells };
  }
}

// Utilitários para formatação
export class SpreadsheetOperationUtils {
  /**
   * Insere uma nova coluna em uma posição específica (compatível com merge)
   */
  static insertColumn(
    data: CellData[][],
    columnWidths: number[],
    insertIndex: number,
    defaultWidth: number = 100
  ): {
    newData: CellData[][];
    newColumnWidths: number[];
  } {
    // Primeiro, ajustar as referências de merge
    const adjustedData = this.adjustMergeReferencesForColumnInsert(data, insertIndex);
    
    const newData = adjustedData.map((row, rowIndex) => {
      const newRow = [...row];
      
      // Inserir nova célula vazia na posição especificada
      const newCell: CellData = {
        value: '',
        id: `cell-${rowIndex}-${insertIndex}`,
        formula: null,
        computed_value: null,
        error: null,
        is_formula: false,
        style: {},
        merged: false
      };
      
      newRow.splice(insertIndex, 0, newCell);
      
      // Atualizar IDs das células após a inserção
      return newRow.map((cell, colIndex) => ({
        ...cell,
        id: `cell-${rowIndex}-${colIndex}`
      }));
    });

    const newColumnWidths = [...columnWidths];
    newColumnWidths.splice(insertIndex, 0, defaultWidth);

    return { newData, newColumnWidths };
  }

  /**
   * Remove uma coluna em uma posição específica (compatível com merge)
   */
  static removeColumn(
    data: CellData[][],
    columnWidths: number[],
    removeIndex: number
  ): {
    newData: CellData[][];
    newColumnWidths: number[];
    warnings: string[];
  } {
    const warnings: string[] = [];
    
    // Verificar se a coluna a ser removida contém células mescladas
    const mergeConflicts = this.checkColumnMergeConflicts(data, removeIndex);
    if (mergeConflicts.length > 0) {
      // Desmesclar células que seriam afetadas
      const unmergedData = this.handleMergeConflictsForColumnRemoval(data, removeIndex);
      warnings.push(...mergeConflicts.map(conflict => 
        `Células mescladas em ${conflict.range} foram desmescladas devido à remoção da coluna`
      ));
      data = unmergedData;
    }

    // Ajustar referências de merge antes da remoção
    const adjustedData = this.adjustMergeReferencesForColumnRemoval(data, removeIndex);
    
    const newData = adjustedData.map((row, rowIndex) => {
      const newRow = [...row];
      newRow.splice(removeIndex, 1);
      
      // Atualizar IDs das células após a remoção
      return newRow.map((cell, colIndex) => ({
        ...cell,
        id: `cell-${rowIndex}-${colIndex}`
      }));
    });

    const newColumnWidths = [...columnWidths];
    newColumnWidths.splice(removeIndex, 1);

    return { newData, newColumnWidths, warnings };
  }

  /**
   * Insere uma nova linha em uma posição específica (compatível com merge)
   */
  static insertRow(
    data: CellData[][],
    rowHeights: number[],
    insertIndex: number,
    cols: number,
    defaultHeight: number = 32
  ): {
    newData: CellData[][];
    newRowHeights: number[];
  } {
    // Primeiro, ajustar as referências de merge
    const adjustedData = this.adjustMergeReferencesForRowInsert(data, insertIndex);
    
    const newData = [...adjustedData];
    const newRow = Array(cols).fill(null).map((_, colIndex) => ({
      value: '',
      id: `cell-${insertIndex}-${colIndex}`,
      formula: null,
      computed_value: null,
      error: null,
      is_formula: false,
      style: {},
      merged: false
    }));
    
    newData.splice(insertIndex, 0, newRow);
    
    // Atualizar IDs das células após a inserção
    const updatedData = newData.map((row, rowIndex) => 
      row.map((cell, colIndex) => ({
        ...cell,
        id: `cell-${rowIndex}-${colIndex}`
      }))
    );

    const newRowHeights = [...rowHeights];
    newRowHeights.splice(insertIndex, 0, defaultHeight);

    return { newData: updatedData, newRowHeights };
  }

  /**
   * Remove uma linha em uma posição específica (compatível com merge)
   */
  static removeRow(
    data: CellData[][],
    rowHeights: number[],
    removeIndex: number
  ): {
    newData: CellData[][];
    newRowHeights: number[];
    warnings: string[];
  } {
    const warnings: string[] = [];
    
    // Verificar se a linha a ser removida contém células mescladas
    const mergeConflicts = this.checkRowMergeConflicts(data, removeIndex);
    if (mergeConflicts.length > 0) {
      // Desmesclar células que seriam afetadas
      const unmergedData = this.handleMergeConflictsForRowRemoval(data, removeIndex);
      warnings.push(...mergeConflicts.map(conflict => 
        `Células mescladas em ${conflict.range} foram desmescladas devido à remoção da linha`
      ));
      data = unmergedData;
    }

    // Ajustar referências de merge antes da remoção
    const adjustedData = this.adjustMergeReferencesForRowRemoval(data, removeIndex);
    
    const newData = [...adjustedData];
    newData.splice(removeIndex, 1);
    
    // Atualizar IDs das células após a remoção
    const updatedData = newData.map((row, rowIndex) => 
      row.map((cell, colIndex) => ({
        ...cell,
        id: `cell-${rowIndex}-${colIndex}`
      }))
    );

    const newRowHeights = [...rowHeights];
    newRowHeights.splice(removeIndex, 1);

    return { newData: updatedData, newRowHeights, warnings };
  }

  /**
   * Ajusta referências de merge quando uma coluna é inserida
   */
  private static adjustMergeReferencesForColumnInsert(
    data: CellData[][],
    insertIndex: number
  ): CellData[][] {
    return data.map(row =>
      row.map(cell => {
        if (!cell.merged || !cell.mergeRange || !cell.masterCell) {
          return cell;
        }

        const newMergeRange = { ...cell.mergeRange };
        const newMasterCell = { ...cell.masterCell };

        // Ajustar startCol e endCol se necessário
        if (cell.mergeRange.startCol >= insertIndex) {
          newMergeRange.startCol++;
        }
        if (cell.mergeRange.endCol >= insertIndex) {
          newMergeRange.endCol++;
        }

        // Ajustar masterCell col se necessário
        if (cell.masterCell.col >= insertIndex) {
          newMasterCell.col++;
        }

        return {
          ...cell,
          mergeRange: newMergeRange,
          masterCell: newMasterCell
        };
      })
    );
  }

  /**
   * Ajusta referências de merge quando uma coluna é removida
   */
  private static adjustMergeReferencesForColumnRemoval(
    data: CellData[][],
    removeIndex: number
  ): CellData[][] {
    return data.map(row =>
      row.map(cell => {
        if (!cell.merged || !cell.mergeRange || !cell.masterCell) {
          return cell;
        }

        const newMergeRange = { ...cell.mergeRange };
        const newMasterCell = { ...cell.masterCell };

        // Ajustar startCol e endCol se necessário
        if (cell.mergeRange.startCol > removeIndex) {
          newMergeRange.startCol--;
        }
        if (cell.mergeRange.endCol > removeIndex) {
          newMergeRange.endCol--;
        }

        // Ajustar masterCell col se necessário
        if (cell.masterCell.col > removeIndex) {
          newMasterCell.col--;
        }

        return {
          ...cell,
          mergeRange: newMergeRange,
          masterCell: newMasterCell
        };
      })
    );
  }

  /**
   * Ajusta referências de merge quando uma linha é inserida
   */
  private static adjustMergeReferencesForRowInsert(
    data: CellData[][],
    insertIndex: number
  ): CellData[][] {
    return data.map(row =>
      row.map(cell => {
        if (!cell.merged || !cell.mergeRange || !cell.masterCell) {
          return cell;
        }

        const newMergeRange = { ...cell.mergeRange };
        const newMasterCell = { ...cell.masterCell };

        // Ajustar startRow e endRow se necessário
        if (cell.mergeRange.startRow >= insertIndex) {
          newMergeRange.startRow++;
        }
        if (cell.mergeRange.endRow >= insertIndex) {
          newMergeRange.endRow++;
        }

        // Ajustar masterCell row se necessário
        if (cell.masterCell.row >= insertIndex) {
          newMasterCell.row++;
        }

        return {
          ...cell,
          mergeRange: newMergeRange,
          masterCell: newMasterCell
        };
      })
    );
  }

  /**
   * Ajusta referências de merge quando uma linha é removida
   */
  private static adjustMergeReferencesForRowRemoval(
    data: CellData[][],
    removeIndex: number
  ): CellData[][] {
    return data.map(row =>
      row.map(cell => {
        if (!cell.merged || !cell.mergeRange || !cell.masterCell) {
          return cell;
        }

        const newMergeRange = { ...cell.mergeRange };
        const newMasterCell = { ...cell.masterCell };

        // Ajustar startRow e endRow se necessário
        if (cell.mergeRange.startRow > removeIndex) {
          newMergeRange.startRow--;
        }
        if (cell.mergeRange.endRow > removeIndex) {
          newMergeRange.endRow--;
        }

        // Ajustar masterCell row se necessário
        if (cell.masterCell.row > removeIndex) {
          newMasterCell.row--;
        }

        return {
          ...cell,
          mergeRange: newMergeRange,
          masterCell: newMasterCell
        };
      })
    );
  }

  /**
   * Verifica conflitos de merge ao remover uma coluna
   */
  private static checkColumnMergeConflicts(
    data: CellData[][],
    removeIndex: number
  ): Array<{ range: string; mergeRange: any }> {
    const conflicts: Array<{ range: string; mergeRange: any }> = [];
    const processedMerges = new Set<string>();

    data.forEach((row) => {
      row.forEach((cell) => {
        if (cell.merged && cell.mergeRange && cell.masterCell) {
          const mergeKey = `${cell.masterCell.row}-${cell.masterCell.col}`;
          
          if (!processedMerges.has(mergeKey)) {
            processedMerges.add(mergeKey);
            
            const { startCol, endCol, startRow, endRow } = cell.mergeRange;
            
            // Verificar se o merge cruza a coluna a ser removida
            if (startCol <= removeIndex && endCol >= removeIndex) {
              conflicts.push({
                range: `${this.getColumnLabel(startCol)}${startRow + 1}:${this.getColumnLabel(endCol)}${endRow + 1}`,
                mergeRange: cell.mergeRange
              });
            }
          }
        }
      });
    });

    return conflicts;
  }

  /**
   * Verifica conflitos de merge ao remover uma linha
   */
  private static checkRowMergeConflicts(
    data: CellData[][],
    removeIndex: number
  ): Array<{ range: string; mergeRange: any }> {
    const conflicts: Array<{ range: string; mergeRange: any }> = [];
    const processedMerges = new Set<string>();

    data.forEach((row) => {
      row.forEach((cell) => {
        if (cell.merged && cell.mergeRange && cell.masterCell) {
          const mergeKey = `${cell.masterCell.row}-${cell.masterCell.col}`;
          
          if (!processedMerges.has(mergeKey)) {
            processedMerges.add(mergeKey);
            
            const { startCol, endCol, startRow, endRow } = cell.mergeRange;
            
            // Verificar se o merge cruza a linha a ser removida
            if (startRow <= removeIndex && endRow >= removeIndex) {
              conflicts.push({
                range: `${this.getColumnLabel(startCol)}${startRow + 1}:${this.getColumnLabel(endCol)}${endRow + 1}`,
                mergeRange: cell.mergeRange
              });
            }
          }
        }
      });
    });

    return conflicts;
  }

  /**
   * Desmescla células afetadas pela remoção de uma coluna
   */
  private static handleMergeConflictsForColumnRemoval(
    data: CellData[][],
    removeIndex: number
  ): CellData[][] {
    const newData = data.map(row => row.map(cell => ({ ...cell })));
    
    // Encontrar e desmesclar células afetadas
    const processedMerges = new Set<string>();
    
    newData.forEach((row) => {
      row.forEach((cell) => {
        if (cell.merged && cell.mergeRange && cell.masterCell) {
          const mergeKey = `${cell.masterCell.row}-${cell.masterCell.col}`;
          
          if (!processedMerges.has(mergeKey)) {
            processedMerges.add(mergeKey);
            
            const { startCol, endCol, startRow, endRow } = cell.mergeRange;
            
            // Se o merge cruza a coluna a ser removida, desmesclar
            if (startCol <= removeIndex && endCol >= removeIndex) {
              this.unmergeCellsInRange(newData, startRow, startCol, endRow, endCol);
            }
          }
        }
      });
    });

    return newData;
  }

  /**
   * Desmescla células afetadas pela remoção de uma linha
   */
  private static handleMergeConflictsForRowRemoval(
    data: CellData[][],
    removeIndex: number
  ): CellData[][] {
    const newData = data.map(row => row.map(cell => ({ ...cell })));
    
    // Encontrar e desmesclar células afetadas
    const processedMerges = new Set<string>();
    
    newData.forEach((row) => {
      row.forEach((cell) => {
        if (cell.merged && cell.mergeRange && cell.masterCell) {
          const mergeKey = `${cell.masterCell.row}-${cell.masterCell.col}`;
          
          if (!processedMerges.has(mergeKey)) {
            processedMerges.add(mergeKey);
            
            const { startCol, endCol, startRow, endRow } = cell.mergeRange;
            
            // Se o merge cruza a linha a ser removida, desmesclar
            if (startRow <= removeIndex && endRow >= removeIndex) {
              this.unmergeCellsInRange(newData, startRow, startCol, endRow, endCol);
            }
          }
        }
      });
    });

    return newData;
  }

  /**
   * Desmescla células em um intervalo específico
   */
  private static unmergeCellsInRange(
    data: CellData[][],
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number
  ): void {
    // Encontrar a célula master
    const masterCell = data[startRow]?.[startCol];
    if (!masterCell) return;

    // Preservar o valor da célula master
    const masterValue = masterCell.value;
    const masterFormula = masterCell.formula;
    const masterComputedValue = masterCell.computed_value;
    const masterIsFormula = masterCell.is_formula;
    const masterStyle = masterCell.style;
    const masterMedia = masterCell.media;

    // Desmesclar todas as células no intervalo
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        if (data[row]?.[col]) {
          if (row === startRow && col === startCol) {
            // Célula master - manter dados mas remover merge
            data[row][col] = {
              ...data[row][col],
              value: masterValue,
              formula: masterFormula,
              computed_value: masterComputedValue,
              is_formula: masterIsFormula,
              style: masterStyle,
              media: masterMedia,
              merged: false,
              masterCell: undefined,
              mergeRange: undefined
            };
          } else {
            // Células secundárias - limpar
            data[row][col] = {
              ...data[row][col],
              value: '',
              formula: null,
              computed_value: null,
              is_formula: false,
              merged: false,
              masterCell: undefined,
              mergeRange: undefined,
              style: {},
              media: undefined
            };
          }
        }
      }
    }
  }

  /**
   * Converte índice de coluna para label (A, B, C, ...)
   */
  private static getColumnLabel(index: number): string {
    let result = '';
    let num = index;
    
    while (num >= 0) {
      result = String.fromCharCode(65 + (num % 26)) + result;
      num = Math.floor(num / 26) - 1;
    }
    
    return result;
  }

  /**
   * Valida se uma operação de inserção/remoção é possível
   */
  static validateOperation(
    operation: 'insert' | 'remove',
    type: 'row' | 'column',
    index: number,
    currentCount: number
  ): { isValid: boolean; error?: string } {
    if (operation === 'remove' && currentCount <= 1) {
      return {
        isValid: false,
        error: `Não é possível remover a última ${type === 'row' ? 'linha' : 'coluna'}`
      };
    }

    if (index < 0 || (operation === 'remove' && index >= currentCount)) {
      return {
        isValid: false,
        error: `Índice ${index} fora dos limites`
      };
    }

    if (operation === 'insert' && index > currentCount) {
      return {
        isValid: false,
        error: `Índice de inserção ${index} fora dos limites`
      };
    }

    return { isValid: true };
  }

  /**
   * Atualiza referências de células em fórmulas após inserção/remoção
   */
  static updateCellReferences(
    data: CellData[][],

  ): CellData[][] {
    return data.map(row =>
      row.map(cell => {
        if (!cell.formula || !cell.is_formula) return cell;

        // Aqui você pode implementar a lógica para atualizar referências
        // Por exemplo, se inserir uma coluna na posição 2, todas as referências
        // para colunas >= 2 devem ser incrementadas
        
        // Esta é uma implementação simplificada
        let updatedFormula = cell.formula;
        
        // TODO: Implementar lógica completa de atualização de referências
        // Isso requereria parsing da fórmula e atualização das referências
        
        return {
          ...cell,
          formula: updatedFormula
        };
      })
    );
  }
}
// Utilitários para fórmulas (mantidos do arquivo original)
export class FormattingUtils {
  /**
   * Formatos de número predefinidos
   */
  static readonly NUMBER_FORMATS = {
    GENERAL: 'general',
    NUMBER: 'number',
    CURRENCY: 'currency',
    PERCENTAGE: 'percentage',
    DECIMAL_2: 'decimal_2',
    DECIMAL_4: 'decimal_4',
    SCIENTIFIC: 'scientific'
  };

  /**
   * Aplica formatação a um valor
   */
  static async formatValue(value: string, format: string): Promise<string> {
    return await FormulaEvaluationUtils.formatFormulaResult(value, format);
  }

  /**
   * Detecta o tipo de valor automaticamente
   */
  static detectValueType(value: string): 'number' | 'text' | 'boolean' | 'date' | 'formula' {
    if (FormulaUtils.isFormula(value)) return 'formula';
    if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') return 'boolean';
    if (!isNaN(Number(value)) && value.trim() !== '') return 'number';
    if (this.isDateString(value)) return 'date';
    return 'text';
  }

  /**
   * Verifica se uma string representa uma data
   */
  static isDateString(value: string): boolean {
    const date = new Date(value);
    return !isNaN(date.getTime()) && value.includes('/') || value.includes('-');
  }

  /**
   * Formata um número como moeda brasileira
   */
  static formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  /**
   * Formata um número como porcentagem
   */
  static formatPercentage(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 2
    }).format(value / 100);
  }
}



// Exportar todas as classes como um objeto padrão
export default {
  CellReferenceUtils,
  FormulaUtils,
  CellMergeUtils,
  FormulaEvaluationUtils,
  SpreadsheetDataUtils,
  FormattingUtils,
  SpreadsheetOperationUtils
};