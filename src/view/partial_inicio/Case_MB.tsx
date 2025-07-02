import {
  CheckCircle,
  Clock,
  Users,
  Target,
  Lock, // Added Lock icon for MB
  Unlock, // Added Unlock icon for MB
} from 'lucide-react';
import React, { memo, useState } from 'react';
import { StatCard, MBResponse, ProjectItem, Projeto, MicrobiologiaPendenteItem, MicrobiologiaLiberacaoPendenteItem } from '../Main';

interface MBScreenProps {
  mb: MBResponse;
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

export const MBScreen = memo<MBScreenProps>(({ mb }) => {
  const [showAllMBItems, setShowAllMBItems] = useState(false);

  const hasMoreMBItems = mb.pendencias_prazo.length + mb.pendencias_liberacao.length > 3;

  const toggleModal = () => {
    setShowAllMBItems(!showAllMBItems);
  };

  // Helper function to map MicrobiologiaPendenteItem or MicrobiologiaLiberacaoPendenteItem to ProjectItem's Projeto prop
  const mapMBItemToProjeto = (item: MicrobiologiaPendenteItem | MicrobiologiaLiberacaoPendenteItem): Projeto => {
    const isPendente = 'tempo' in item; // Check if it's a MicrobiologiaPendenteItem

    let formattedDate = new Date().toISOString().split('T')[0]; // Default to current date

    if (isPendente && item.tempo) {
      // Split the date string "DD/MM/YYYY HH:MM"
      const [datePart, timePart] = item.tempo.split(' ');
      const [day, month, year] = datePart.split('/');

      // Reassemble into "YYYY-MM-DDTHH:MM" for reliable Date object creation
      const isoFormattedDateTime = `${year}-${month}-${day}T${timePart}:00`; // Added seconds for full ISO format

      try {
        const dateObj = new Date(isoFormattedDateTime);
        if (!isNaN(dateObj.getTime())) { // Check if the date is valid
          formattedDate = dateObj.toISOString().split('T')[0];
        }
      } catch (error) {
        console.error("Error parsing date:", item.tempo, error);
        // Fallback to default if parsing fails
      }
    }

    return {
      id: item.id,
      nome: item.identificacao || `Item MB ID ${item.id}`,
      responsavel: item.fantasia || item.razao || "Cliente Desconhecido",
      status: isPendente ? (item.passou ? 'concluido' : 'andamento') : 'andamento',
      prioridade: isPendente ? (item.passou ? 'baixa' : 'alta') : 'media',
      dataEntrega: formattedDate, // Use the correctly formatted date
      progresso: isPendente ? (item.passou ? 100 : 0) : 80, // 80% for MicrobiologiaLiberacaoPendenteItem
      atencoes: isPendente ? (item.passou ? 0 : 1) : 0,
    };
  };

  return (
    <>
      {/* Cards de Estatísticas para MB */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <StatCard
          icon={<Lock size={24} color="#ef4444" />}
          title="Total de Pendências"
          value={mb.total_pendencias_prazo + mb.total_pendencias_liberacao}
          gradient="linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)"
          borderColor="#fca5a5"
          textColor="#b91c1c"
        />
        <StatCard
          icon={<Clock size={24} color="#f59e0b" />}
          title="Pendências de Prazo"
          value={mb.total_pendencias_prazo}
          gradient="linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)"
          borderColor="#fde68a"
          textColor="#92400e"
        />
        <StatCard
          icon={<Unlock size={24} color="#0ea5e9" />}
          title="Pendências de Liberação"
          value={mb.total_pendencias_liberacao}
          gradient="linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)"
          borderColor="#7dd3fc"
          textColor="#0c4a6e"
        />
      </div>

      {/* Análises Recentes para MB */}
      <div style={modernCardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
          <Users size={24} color="#166534" style={{ marginRight: '0.75rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#166534', margin: 0 }}>
            Bloqueios Recentes (MB)
          </h2>
        </div>

        {mb.pendencias_prazo.length > 0 || mb.pendencias_liberacao.length > 0 ? (
          <>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#dc2626', marginBottom: '1rem' }}>
              Pendências de Prazo
            </h3>
            {mb.pendencias_prazo.slice(0, 3).map((item, index) => (
              <ProjectItem
                key={`pendente-${item.id || index}`}
                projeto={mapMBItemToProjeto(item)}
                style={{ backgroundColor: '#ffe0e0', marginBottom: '0.75rem', padding: '1rem', borderRadius: '8px' }}
              />
            ))}

            {/* Separator if both types exist */}
            {mb.pendencias_prazo.length > 0 && mb.pendencias_liberacao.length > 0 && (
              <hr style={{ borderTop: '1px solid #e5e7eb', margin: '2rem 0' }} />
            )}

            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#2563eb', marginBottom: '1rem' }}>
              Pendências de Liberação
            </h3>
            {mb.pendencias_liberacao.slice(0, 3).map((item, index) => (
              <ProjectItem
                key={`liberacao-${item.id || index}`}
                projeto={mapMBItemToProjeto(item)}
                style={{ backgroundColor: '#e0f2fe', marginBottom: '0.75rem', padding: '1rem', borderRadius: '8px' }}
              />
            ))}

            {hasMoreMBItems && (
              <button
                style={viewMoreButtonStyle}
                onClick={toggleModal}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#16a34a')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#22c55e')}
              >
                Ver Mais Bloqueios ({mb.total_pendencias_prazo + mb.total_pendencias_liberacao} bloqueios)
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
            Nenhum bloqueio de MB encontrado.
          </div>
        )}
      </div>

      {/* Modal para exibir todos os bloqueios de MB */}
      {showAllMBItems && (
        <div style={modalOverlayStyle} onClick={toggleModal}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <button style={closeButtonStyle} onClick={toggleModal}>&times;</button>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '600', color: '#166534', marginBottom: '1.5rem' }}>
              Todas as Pendências de Microbiologia
            </h2>

            <h3 style={{ fontSize: '1.4rem', fontWeight: '600', color: '#dc2626', marginBottom: '1rem' }}>
              Pendências de Prazo
            </h3>
            {mb.pendencias_prazo.map((item, index) => (
              <ProjectItem
                key={`modal-pendente-${item.id || index}`}
                projeto={mapMBItemToProjeto(item)}
                style={{ backgroundColor: '#ffe0e0', marginBottom: '0.75rem', padding: '1rem', borderRadius: '8px' }}
              />
            ))}

            {/* Separator if both types exist in the modal */}
            {mb.pendencias_prazo.length > 0 && mb.pendencias_liberacao.length > 0 && (
              <hr style={{ borderTop: '1px solid #e5e7eb', margin: '2rem 0' }} />
            )}

            <h3 style={{ fontSize: '1.4rem', fontWeight: '600', color: '#2563eb', marginBottom: '1rem' }}>
              Pendências de Liberação
            </h3>
            {mb.pendencias_liberacao.map((item, index) => (
              <ProjectItem
                key={`modal-liberacao-${item.id || index}`}
                projeto={mapMBItemToProjeto(item)}
                style={{ backgroundColor: '#e0f2fe', marginBottom: '0.75rem', padding: '1rem', borderRadius: '8px' }}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
});

MBScreen.displayName = 'MBScreen';