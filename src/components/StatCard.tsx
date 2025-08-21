import React, { memo } from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  gradient: string;
  borderColor: string;
  textColor: string;
}

export const StatCard = memo<StatCardProps>(({ icon, title, value, gradient, borderColor, textColor }) => (
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
StatCard.displayName = 'StatCard';