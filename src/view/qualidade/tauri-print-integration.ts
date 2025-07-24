// Integração com APIs do Tauri para impressão seletiva
import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';

export interface PrintOptions {
  orientation?: 'portrait' | 'landscape';
  paperSize?: 'A4' | 'A3' | 'Letter' | 'Legal';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  scale?: number;
  printBackground?: boolean;
  headerFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
}

export interface PrintArea {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface CellData {
  value: string;
  computed_value?: string;
  style?: any;
  media?: any;
  is_formula?: boolean;
  error?: string;
}

export class TauriPrintService {
  /**
   * Gera HTML otimizado para impressão com área selecionada
   */
  static generatePrintHTML(
    data: CellData[][],
    printArea: PrintArea | null,
    spreadsheetName: string,
    getColumnLabel: (index: number) => string
  ): string {
    // Determinar área a ser impressa
    let startRow = 0, endRow = data.length - 1, startCol = 0, endCol = data[0]?.length - 1 || 0;
    
    if (printArea) {
      startRow = printArea.startRow;
      endRow = printArea.endRow;
      startCol = printArea.startCol;
      endCol = printArea.endCol;
    }

    const printRows = endRow - startRow + 1;
    const printCols = endCol - startCol + 1;

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Impressão - ${spreadsheetName}</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 1cm;
        }
        
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 12px;
            color: #000;
            background: #fff;
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
            font-weight: bold;
        }
        
        .print-header .meta {
            margin: 5px 0 0 0;
            color: #666;
            font-size: 11px;
        }
        
