import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X, Search, Filter, Eye, Package } from 'lucide-react'; // Adicionei Package icon
import { listen, emit } from '@tauri-apps/api/event';
import { invoke } from "@tauri-apps/api/core";
// Interfaces
import { Window } from '@tauri-apps/api/window';
interface Pacote { id: number; nome: string | null; legislacao: number | null; }
interface PacoteCompleto { id: number; nome: string | null; legislacao: number | null; parametros: number[]; parametros_texto: string[] | null; }
interface Legislacao { id: number; nome: string; }
interface ApiResponse<T> { success: boolean; data?: T; message?: string; }
interface Message { type: 'success' | 'error'; text: string; }

// Hook de debounce
const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

// Componente principal
export const SelecionarParametrosView: React.FC = () => {
    // Estados para a visualização e filtragem de pacotes
    const [pacotes, setPacotes] = useState<Pacote[]>([]);
    const [legislacoes, setLegislacoes] = useState<Legislacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<Message | null>(null);
    const [filtroNome, setFiltroNome] = useState('');
    const [filtroLegislacao, setFiltroLegislacao] = useState('');
    const debouncedFiltroNome = useDebounce(filtroNome, 300);

    // Estados para o modal de visualização
    const [showModal, setShowModal] = useState(false);
    const [pacoteVisualizacao, setPacoteVisualizacao] = useState<PacoteCompleto | null>(null);

    const legislacaoMap = useMemo(() => new Map(legislacoes.map(leg => [leg.id, leg.nome])), [legislacoes]);

    // Funções de carregamento de dados
    const carregarPacotes = useCallback(async () => {
        setLoading(true);
        setMessage(null); // Limpa mensagens anteriores
        try {
            const legislacaoId = filtroLegislacao ? parseInt(filtroLegislacao, 10) : undefined;
            const res: ApiResponse<Pacote[]> = await invoke("listar_pacotes_tauri", {
                nome: debouncedFiltroNome || null,
                legislacaoId: legislacaoId,
            });
            if (res.success && res.data) {
                setPacotes(res.data);
               
            } else {
                setMessage({ type: 'error', text: res.message || "Falha ao carregar pacotes." });
            }
        } catch (err) {
            setMessage({ type: 'error', text: "Erro de comunicação com o backend." });
        } finally {
            setLoading(false);
        }
    }, [debouncedFiltroNome, filtroLegislacao]);

    const handleVisualizarPacote = async (id: number) => {
        setMessage(null); // Limpa mensagens anteriores
        try {
            const res: ApiResponse<PacoteCompleto> = await invoke("buscar_pacote_por_id_tauri", { id });
            if (res.success && res.data) {
                setPacoteVisualizacao(res.data);
                setShowModal(true);
            } else {
                setMessage({ type: 'error', text: res.message || "Falha ao carregar detalhes do pacote." });
            }
        } catch (err) {
            setMessage({ type: 'error', text: "Erro ao buscar detalhes do pacote." });
        }
    };

    // NOVA FUNÇÃO: Confirmar seleção do pacote usando eventos do Tauri
    const handleConfirmarSelecao = async () => {
        if (!pacoteVisualizacao) {
            setMessage({ 
                type: 'error', 
                text: "Erro: Nenhum pacote selecionado." 
            });
            return;
        }

        try {
            const pacoteIds = pacoteVisualizacao.parametros;
            const legislacaoId = pacoteVisualizacao.legislacao;

            console.log('Confirmando seleção:', { 
                pacoteIds, 
                legislacaoId, 
                pacoteNome: pacoteVisualizacao.nome 
            });

            // Emitir evento para a janela pai com os dados selecionados
            await emit('parametros-selecionados', {
                pacoteIds: pacoteIds,
                legislacaoId: legislacaoId,
                pacoteNome: pacoteVisualizacao.nome
            });

            // Mostrar mensagem de sucesso
            setMessage({ 
                type: 'success', 
                text: `Pacote "${pacoteVisualizacao.nome}" aplicado com sucesso!` 
            });

            // Fechar janela após delay
            setTimeout(async () => {
                try {
                    const { getCurrentWindow } = await import('@tauri-apps/api/window');
                    const currentWindow = getCurrentWindow();
                    await currentWindow.close();
                } catch (closeError) {
                    console.error('Erro ao fechar janela:', closeError);
                    setShowModal(false);
                }
            }, 1500);
            
        } catch (error) {
            console.error('Erro ao confirmar seleção:', error);
            setMessage({ 
                type: 'error', 
                text: "Erro ao processar a seleção. Tente novamente." 
            });
        }
    };

  

    // Carrega dados iniciais e legislações
    useEffect(() => {
        carregarPacotes(); // Carrega pacotes sem filtro inicial
        invoke<ApiResponse<Legislacao[]>>("listar_legislacoes_ativas_tauri")
            .then(res => res.success && res.data && setLegislacoes(res.data))
            .catch(err => setMessage({ type: 'error', text: "Erro ao carregar legislações." }));
    }, [carregarPacotes]);

    // Estilos
    const styles: { [key: string]: React.CSSProperties } = {
        container: {
            minHeight: '100vh',
            width: '100vw',
            backgroundColor: '#f0f2f5', // Um cinza mais suave
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            fontFamily: "'Inter', sans-serif" // Fonte moderna
        },
        header: {
            background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', // Novo gradiente, mais moderno
            color: 'white',
            padding: '1.5rem 2rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            position: 'sticky',
            top: 0,
            zIndex: 10
        },
        headerContent: {
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%'
        },
        headerTitle: {
            fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', // Levemente maior
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            margin: 0,
            letterSpacing: '-0.025em' // Pequeno ajuste no espaçamento
        },
        main: {
            flex: 1,
            padding: '2rem',
            maxWidth: '1200px',
            margin: '0 auto',
            width: '100%',
            boxSizing: 'border-box'
        },
        card: {
            backgroundColor: 'white',
            borderRadius: '16px', // Borda mais arredondada
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)', // Sombra mais proeminente
            border: '1px solid #e2e8f0', // Borda sutil
            overflow: 'hidden',
            maxHeight: '600px'
        },
        cardHeader: {
            padding: '1.5rem',
            borderBottom: '1px solid #edf2f7',
            backgroundColor: '#f8fafc'
        },
        cardTitle: {
            fontSize: '1.4rem', // Levemente maior
            fontWeight: '600',
            color: '#1a202c',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem' // Mais espaçamento
        },
        cardBody: {
            padding: '1.5rem'
        },
        searchContainer: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr auto',
            gap: '1.5rem', // Mais espaçamento
            alignItems: 'end',
            marginBottom: '2rem' // Mais espaçamento
        },
        formGroup: {
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem' // Mais espaçamento
        },
        label: {
            fontSize: '0.9rem', // Levemente maior
            fontWeight: '600',
            color: '#4a5568'
        },
        input: {
            width: '100%',
            padding: '0.85rem 1.1rem', // Mais padding
            border: '2px solid #cbd5e0', // Borda mais visível
            borderRadius: '10px', // Borda mais arredondada
            fontSize: '0.9rem',
            outline: 'none',
            transition: 'all 0.3s ease',
            boxSizing: 'border-box',
            backgroundColor: 'white'
        },
        select: {
            width: '100%',
            padding: '0.85rem 1.1rem',
            border: '2px solid #cbd5e0',
            borderRadius: '10px',
            fontSize: '0.9rem',
            outline: 'none',
            backgroundColor: 'white',
            cursor: 'pointer',
            boxSizing: 'border-box',
            appearance: 'none', // Remove a seta padrão em alguns navegadores
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fillRule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clipRule='evenodd'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.75rem center',
            backgroundSize: '1.5em 1.5em'
        },
        searchButton: {
            backgroundColor: '#06b6d4', // Cor primária
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            padding: '0.85rem 1.8rem', // Mais padding
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            whiteSpace: 'nowrap',
            height: 'fit-content'
        },
        resultsContainer: {
            marginTop: '2rem',
            padding: '0', // Remover padding do container
            backgroundColor: 'white', // Fundo branco
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            overflowX: 'auto', // Scroll horizontal para tabelas largas
            maxHeight: '400px', // Altura máxima para ativar o scroll vertical
            overflowY: 'auto' // Scroll vertical
        },
        table: {
            width: '100%',
            borderCollapse: 'separate', // Para border-radius nas células
            borderSpacing: '0',
            minWidth: '600px', // Garante que a tabela não fique muito estreita em telas pequenas
            borderRadius: '12px', // Borda arredondada para a tabela
        },
        tableHeader: {
            backgroundColor: '#f1f5f9', // Fundo mais claro para o cabeçalho
            position: 'sticky', // Cabeçalho fixo no scroll
            top: 0,
            zIndex: 1
        },
        tableCell: {
            padding: '14px 20px', // Mais padding
            textAlign: 'left',
            borderBottom: '1px solid #edf2f7',
            color: '#2d3748',
            fontSize: '0.9rem'
        },
        tableHeaderCell: {
            padding: '14px 20px',
            textAlign: 'left',
            color: '#4a5568',
            fontWeight: '600',
            fontSize: '0.95rem'
        },
        tableRow: {
          
                backgroundColor: '#f8fafc' // Efeito hover na linha
            
        },
        actionButtonsContainer: {
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end',
            marginTop: '2rem', // Mais espaçamento
            paddingTop: '1.5rem',
            borderTop: '1px solid #edf2f7'
        },
        primaryButton: {
            backgroundColor: '#059669', // Verde para ação principal
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            padding: '0.85rem 1.8rem',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
        },
        secondaryButton: {
            backgroundColor: '#e2e8f0', // Cinza claro
            color: '#4a5568',
            border: '1px solid #cbd5e0',
            borderRadius: '10px',
            padding: '0.85rem 1.8rem',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
        },
        viewButton: { // Novo estilo para o botão Visualizar
            backgroundColor: '#10b981', // Verde mais vivo
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '0.6rem 1.2rem',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
        },
        noResults: {
            textAlign: 'center',
            color: '#718096',
            fontSize: '1rem',
            padding: '3rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
        },
        loadingMessage: {
            textAlign: 'center',
            color: '#4a5568',
            fontSize: '1rem',
            padding: '3rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
        },
        // Estilos do Modal
        modalOverlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)', // Fundo mais escuro
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            transition: 'opacity 0.3s ease',
            opacity: showModal ? 1 : 0, // Transição de opacidade
            pointerEvents: showModal ? 'auto' : 'none' // Desabilita eventos quando invisível
        },
        modalContent: {
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '16px', // Borda mais arredondada
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)', // Sombra mais intensa
            minWidth: '400px',
            maxWidth: '600px',
            position: 'relative',
            transform: showModal ? 'translateY(0)' : 'translateY(-20px)', // Transição de slide
            transition: 'transform 0.3s ease, opacity 0.3s ease'
        },
        modalHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #edf2f7',
            paddingBottom: '1.2rem',
            marginBottom: '1.5rem',
            color: '#1a202c',
            fontSize: '1.5rem',
            fontWeight: '700'
        },
        modalCloseBtn: {
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#718096',
            padding: '0.5rem',
            borderRadius: '50%',
            transition: 'all 0.2s ease'
        },
        modalBody: {
            maxHeight: '300px', // Altura máxima para o corpo do modal
            overflowY: 'auto', // Scroll interno no corpo do modal
            paddingRight: '10px', // Espaço para a barra de scroll
            color: '#4a5568'
        },
        modalList: {
            listStyleType: 'none', // Remove bullets padrão
            padding: 0,
            margin: 0
        },
        modalListItem: {
            padding: '0.6rem 0',
            borderBottom: '1px dotted #e2e8f0'
        },
        messageBox: {
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            fontWeight: '600',
            fontSize: '0.9rem'
        },
        errorMessage: {
            backgroundColor: '#fee2e2',
            color: '#ef4444',
            border: '1px solid #fca5a5'
        },
        infoMessage: {
            backgroundColor: '#e0f2fe',
            color: '#2563eb',
            border: '1px solid #93c5fd'
        }
    };

    // Ajustes de estilo para mobile/tablet (mantidos)
    const isMobile = window.innerWidth <= 768;
    const isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;
    if (isMobile) {
        styles.searchContainer = { ...styles.searchContainer, gridTemplateColumns: '1fr', gap: '1rem' };
        styles.main = { ...styles.main, padding: '1rem' };
        styles.header = { ...styles.header, padding: '1rem' };
        styles.cardBody = { ...styles.cardBody, padding: '1rem' };
        styles.actionButtonsContainer = { ...styles.actionButtonsContainer, flexDirection: 'column' as const };
        styles.modalContent = { ...styles.modalContent, minWidth: 'unset', maxWidth: '90vw' };
    }
    if (isTablet) {
        styles.searchContainer = { ...styles.searchContainer, gridTemplateColumns: '1fr 1fr', gap: '1rem' };
        styles.searchButton = { ...styles.searchButton, gridColumn: 'span 2' };
    }

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div style={styles.headerContent}>
                    <h1 style={styles.headerTitle}>
                        <Package size={isMobile ? 26 : 30} /> {/* Ícone de pacote */}
                        Selecionar Parâmetros
                    </h1>
                </div>
            </header>
            
            <main style={styles.main}>
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <h2 style={styles.cardTitle}>
                            <Filter size={24} />
                            Filtros de Pacotes
                        </h2>
                    </div>
                    
                    <div style={styles.cardBody}>
                        <div style={styles.searchContainer}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Nome do Pacote</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={filtroNome}
                                    onChange={(e) => setFiltroNome(e.target.value)}
                                    placeholder="Ex: Água Potável, Efluente"
                                />
                            </div>
                            
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Legislação</label>
                                <select
                                    style={styles.select}
                                    value={filtroLegislacao}
                                    onChange={(e) => setFiltroLegislacao(e.target.value)}
                                >
                                    <option value="">Todas as Legislações</option>
                                    {legislacoes.map(leg => (
                                        <option key={leg.id} value={leg.id}>{leg.nome}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <button 
                                style={styles.searchButton}
                                onClick={carregarPacotes}
                                onMouseEnter={(e) => {
                                    Object.assign(e.currentTarget.style);
                                }}
                                onMouseLeave={(e) => {
                                    Object.assign(e.currentTarget.style, {
                                        backgroundColor: '#06b6d4',
                                        transform: 'translateY(0)',
                                        boxShadow: 'none'
                                    });
                                }}
                            >
                                <Search size={18} />
                                Buscar Pacotes
                            </button>
                        </div>

                        {message && (
                            <div style={{ ...styles.messageBox, ...(message.type === 'error' ? styles.errorMessage : styles.infoMessage) }}>
                                {message.text}
                            </div>
                        )}

                        <div style={styles.resultsContainer}>
                            {loading ? (
                                <div style={styles.loadingMessage}>
                                    <img src="https://i.gifer.com/ZZ5H.gif" alt="Carregando..." style={{ width: '50px', height: '50px' }} /> {/* Exemplo de GIF de loading */}
                                    <p>Carregando pacotes disponíveis...</p>
                                </div>
                            ) : (
                                pacotes.length > 0 ? (
                                    <table style={styles.table}>
                                        <thead style={styles.tableHeader}>
                                            <tr>
                                                <th style={{ ...styles.tableHeaderCell, borderTopLeftRadius: '12px' }}>Nome do Pacote</th>
                                                <th style={styles.tableHeaderCell}>Legislação</th>
                                                <th style={{ ...styles.tableHeaderCell, width: '120px', borderTopRightRadius: '12px' }}>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pacotes.map((pacote) => (
                                                <tr key={pacote.id} style={styles.tableRow}>
                                                    <td style={styles.tableCell}>{pacote.nome}</td>
                                                    <td style={styles.tableCell}>{pacote.legislacao ? legislacaoMap.get(pacote.legislacao) : 'N/A'}</td>
                                                    <td style={{ ...styles.tableCell, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <button
                                                            style={styles.viewButton}
                                                            onClick={() => handleVisualizarPacote(pacote.id)}
                                                            onMouseEnter={(e) => {
                                                                Object.assign(e.currentTarget.style);
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                Object.assign(e.currentTarget.style, {
                                                                    backgroundColor: '#10b981',
                                                                    transform: 'translateY(0)',
                                                                    boxShadow: 'none'
                                                                });
                                                            }}

                                                        >
                                                            <Eye size={16} /> Visualizar
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    !message && !loading && (
                                        <div style={styles.noResults}>
                                            <Search size={48} color="#cbd5e0" />
                                            <p>Nenhum pacote disponível. Tente ajustar os filtros.</p>
                                        </div>
                                    )
                                )
                            )}
                        </div>

                      
                    </div>
                </div>
            </main>

            {/* Modal de Visualização */}
          {showModal && pacoteVisualizacao && (
    <div style={styles.modalOverlay}>
        <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
                Detalhes do Pacote: {pacoteVisualizacao.nome}
                <button style={styles.modalCloseBtn} onClick={() => setShowModal(false)}>
                    <X size={24} />
                </button>
            </div>
            <div style={styles.modalBody}>
                <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#2d3748' }}>Parâmetros Associados:</h3>
                {/* AQUI: Verificação de nulidade */}
                {pacoteVisualizacao.parametros_texto && pacoteVisualizacao.parametros_texto.length > 0 ? (
                    <ul style={styles.modalList}>
                        {pacoteVisualizacao.parametros_texto.map((parametro, index) => (
                            <li key={index} style={styles.modalListItem}>Parâmetro: {parametro}</li>
                        ))}
                    </ul>
                ) : (
                    <p style={{ color: '#718096' }}>Nenhum parâmetro associado a este pacote.</p>
                )}
            </div>
              <div style={styles.actionButtonsContainer}>
                            <button 
                                style={styles.secondaryButton}
                      
                                onMouseEnter={(e) => {
                                    Object.assign(e.currentTarget.style, {
                                        backgroundColor: '#d1d5db',
                                        transform: 'translateY(-1px)',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                    });
                                }}
                                onMouseLeave={(e) => {
                                    Object.assign(e.currentTarget.style, {
                                        backgroundColor: '#e2e8f0',
                                        transform: 'translateY(0)',
                                        boxShadow: 'none'
                                    });
                                }}
                            >
                                Cancelar
                            </button>
                            <button 
                                style={styles.primaryButton}
                                onClick={handleConfirmarSelecao}
                                onMouseEnter={(e) => {
                                    Object.assign(e.currentTarget.style, {
                                        backgroundColor: '#047857',
                                        transform: 'translateY(-1px)',
                                        boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
                                    });
                                }}
                                onMouseLeave={(e) => {
                                    Object.assign(e.currentTarget.style, {
                                        backgroundColor: '#059669',
                                        transform: 'translateY(0)',
                                        boxShadow: 'none'
                                    });
                                }}
                            >
                                Confirmar Seleção
                            </button>
                        </div>
        </div>
    </div>
)}
        </div>
    );
};

export default SelecionarParametrosView;