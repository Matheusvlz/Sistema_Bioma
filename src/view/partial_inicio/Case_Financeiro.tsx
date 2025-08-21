// src/screens/partial_inicio/Case_Financeiro.tsx

import {
  DollarSign, // Represents money/finance
  Clock,      // For overdue/due today/this month
  CalendarDays, // For general due dates
  Wallet,     // Another finance-related icon
} from 'lucide-react';
import React, { memo, useState } from 'react';
// Assuming these types are correctly defined in '../Main'
import { StatCard, ProjectItem, Projeto } from '../Main'; // ProjectItem and Projeto are general enough
// Ensure these are specific to Financeiro from your models
import { FinanceiroResponse, UnpaidBoletoNF } from '../Main'; // Import your financeiro types

interface FinanceiroScreenProps {
  financeiro: FinanceiroResponse; // Prop name matches the data structure
}

const modernCardStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  borderRadius: '16px',
  padding: '2rem',
  boxShadow: '0 0 25px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.03)',
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
  maxWidth: '800px', // Slightly wider for finance details
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
  backgroundColor: '#3b82f6', // A blue tone for finance
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: '600',
  transition: 'background-color 0.2s ease-in-out',
  width: '100%',
};

export const FinanceiroScreen = memo<FinanceiroScreenProps>(({ financeiro }) => {
  const [showAllBoletos, setShowAllBoletos] = useState(false);

  const totalBoletosDisplayed = financeiro.boletos_vencidos.length +
                               financeiro.boletos_vencem_hoje.length +
                               financeiro.boletos_vencem_este_mes.length;

  // Decide if "View More" button is needed (e.g., if total items exceed a certain threshold for display)
  const hasMoreBoletos = totalBoletosDisplayed > 9; // Show top 3 of each category, total 9 visible

  const toggleModal = () => {
    setShowAllBoletos(!showAllBoletos);
  };

  // Helper function to map UnpaidBoletoNF to ProjectItem's Projeto prop
  const mapBoletoToProjeto = (boleto: UnpaidBoletoNF): Projeto => {
    let formattedDate = new Date().toISOString().split('T')[0]; // Default to current date

    if (boleto.data_vencimento_boleto) {
      try {
        const dateObj = new Date(boleto.data_vencimento_boleto);
        if (!isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toISOString().split('T')[0];
        }
      } catch (error) {
        console.error("Error parsing boleto date:", boleto.data_vencimento_boleto, error);
      }
    }

    // Determine status based on due date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = boleto.data_vencimento_boleto ? new Date(boleto.data_vencimento_boleto) : today;
    dueDate.setHours(0, 0, 0, 0);

    let status: Projeto['status'] = 'andamento';
    let prioridade: Projeto['prioridade'] = 'media';
    let atencoes = 0;

    if (dueDate < today) {
      status = 'planejamento'; // Use 'planejamento' to indicate overdue/pending
      prioridade = 'alta'; // Overdue items are high priority
      atencoes = 1; // Mark as attention needed
    } else if (dueDate.getTime() === today.getTime()) {
      status = 'andamento'; // Due today, still in progress
      prioridade = 'alta'; // Also high priority
      atencoes = 1;
    } else {
      status = 'andamento'; // Future due date
      prioridade = 'baixa'; // Lower priority if not due soon
    }

    // You might want to adjust progresso based on payment status, but as these are UNPAID, 0% makes sense
    return {
      id: boleto.id_boleto,
      nome:  `Boleto da NF  ${boleto.nf_numero}` || '',
      responsavel: boleto.nome_cliente || "Cliente Desconhecido",
      status: boleto.nf_pago === true ? 'concluido' : status, // If NF is paid, consider it concluded
      prioridade: boleto.nf_pago === true ? 'baixa' : prioridade,
      dataEntrega: formattedDate,
      progresso: boleto.nf_pago === true ? 100 : 0, // 0% if unpaid, 100% if NF indicates paid
      atencoes: boleto.nf_pago === true ? 0 : atencoes,
    };
  };

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
          icon={<DollarSign size={24} color="#ef4444" />}
          title="Boletos Vencidos"
          value={financeiro.boletos_vencidos.length}
          gradient="linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)"
          borderColor="#fca5a5"
          textColor="#b91c1c"
        />
        <StatCard
          icon={<Clock size={24} color="#f59e0b" />}
          title="Vencem Hoje"
          value={financeiro.boletos_vencem_hoje.length}
          gradient="linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)"
          borderColor="#fde68a"
          textColor="#92400e"
        />
        <StatCard
          icon={<CalendarDays size={24} color="#0ea5e9" />}
          title="Vencem Este Mês"
          value={financeiro.boletos_vencem_este_mes.length}
          gradient="linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)"
          borderColor="#7dd3fc"
          textColor="#0c4a6e"
        />
        <StatCard
          icon={<Wallet size={24} color="#166534" />}
          title="Total Não Pagos"
          value={financeiro.total_itens_nao_pagos}
          gradient="linear-gradient(135deg, #dcfce7 0%, #a7f3d0 100%)"
          borderColor="#34d399"
          textColor="#065f46"
        />
      </div>

      {/* Seção de Boletos Recentes para Financeiro */}
      <div style={modernCardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
          <DollarSign size={24} color="#166534" style={{ marginRight: '0.75rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#166534', margin: 0 }}>
            Situação Financeira
          </h2>
        </div>

        {financeiro.total_itens_nao_pagos > 0 ? (
          <>
            {financeiro.boletos_vencidos.length > 0 && (
              <>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#dc2626', marginBottom: '1rem' }}>
                  Boletos Vencidos
                </h3>
                {financeiro.boletos_vencidos.slice(0, 3).map((item, index) => (
                  <ProjectItem
                    key={`vencido-${item.id_boleto || index}`}
                    projeto={mapBoletoToProjeto(item)}
                   
                  />
                ))}
              </>
            )}

            {financeiro.boletos_vencem_hoje.length > 0 && (
              <>
                {financeiro.boletos_vencidos.length > 0 && <hr style={{ borderTop: '1px solid #e5e7eb', margin: '2rem 0' }} />}
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#f59e0b', marginBottom: '1rem' }}>
                  Vencem Hoje
                </h3>
                {financeiro.boletos_vencem_hoje.slice(0, 3).map((item, index) => (
                  <ProjectItem
                    key={`hoje-${item.id_boleto || index}`}
                    projeto={mapBoletoToProjeto(item)}
                   
                  />
                ))}
              </>
            )}

            {financeiro.boletos_vencem_este_mes.length > 0 && (
              <>
                {(financeiro.boletos_vencidos.length > 0 || financeiro.boletos_vencem_hoje.length > 0) && <hr style={{ borderTop: '1px solid #e5e7eb', margin: '2rem 0' }} />}
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#2563eb', marginBottom: '1rem' }}>
                  Vencem Este Mês
                </h3>
                {financeiro.boletos_vencem_este_mes.slice(0, 3).map((item, index) => (
                  <ProjectItem
                    key={`este-mes-${item.id_boleto || index}`}
                    projeto={mapBoletoToProjeto(item)}
                 
                  />
                ))}
              </>
            )}

            {hasMoreBoletos && (
              <button
                style={viewMoreButtonStyle}
                onClick={toggleModal}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3b82f6')}
              >
                Ver Todos os Boletos ({financeiro.total_itens_nao_pagos} itens)
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
            Nenhum boleto pendente encontrado para este mês.
          </div>
        )}
      </div>

      {/* Modal para exibir todos os boletos */}
      {showAllBoletos && (
        <div style={modalOverlayStyle} onClick={toggleModal}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <button style={closeButtonStyle} onClick={toggleModal}>&times;</button>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '600', color: '#166534', marginBottom: '1.5rem' }}>
              Todos os Boletos Não Pagos
            </h2>

            {financeiro.boletos_vencidos.length > 0 && (
              <>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '600', color: '#dc2626', marginBottom: '1rem' }}>
                  Boletos Vencidos
                </h3>
                {financeiro.boletos_vencidos.map((item, index) => (
                  <ProjectItem
                    key={`modal-vencido-${item.id_boleto || index}`}
                    projeto={mapBoletoToProjeto(item)}
                    
                  />
                ))}
              </>
            )}

            {financeiro.boletos_vencem_hoje.length > 0 && (
              <>
                {financeiro.boletos_vencidos.length > 0 && <hr style={{ borderTop: '1px solid #e5e7eb', margin: '2rem 0' }} />}
                <h3 style={{ fontSize: '1.4rem', fontWeight: '600', color: '#f59e0b', marginBottom: '1rem' }}>
                  Vencem Hoje
                </h3>
                {financeiro.boletos_vencem_hoje.map((item, index) => (
                  <ProjectItem
                    key={`modal-hoje-${item.id_boleto || index}`}
                    projeto={mapBoletoToProjeto(item)}
                    
                  />
                ))}
              </>
            )}

            {financeiro.boletos_vencem_este_mes.length > 0 && (
              <>
                {(financeiro.boletos_vencidos.length > 0 || financeiro.boletos_vencem_hoje.length > 0) && <hr style={{ borderTop: '1px solid #e5e7eb', margin: '2rem 0' }} />}
                <h3 style={{ fontSize: '1.4rem', fontWeight: '600', color: '#2563eb', marginBottom: '1rem' }}>
                  Vencem Este Mês
                </h3>
                {financeiro.boletos_vencem_este_mes.map((item, index) => (
                  <ProjectItem
                    key={`modal-este-mes-${item.id_boleto || index}`}
                    projeto={mapBoletoToProjeto(item)}
                  
                  />
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
});

FinanceiroScreen.displayName = 'FinanceiroScreen';