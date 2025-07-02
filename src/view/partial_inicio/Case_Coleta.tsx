import {
  CheckCircle,
  Clock,
  Users,
  Target, // Added Target for the first StatCard
} from 'lucide-react';
import React, { memo, useState } from 'react'; // Import useState
// Import StatCard, ColetaResponse, AgendamentoComCliente from Inicio.tsx
import { StatCard, ColetaResponse, ProjectItem, AgendamentoComCliente, Projeto } from '../Main';

interface ColetaScreenProps {
  coleta: ColetaResponse;
  // If you also want to pass 'projetos' data specific to Coleta, add it here.
  // For now, I'm assuming 'coleta.agendamentos' will be the primary data for the list.
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

// --- Modal Styles (reused from AtendimentoScreen or defined globally if common) ---
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
  animation: 'fadeInUp 0.3s ease-out', // Requires CSS @keyframes fadeInUp
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
// --- End Modal Styles ---

export const ColetaScreen = memo<ColetaScreenProps>(({ coleta }) => {
  const [showAllAgendamentos, setShowAllAgendamentos] = useState(false);

  // Calculate completed and pending counts from `coleta.agendamentos`
  const completedAgendamentos = coleta.agendamentos.filter(
    (agendamento) => agendamento.recibo_gerado === true // Explicitly check for true
  ).length;
  const pendingAgendamentos = coleta.agendamentos.filter(
    (agendamento) => agendamento.recibo_gerado === false || agendamento.recibo_gerado === undefined || agendamento.recibo_gerado === null
  ).length;

  const displayedAgendamentos = coleta.agendamentos.slice(0, 3);
  const hasMoreAgendamentos = coleta.agendamentos.length > 3;

  const toggleModal = () => {
    setShowAllAgendamentos(!showAllAgendamentos);
  };

  // Helper function to map AgendamentoComCliente to ProjectItem's Projeto prop
  const mapAgendamentoToProjeto = (agendamento: AgendamentoComCliente): Projeto => {
    // Generate a stable ID if cliente_cod is undefined, to avoid issues with lists
    const id = agendamento.cliente_cod !== undefined && agendamento.cliente_cod !== null
               ? agendamento.cliente_cod : Math.floor(Math.random() * 1_000_000);

    return {
      id: id,
      nome: agendamento.descricao || `Agendamento Cliente ${agendamento.cliente_nome || ''}`,
      responsavel: agendamento.cliente_nome || "Cliente Desconhecido",
      status: agendamento.recibo_gerado === true ? 'concluido' : 'andamento',
      prioridade: 'media', // Default, infer from other data if available
      dataEntrega: agendamento.data || new Date().toISOString().split('T')[0], // Fallback to current date
      progresso: agendamento.recibo_gerado === true ? 100 : 50, // Example progress
      atencoes: 0, // No specific attention field in AgendamentoComCliente yet
    };
  };


  return (
    <>
      {/* Cards de Estatísticas para Coleta */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <StatCard
          icon={<Target size={24} color="#22c55e" />}
          title="Total de Agendamentos"
          value={coleta.total_agendamentos}
          gradient="linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)"
          borderColor="#bbf7d0"
          textColor="#166534"
        />
        <StatCard
          icon={<Clock size={24} color="#f59e0b" />}
          title="Agendamentos Pendentes"
          value={pendingAgendamentos}
          gradient="linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)"
          borderColor="#fde68a"
          textColor="#92400e"
        />
        <StatCard
          icon={<CheckCircle size={24} color="#0ea5e9" />}
          title="Agend. Concluídos"
          value={completedAgendamentos}
          gradient="linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)"
          borderColor="#7dd3fc"
          textColor="#0c4a6e"
        />
      </div>

      {/* Análises Recentes para Coleta */}
      <div style={modernCardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
          <Users size={24} color="#166534" style={{ marginRight: '0.75rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#166534', margin: 0 }}>
            Agendamentos Recentes (Coleta)
          </h2>
        </div>

        {coleta.agendamentos && coleta.agendamentos.length > 0 ? (
          <>
            {/* Display only the first 3 appointments */}
            {displayedAgendamentos.map((agendamento, index) => (
              <ProjectItem
                key={agendamento.cliente_cod || index} // Use client_cod as key if unique, otherwise index
                projeto={mapAgendamentoToProjeto(agendamento)}
              />
            ))}

            {hasMoreAgendamentos && (
              <button
                style={viewMoreButtonStyle}
                onClick={toggleModal}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#16a34a')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#22c55e')}
              >
                Ver Mais Agendamentos ({coleta.agendamentos.length - displayedAgendamentos.length} agendamentos)
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
            Nenhum agendamento de coleta encontrado.
          </div>
        )}
      </div>

      {/* Modal para exibir todos os agendamentos */}
      {showAllAgendamentos && (
        <div style={modalOverlayStyle} onClick={toggleModal}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <button style={closeButtonStyle} onClick={toggleModal}>&times;</button>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '600', color: '#166534', marginBottom: '1.5rem' }}>
              Todas as Pendências de Coleta
            </h2>
            {coleta.agendamentos.map((agendamento, index) => (
              <ProjectItem
                key={agendamento.cliente_cod || index} // Use client_cod as key if unique, otherwise index
                projeto={mapAgendamentoToProjeto(agendamento)}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
});

ColetaScreen.displayName = 'ColetaScreen';