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
}

export interface FormulaResult {
  success: boolean;
  value: string;
  error?: string;
  dependencies: string[];
  formula_type: string;
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

  /**
   * Converte uma fórmula para formato de exibição
   */
  static formatFormulaForDisplay(formula: string): string {
    return this.addFormulaPrefix(formula);
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
        const cellData = this.convertCellDataForBackend(newData);
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
  } {
    let totalCells = 0;
    let filledCells = 0;
    let formulaCells = 0;
    let errorCells = 0;
    
    data.forEach(row => {
      row.forEach(cell => {
        totalCells++;
        if (cell.value || cell.computed_value) filledCells++;
        if (cell.is_formula) formulaCells++;
        if (cell.error) errorCells++;
      });
    });
    
    return { totalCells, filledCells, formulaCells, errorCells };
  }
}

// Utilitários para formatação
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
  FormulaEvaluationUtils,
  SpreadsheetDataUtils,
  FormattingUtils
};