        .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            table-layout: fixed;
        }
        
        .print-table th,
        .print-table td {
            border: 1px solid #ccc;
            padding: 3px 5px;
            text-align: left;
            vertical-align: top;
            word-wrap: break-word;
            overflow: hidden;
            font-size: 10px;
            line-height: 1.2;
        }
        
        .print-table th {
            background-color: #f5f5f5;
            font-weight: bold;
            text-align: center;
            font-size: 9px;
        }
        
        .print-table .row-header {
            background-color: #f9f9f9;
            font-weight: bold;
            text-align: center;
            width: 30px;
            min-width: 30px;
            max-width: 30px;
        }
        
        .formula-cell {
            background-color: #e8f5e8;
            position: relative;
        }
        
        .formula-cell::before {
            content: 'f';
            position: absolute;
            top: 1px;
            left: 1px;
            font-size: 7px;
            color: #16a34a;
            font-weight: bold;
        }
        
        .error-cell {
            background-color: #ffe6e6;
            color: #d32f2f;
        }
        
        .media-cell {
            background-color: #f0f8ff;
            font-style: italic;
        }
        
        .cell-bold { font-weight: bold; }
        .cell-italic { font-style: italic; }
        .cell-underline { text-decoration: underline; }
        .cell-strikethrough { text-decoration: line-through; }
        .cell-center { text-align: center; }
        .cell-right { text-align: right; }
        
        .print-footer {
            margin-top: 20px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 10px;
        }
        
        /* Otimizações para impressão */
        @media print {
            body { -webkit-print-color-adjust: exact; }
            .print-table { page-break-inside: avoid; }
            .print-table tr { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="print-header">
        <h1>${spreadsheetName}</h1>
        <div class="meta">Impresso em: ${new Date().toLocaleString('pt-BR')}</div>
        <div class="meta">
            ${printArea 
                ? `Área: ${getColumnLabel(startCol)}${startRow + 1}:${getColumnLabel(endCol)}${endRow + 1} (${printRows} × ${printCols})`
                : `Planilha completa (${data.length} × ${data[0]?.length || 0})`
            }
        </div>
    </div>
    
    <table class="print-table">
        <thead>
            <tr>
                <th class="row-header">#</th>
                ${Array(printCols).fill(null).map((_, colIndex) => 
                    `<th style="width: ${Math.max(60, 100 / printCols)}px;">${getColumnLabel(startCol + colIndex)}</th>`
                ).join('')}
            </tr>
        </thead>
        <tbody>
            ${Array(printRows).fill(null).map((_, rowIndex) => {
                const actualRowIndex = startRow + rowIndex;
                return `
                <tr>
                    <td class="row-header">${actualRowIndex + 1}</td>
                    ${Array(printCols).fill(null).map((_, colIndex) => {
                        const actualColIndex = startCol + colIndex;
                        const cell = data[actualRowIndex]?.[actualColIndex];
                        
                        if (!cell) return '<td></td>';
                        
                        let cellContent = cell.computed_value || cell.value || '';
                        let cellClasses = [];
                        let cellStyles = [];
                        
                        // Aplicar classes baseadas no tipo de célula
                        if (cell.error) {
                            cellClasses.push('error-cell');
                            cellContent = cell.error;
                        } else if (cell.is_formula) {
                            cellClasses.push('formula-cell');
                        } else if (cell.media) {
                            cellClasses.push('media-cell');
                            cellContent = `[${cell.media.type.toUpperCase()}] ${cellContent}`;
                        }
                        
                        // Aplicar estilos da célula
                        if (cell.style) {
                            if (cell.style.fontWeight === 'bold') cellClasses.push('cell-bold');
                            if (cell.style.fontStyle === 'italic') cellClasses.push('cell-italic');
                            if (cell.style.textDecoration === 'underline') cellClasses.push('cell-underline');
                            if (cell.style.textDecoration === 'line-through') cellClasses.push('cell-strikethrough');
                            if (cell.style.textAlign === 'center') cellClasses.push('cell-center');
                            if (cell.style.textAlign === 'right') cellClasses.push('cell-right');
                            
                            if (cell.style.backgroundColor) cellStyles.push(`background-color: ${cell.style.backgroundColor}`);
                            if (cell.style.color) cellStyles.push(`color: ${cell.style.color}`);
                            if (cell.style.fontSize) cellStyles.push(`font-size: ${cell.style.fontSize}`);
                        }
                        
                        const classAttr = cellClasses.length > 0 ? ` class="${cellClasses.join(' ')}"` : '';
                        const styleAttr = cellStyles.length > 0 ? ` style="${cellStyles.join('; ')}"` : '';
                        
                        return `<td${classAttr}${styleAttr}>${cellContent}</td>`;
                    }).join('')}
                </tr>`;
            }).join('')}
        </tbody>
    </table>
    
</body>
</html>`;

    return html;
  }

  /**
   * Salva HTML de impressão como arquivo
   */
  static async saveAsHTML(
    data: CellData[][],
    printArea: PrintArea | null,
    spreadsheetName: string,
    getColumnLabel: (index: number) => string
  ): Promise<string | null> {
    try {
      const html = this.generatePrintHTML(data, printArea, spreadsheetName, getColumnLabel);
      
      const filePath = await save({
        filters: [{
          name: 'HTML',
          extensions: ['html']
        }],
        defaultPath: `${spreadsheetName.replace(/\s+/g, '_')}_impressao.html`
      });

      if (filePath) {
        await writeTextFile(filePath, html);
        return filePath;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao salvar HTML:', error);
      throw error;
    }
  }

  /**
   * Gera PDF usando comando Tauri (se disponível)
   */
  static async generatePDF(
    data: CellData[][],
    printArea: PrintArea | null,
    spreadsheetName: string,
    getColumnLabel: (index: number) => string,
    options: PrintOptions = {}
  ): Promise<string | null> {
    try {
      const html = this.generatePrintHTML(data, printArea, spreadsheetName, getColumnLabel);
      
      // Tentar usar comando Tauri personalizado para gerar PDF
      const result = await invoke<{ success: boolean; path?: string; error?: string }>('generate_pdf_from_html', {
        html,
        options: {
          orientation: options.orientation || 'landscape',
          paperSize: options.paperSize || 'A4',
          margins: options.margins || { top: 1, right: 1, bottom: 1, left: 1 },
          scale: options.scale || 1,
          printBackground: options.printBackground !== false,
          ...options
        }
      });

      if (result.success && result.path) {
        return result.path;
      } else {
        throw new Error(result.error || 'Erro ao gerar PDF');
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      // Fallback: salvar como HTML
      return await this.saveAsHTML(data, printArea, spreadsheetName, getColumnLabel);
    }
  }

  /**
   * Imprime usando API nativa do Tauri
   */
  static async printNative(
    data: CellData[][],
    printArea: PrintArea | null,
    spreadsheetName: string,
    getColumnLabel: (index: number) => string,
    options: PrintOptions = {}
  ): Promise<boolean> {
    try {
      const html = this.generatePrintHTML(data, printArea, spreadsheetName, getColumnLabel);
      
      // Tentar usar comando Tauri para impressão nativa
      const result = await invoke<{ success: boolean; error?: string }>('print_html', {
        html,
        options: {
          orientation: options.orientation || 'landscape',
          paperSize: options.paperSize || 'A4',
          margins: options.margins || { top: 1, right: 1, bottom: 1, left: 1 },
          scale: options.scale || 0.8,
          printBackground: options.printBackground !== false,
          ...options
        }
      });

      return result.success;
    } catch (error) {
      console.error('Erro na impressão nativa:', error);
      // Fallback: usar window.print()
      return this.printFallback(data, printArea, spreadsheetName, getColumnLabel);
    }
  }

  /**
   * Fallback para impressão usando window.print()
   */
  static printFallback(
    data: CellData[][],
    printArea: PrintArea | null,
    spreadsheetName: string,
    getColumnLabel: (index: number) => string
  ): boolean {
    try {
      const html = this.generatePrintHTML(data, printArea, spreadsheetName, getColumnLabel);
      
      // Criar janela temporária para impressão
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Não foi possível abrir janela de impressão');
      }

      printWindow.document.write(html);
      printWindow.document.close();
      
      // Aguardar carregamento e imprimir
      printWindow.onload = () => {
        printWindow.print();
        setTimeout(() => printWindow.close(), 1000);
      };

      return true;
    } catch (error) {
      console.error('Erro no fallback de impressão:', error);
      return false;
    }
  }

  /**
   * Exporta área selecionada como CSV
   */
  static async exportAreaAsCSV(
    data: CellData[][],
    printArea: PrintArea | null,
    spreadsheetName: string
  ): Promise<string | null> {
    try {
      let startRow = 0, endRow = data.length - 1, startCol = 0, endCol = data[0]?.length - 1 || 0;
      
      if (printArea) {
        startRow = printArea.startRow;
        endRow = printArea.endRow;
        startCol = printArea.startCol;
        endCol = printArea.endCol;
      }

      const csvContent = [];
      
      for (let r = startRow; r <= endRow; r++) {
        const row = [];
        for (let c = startCol; c <= endCol; c++) {
          const cell = data[r]?.[c];
          let value = cell?.computed_value || cell?.value || '';
          
          // Escapar aspas e vírgulas
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          
          row.push(value);
        }
        csvContent.push(row.join(','));
      }

      const csvText = csvContent.join('\n');
      
      const filePath = await save({
        filters: [{
          name: 'CSV',
          extensions: ['csv']
        }],
        defaultPath: `${spreadsheetName.replace(/\s+/g, '_')}_area.csv`
      });

      if (filePath) {
        await writeTextFile(filePath, csvText);
        return filePath;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      throw error;
    }
  }

  /**
   * Valida área de impressão
   */
  static validatePrintArea(
    printArea: PrintArea,
    maxRows: number,
    maxCols: number
  ): { valid: boolean; error?: string } {
    if (printArea.startRow < 0 || printArea.startCol < 0) {
      return { valid: false, error: 'Área de impressão não pode ter valores negativos' };
    }
    
    if (printArea.endRow >= maxRows || printArea.endCol >= maxCols) {
      return { valid: false, error: 'Área de impressão excede os limites da planilha' };
    }
    
    if (printArea.startRow > printArea.endRow || printArea.startCol > printArea.endCol) {
      return { valid: false, error: 'Área de impressão inválida' };
    }
    
    const cellCount = (printArea.endRow - printArea.startRow + 1) * (printArea.endCol - printArea.startCol + 1);
    if (cellCount > 10000) {
      return { valid: false, error: 'Área de impressão muito grande (máximo 10.000 células)' };
    }
    
    return { valid: true };
  }
}

export default TauriPrintService;

