import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Search, Download, Grid, List, FileSpreadsheet } from 'lucide-react';
// Importar o invoke do Tauri para chamadas ao backend
import { invoke } from '@tauri-apps/api/core';

interface CellData {
  id: number;
  value: number;
  selected: boolean;
  highlighted: boolean;
  specificHighlight: boolean; // Nova propriedade para destaque específico em verde
}

interface NumberRange {
  id: number;
  inicial: number;
  final: number;
}

const CELL_SIZE = 50; // Tamanho fixo para cálculos otimizados
const OVERSCAN = 5; // Células extras renderizadas fora da tela

export const Planilha: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCells, setSelectedCells] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [highlightedRange, setHighlightedRange] = useState<{ start: number; end: number } | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  
  // Estados para number ranges
  const [numberRanges, setNumberRanges] = useState<NumberRange[]>([]);
  const [selectedRangeId, setSelectedRangeId] = useState<number | null>(null);
  const [specificNumbers, setSpecificNumbers] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // useEffect para carregar os number ranges ao montar o componente
  useEffect(() => {
    const loadNumberRanges = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Chamada real para o controller Rust via Tauri
        const ranges = await invoke('consultar_intervalos_planilhas') as NumberRange[];
        
        setNumberRanges(ranges);
        
        // Selecionar o primeiro range por padrão se existir
        if (ranges.length > 0) {
          setSelectedRangeId(ranges[0].id);
        }
      } catch (error) {
    
      } finally {
        setLoading(false);
      }
    };

    loadNumberRanges();
  }, []);

  // useEffect para carregar números específicos quando um range é selecionado
  useEffect(() => {
    const loadSpecificNumbers = async () => {
      if (!selectedRangeId) {
        setSpecificNumbers(new Set());
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Chamada real para o controller Rust via Tauri
        // Nota: O backend tem consultar_amostras_por_planilha que retorna números de amostras
        // Assumindo que selectedRangeId corresponde ao planilha_id
        const numbers = await invoke('consultar_amostras_por_planilha', { 
          planilhaId: selectedRangeId 
        }) as number[];
        
        setSpecificNumbers(new Set(numbers));
      } catch (error) {
        console.error('Erro ao carregar números específicos:', error);
        setError('Erro ao carregar números específicos');
        
        // Fallback para mock data em caso de erro
        const selectedRange = numberRanges.find(r => r.id === selectedRangeId);
        if (selectedRange) {
          // Gerar alguns números específicos dentro do range para demonstração
          const rangeSize = selectedRange.final- selectedRange.inicial + 1;
          const numSpecific = Math.min(5, Math.floor(rangeSize / 3)); // Até 5 números ou 1/3 do range
          
          let mockSpecificNumbers: number[] = [];
          for (let i = 0; i < numSpecific; i++) {
            const randomOffset = Math.floor(Math.random() * rangeSize);
            mockSpecificNumbers.push(selectedRange.inicial + randomOffset);
          }
          
          // Remover duplicatas e ordenar
          mockSpecificNumbers = [...new Set(mockSpecificNumbers)].sort((a, b) => a - b);
          setSpecificNumbers(new Set(mockSpecificNumbers));
        }
      } finally {
        setLoading(false);
      }
    };

    loadSpecificNumbers();
  }, [selectedRangeId, numberRanges]);

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

  // Range selecionado
  const selectedRange = useMemo(() => {
    return numberRanges.find(range => range.id === selectedRangeId);
  }, [numberRanges, selectedRangeId]);

  // Dados filtrados baseados no range selecionado
  const filteredIds = useMemo(() => {
    let baseIds: number[] = [];
    
    if (selectedRange) {
      // Gerar números baseados no range selecionado (user range)
      baseIds = Array.from(
        { length: selectedRange.final - selectedRange.inicial + 1 }, 
        (_, i) => selectedRange.inicial + i
      );
    } else {
      // Fallback para o comportamento original se nenhum range estiver selecionado
      baseIds = Array.from({ length: 549 }, (_, i) => i + 1);
    }

    // Aplicar filtro de busca se houver
    if (!searchTerm.trim()) {
      return baseIds;
    }
    
    const searchNum = parseInt(searchTerm);
    if (isNaN(searchNum)) return baseIds;
    
    return baseIds.filter(id => id.toString().includes(searchTerm));
  }, [searchTerm, selectedRange]);

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
          specificHighlight: specificNumbers.has(cellId), // Destaque verde para números específicos
          x: col * CELL_SIZE,
          y: row * CELL_SIZE
        });
      }
    }
    
    return visible;
  }, [filteredIds, gridConfig, scrollTop, selectedCells, highlightedRange, specificNumbers]);

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
    const start = Math.max(selectedRange?.inicial || 1, cellId - 5);
    const end = Math.min(selectedRange?.final || 549, cellId + 5);
    setHighlightedRange({ start, end });
  }, [selectedRange]);

  const handleRangeChange = useCallback((rangeId: number) => {
    setSelectedRangeId(rangeId);
    // Limpar seleções quando trocar de range
    setSelectedCells(new Set());
    setHighlightedRange(null);
    setError(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCells(new Set());
    setHighlightedRange(null);
  }, []);

  const selectAll = useCallback(() => {
    setSelectedCells(new Set(filteredIds));
  }, [filteredIds]);

  const exportData = useCallback(() => {
    const selectedData = Array.from(selectedCells).sort((a, b) => a - b);
    const specificData = Array.from(specificNumbers).sort((a, b) => a - b);
    
    console.log('Dados selecionados:', selectedData);
    console.log('Números específicos (verde):', specificData);
    
    alert(`Exportando ${selectedData.length} células selecionadas e ${specificData.length} números específicos`);
  }, [selectedCells, specificNumbers]);

  // Nova função para gerar planilha
  const gerarNovaPlanilha = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      

      
      // Chamada para o novo endpoint
      const resultado = await invoke('gerar_nova_planilha') as { inicial: number; final: number };
      
      // Recarregar a lista de ranges para incluir o novo
      const ranges = await invoke('consultar_intervalos_planilhas') as NumberRange[];
      setNumberRanges(ranges);
      
      // Selecionar o novo range (assumindo que é o primeiro na lista ordenada)
      if (ranges.length > 0) {
        setSelectedRangeId(ranges[0].id);
      }
      
      // Mostrar mensagem de sucesso
      alert(`Nova planilha criada! Range: ${resultado.inicial} - ${resultado.final}`);
      
    } catch (error) {
      console.error('Erro ao gerar nova planilha:', error);
      setError('Erro ao gerar nova planilha');
      alert('Erro ao gerar nova planilha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Componente de célula memoizado com lógica de cores atualizada
  const Cell = React.memo(({ cell }: { cell: CellData & { x: number; y: number } }) => {
    let backgroundColor = '#f8fafc';
    let color = '#374151';
    let borderColor = '#e2e8f0';
    let fontWeight = '400';

    // Prioridade: selecionado > específico (verde) > destacado (amarelo)
    if (cell.selected) {
      backgroundColor = '#10b981';
      color = 'white';
      borderColor = '#059669';
      fontWeight = '600';
    } else if (cell.specificHighlight) {
      // Destaque verde para números específicos retornados pelo controller
      backgroundColor = '#22c55e';
      color = 'white';
      borderColor = '#16a34a';
      fontWeight = '600';
    } else if (cell.highlighted) {
      backgroundColor = '#f59e0b';
      color = 'white';
      borderColor = '#d97706';
      fontWeight = '600';
    }

    return (
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
          background: backgroundColor,
          color: color,
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: fontWeight,
          border: `1px solid ${borderColor}`,
          borderRadius: '4px',
          userSelect: 'none',
          willChange: 'transform',
          transition: 'background-color 0.1s ease'
        }}
        onClick={() => handleCellClick(cell.id)}
        onDoubleClick={() => handleCellDoubleClick(cell.id)}
        onMouseEnter={(e) => {
          if (!cell.selected && !cell.highlighted && !cell.specificHighlight) {
            e.currentTarget.style.backgroundColor = '#e2e8f0';
          }
        }}
        onMouseLeave={(e) => {
          if (!cell.selected && !cell.highlighted && !cell.specificHighlight) {
            e.currentTarget.style.backgroundColor = '#f8fafc';
          }
        }}
      >
        {cell.value}
      </div>
    );
  });

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
                {filteredIds.length} células • {selectedCells.size} selecionadas • {specificNumbers.size} específicas
                {selectedRange && ` • Range: ${selectedRange.inicial}-${selectedRange.final}`}
                {loading && ' • Carregando...'}
                {error && ` • ${error}`}
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={gerarNovaPlanilha}
              disabled={loading}
              style={{
                background: loading ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.9)',
                border: 'none',
                color: loading ? 'rgba(255,255,255,0.7)' : '#047857',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}
            >
              <FileSpreadsheet size={16} />
              {loading ? 'Gerando...' : 'Gerar Planilha'}
            </button>
            
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
              disabled={selectedCells.size === 0 && specificNumbers.size === 0}
              style={{
                background: (selectedCells.size > 0 || specificNumbers.size > 0) ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
                border: 'none',
                color: (selectedCells.size > 0 || specificNumbers.size > 0) ? '#047857' : 'rgba(255,255,255,0.7)',
                padding: '0.5rem',
                borderRadius: '8px',
                cursor: (selectedCells.size > 0 || specificNumbers.size > 0) ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Download size={16} />
            </button>
          </div>
        </div>

        {/* Controls Compactos com Combo Box */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #e5e7eb',
          background: '#f8fafc',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexShrink: 0,
          flexWrap: 'wrap'
        }}>
          {/* Combo Box para Number Ranges */}
          <div style={{ minWidth: '200px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.8rem', 
              color: '#6b7280', 
              marginBottom: '0.25rem' 
            }}>
              Range de Números:
            </label>
            <select
              value={selectedRangeId || ''}
              onChange={(e) => handleRangeChange(Number(e.target.value))}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.9rem',
                outline: 'none',
                background: 'white'
              }}
            >
              <option value="">Selecione um range...</option>
              {numberRanges.map((range) => (
                <option key={range.id} value={range.id}>
                  NI: {range.inicial} - NF: {range.final}
                </option>
              ))}
            </select>
          </div>

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
              onClick={clearSelection}
              disabled={selectedCells.size === 0 && !highlightedRange}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                background: 'white',
                color: '#6b7280',
                cursor: (selectedCells.size > 0 || highlightedRange) ? 'pointer' : 'not-allowed',
                fontSize: '0.85rem'
              }}
            >
              Limpar
            </button>
            
            <button
              onClick={selectAll}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #10b981',
                borderRadius: '8px',
                background: '#10b981',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              Selecionar Tudo
            </button>
          </div>
        </div>

        {/* Grid Container */}
        <div 
          ref={containerRef}
          style={{
            flex: 1,
            overflow: 'hidden',
            position: 'relative',
            padding: '1rem'
          }}
        >
          {viewMode === 'grid' ? (
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              style={{
                height: '100%',
                overflowY: 'auto',
                overflowX: 'hidden',
                position: 'relative'
              }}
            >
              <div style={{ height: totalHeight, position: 'relative' }}>
                {visibleCells.map((cell) => (
                  <Cell key={cell.id} cell={cell} />
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              height: '100%',
              overflowY: 'auto',
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                      Número
                    </th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIds.map((id) => (
                    <tr
                      key={id}
                      onClick={() => handleCellClick(id)}
                      style={{
                        cursor: 'pointer',
                        background: selectedCells.has(id) 
                          ? '#10b981' 
                          : specificNumbers.has(id)
                          ? '#22c55e'
                          : 'white',
                        color: (selectedCells.has(id) || specificNumbers.has(id)) ? 'white' : '#374151'
                      }}
                    >
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                        {id}
                      </td>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                        {selectedCells.has(id) 
                          ? 'Selecionado' 
                          : specificNumbers.has(id)
                          ? 'Específico'
                          : 'Normal'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Planilha;
