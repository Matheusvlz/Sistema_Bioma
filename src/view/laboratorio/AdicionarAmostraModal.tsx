// AdicionarAmostraModal.tsx - CORRIGIDO COM FUNCIONALIDADE DE FILTRO
import React, { useState, useEffect, useMemo } from 'react';
import { X, Loader, Search, Check, AlertCircle, Plus } from 'lucide-react';
import { emit } from '@tauri-apps/api/event';
import { invoke as tauriInvoke } from '@tauri-apps/api/core'; // Usando alias para clareza

// Interfaces simplificadas para o modal
interface AmostraItem {
    id: number;
    numero?: string;
    identificacao?: string;
    fantasia?: string;
    razao?: string;
}

interface AdicionarAmostraModalProps {
    // O array de IDs das amostras que JÁ ESTÃO na lista principal (para evitar duplicação)
    amostrasExistentesIds: number[]; 
    onClose: () => void;
}

// Estilos básicos para o modal (Mantidos)
const modalStyles: Record<string, React.CSSProperties> = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modal: {
        backgroundColor: '#fff',
        borderRadius: '8px',
        width: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        padding: '1rem 1.5rem',
        borderBottom: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: '1.25rem',
        fontWeight: 600,
        margin: 0,
    },
    closeButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#666',
    },
    content: {
        padding: '1.5rem',
        flexGrow: 1,
    },
    list: {
        marginTop: '1rem',
        border: '1px solid #ddd',
        borderRadius: '4px',
        maxHeight: '300px',
        overflowY: 'auto',
    },
    listItem: {
        padding: '0.75rem 1rem',
        borderBottom: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'background-color 0.15s',
    },
    footer: {
        padding: '1rem 1.5rem',
        borderTop: '1px solid #eee',
        textAlign: 'right' as const,
    },
    addButton: {
        padding: '0.5rem 1rem',
        backgroundColor: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginLeft: '1rem',
    }
};

