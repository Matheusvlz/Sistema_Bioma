import React, { useState } from 'react';
import FilaTrabalho from './FilaTrabalho';
import VisualizarMapaResultado from './VisualizarMapaResultado';

// Este componente é o container que troca as telas sem fechar a janela
const GerenciarAnalises: React.FC = () => {
    // Estado para controlar qual tela exibir: 'fila' ou 'mapa'
    const [telaAtual, setTelaAtual] = useState<'fila' | 'mapa'>('fila');
    
    // Dados passados da Fila para o Mapa (Contexto de navegação)
    // O ID do Parametro é obrigatório para abrir o mapa
    const [parametroSelecionado, setParametroSelecionado] = useState<number | null>(null);
    
    // O ID da Amostra é opcional (se o usuário clicar em "Abrir" numa linha específica)
    // Se for null, o mapa carrega todas as amostras daquele parâmetro
    const [amostraFocada, setAmostraFocada] = useState<number | null>(null); 

    // Função chamada pela Fila quando o usuário clica em "Abrir"
    const handleAbrirMapa = (idParametro: number, idAmostra?: number) => {
        console.log(`Abrindo mapa: Parametro=${idParametro}, Amostra=${idAmostra}`);
        setParametroSelecionado(idParametro);
        setAmostraFocada(idAmostra || null);
        setTelaAtual('mapa');
    };

    // Função chamada pelo Mapa quando clica em "Voltar"
    const handleVoltar = () => {
        setParametroSelecionado(null);
        setAmostraFocada(null);
        setTelaAtual('fila');
    };

    return (
        <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f0f2f5' }}>
            {telaAtual === 'fila' ? (
                <FilaTrabalho 
                    onAbrirMapa={handleAbrirMapa} 
                />
            ) : (
                <VisualizarMapaResultado 
                    idParametro={parametroSelecionado!} 
                    idAmostra={amostraFocada}
                    onVoltar={handleVoltar} 
                />
            )}
        </div>
    );
};

export default GerenciarAnalises;