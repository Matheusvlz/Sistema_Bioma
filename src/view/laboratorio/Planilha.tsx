import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Search, Download, Grid, List, FileSpreadsheet } from 'lucide-react';

interface CellData {
  id: number;
  value: number;
  selected: boolean;
  highlighted: boolean;
}

const CELL_SIZE = 45; // Tamanho fixo para cálculos otimizados
const OVERSCAN = 5; // Células extras renderizadas fora da tela

export const Planilha: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCells, setSelectedCells] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [highlightedRange, setHighlightedRange] = useState<{ start: number; end: number } | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Configurações do grid otimizadas
  const gridConfig = useMemo(() => {
    const cols = Math.floor(containerSize.width / CELL_SIZE);
    const visibleRows = Math.ceil(containerSize.height / CELL_SIZE);
    return { 
      cols: Math.max(10, cols - 1), // Mínimo 10 colunas
      visibleRows: visibleRows + OVERSCAN * 2,
      cellSize: CELL_SIZE
    };
  }, [containerSize]);

  // Dados filtrados (apenas IDs para economia de memória)
  const filteredIds = useMemo(() => {
    if (!searchTerm.trim()) {
      return Array.from({ length: 549 }, (_, i) => i + 1);
    }
    const searchNum = parseInt(searchTerm);
    if (isNaN(searchNum)) return Array.from({ length: 549 }, (_, i) => i + 1);
    
    return Array.from({ length: 549 }, (_, i) => i + 1)
      .filter(id => id.toString().includes(searchTerm));
  }, [searchTerm]);

  // Calcular apenas células visíveis
  const visibleCells = useMemo(() => {
    const startRow = Math.max(0, Math.floor(scrollTop / CELL_SIZE) - OVERSCAN);
    const endRow = startRow + gridConfig.visibleRows;
    const totalRows = Math.ceil(filteredIds.length / gridConfig.cols);
    
    const visible: Array<CellData & { x: number; y: number }> = [];
    
    for (let row = startRow; row < Math.min(endRow, totalRows); row++) {
      for (let col = 0; col < gridConfig.cols; col++) {
        const index = row * gridConfig.cols + col;
        if (index >= filteredIds.length) break;
        
        const cellId = filteredIds[index];
        visible.push({
          id: cellId,
          value: cellId,
          selected: selectedCells.has(cellId),
          highlighted: highlightedRange 
            ? cellId >= highlightedRange.start && cellId <= highlightedRange.end
            : false,
          x: col * CELL_SIZE,
          y: row * CELL_SIZE
        });
      }
    }
    
    return visible;
  }, [filteredIds, gridConfig, scrollTop, selectedCells, highlightedRange]);

  // Altura total para scroll
  const totalHeight = Math.ceil(filteredIds.length / gridConfig.cols) * CELL_SIZE;

  // Atualizar tamanho do container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: rect.width - 32, // Padding
          height: Math.max(400, window.innerHeight - rect.top - 140)
        });
      }
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Handlers otimizados
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const handleCellClick = useCallback((cellId: number) => {
    setSelectedCells(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cellId)) {
        newSet.delete(cellId);
      } else {
        newSet.add(cellId);
      }
      return newSet;
    });
  }, []);

  const handleCellDoubleClick = useCallback((cellId: number) => {
    const start = Math.max(1, cellId - 5);
    const end = Math.min(549, cellId + 5);
    setHighlightedRange({ start, end });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCells(new Set());
    setHighlightedRange(null);
  }, []);

  const selectAll = useCallback(() => {
    setSelectedCells(new Set(Array.from({ length: 549 }, (_, i) => i + 1)));
  }, []);

  const exportData = useCallback(() => {
    const selectedData = Array.from(selectedCells).sort((a, b) => a - b);
    console.log('Dados selecionados:', selectedData);
    alert(`Exportando ${selectedData.length} células`);
  }, [selectedCells]);

  // Componente de célula memoizado
  const Cell = React.memo(({ cell }: { cell: CellData & { x: number; y: number } }) => (
    <div
      style={{
        position: 'absolute',
        left: cell.x,
        top: cell.y,
        width: CELL_SIZE - 2,
        height: CELL_SIZE - 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: cell.selected 
          ? '#10b981'
          : cell.highlighted
          ? '#f59e0b'
          : '#f8fafc',
        color: cell.selected || cell.highlighted ? 'white' : '#374151',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: cell.selected || cell.highlighted ? '600' : '400',
        border: `1px solid ${cell.selected ? '#059669' : cell.highlighted ? '#d97706' : '#e2e8f0'}`,
        borderRadius: '4px',
        userSelect: 'none',
        willChange: 'transform',
        transition: 'background-color 0.1s ease'
      }}
      onClick={() => handleCellClick(cell.id)}
      onDoubleClick={() => handleCellDoubleClick(cell.id)}
      onMouseEnter={(e) => {
        if (!cell.selected && !cell.highlighted) {
          e.currentTarget.style.backgroundColor = '#e2e8f0';
        }
      }}
      onMouseLeave={(e) => {
        if (!cell.selected && !cell.highlighted) {
          e.currentTarget.style.backgroundColor = '#f8fafc';
        }
      }}
    >
      {cell.value}
    </div>
  ));

  return (
    <div style={{
      height: '100vh',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      padding: '1rem',
      overflow: 'hidden',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        height: '100%',
        maxWidth: '1400px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Header Compacto */}
        <div style={{
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          color: 'white',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <FileSpreadsheet size={24} />
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
                Planilha Interativa
              </h1>
              <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
                {filteredIds.length} células • {selectedCells.size} selecionadas
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '0.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {viewMode === 'grid' ? <List size={16} /> : <Grid size={16} />}
            </button>
            
            <button
              onClick={exportData}
              disabled={selectedCells.size === 0}
              style={{
                background: selectedCells.size > 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
                border: 'none',
                color: selectedCells.size > 0 ? '#047857' : 'rgba(255,255,255,0.7)',
                padding: '0.5rem',
                borderRadius: '8px',
                cursor: selectedCells.size > 0 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Download size={16} />
            </button>
          </div>
        </div>

        {/* Controls Compactos */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #e5e7eb',
          background: '#f8fafc',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '250px' }}>
            <Search size={16} style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b7280'
            }} />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.5rem 0.5rem 2.5rem',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={selectAll}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              Todos
            </button>
            
            <button
              onClick={clearSelection}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              Limpar
            </button>
          </div>
        </div>

        {/* Grid Virtualizado */}
        <div 
          ref={containerRef}
          style={{
            flex: 1,
            padding: '1rem',
            background: 'white',
            overflow: 'hidden'
          }}
        >
          {filteredIds.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#6b7280'
            }}>
              <Search size={32} style={{ opacity: 0.5 }} />
              <p style={{ margin: '1rem 0 0 0' }}>Nenhum número encontrado</p>
            </div>
          ) : (
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              style={{
                height: containerSize.height,
                overflowY: 'auto',
                overflowX: 'hidden',
                position: 'relative',
                scrollbarWidth: 'thin'
              }}
            >
              <div style={{
                height: totalHeight,
                position: 'relative',
                width: '100%'
              }}>
                {visibleCells.map((cell) => (
                  <Cell key={cell.id} cell={cell} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Compacto */}
        <div style={{
          padding: '0.75rem 1.5rem',
          background: '#f8fafc',
          borderTop: '1px solid #e5e7eb',
          fontSize: '0.8rem',
          color: '#6b7280',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <span>Clique: selecionar • Duplo clique: destacar</span>
          <span>Renderizando: <strong>{visibleCells.length}</strong> de <strong>{filteredIds.length}</strong></span>
        </div>
      </div>
    </div>
  );
};