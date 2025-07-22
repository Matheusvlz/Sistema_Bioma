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

interface CellData {
  value: string;
  id: string;
  formula?: string | null;
  style?: CellStyle;
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
  createdAt?: string;
  version?: string;
  metadata?: {
    author?: string;
    description?: string;
    tags?: string[];
    lastModified?: string;
  };
}

interface CSVImportOptions {
  delimiter?: string;
  quote?: string;
  escape?: string;
  skipEmptyLines?: boolean;
  trimWhitespace?: boolean;
  hasHeader?: boolean;
}

interface CSVExportOptions {
  delimiter?: string;
  quote?: string;
  includeHeaders?: boolean;
  dateFormat?: string;
}

// Utilitários para manipulação de dados da planilha

export const createEmptySpreadsheet = (rows: number, cols: number): CellData[][] => {
  return Array(rows).fill(null).map((_, rowIndex) =>
    Array(cols).fill(null).map((_, colIndex) => ({
      value: "",
      id: `cell-${rowIndex}-${colIndex}`,
      formula: null,
      style: {}
    }))
  );
};

export const getColumnLabel = (index: number): string => {
  let label = "";
  let num = index;
  while (num >= 0) {
    label = String.fromCharCode(65 + (num % 26)) + label;
    num = Math.floor(num / 26) - 1;
  }
  return label;
};

export const getCellReference = (rowIndex: number, colIndex: number): string => {
  return `${getColumnLabel(colIndex)}${rowIndex + 1}`;
};

export const validateSpreadsheetData = (data: any): data is CellData[][] => {
  if (!Array.isArray(data)) return false;
  
  return data.every(row => 
    Array.isArray(row) && 
    row.every(cell => 
      typeof cell === "object" && 
      cell !== null && 
      typeof cell.value === "string" &&
      typeof cell.id === "string"
    )
  );
};

export const exportToJSON = (spreadsheetData: SpreadsheetData): string => {
  const template: SpreadsheetData = {
    name: spreadsheetData.name,
    rows: spreadsheetData.rows,
    cols: spreadsheetData.cols,
    data: spreadsheetData.data,
    history: spreadsheetData.history,
    columnWidths: spreadsheetData.columnWidths,
    rowHeights: spreadsheetData.rowHeights,
    globalStyles: spreadsheetData.globalStyles,
    createdAt: spreadsheetData.createdAt || new Date().toISOString(),
    version: "2.0",
    metadata: {
      ...spreadsheetData.metadata,
      lastModified: new Date().toISOString()
    }
  };

  return JSON.stringify(template, null, 2);
};

