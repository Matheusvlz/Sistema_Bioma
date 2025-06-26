import React from 'react';
import { Layout } from '../components/Layout';

export const Laboratorio: React.FC = () => {
  return (
    <Layout>
      <div>
        <h1 style={{ margin: '0 0 2rem 0', fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
          Laboratório
        </h1>
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Área de Laboratório em desenvolvimento...
          </p>
        </div>
      </div>
    </Layout>
  );
};