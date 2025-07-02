import React, { memo } from 'react';
import { Target, TrendingUp, CheckCircle, AlertTriangle, DollarSign } from 'lucide-react';
import { ProjectItem, Projeto, StatCard } from '../Main';

interface FinanceiroScreenProps {
  projetos: Projeto[];

}

const modernCardStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  borderRadius: '16px',
  padding: '2rem',
  boxShadow: '0 10px 25px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.03)',
  border: '1px solid rgba(255,255,255,0.2)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden'
};

export const FinanceiroScreen = memo<FinanceiroScreenProps>(({ projetos, estatisticas }) => {
  return (
    <>
      {/* Cards de Estatísticas para Financeiro */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <StatCard
          icon={<Target size={24} color="#22c55e" />}
          title="Total de Transações"
          value={estatisticas.total}
          gradient="linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)"
          borderColor="#bbf7d0"
          textColor="#166534"
        />
        <StatCard
          icon={<TrendingUp size={24} color="#3b82f6" />}
          title="Transações Pendentes"
          value={estatisticas.andamento}
          gradient="linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)"
          borderColor="#93c5fd"
          textColor="#1e40af"
        />
        <StatCard
          icon={<CheckCircle size={24} color="#0ea5e9" />}
          title="Transações Concluídas"
          value={estatisticas.concluidos}
          gradient="linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)"
          borderColor="#7dd3fc"
          textColor="#0c4a6e"
        />
        <StatCard
          icon={<AlertTriangle size={24} color="#f59e0b" />}
          title="Transações c/ Atenção"
          value={estatisticas.comAtencao}
          gradient="linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)"
          borderColor="#fcd34d"
          textColor="#92400e"
        />
      </div>

      {/* Análises Recentes para Financeiro */}
      <div style={modernCardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
          <DollarSign size={24} color="#166534" style={{ marginRight: '0.75rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#166534', margin: 0 }}>
            Movimentações Financeiras Recentes
          </h2>
        </div>

        {projetos.length > 0 ? (
          projetos.map(projeto => (
            <ProjectItem key={projeto.id} projeto={projeto} />
          ))
        ) : (
          <div style={{
            textAlign: 'center',
            color: '#6b7280',
            padding: '2rem',
            fontSize: '1rem'
          }}>
            Nenhuma movimentação financeira encontrada.
          </div>
        )}
      </div>
    </>
  );
});

FinanceiroScreen.displayName = 'FinanceiroScreen';