const AdicionarAmostraModal: React.FC<AdicionarAmostraModalProps> = ({ 
    amostrasExistentesIds, 
    onClose 
}) => {
    // Lista completa de amostras que o backend retornou
    const [amostrasDisponiveis, setAmostrasDisponiveis] = useState<AmostraItem[]>([]);
    
    // Lista de amostras selecionadas
    const [selecionadas, setSelecionadas] = useState<AmostraItem[]>([]);
    
    // Estado do filtro
    const [searchTerm, setSearchTerm] = useState(''); 

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 1. Efeito para buscar os dados iniciais do backend
    useEffect(() => {
        const buscarAmostras = async () => {
            setLoading(true);
            setError(null);
            try {
                // ⚠️ SUBSTITUA ESTE INVOKE PELA SUA CHAMADA REAL 
                // Ex: invocar uma função que retorna Amostras em Análise e Não Iniciadas
                const response = await tauriInvoke("buscar_em_analise") as { 
                    success: boolean, 
                    data: AmostraItem[] 
                };
                
                if (response.success && response.data) {
                    // Filtra amostras que já estão na lista principal ANTES de salvar no estado
                    const filtradas = response.data.filter(
                        a => !amostrasExistentesIds.includes(a.id)
                    );
                    setAmostrasDisponiveis(filtradas);
                } else {
                    setError("Erro ao carregar amostras.");
                }
            } catch (err) {
                setError("Falha na comunicação com o backend.");
            } finally {
                setLoading(false);
            }
        };

        buscarAmostras();
    }, [amostrasExistentesIds]);


    // 2. Memoização para filtrar as amostras com base no searchTerm
    const amostrasFiltradas = useMemo(() => {
        if (!searchTerm) {
            return amostrasDisponiveis;
        }

        const lowerCaseSearch = searchTerm.toLowerCase();

        return amostrasDisponiveis.filter(amostra => {
            const numero = amostra.numero?.toLowerCase() || '';
            const identificacao = amostra.identificacao?.toLowerCase() || '';
            const fantasia = amostra.fantasia?.toLowerCase() || '';
            const razao = amostra.razao?.toLowerCase() || '';
            
            return (
                numero.includes(lowerCaseSearch) ||
                identificacao.includes(lowerCaseSearch) ||
                fantasia.includes(lowerCaseSearch) ||
                razao.includes(lowerCaseSearch)
            );
        });
    }, [amostrasDisponiveis, searchTerm]);


    // 3. Lógica de seleção
    const handleToggleSelect = (amostra: AmostraItem) => {
        setSelecionadas(prev => 
            prev.some(s => s.id === amostra.id)
                ? prev.filter(s => s.id !== amostra.id)
                : [...prev, amostra]
        );
    };

    // 4. Lógica de Adicionar (Emitir Evento)
    const handleAdicionar = async () => {
        if (selecionadas.length === 0) return;
        
        try {
            // Emite o evento para a tela principal (parametro-resultado-view.tsx)
            await emit('adicionar-amostras-a-resultado', selecionadas);
            onClose(); // Fecha o modal
        } catch (e) {
            console.error("Erro ao emitir evento:", e);
        }
    };

    return (
        <div style={modalStyles.overlay}>
            <div style={modalStyles.modal}>
                <div style={modalStyles.header}>
                    <h2 style={modalStyles.title}>Adicionar Amostras</h2>
                    <button onClick={onClose} style={modalStyles.closeButton}>
                        <X size={24} />
                    </button>
                </div>
                <div style={modalStyles.content}>
                    <p>Selecione as amostras que deseja adicionar à visualização de resultados:</p>
                    
                    {error && (
                        <div style={{ color: 'red', margin: '1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}
                    
                    {/* INPUT DE FILTRO CORRIGIDO */}
                    <div style={{ position: 'relative' }}>
                        <input 
                            type="text" 
                            placeholder="Buscar por número, identificação ou cliente..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)} // ⬅️ AQUI ESTÁ A CORREÇÃO
                            style={{ 
                                width: '100%', 
                                padding: '0.75rem 1rem', 
                                borderRadius: '4px', 
                                border: '1px solid #ddd', 
                                paddingRight: '40px' 
                            }}
                        />
                        <Search size={18} style={{ 
                            position: 'absolute', 
                            right: 10, 
                            top: '50%', 
                            transform: 'translateY(-50%)', 
                            color: '#999' 
                        }} />
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <Loader size={32} style={{ animation: 'spin 1s linear infinite' }} />
                        </div>
                    ) : (
                        <div style={modalStyles.list}>
                            {/* RENDERIZAÇÃO DA LISTA FILTRADA */}
                            {amostrasFiltradas.length === 0 ? (
                                <p style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
                                    {searchTerm ? `Nenhuma amostra encontrada para "${searchTerm}".` : "Nenhuma amostra disponível para adicionar."}
                                </p>
                            ) : (
                                amostrasFiltradas.map(amostra => {
                                    const isSelected = selecionadas.some(s => s.id === amostra.id);
                                    
                                    // Determina a cor de hover/seleção
                                    const backgroundColor = isSelected ? '#e0f2fe' : 'white';
                                    const hoverColor = isSelected ? '#c6e7ff' : '#f9f9f9'; // Cor ligeiramente mais escura no hover
                                    
                                    return (
                                        <div 
                                            key={amostra.id} 
                                            style={{ 
                                                ...modalStyles.listItem, 
                                                backgroundColor: backgroundColor 
                                            }}
                                            onClick={() => handleToggleSelect(amostra)}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverColor}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = backgroundColor}
                                        >
                                            <div style={{ flexGrow: 1 }}>
                                                <strong>Amostra #{amostra.numero}</strong>
                                                <small style={{ display: 'block', color: '#666' }}>
                                                    {amostra.identificacao} ({amostra.fantasia || amostra.razao || 'Cliente não informado'})
                                                </small>
                                            </div>
                                            {isSelected && <Check size={20} color="#1d4ed8" />}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
                <div style={modalStyles.footer}>
                 
                    <button 
                        onClick={handleAdicionar} 
                        disabled={selecionadas.length === 0} 
                        style={modalStyles.addButton}
                    >
                        <Plus size={18} />
                        Adicionar ({selecionadas.length})
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdicionarAmostraModal;