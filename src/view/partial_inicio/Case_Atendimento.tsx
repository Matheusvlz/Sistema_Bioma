import React, { memo, useState } from 'react';
import {  CheckCircle, AlertTriangle, Headset, Clock, BarChart2 } from 'lucide-react';
import { ProjectItem, StatCard, AtendimentoItem } from '../Main'; // Import AtendimentoItem and ProjectItem, Projeto

interface AtendimentoScreenProps {
  atendimentos: AtendimentoItem[];
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

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const modalContentStyle: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: '12px',
  padding: '2rem',
  width: '90%',
  maxWidth: '700px',
  maxHeight: '80vh',
  overflowY: 'auto',
  boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
  position: 'relative',
  animation: 'fadeInUp 0.3s ease-out',
};

const closeButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: '15px',
  right: '15px',
  background: 'none',
  border: 'none',
  fontSize: '1.5rem',
  cursor: 'pointer',
  color: '#6b7280',
};

const viewMoreButtonStyle: React.CSSProperties = {
  marginTop: '1.5rem',
  padding: '0.75rem 1.5rem',
  backgroundColor: '#22c55e',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: '600',
  transition: 'background-color 0.2s ease-in-out',
  width: '100%',
};


export const AtendimentoScreen = memo<AtendimentoScreenProps>(({ atendimentos }) => {
  const [showAllAtendimentos, setShowAllAtendimentos] = useState(false);

  const totalAtendimentos = atendimentos.length;
  const atendimentosConcluidos = atendimentos.filter(item => item.numero && item.numero % 2 === 0).length;
  const atendimentosEmAndamento = totalAtendimentos - atendimentosConcluidos;
  const atendimentosComAtencao = atendimentos.filter(item => item.prefixo === 'URGENTE').length;

  const displayedAtendimentos = atendimentos.slice(0, 3);
  const hasMoreAtendimentos = atendimentos.length > 3;

  const toggleModal = () => {
    setShowAllAtendimentos(!showAllAtendimentos);
  };

  const renderAtendimentoItem = (item: AtendimentoItem) => (
    <ProjectItem
      key={item.id}
      projeto={{
        id: item.id,
        nome: `Cadastrar Coleta: ${item.numero || ''} ${item.prefixo ? `(${item.prefixo})` : ''}`,
        responsavel: item.cliente || "Cliente Desconhecido",
        status: (item.numero && item.numero % 2 === 0) ? 'concluido' : 'andamento',
        prioridade: (item.prefixo === 'URGENTE' || item.prefixo?.includes('ALTA')) ? 'alta' :
                    (item.prefixo?.includes('MEDIA')) ? 'media' : 'baixa',
        dataEntrega: item.data_coleta || new Date().toISOString().split('T')[0],
        progresso: (item.numero && item.numero % 2 === 0) ? 100 : 50,
        atencoes: (item.prefixo === 'URGENTE') ? 1 : 0,
      }}
    />
  );

  return (
    <>
      {/* Cards de Estatísticas para Atendimento */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <StatCard
          icon={<BarChart2 size={24} color="#22c55e" />}
          title="Total de Atendimentos"
          value={totalAtendimentos}
          gradient="linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)"
          borderColor="#bbf7d0"
          textColor="#166534"
        />
        <StatCard
          icon={<Clock size={24} color="#3b82f6" />}
          title="Atendimentos em Andamento"
          value={atendimentosEmAndamento}
          gradient="linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)"
          borderColor="#93c5fd"
          textColor="#1e40af"
        />
        <StatCard
          icon={<CheckCircle size={24} color="#0ea5e9" />}
          title="Atendimentos Concluídos"
          value={atendimentosConcluidos}
          gradient="linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)"
          borderColor="#7dd3fc"
          textColor="#0c4a6e"
        />
        <StatCard
          icon={<AlertTriangle size={24} color="#f59e0b" />}
          title="Atendimentos c/ Atenção"
          value={atendimentosComAtencao}
          gradient="linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)"
          borderColor="#fcd34d"
          textColor="#92400e"
        />
      </div>

      {/* Análises Recentes para Atendimento */}
      <div style={modernCardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
          <Headset size={24} color="#166534" style={{ marginRight: '0.75rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#166534', margin: 0 }}>
            Trabalhos Recentes
          </h2>
        </div>

        {atendimentos.length > 0 ? (
          <>
            {displayedAtendimentos.map(renderAtendimentoItem)}

            {hasMoreAtendimentos && (
              <button
                style={viewMoreButtonStyle}
                onClick={toggleModal}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#16a34a')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#22c55e')}
              >
                Ver Mais Trabalhos ({totalAtendimentos - displayedAtendimentos.length} pendências)
              </button>
            )}
          </>
        ) : (
          <div style={{
            textAlign: 'center',
            color: '#6b7280',
            padding: '2rem',
            fontSize: '1rem'
          }}>
            Nenhum trabalho encontrado.
          </div>
        )}
      </div>

      {/* Modal para exibir todos os atendimentos */}
      {showAllAtendimentos && (
        <div style={modalOverlayStyle} onClick={toggleModal}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <button style={closeButtonStyle} onClick={toggleModal}>&times;</button>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '600', color: '#166534', marginBottom: '1.5rem' }}>
              Todas as Pendências de Trabalhos
            </h2>
            {atendimentos.map(renderAtendimentoItem)}
          </div>
        </div>
      )}
    </>
  );
});

AtendimentoScreen.displayName = 'AtendimentoScreen';