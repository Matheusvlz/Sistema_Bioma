import React from 'react';
import { Layout } from '../components/Layout';

export const Inicio: React.FC = () => {
    return (
        <Layout>
            <div className="inicio">
                <h1 style={{ margin: '0 0 2rem 0', fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
                    Início
                </h1>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '2rem'
                }}>
                    <div style={{
                        background: 'white',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#6b7280' }}>Total de Projetos</h3>
                        <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>24</p>
                    </div>

                    <div style={{
                        background: 'white',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#6b7280' }}>Em Andamento</h3>
                        <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#22c55e' }}>8</p>
                    </div>

                    <div style={{
                        background: 'white',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#6b7280' }}>Concluídos</h3>
                        <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>16</p>
                    </div>
                </div>

                <div style={{
                    background: 'white',
                    padding: '2rem',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
                        Projetos Recentes
                    </h2>
                    <p style={{ color: '#6b7280', margin: 0 }}>
                        Aqui aparecerão os projetos mais recentes...
                    </p>
                </div>
            </div>
        </Layout>
    );
};