export const importFromJSON = (jsonString: string): { success: boolean; data?: SpreadsheetData; error?: string } => {
  try {
    const template: SpreadsheetData = JSON.parse(jsonString);
    
    // Validação básica
    if (!template.name || !template.rows || !template.cols || !template.data) {
      throw new Error("Template inválido: campos obrigatórios ausentes");
    }

    if (!validateSpreadsheetData(template.data)) {
      throw new Error("Template inválido: dados da planilha corrompidos");
    }

    // Garantir que arrays de dimensões existam
    if (!template.columnWidths) {
      template.columnWidths = Array(template.cols).fill(100);
    }
    
    if (!template.rowHeights) {
      template.rowHeights = Array(template.rows).fill(32);
    }

    if (!template.globalStyles) {
      template.globalStyles = {};
    }

    return {
      success: true,
      data: template
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
};

export const parseCSV = (csvContent: string, options: CSVImportOptions = {}): string[][] => {
  const {
    delimiter = ',',
    quote = '"',
    escape = '"',
    skipEmptyLines = true,
    trimWhitespace = true
  } = options;

  const lines = csvContent.split('\n');
  const result: string[][] = [];

  for (let line of lines) {
    if (skipEmptyLines && line.trim() === '') continue;

    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === quote) {
        if (inQuotes && nextChar === quote) {
          // Escape sequence
          current += quote;
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === delimiter && !inQuotes) {
        // End of field
        row.push(trimWhitespace ? current.trim() : current);
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    // Add the last field
    row.push(trimWhitespace ? current.trim() : current);
    result.push(row);
  }

  return result;
};

export const importFromCSV = (csvContent: string, options: CSVImportOptions = {}): { success: boolean; data?: CellData[][]; rows?: number; cols?: number; error?: string } => {
  try {
    const csvData = parseCSV(csvContent, options);
    
    if (csvData.length === 0) {
      throw new Error("Arquivo CSV vazio");
    }

    const maxCols = Math.max(...csvData.map(row => row.length));
    const rows = csvData.length;
    const cols = maxCols;

    // Converter para formato CellData
    const data: CellData[][] = csvData.map((row, rowIndex) =>
      Array(maxCols).fill(null).map((_, colIndex) => ({
        value: row[colIndex] || '',
        id: `cell-${rowIndex}-${colIndex}`,
        style: {}
      }))
    );

    return {
      success: true,
      data,
      rows,
      cols
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
};

export const exportToCSV = (data: CellData[][], options: CSVExportOptions = {}): string => {
  const {
    delimiter = ',',
    quote = '"',
    includeHeaders = false
  } = options;

  const escapeField = (field: string): string => {
    const needsQuoting = field.includes(delimiter) || field.includes(quote) || field.includes('\n') || field.includes('\r');
    
    if (needsQuoting) {
      const escaped = field.replace(new RegExp(quote, 'g'), quote + quote);
      return quote + escaped + quote;
    }
    
    return field;
  };

  let result = '';

  // Adicionar headers se solicitado
  if (includeHeaders && data.length > 0) {
    const headers = data[0].map((_, colIndex) => getColumnLabel(colIndex));
    result += headers.map(escapeField).join(delimiter) + '\n';
  }

  // Adicionar dados
  for (const row of data) {
    const csvRow = row.map(cell => escapeField(cell.value.toString()));
    result += csvRow.join(delimiter) + '\n';
  }

  return result.trim();
};

export const calculateSpreadsheetStats = (data: CellData[][]) => {
  let totalCells = 0;
  let filledCells = 0;
  let emptyCells = 0;
  let numericCells = 0;
  let textCells = 0;

  data.forEach(row => {
    row.forEach(cell => {
      totalCells++;
      const value = cell.value.trim();
      
      if (value !== "") {
        filledCells++;
        
        // Verificar se é numérico
        if (!isNaN(Number(value)) && value !== "") {
          numericCells++;
        } else {
          textCells++;
        }
      } else {
        emptyCells++;
      }
    });
  });

  return {
    totalCells,
    filledCells,
    emptyCells,
    numericCells,
    textCells,
    fillPercentage: totalCells > 0 ? Math.round((filledCells / totalCells) * 100) : 0
  };
};

export const findAndReplace = (data: CellData[][], findValue: string, replaceValue: string, options: { matchCase?: boolean; wholeWord?: boolean; useRegex?: boolean } = {}): { data: CellData[][]; replacements: number } => {
  const { matchCase = false, wholeWord = false, useRegex = false } = options;
  let replacements = 0;

  const newData = data.map(row =>
    row.map(cell => {
      let cellValue = cell.value;
      let searchValue = findValue;

      if (useRegex) {
        try {
          const flags = matchCase ? 'g' : 'gi';
          const regex = new RegExp(findValue, flags);
          const newValue = cellValue.replace(regex, replaceValue);
          
          if (newValue !== cellValue) {
            replacements++;
            return { ...cell, value: newValue };
          }
        } catch (error) {
          // Regex inválido, ignorar
        }
      } else {
        if (!matchCase) {
          cellValue = cellValue.toLowerCase();
          searchValue = searchValue.toLowerCase();
        }

        if (wholeWord) {
          const regex = new RegExp(`\\b${searchValue}\\b`, matchCase ? 'g' : 'gi');
          if (regex.test(cell.value)) {
            replacements++;
            return {
              ...cell,
              value: cell.value.replace(regex, replaceValue)
            };
          }
        } else {
          if (cellValue.includes(searchValue)) {
            replacements++;
            return {
              ...cell,
              value: cell.value.replace(
                new RegExp(findValue, matchCase ? "g" : "gi"),
                replaceValue
              )
            };
          }
        }
      }

      return cell;
    })
  );

  return {
    data: newData,
    replacements
  };
};

export const resizeSpreadsheet = (currentData: CellData[][], newRows: number, newCols: number): CellData[][] => {
  const currentRows = currentData.length;
  const currentCols = currentData[0]?.length || 0;

  // Criar nova matriz com o tamanho desejado
  const newData = Array(newRows).fill(null).map((_, rowIndex) =>
    Array(newCols).fill(null).map((_, colIndex) => {
      // Se a célula existe nos dados atuais, mantê-la
      if (rowIndex < currentRows && colIndex < currentCols) {
        return currentData[rowIndex][colIndex];
      }
      // Caso contrário, criar nova célula vazia
      return {
        value: "",
        id: `cell-${rowIndex}-${colIndex}`,
        formula: null,
        style: {}
      };
    })
  );

  return newData;
};

export const applyCellStyle = (data: CellData[][], rowIndex: number, colIndex: number, style: Partial<CellStyle>): CellData[][] => {
  const newData = data.map(row => [...row]);
  
  if (newData[rowIndex] && newData[rowIndex][colIndex]) {
    newData[rowIndex][colIndex] = {
      ...newData[rowIndex][colIndex],
      style: {
        ...newData[rowIndex][colIndex].style,
        ...style
      }
    };
  }

  return newData;
};

export const applyRangeStyle = (data: CellData[][], startRow: number, startCol: number, endRow: number, endCol: number, style: Partial<CellStyle>): CellData[][] => {
  const newData = data.map(row => [...row]);

  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      if (newData[row] && newData[row][col]) {
        newData[row][col] = {
          ...newData[row][col],
          style: {
            ...newData[row][col].style,
            ...style
          }
        };
      }
    }
  }

  return newData;
};

export const clearCellStyles = (data: CellData[][], rowIndex: number, colIndex: number): CellData[][] => {
  const newData = data.map(row => [...row]);
  
  if (newData[rowIndex] && newData[rowIndex][colIndex]) {
    newData[rowIndex][colIndex] = {
      ...newData[rowIndex][colIndex],
      style: {}
    };
  }

  return newData;
};

export const duplicateRow = (data: CellData[][], rowIndex: number): CellData[][] => {
  if (rowIndex < 0 || rowIndex >= data.length) return data;

  const newData = [...data];
  const rowToDuplicate = data[rowIndex].map((cell, colIndex) => ({
    ...cell,
    id: `cell-${data.length}-${colIndex}`
  }));

  newData.splice(rowIndex + 1, 0, rowToDuplicate);
  return newData;
};

export const duplicateColumn = (data: CellData[][], colIndex: number): CellData[][] => {
  if (colIndex < 0 || (data.length > 0 && colIndex >= data[0].length)) return data;

  const newData = data.map((row, rowIndex) => {
    const newRow = [...row];
    const cellToDuplicate = {
      ...row[colIndex],
      id: `cell-${rowIndex}-${row.length}`
    };
    newRow.splice(colIndex + 1, 0, cellToDuplicate);
    return newRow;
  });

  return newData;
};

export const sortData = (data: CellData[][], columnIndex: number, ascending: boolean = true): CellData[][] => {
  if (data.length <= 1) return data;

  const newData = [...data];
  
  newData.sort((a, b) => {
    const aValue = a[columnIndex]?.value || '';
    const bValue = b[columnIndex]?.value || '';

    // Tentar converter para número
    const aNum = parseFloat(aValue);
    const bNum = parseFloat(bValue);

    if (!isNaN(aNum) && !isNaN(bNum)) {
      // Ambos são números
      return ascending ? aNum - bNum : bNum - aNum;
    } else {
      // Comparação de string
      const comparison = aValue.localeCompare(bValue);
      return ascending ? comparison : -comparison;
    }
  });

  return newData;
};

export const filterData = (data: CellData[][], columnIndex: number, filterValue: string, filterType: 'contains' | 'equals' | 'startsWith' | 'endsWith' = 'contains'): CellData[][] => {
  return data.filter(row => {
    const cellValue = row[columnIndex]?.value || '';
    
    switch (filterType) {
      case 'equals':
        return cellValue === filterValue;
      case 'startsWith':
        return cellValue.startsWith(filterValue);
      case 'endsWith':
        return cellValue.endsWith(filterValue);
      case 'contains':
      default:
        return cellValue.includes(filterValue);
    }
  });
};

export const getColumnData = (data: CellData[][], columnIndex: number): string[] => {
  return data.map(row => row[columnIndex]?.value || '');
};

export const getRowData = (data: CellData[][], rowIndex: number): string[] => {
  return data[rowIndex]?.map(cell => cell.value) || [];
};

export const validateCSV = (csvContent: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!csvContent || csvContent.trim() === '') {
    errors.push('Arquivo CSV está vazio');
    return { isValid: false, errors };
  }

  try {
    const lines = csvContent.split('\n');
    const firstLineLength = lines[0] ? lines[0].split(',').length : 0;
    
    lines.forEach((line, index) => {
      if (line.trim() === '') return; // Pular linhas vazias
      
      const columns = line.split(',');
      if (columns.length !== firstLineLength) {
        errors.push(`Linha ${index + 1}: número inconsistente de colunas (esperado: ${firstLineLength}, encontrado: ${columns.length})`);
      }
    });
  } catch (error) {
    errors.push('Erro ao analisar o arquivo CSV');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
