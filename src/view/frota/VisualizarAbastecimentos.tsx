import React, { useState, useEffect, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  Legend 
} from 'recharts';
import { 
  Filter, 
  Calendar, 
  Car, 
  User, 
  TrendingUp, 
  BarChart3, 
  PieChart as PieChartIcon,
  Fuel,
  Search,
  Download,
  RefreshCw,
  Eye,
  FileText,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import style from './css/visualizar_abastaecimentos.module.css'; // Importa como módulo CSS

interface FrotaAbastecimento {
  id: number;
  veiculo: number;
  motorista: number;
  valor_litro: any;
  litro: any;
  valor: any;
  combustivel: number;
  posto: number;
  data: string;
  notafiscal: string;
  quilometragem: any;
}

interface Veiculo {
  id: number;
  nome: string;
  marca: string;
  placa: string;
}

interface Motorista {
  id: number;
  nome: string;
  cnh: string;
}

interface Posto {
  id: number;
  nome: string;
  endereco: string;
}

interface Combustivel {
  id: number;
  nome: string;
  tipo: string;
}

interface Filtros {
  veiculo: string;
  motorista: string;
  posto: string;
  combustivel: string;
  dataInicio: string;
  dataFim: string;
  periodo: string;
  valorMinimo: string;
  valorMaximo: string;
}

interface FiltrosAbastecimento {
  veiculo_id?: number;
  motorista_id?: number;
  posto_id?: number;
  combustivel_id?: number;
  data_inicio?: string;
  data_fim?: string;
  valor_minimo?: number;
  valor_maximo?: number;
}

const VisualizarAbastecimentos: React.FC = () => {
  const [abastecimentos, setAbastecimentos] = useState<FrotaAbastecimento[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [postos, setPostos] = useState<Posto[]>([]);
  const [combustiveis, setCombustiveis] = useState<Combustivel[]>([]);
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie'>('line');
  const [showTable, setShowTable] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  const [filtros, setFiltros] = useState<Filtros>({
    veiculo: '',
    motorista: '',
    posto: '',
    combustivel: '',
    dataInicio: '',
    dataFim: '',
    periodo: 'mes',
    valorMinimo: '',
    valorMaximo: ''
  });

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (Object.values(filtros).some(valor => valor !== '')) {
        buscarAbastecimentosFiltrados();
      } else {
        carregarDados();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filtros]);

  // Reset da página quando os filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [filtros, searchTerm]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Carregar abastecimentos
      const abastecimentosData = await invoke<FrotaAbastecimento[]>('buscar_abastecimento');
      setAbastecimentos(abastecimentosData);

      // Carregar dados relacionados (assumindo que existem essas funções)
      await carregarDadosRelacionados();

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      // Em caso de erro, usar dados mock
      setAbastecimentos([]);
      await carregarDadosRelacionados();
    }
    setLoading(false);
  };

  const carregarDadosRelacionados = async () => {
    try {
      const veiculosData = await invoke<Veiculo[]>('buscar_veiculos_e_marcas');
      setVeiculos(veiculosData);
    } catch {
   
    }

    try {
      const motoristasData = await invoke<Motorista[]>('buscar_motoristas');
      setMotoristas(motoristasData);
    } catch {
   
    }

    try {
      const postosData = await invoke<Posto[]>('buscar_postos');
      setPostos(postosData);
    } catch {

    }

    try {
      const combustiveisData = await invoke<Combustivel[]>('buscar_combustiveis');
      setCombustiveis(combustiveisData);
    } catch {
      // Mock data para combustíveis
      setCombustiveis([
        { id: 1, nome: 'Gasolina Comum', tipo: 'Gasolina' },
        { id: 2, nome: 'Gasolina Aditivada', tipo: 'Gasolina' },
        { id: 3, nome: 'Etanol', tipo: 'Álcool' },
        { id: 4, nome: 'Diesel S10', tipo: 'Diesel' }
      ]);
    }
  };

  const buscarAbastecimentosFiltrados = async () => {
    setLoading(true);
    try {
      // Construir parâmetros de filtro
      const parametros: FiltrosAbastecimento = {};
      
      if (filtros.veiculo) parametros.veiculo_id = parseInt(filtros.veiculo);
      if (filtros.motorista) parametros.motorista_id = parseInt(filtros.motorista);
      if (filtros.posto) parametros.posto_id = parseInt(filtros.posto);
      if (filtros.combustivel) parametros.combustivel_id = parseInt(filtros.combustivel);
      if (filtros.dataInicio) parametros.data_inicio = filtros.dataInicio;
      if (filtros.dataFim) parametros.data_fim = filtros.dataFim;
      if (filtros.valorMinimo) parametros.valor_minimo = parseFloat(filtros.valorMinimo);
      if (filtros.valorMaximo) parametros.valor_maximo = parseFloat(filtros.valorMaximo);

      // Tentar usar a nova função de filtro
      try {
        const abastecimentosData = await invoke<FrotaAbastecimento[]>('buscar_abastecimento_filtrado', { filtros: parametros });
        setAbastecimentos(abastecimentosData);
      } catch (error) {
        console.warn('Função de filtro não disponível, usando busca padrão:', error);
        // Fallback para busca padrão
        const abastecimentosData = await invoke<FrotaAbastecimento[]>('buscar_abastecimento');
        setAbastecimentos(abastecimentosData);
      }
    } catch (error) {
      console.error('Erro ao buscar abastecimentos filtrados:', error);
      // Em caso de erro, usar busca padrão
      try {
        const abastecimentosData = await invoke<FrotaAbastecimento[]>('buscar_abastecimento');
        setAbastecimentos(abastecimentosData);
      } catch (fallbackError) {
        console.error('Erro na busca padrão:', fallbackError);
        setAbastecimentos([]);
      }
    }
    setLoading(false);
  };

  const abastecimentosFiltrados = useMemo(() => {
    let dados = abastecimentos;

    // Filtro por termo de busca
    if (searchTerm) {
      dados = dados.filter(abast => {
        const veiculo = veiculos.find(v => v.id === abast.veiculo);
        const motorista = motoristas.find(m => m.id === abast.motorista);
        const posto = postos.find(p => p.id === abast.posto);
        const combustivel = combustiveis.find(c => c.id === abast.combustivel);
        
        const textoCompleto = [
          veiculo?.nome,
          veiculo?.placa,
          motorista?.nome,
          posto?.nome,
          combustivel?.nome,
          abast.notafiscal,
          abast.data
        ].join(' ').toLowerCase();
        
        return textoCompleto.includes(searchTerm.toLowerCase());
      });
    }

    // Aplicar filtros locais apenas se não foram aplicados no backend
    // (para casos onde o backend não suporta filtros ou como fallback)
    return dados.filter(abast => {
      const dataAbast = new Date(abast.data);
      const dataInicio = filtros.dataInicio ? new Date(filtros.dataInicio) : null;
      const dataFim = filtros.dataFim ? new Date(filtros.dataFim) : null;
      const valorMinimo = filtros.valorMinimo ? parseFloat(filtros.valorMinimo) : null;
      const valorMaximo = filtros.valorMaximo ? parseFloat(filtros.valorMaximo) : null;

      return (
        (!filtros.veiculo || abast.veiculo.toString() === filtros.veiculo) &&
        (!filtros.motorista || abast.motorista.toString() === filtros.motorista) &&
        (!filtros.posto || abast.posto.toString() === filtros.posto) &&
        (!filtros.combustivel || abast.combustivel.toString() === filtros.combustivel) &&
        (!dataInicio || dataAbast >= dataInicio) &&
        (!dataFim || dataAbast <= dataFim) &&
        (!valorMinimo || abast.valor >= valorMinimo) &&
        (!valorMaximo || abast.valor <= valorMaximo)
      );
    });
  }, [abastecimentos, filtros, searchTerm, veiculos, motoristas, postos, combustiveis]);

  // Cálculos de paginação
  const totalItems = abastecimentosFiltrados.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = abastecimentosFiltrados.slice(startIndex, endIndex);

  // Funções de navegação da paginação
  const goToFirstPage = () => setCurrentPage(1);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPage = (page: number) => setCurrentPage(page);

  // Gerar números de páginas para exibição
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  const dadosLinha = useMemo(() => {
    const dados = abastecimentosFiltrados.reduce((acc, abast) => {
      const data = new Date(abast.data).toLocaleDateString('pt-BR');
      const existing = acc.find(item => item.data === data);
      
      if (existing) {
        existing.litros += parseFloat(abast.litro) || 0;
        existing.valor += parseFloat(abast.valor) || 0;
        existing.abastecimentos += 1;
        existing.kmTotal += abast.quilometragem;
      } else {
        acc.push({
          data,
          litros: parseFloat(abast.litro) || 0,
          valor: parseFloat(abast.valor) || 0,
          abastecimentos: 1,
          kmTotal: abast.quilometragem,
          eficiencia: abast.quilometragem / abast.litro
        });
      }
      return acc;
    }, [] as any[]);

    return dados.sort((a, b) => new Date(a.data.split('/').reverse().join('-')).getTime() - 
                              new Date(b.data.split('/').reverse().join('-')).getTime());
  }, [abastecimentosFiltrados]);

  const dadosBarras = useMemo(() => {
    const dados = abastecimentosFiltrados.reduce((acc, abast) => {
      const veiculo = veiculos.find(v => v.id === abast.veiculo);
      const nomeVeiculo = veiculo ? `${veiculo.nome}` : `Veículo ${abast.veiculo}`;
      
      const existing = acc.find(item => item.veiculo === nomeVeiculo);
      
      if (existing) {
        existing.litros += parseFloat(abast.litro) || 0;
        existing.valor += parseFloat(abast.valor) || 0;
        existing.abastecimentos += 1;
        existing.kmTotal += abast.quilometragem;
      } else {
        acc.push({
          veiculo: nomeVeiculo,
          litros: parseFloat(abast.litro) || 0,
          valor: parseFloat(abast.valor) || 0,
          abastecimentos: 1,
          kmTotal: abast.quilometragem,
          eficiencia: abast.quilometragem / abast.litro
        });
      }
      return acc;
    }, [] as any[]);

    return dados.sort((a, b) => b.valor - a.valor);
  }, [abastecimentosFiltrados, veiculos]);

  const dadosPizza = useMemo(() => {
    const dados = abastecimentosFiltrados.reduce((acc, abast) => {
      const combustivel = combustiveis.find(c => c.id === abast.combustivel);
      const nomeCombustivel = combustivel ? combustivel.nome : `Combustível ${abast.combustivel}`;
      
      const existing = acc.find(item => item.name === nomeCombustivel);
      
      if (existing) {
        existing.value += parseFloat(abast.valor) || 0;
        existing.litros += parseFloat(abast.litro) || 0;
      } else {
        acc.push({
          name: nomeCombustivel,
          value: parseFloat(abast.valor) || 0,
          litros: parseFloat(abast.litro) || 0
        });
      }
      return acc;
    }, [] as any[]);

    return dados.sort((a, b) => b.value - a.value);
  }, [abastecimentosFiltrados, combustiveis]);

  const cores = ['#10b981', '#059669', '#34d399', '#6ee7b7', '#a7f3d0', '#065f46', '#047857'];

  const handleFiltroChange = (campo: keyof Filtros, valor: string) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const limparFiltros = () => {
    setFiltros({
      veiculo: '',
      motorista: '',
      posto: '',
      combustivel: '',
      dataInicio: '',
      dataFim: '',
      periodo: 'mes',
      valorMinimo: '',
      valorMaximo: ''
    });
    setSearchTerm('');
  };

  const estatisticas = useMemo(() => {
    const total = abastecimentosFiltrados.reduce((acc, abast) => ({
      valor: acc.valor + (parseFloat(abast.valor) || 0),
      litros: acc.litros + (parseFloat(abast.litro) || 0),
      abastecimentos: acc.abastecimentos + 1,
      kmTotal: acc.kmTotal + abast.quilometragem
    }), { valor: 0, litros: 0, abastecimentos: 0, kmTotal: 0 });

    const mediaValor = total.abastecimentos > 0 ? total.valor / total.abastecimentos : 0;
    const mediaLitros = total.abastecimentos > 0 ? total.litros / total.abastecimentos : 0;
    const eficienciaMedia = total.litros > 0 ? total.kmTotal / total.litros : 0;

    return {
      ...total,
      mediaValor: parseFloat(mediaValor.toFixed(2)),
      mediaLitros: parseFloat(mediaLitros.toFixed(2)),
      eficienciaMedia: parseFloat(eficienciaMedia.toFixed(1))
    };
  }, [abastecimentosFiltrados]);

  const exportarDados = () => {
    const dadosCSV = abastecimentosFiltrados.map(abast => {
      const veiculo = veiculos.find(v => v.id === abast.veiculo);
      const motorista = motoristas.find(m => m.id === abast.motorista);
      const posto = postos.find(p => p.id === abast.posto);
      const combustivel = combustiveis.find(c => c.id === abast.combustivel);
      
      return {
        Data: new Date(abast.data).toLocaleDateString('pt-BR'),
        Veiculo: veiculo ? `${veiculo.nome} (${veiculo.placa})` : `Veículo ${abast.veiculo}`,
        Motorista: motorista ? motorista.nome : `Motorista ${abast.motorista}`,
        Posto: posto ? posto.nome : `Posto ${abast.posto}`,
        Combustivel: combustivel ? combustivel.nome : `Combustível ${abast.combustivel}`,
        Litros: parseFloat(abast.litro).toFixed(2),
        'Valor por Litro': parseFloat(abast.valor_litro).toFixed(2),
        'Valor Total': parseFloat(abast.valor).toFixed(2),
        Quilometragem: abast.quilometragem,
        'Nota Fiscal': abast.notafiscal
      };
    });

    const csv = [
      Object.keys(dadosCSV[0] || {}).join(','),
      ...dadosCSV.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `abastecimentos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className={style['scrollable-container']}>
      <div className={style['visualizar-abastecimentos']}> 
        <div className={style.header}>
          <div className={style['header-content']}>
            <div className={style['header-left']}>
              <Fuel className={style['header-icon']} />
              <h1>Visualizar Abastecimentos</h1>
            </div>
            <div className={style['header-actions']}>
              <button onClick={carregarDados} disabled={loading} className={style['btn-secondary']}>
                <RefreshCw className={`${style.icon} ${loading ? style.rotating : ''}`} />
                Atualizar
              </button>
              <button onClick={exportarDados} className={style['btn-primary']} disabled={abastecimentosFiltrados.length === 0}>
                <Download className={style.icon} />
                Exportar CSV
              </button>
            </div>
          </div>
        </div>

        {/* Barra de busca */}
        <div className={style['search-container']}>
          <div className={style['search-wrapper']}>
            <Search className={style['search-icon']} />
            <input
              type="text"
              placeholder="Buscar por veículo, motorista, posto, nota fiscal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={style['search-input']}
            />
          </div>
        </div>

        {/* Filtros */}
        <div className={style['filtros-container']}>
          <div className={style['filtros-header']}>
            <Filter className={style.icon} />
            <h2>Filtros Avançados</h2>
            <button onClick={limparFiltros} className={style['btn-clear']}>
              Limpar Filtros
            </button>
          </div>
          
          <div className={style['filtros-grid']}>
            <div className={style['filtro-item']}>
              <label>
                <Car className={style.icon} />
                Veículo
              </label>
              <select 
                value={filtros.veiculo} 
                onChange={(e) => handleFiltroChange('veiculo', e.target.value)}
              >
                <option value="">Todos os veículos</option>
                {veiculos.map(veiculo => (
                  <option key={veiculo.id} value={veiculo.id.toString()}>
                    {veiculo.nome} - {veiculo.placa}
                  </option>
                ))}
              </select>
            </div>

            <div className={style['filtro-item']}>
              <label>
                <User className={style.icon} />
                Motorista
              </label>
              <select 
                value={filtros.motorista} 
                onChange={(e) => handleFiltroChange('motorista', e.target.value)}
              >
                <option value="">Todos os motoristas</option>
                {motoristas.map(motorista => (
                  <option key={motorista.id} value={motorista.id.toString()}>
                    {motorista.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className={style['filtro-item']}>
              <label>
                <MapPin className={style.icon} />
                Posto
              </label>
              <select 
                value={filtros.posto} 
                onChange={(e) => handleFiltroChange('posto', e.target.value)}
              >
                <option value="">Todos os postos</option>
                {postos.map(posto => (
                  <option key={posto.id} value={posto.id.toString()}>
                    {posto.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className={style['filtro-item']}>
              <label>
                <Fuel className={style.icon} />
                Combustível
              </label>
              <select 
                value={filtros.combustivel} 
                onChange={(e) => handleFiltroChange('combustivel', e.target.value)}
              >
                <option value="">Todos os combustíveis</option>
                {combustiveis.map(combustivel => (
                  <option key={combustivel.id} value={combustivel.id.toString()}>
                    {combustivel.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className={style['filtro-item']}>
              <label>
                <Calendar className={style.icon} />
                Data Início
              </label>
              <input 
                type="date" 
                value={filtros.dataInicio}
                onChange={(e) => handleFiltroChange('dataInicio', e.target.value)}
              />
            </div>

            <div className={style['filtro-item']}>
              <label>
                <Calendar className={style.icon} />
                Data Fim
              </label>
              <input 
                type="date" 
                value={filtros.dataFim}
                onChange={(e) => handleFiltroChange('dataFim', e.target.value)}
              />
            </div>

            <div className={style['filtro-item']}>
              <label>
                <TrendingUp className={style.icon} />
                Valor Mínimo
              </label>
              <input 
                type="number" 
                step="0.01"
                placeholder="R$ 0,00"
                value={filtros.valorMinimo}
                onChange={(e) => handleFiltroChange('valorMinimo', e.target.value)}
              />
            </div>

            <div className={style['filtro-item']}>
              <label>
                <TrendingUp className={style.icon} />
                Valor Máximo
              </label>
              <input 
                type="number" 
                step="0.01"
                placeholder="R$ 999,99"
                value={filtros.valorMaximo}
                onChange={(e) => handleFiltroChange('valorMaximo', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className={style['estatisticas-container']}>
          <div className={style['stat-card']}>
            <div className={style['stat-icon']}>
              <Fuel />
            </div>
            <div className={style['stat-content']}>
              <h3>Total Gasto</h3>
              <p className={style['stat-value']}>R$ {estatisticas.valor.toFixed(2)}</p>
              <p className={style['stat-subtitle']}>Média: R$ {estatisticas.mediaValor.toFixed(2)}</p>
            </div>
          </div>

          <div className={style['stat-card']}>
            <div className={style['stat-icon']}>
              <TrendingUp />
            </div>
            <div className={style['stat-content']}>
              <h3>Total Litros</h3>
              <p className={style['stat-value']}>{estatisticas.litros.toFixed(2)} L</p>
              <p className={style['stat-subtitle']}>Média: {estatisticas.mediaLitros.toFixed(2)} L</p>
            </div>
          </div>

          <div className={style['stat-card']}>
            <div className={style['stat-icon']}>
              <BarChart3 />
            </div>
            <div className={style['stat-content']}>
              <h3>Abastecimentos</h3>
              <p className={style['stat-value']}>{estatisticas.abastecimentos}</p>
              <p className={style['stat-subtitle']}>Registros filtrados</p>
            </div>
          </div>

          <div className={style['stat-card']}>
            <div className={style['stat-icon']}>
              <Clock />
            </div>
            <div className={style['stat-content']}>
              <h3>Eficiência</h3>
              <p className={style['stat-value']}>{estatisticas.eficienciaMedia.toFixed(1)} km/L</p>
              <p className={style['stat-subtitle']}>Média geral</p>
            </div>
          </div>
        </div>

        {/* Controles dos gráficos */}
        <div className={style['chart-controls']}>
          <div className={style['chart-header']}>
            <h2>Análise Gráfica</h2>
            <div className={style['chart-actions']}>
              <button 
                onClick={() => setShowTable(!showTable)}
                className={`${style['btn-toggle']} ${showTable ? style.active : ''}`}
              >
                <Eye className={style.icon} />
                {showTable ? 'Ocultar' : 'Mostrar'} Tabela
              </button>
            </div>
          </div>
          <div className={style['chart-type-selector']}>
            <button 
              className={`${style['btn-toggle']} ${chartType === 'line' ? style.active : ''}`}
              onClick={() => setChartType('line')}
            >
              <TrendingUp className={style.icon} />
              Tendência Temporal
            </button>
            <button 
              className={`${style['btn-toggle']} ${chartType === 'bar' ? style.active : ''}`}
              onClick={() => setChartType('bar')}
            >
              <BarChart3 className={style.icon} />
              Comparação por Veículo
            </button>
            <button 
              className={`${style['btn-toggle']} ${chartType === 'pie' ? style.active : ''}`}
              onClick={() => setChartType('pie')}
            >
              <PieChartIcon className={style.icon} />
              Distribuição por Combustível
            </button>
          </div>
        </div>

        {/* Gráficos */}
        <div className={style['charts-container']}>
          {chartType === 'line' && (
            <div className={style['chart-wrapper']}>
              <div className={style['chart-header']}>
                <h3>Consumo e Gastos ao Longo do Tempo</h3>
                <p className={style['chart-subtitle']}>Acompanhe a evolução dos gastos e consumo de combustível</p>
              </div>
              <ResponsiveContainer width="100%" height={450}>
                <LineChart data={dadosLinha} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.7} />
                  <XAxis 
                    dataKey="data" 
                    stroke="#6b7280" 
                    fontSize={12}
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis 
                    stroke="#6b7280" 
                    fontSize={12}
                    tick={{ fill: '#6b7280' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '2px solid #10b981',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(16, 185, 129, 0.2)'
                    }}
                    labelStyle={{ color: '#1f2937', fontWeight: 'bold' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="valor" 
                    stroke="#10b981" 
                    strokeWidth={4}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 2 }}
                    name="Valor Total (R$)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="litros" 
                    stroke="#059669" 
                    strokeWidth={4}
                    dot={{ fill: '#059669', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: '#059669', strokeWidth: 2 }}
                    name="Litros Consumidos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {chartType === 'bar' && (
            <div className={style['chart-wrapper']}>
              <div className={style['chart-header']}>
                <h3>Análise Comparativa por Veículo</h3>
                <p className={style['chart-subtitle']}>Compare gastos, consumo e eficiência entre veículos</p>
              </div>
              <ResponsiveContainer width="100%" height={450}>
                <BarChart data={dadosBarras} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.7} />
                  <XAxis 
                    dataKey="veiculo" 
                    stroke="#6b7280" 
                    fontSize={12}
                    tick={{ fill: '#6b7280' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke="#6b7280" 
                    fontSize={12}
                    tick={{ fill: '#6b7280' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '2px solid #10b981',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(16, 185, 129, 0.2)'
                    }}
                    labelStyle={{ color: '#1f2937', fontWeight: 'bold' }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="valor" 
                    fill="#10b981" 
                    name="Valor Total (R$)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="litros" 
                    fill="#059669" 
                    name="Litros Consumidos"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {chartType === 'pie' && (
            <div className={style['chart-wrapper']}>
              <div className={style['chart-header']}>
                <h3>Distribuição de Gastos por Tipo de Combustível</h3>
                <p className={style['chart-subtitle']}>Visualize como os gastos se distribuem entre os tipos de combustível</p>
              </div>
              <ResponsiveContainer width="100%" height={450}>
                <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <Pie
                    data={dadosPizza}
                    cx="50%"
                    cy="50%"
                    outerRadius={140}
                    innerRadius={60}
                    fill="#10b981"
                    dataKey="value"
                    labelLine={false}
                  >
                    {dadosPizza.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={cores[index % cores.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string, props: any) => [
                      `R$ ${value}`,
                      'Valor Gasto',
                      `${parseFloat(props.payload.litros).toFixed(2)} L`
                    ]}
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '2px solid #10b981',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(16, 185, 129, 0.2)'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Tabela de dados com paginação */}
        {showTable && (
          <div className={style['tabela-container']}>
            <div className={style['tabela-header']}>
              <h2>Dados Detalhados dos Abastecimentos</h2>
              <div className={style['tabela-info']}>
                <FileText className={style.icon} />
                <span>
                  {totalItems} registros encontrados 
                  {totalItems > 0 && (
                    <span className={style['pagination-info']}>
                      (Exibindo {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems})
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Controles de paginação superior */}
            {totalPages > 1 && (
              <div className={style['pagination-container']}>
                <div className={style['pagination-info-text']}>
                  Página {currentPage} de {totalPages}
                </div>
                <div className={style['pagination-controls']}>
                  <button 
                    onClick={goToFirstPage} 
                    disabled={currentPage === 1}
                    className={style['pagination-btn']}
                    title="Primeira página"
                  >
                    <ChevronsLeft className={style.icon} />
                  </button>
                  <button 
                    onClick={goToPreviousPage} 
                    disabled={currentPage === 1}
                    className={style['pagination-btn']}
                    title="Página anterior"
                  >
                    <ChevronLeft className={style.icon} />
                  </button>
                  
                  <div className={style['pagination-numbers']}>
                    {getPageNumbers().map(pageNum => (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`${style['pagination-number']} ${
                          currentPage === pageNum ? style.active : ''
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>
                  
                  <button 
                    onClick={goToNextPage} 
                    disabled={currentPage === totalPages}
                    className={style['pagination-btn']}
                    title="Próxima página"
                  >
                    <ChevronRight className={style.icon} />
                  </button>
                  <button 
                    onClick={goToLastPage} 
                    disabled={currentPage === totalPages}
                    className={style['pagination-btn']}
                    title="Última página"
                  >
                    <ChevronsRight className={style.icon} />
                  </button>
                </div>
                <div className={style['items-per-page']}>
                  {itemsPerPage} itens por página
                </div>
              </div>
            )}

            <div className={style['scrollable-container']}>
              <div className={style['tabela-wrapper']}>
                <table className={style['tabela-abastecimentos']}>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Veículo</th>
                      <th>Motorista</th>
                      <th>Posto</th>
                      <th>Combustível</th>
                      <th>Litros</th>
                      <th>Valor/L</th>
                      <th>Valor Total</th>
                      <th>KM</th>
                      <th>Nota Fiscal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length === 0 ? (
                      <tr>
                        <td colSpan={10} className={style['no-data']}>
                          <div className={style['no-data-content']}>
                            <Search className={style['no-data-icon']} />
                            <p>Nenhum abastecimento encontrado com os filtros aplicados</p>
                            <button onClick={limparFiltros} className={style['btn-clear']}>
                              Limpar Filtros
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((abast) => {
                        const veiculo = veiculos.find(v => v.id === abast.veiculo);
                        const motorista = motoristas.find(m => m.id === abast.motorista);
                        const posto = postos.find(p => p.id === abast.posto);
                        const combustivel = combustiveis.find(c => c.id === abast.combustivel);
                        
                        return (
                          <tr key={abast.id} className={style['tabela-row']}>
                            <td className={style['data-cell']}>
                              {new Date(abast.data).toLocaleDateString('pt-BR')}
                            </td>
                            <td className={style['veiculo-cell']}>
                              <div className={style['veiculo-info']}>
                                <Car className={style['cell-icon']} />
                                <div>
                                  <div className={style['veiculo-nome']}>
                                    {veiculo ? veiculo.nome : `Veículo ${abast.veiculo}`}
                                  </div>
                                  <div className={style['veiculo-placa']}>
                                    {veiculo ? veiculo.placa : 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className={style['motorista-cell']}>
                              <div className={style['motorista-info']}>
                                <User className={style['cell-icon']} />
                                <span>{motorista ? motorista.nome : `Motorista ${abast.motorista}`}</span>
                              </div>
                            </td>
                            <td className={style['posto-cell']}>
                              <div className={style['posto-info']}>
                                <MapPin className={style['cell-icon']} />
                                <span>{posto ? posto.nome : `Posto ${abast.posto}`}</span>
                              </div>
                            </td>
                            <td className={style['combustivel-cell']}>
                              <div className={style['combustivel-info']}>
                                <Fuel className={style['cell-icon']} />
                                <span>{combustivel ? combustivel.nome : `Combustível ${abast.combustivel}`}</span>
                              </div>
                            </td>
                            <td className={style['litros-cell']}>
                              {parseFloat(abast.litro).toFixed(2)} L
                            </td>
                            <td className={style['valor-litro-cell']}>
                              R$ {parseFloat(abast.valor_litro).toFixed(2)}
                            </td>
                            <td className={style['valor-total-cell']}>
                              <span className={style['valor-destaque']}>
                                R$ {parseFloat(abast.valor).toFixed(2)}
                              </span>
                            </td>
                            <td className={style['km-cell']}>
                              {abast.quilometragem.toLocaleString()} km
                            </td>
                            <td className={style['nota-fiscal-cell']}>
                              <span className={style['nota-fiscal']}>
                                {abast.notafiscal}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Controles de paginação inferior */}
            {totalPages > 1 && (
              <div className={style['pagination-container']}>
                <div className={style['pagination-info-text']}>
                  Página {currentPage} de {totalPages}
                </div>
                <div className={style['pagination-controls']}>
                  <button 
                    onClick={goToFirstPage} 
                    disabled={currentPage === 1}
                    className={style['pagination-btn']}
                    title="Primeira página"
                  >
                    <ChevronsLeft className={style.icon} />
                  </button>
                  <button 
                    onClick={goToPreviousPage} 
                    disabled={currentPage === 1}
                    className={style['pagination-btn']}
                    title="Página anterior"
                  >
                    <ChevronLeft className={style.icon} />
                  </button>
                  
                  <div className={style['pagination-numbers']}>
                    {getPageNumbers().map(pageNum => (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`${style['pagination-number']} ${
                          currentPage === pageNum ? style.active : ''
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>
                  
                  <button 
                    onClick={goToNextPage} 
                    disabled={currentPage === totalPages}
                    className={style['pagination-btn']}
                    title="Próxima página"
                  >
                    <ChevronRight className={style.icon} />
                  </button>
                  <button 
                    onClick={goToLastPage} 
                    disabled={currentPage === totalPages}
                    className={style['pagination-btn']}
                    title="Última página"
                  >
                    <ChevronsRight className={style.icon} />
                  </button>
                </div>
                <div className={style['items-per-page']}>
                  {itemsPerPage} itens por página
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualizarAbastecimentos;
