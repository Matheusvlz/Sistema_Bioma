import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Calendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Layout } from '../components/Layout';
import './styles/inicio_style.css';
import { core } from "@tauri-apps/api";
import { CustomSelect, OptionType } from '../components/CustomSelect';

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar as CalendarIcon,
  Flag,
  TrendingUp,
  Users,
  Target
} from 'lucide-react';

type Value = Date | null;

type Projeto = {
  id: number;
  nome: string;
  responsavel: string;
  status: 'concluido' | 'andamento' | 'planejamento';
  prioridade: 'alta' | 'media' | 'baixa';
  dataEntrega: string;
  progresso: number;
  atencoes: number;
};

type TelaPermitida = {
  id: number;
  nome: string;
};

// Componente StatCard memoizado
const StatCard = memo<{
  icon: React.ReactNode;
  title: string;
  value: number;
  gradient: string;
  borderColor: string;
  textColor: string;
}>(({ icon, title, value, gradient, borderColor, textColor }) => (
  <div 
    className="stat-card" 
    style={{
      background: gradient,
      borderRadius: '16px',
      padding: '1.5rem',
      textAlign: 'center',
      cursor: 'pointer',
      boxShadow: '0 10px 25px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.03)',
      border: `1px solid ${borderColor}`,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
      {icon}
    </div>
    <h4 style={{ color: textColor, marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
      {title}
    </h4>
    <p style={{ fontSize: '2.2rem', fontWeight: '700', color: textColor, margin: 0 }}>
      {value}
    </p>
  </div>
));

// Componente ProjectItem memoizado
const ProjectItem = memo<{ projeto: Projeto }>(({ projeto }) => {
  const formatarData = useCallback((data: string) => new Date(data).toLocaleDateString('pt-BR'), []);
  
  const getPrioridadeColor = useCallback((prioridade: Projeto['prioridade']) => {
    const colors = {
      alta: '#ef4444',
      media: '#f59e0b',
      baixa: '#22c55e',
    };
    return colors[prioridade];
  }, []);

  const getStatusIcon = useCallback((status: Projeto['status']) => {
    switch (status) {
      case 'concluido':
        return <CheckCircle size={16} color="#22c55e" />;
      case 'andamento':
        return <Clock size={16} color="#3b82f6" />;
      default:
        return <Flag size={16} color="#6b7280" />;
    }
  }, []);

  const getStatusBadge = useCallback((status: Projeto['status']) => {
    const styles = {
      concluido: { bg: '#dcfce7', color: '#166534', text: 'Concluído' },
      andamento: { bg: '#dbeafe', color: '#1e40af', text: 'Em Andamento' },
      planejamento: { bg: '#f3f4f6', color: '#374151', text: 'Planejamento' }
    };
    
    const style = styles[status];
    return (
      <span style={{
        backgroundColor: style.bg,
        color: style.color,
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '500'
      }}>
        {style.text}
      </span>
    );
  }, []);

  return (
    <div className="project-item" style={{ marginBottom: '1rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <strong style={{ color: '#111827', fontSize: '1.1rem' }}>{projeto.nome}</strong>
            {getStatusBadge(projeto.status)}
          </div>
          <div style={{ 
            fontSize: '0.9rem', 
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Users size={14} />
            {projeto.responsavel}
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${projeto.progresso}%` }}
            />
          </div>
          <div style={{ 
            fontSize: '0.8rem', 
            color: '#22c55e', 
            fontWeight: '500',
            marginTop: '0.25rem'
          }}>
            {projeto.progresso}% concluído
          </div>
        </div>
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '0.5rem',
          marginLeft: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {getStatusIcon(projeto.status)}
            <span style={{ fontSize: '0.875rem', color: '#4b5563', fontWeight: '500' }}>
              {formatarData(projeto.dataEntrega)}
            </span>
          </div>
          {projeto.atencoes > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              backgroundColor: '#fef3c7',
              padding: '0.25rem 0.5rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: '#92400e'
            }}>
              <AlertTriangle size={12} />
              {projeto.atencoes} atenção{projeto.atencoes > 1 ? 'ões' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Componentes de calendário memoizados
const CalendarTileContent = memo<{ date: Date; datasEntrega: string[] }>(({ date, datasEntrega }) => {
  if (datasEntrega.includes(date.toDateString())) {
    return (
      <div style={{
        position: 'absolute',
        bottom: '2px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '6px',
        height: '6px',
        backgroundColor: '#22c55e',
        borderRadius: '50%',
        boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.8)'
      }} />
    );
  }
  return null;
});

const ProximasEntregas = memo<{ projetos: Projeto[] }>(({ projetos }) => {
  const proximasEntregas = useMemo(() => {
    const hoje = new Date();
    return projetos
      .filter(p => new Date(p.dataEntrega) >= hoje)
      .sort((a, b) => new Date(a.dataEntrega).getTime() - new Date(b.dataEntrega).getTime())
      .slice(0, 3);
  }, [projetos]);

  const getPrioridadeColor = useCallback((prioridade: Projeto['prioridade']) => {
    const colors = {
      alta: '#ef4444',
      media: '#f59e0b',
      baixa: '#22c55e',
    };
    return colors[prioridade];
  }, []);

  const formatarData = useCallback((data: string) => new Date(data).toLocaleDateString('pt-BR'), []);

  return (
    <div style={{ 
      marginTop: '2rem',
      padding: '1.5rem',
      background: 'rgba(255, 255, 255, 0.8)',
      borderRadius: '12px',
      border: '1px solid rgba(34, 197, 94, 0.2)'
    }}>
      <h4 style={{ 
        marginBottom: '1rem', 
        color: '#166534',
        fontSize: '1.1rem',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Clock size={18} />
        Próximas Entregas
      </h4>
      
      {proximasEntregas.map(p => (
        <div key={p.id} style={{ 
          fontSize: '0.9rem', 
          color: '#374151', 
          marginBottom: '0.75rem',
          padding: '0.75rem',
          background: 'rgba(34, 197, 94, 0.05)',
          borderRadius: '8px',
          border: '1px solid rgba(34, 197, 94, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: getPrioridadeColor(p.prioridade),
            borderRadius: '50%',
            flexShrink: 0
          }} />
          <div>
            <div style={{ fontWeight: '600', color: '#166534' }}>
              {formatarData(p.dataEntrega)}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
              {p.nome}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

export const Inicio: React.FC = () => {
  const [dataSelecionada, setDataSelecionada] = useState<Value>(new Date());
  const [telasPermitidas, setTelasPermitidas] = useState<TelaPermitida[]>([]);

  // Dados mockados - idealmente viriam de um contexto ou hook
  const projetos: Projeto[] = useMemo(() => [
    {
      id: 1,
      nome: 'Sistema de Gestão',
      responsavel: 'Ana Silva',
      status: 'andamento',
      prioridade: 'alta',
      dataEntrega: '2025-07-15',
      progresso: 75,
      atencoes: 2,
    },
    {
      id: 2,
      nome: 'App Mobile',
      responsavel: 'João Santos',
      status: 'concluido',
      prioridade: 'media',
      dataEntrega: '2025-06-20',
      progresso: 100,
      atencoes: 0,
    },
    {
      id: 3,
      nome: 'Website Corporativo',
      responsavel: 'Maria Costa',
      status: 'andamento',
      prioridade: 'alta',
      dataEntrega: '2025-08-01',
      progresso: 45,
      atencoes: 1,
    }
  ], []);

  // Estatísticas computadas memoizadas
  const estatisticas = useMemo(() => ({
    total: projetos.length,
    andamento: projetos.filter(p => p.status === 'andamento').length,
    concluidos: projetos.filter(p => p.status === 'concluido').length,
    comAtencao: projetos.filter(p => p.atencoes > 0).length
  }), [projetos]);

  // Datas de entrega memoizadas para o calendário
  const datasEntrega = useMemo(() => 
    projetos.map(p => new Date(p.dataEntrega).toDateString()), 
    [projetos]
  );

  // Options para CustomSelect memoizadas
  const telasOptions: OptionType[] = useMemo(() => 
    telasPermitidas.map(tela => ({
      id: tela.id,
      label: tela.nome
    })), 
    [telasPermitidas]
  );

  useEffect(() => {
    let mounted = true;
    
    const buscarTelasPermitidas = async () => {
      try {
        const resultado = await core.invoke<TelaPermitida[]>("get_data_inicio");
        if (mounted) {
          setTelasPermitidas(resultado);
        }
      } catch (err) {
        console.error("Erro ao buscar telas:", err);
      }
    };

    buscarTelasPermitidas();
    
    return () => {
      mounted = false;
    };
  }, []);

  const handleSelectTela = useCallback((selected: OptionType) => {
    console.log("Tela selecionada:", selected);
  }, []);

  const handleCalendarChange = useCallback((value: Value) => {
    setDataSelecionada(value);
  }, []);

  // Função memoizada para renderizar tile content
  const tileContent = useCallback(({ date }: { date: Date }) => (
    <CalendarTileContent date={date} datasEntrega={datasEntrega} />
  ), [datasEntrega]);

  // Estilos constantes
  const containerStyle: React.CSSProperties = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '2rem',
    maxWidth: '1400px',
    margin: '0 auto',
    paddingBottom: '2rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  }), []);

  const modernCardStyle: React.CSSProperties = useMemo(() => ({
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    borderRadius: '16px',
    padding: '2rem',
    boxShadow: '0 10px 25px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.03)',
    border: '1px solid rgba(255,255,255,0.2)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative' as const,
    overflow: 'hidden' as const
  }), []);

  const calendarContainerStyle: React.CSSProperties = useMemo(() => ({
    ...modernCardStyle,
    position: 'sticky' as const,
    top: '1rem',
    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
    border: '1px solid #bbf7d0'
  }), [modernCardStyle]);

  return (
    <Layout>
      <div style={containerStyle}>
        <div>
          {/* Header moderno */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: '700', 
              background: 'linear-gradient(135deg, #166534 0%, #22c55e 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.5rem'
            }}>
              Dashboard Geral
            </h1>
            <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
              Gerencie seus projetos com eficiência e estilo
            </p>
          </div>
          
          {/* Custom Select */}
          <div className="custom-select-wrapper">
            {telasPermitidas.length > 1 ? (
              <CustomSelect 
                options={telasOptions}
                onSelect={handleSelectTela}
                placeholder="Selecione uma tela"
              />
            ) : telasPermitidas.length === 1 ? (
              <div style={{
                backgroundColor: '#f0fdf4',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                color: '#166534',
                fontWeight: 500,
                border: '2px solid #16a34a',
                display: 'inline-block'
              }}>
                {telasPermitidas[0].nome}
              </div>
            ) : null}
          </div>

          {/* Cards de estatísticas */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <StatCard
              icon={<Target size={24} color="#22c55e" />}
              title="Total de Análises"
              value={estatisticas.total}
              gradient="linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)"
              borderColor="#bbf7d0"
              textColor="#166534"
            />
            <StatCard
              icon={<TrendingUp size={24} color="#3b82f6" />}
              title="Em Andamento"
              value={estatisticas.andamento}
              gradient="linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)"
              borderColor="#93c5fd"
              textColor="#1e40af"
            />
            <StatCard
              icon={<CheckCircle size={24} color="#0ea5e9" />}
              title="Concluídos"
              value={estatisticas.concluidos}
              gradient="linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)"
              borderColor="#7dd3fc"
              textColor="#0c4a6e"
            />
            <StatCard
              icon={<AlertTriangle size={24} color="#f59e0b" />}
              title="Com Atenção"
              value={estatisticas.comAtencao}
              gradient="linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)"
              borderColor="#fcd34d"
              textColor="#92400e"
            />
          </div>

          {/* Lista de projetos */}
          <div style={modernCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
              <Users size={24} color="#166534" style={{ marginRight: '0.75rem' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#166534', margin: 0 }}>
                Análises Recentes
              </h2>
            </div>
            
            {projetos.map(projeto => (
              <ProjectItem key={projeto.id} projeto={projeto} />
            ))}
          </div>
        </div>

        {/* Coluna lateral: calendário */}
        <div>
          <div style={calendarContainerStyle}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
              <CalendarIcon size={24} color="#166534" style={{ marginRight: '0.75rem' }} />
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#166534',
                margin: 0
              }}>
                Calendário
              </h2>
            </div>
            
            <Calendar
              onChange={handleCalendarChange}
              value={dataSelecionada}
              locale="pt-BR"
              calendarType="iso8601"
              tileContent={tileContent}
            />

            <ProximasEntregas projetos={projetos} />
          </div>
        </div>
      </div>
    </Layout>
  );
};