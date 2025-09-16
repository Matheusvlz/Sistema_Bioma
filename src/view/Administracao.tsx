import _React, { useState, useMemo, useCallback, memo } from "react";
import { 
    Shield, 
    Users, 
    ClipboardList, 
    Bot, 
    AlertTriangle, 
    Search, 
    Filter, 
    X, 
    TrendingUp,
    BarChart3,
    UserPlus,
    List,
    KeyRound,
    ClipboardCheck,
    LayoutDashboard,
    History,
    FileText,
    Settings2,
    Settings,
    SlidersHorizontal,
    DatabaseBackup,
    FileTerminal
} from "lucide-react";

import { WindowManager } from "../hooks/WindowManager";

// Componente de Card de Status (Reutilizado do seu código original)
const StatusCard = memo(({ card }) => (
    <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #f3f4f6',
        transition: 'all 0.2s ease',
        position: 'relative',
        cursor: 'pointer'
    }}>
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px'
        }}>
            <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                ...card.iconBg
            }}>
                <card.icon size={20} />
            </div>
            <span style={{
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500',
                ...card.changeBg
            }}>
                {card.change}
            </span>
        </div>
        <h3 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '4px'
        }}>{card.value}</h3>
        <p style={{
            color: '#6b7280',
            fontSize: '14px',
            margin: 0
        }}>{card.title}</p>
        <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            opacity: 0.2
        }}>
            <TrendingUp size={20} color={card.trendColor} />
        </div>
    </div>
));

// Componente de Item de Seção (Reutilizado do seu código original)
const SectionItem = memo(({ item, onItemClick }) => {
    const handleClick = useCallback(() => {
        onItemClick(item.name);
    }, [item.name, onItemClick]);

    return (
        <button
            style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid transparent',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
            }}
            onClick={handleClick}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#e5e7eb';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
            }}
            title={item.description}
        >
            <div style={{
                width: '20px',
                height: '20px',
                color: '#6b7280',
                flexShrink: 0,
                marginRight: '12px'
            }}>
                <item.icon size={16} />
            </div>
            <div style={{
                flex: 1,
                minWidth: 0
            }}>
                <div style={{
                    fontWeight: '500',
                    color: '#111827',
                    fontSize: '14px',
                    marginBottom: '2px'
                }}>
                    {item.name}
                </div>
                <div style={{
                    color: '#6b7280',
                    fontSize: '12px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {item.description}
                </div>
            </div>
        </button>
    );
});

// Componente de Card de Seção (Reutilizado do seu código original)
const SectionCard = memo(({ section, searchTerm, onItemClick }) => (
    <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: searchTerm ? '2px solid rgba(59, 130, 246, 0.2)' : '1px solid #f3f4f6',
        overflow: 'hidden',
        transition: 'all 0.2s ease'
    }}>
        <div style={{
            padding: '24px',
            color: 'white',
            background: section.gradient,
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{
                position: 'relative',
                zIndex: 10,
                display: 'flex',
                alignItems: 'start',
                justifyContent: 'space-between'
            }}>
                <div>
                    <h3 style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        marginBottom: '8px',
                        margin: 0
                    }}>{section.title}</h3>
                    <p style={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '14px',
                        marginBottom: '4px',
                        margin: 0
                    }}>
                        {section.items.length} opções disponíveis
                    </p>
                    <span style={{
                        display: 'inline-block',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '500'
                    }}>
                        {section.category}
                    </span>
                </div>
                <section.icon size={32} style={{ opacity: 0.8 }} />
            </div>
        </div>
        
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {section.items.map((item, index) => (
                    <SectionItem 
                        key={`${section.id}-${index}`} 
                        item={item} 
                        onItemClick={onItemClick}
                    />
                ))}
            </div>
        </div>
    </div>
));

export const Administracao = memo(() => {
    const [searchTerm, setSearchTerm] = useState("");
    const [showSearch, setShowSearch] = useState(false);

    // Dados estáticos para a tela de Administração
    const menuSections = useMemo(() => [
        {
            id: "usuarios",
            title: "Gestão de Usuários",
            icon: Users,
            gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            category: "usuários",
            items: [
                { name: "Cadastrar Usuário", icon: UserPlus, description: "Adicionar um novo usuário ao sistema" },
                { name: "Listar Usuários", icon: List, description: "Visualizar e gerenciar usuários existentes" },
                { name: "Permissões de Acesso", icon: KeyRound, description: "Definir papéis e permissões de usuários" }
            ]
        },
        {
            id: "tarefas",
            title: "Monitoramento de Tarefas",
            icon: ClipboardCheck,
            gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            category: "tarefas",
            items: [
                { name: "Painel de Tarefas", icon: LayoutDashboard, description: "Visualizar o status atual das tarefas" },
                { name: "Relatórios de Produtividade", icon: BarChart3, description: "Analisar o desempenho dos usuários" },
                { name: "Histórico de Atividades", icon: History, description: "Consultar logs e atividades passadas" }
            ]
        },
        {
            id: "coletores",
            title: "Análise de Coletores",
            icon: Bot,
            gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            category: "automação",
            items: [
                { name: "Relatorio Coletores", icon: TrendingUp, description: "Visualize e filtre coletores, cidades, e clientes" },
                { name: "Logs de Coletores", icon: FileText, description: "Consultar registros de execução" },
                { name: "Configurar Coletores", icon: Settings2, description: "Ajustar parâmetros e regras" }
            ]
        },
        {
            id: "sistema",
            title: "Configurações do Sistema",
            icon: Settings,
            gradient: "linear-gradient(135deg, #64748b 0%, #475569 100%)",
            category: "sistema",
            items: [
                { name: "Configurações Gerais", icon: SlidersHorizontal, description: "Ajustar configurações globais" },
                { name: "Backups", icon: DatabaseBackup, description: "Gerenciar backups do sistema" },
                { name: "Logs do Sistema", icon: FileTerminal, description: "Visualizar logs gerais da aplicação" }
            ]
        }
    ], []);

    const cards = useMemo(() => [
        {
            title: "Usuários Ativos",
            value: "125",
            change: "+5",
            icon: Users,
            iconBg: { backgroundColor: '#3b82f6' },
            changeBg: { backgroundColor: '#dcfce7', color: '#166534' },
            trendColor: '#10b981'
        },
        {
            title: "Tarefas Pendentes",
            value: "32",
            change: "+12%",
            icon: ClipboardList,
            iconBg: { backgroundColor: '#10b981' },
            changeBg: { backgroundColor: '#dcfce7', color: '#166534' },
            trendColor: '#10b981'
        },
        {
            title: "Coletores Online",
            value: "8",
            change: "100%",
            icon: Bot,
            iconBg: { backgroundColor: '#f59e0b' },
            changeBg: { backgroundColor: '#dcfce7', color: '#166534' },
            trendColor: '#10b981'
        },
        {
            title: "Alertas do Sistema",
            value: "2",
            change: "+1",
            icon: AlertTriangle,
            iconBg: { backgroundColor: '#ef4444' },
            changeBg: { backgroundColor: '#fecaca', color: '#991b1b' },
            trendColor: '#ef4444'
        }
    ], []);

    // Filtrar seções baseado no termo de pesquisa
    const filteredSections = useMemo(() => {
        if (!searchTerm.trim()) return menuSections;
        
        const lowerSearchTerm = searchTerm.toLowerCase();
        return menuSections.filter(section => {
            const titleMatch = section.title.toLowerCase().includes(lowerSearchTerm);
            const categoryMatch = section.category.toLowerCase().includes(lowerSearchTerm);
            const itemsMatch = section.items.some(item => 
                item.name.toLowerCase().includes(lowerSearchTerm) ||
                item.description.toLowerCase().includes(lowerSearchTerm)
            );
            
            return titleMatch || categoryMatch || itemsMatch;
        });
    }, [searchTerm, menuSections]);

    // Callbacks otimizados
    const clearSearch = useCallback(() => {
        setSearchTerm("");
        setShowSearch(false);
    }, []);

    const toggleSearch = useCallback(() => {
        setShowSearch(prev => !prev);
        if (showSearch) {
            setSearchTerm("");
        }
    }, [showSearch]);

    const handleSearchChange = useCallback((e) => {
        setSearchTerm(e.target.value);
    }, []);

    const handleItemClick = useCallback((itemName) => {
        console.log(`Clicado em: ${itemName}`);
        // TODO: Adicionar a lógica para abrir as janelas aqui
        switch(itemName) {
            case "Analisar Desempenho":
                // Exemplo: WindowManager.openAnalisarColetores();
                console.log("Abrir tela para analisar desempenho dos coletores...");
                break;
          
            case 'Relatorio Coletores':
            WindowManager.openAnalisarColetores();
            break;
                
  
            // Adicione outros casos aqui...
            default: 
                break;
        }
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f9fafb',
            paddingBottom: '32px'
        }}>
            {/* Header */}
            <header style={{
                backgroundColor: 'white',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                borderBottom: '1px solid #e5e7eb',
                top: 0,
                zIndex: 10
            }}>
                <div style={{
                    maxWidth: '1280px',
                    margin: '0 auto',
                    padding: '16px 24px'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                backgroundColor: '#475569',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                            }}>
                                <Shield size={24} />
                            </div>
                            <div>
                                <h1 style={{
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                    color: '#111827',
                                    margin: 0
                                }}>Administração</h1>
                                <p style={{
                                    color: '#6b7280',
                                    marginTop: '4px',
                                    margin: 0
                                }}>Gestão de Usuários, Tarefas e Sistema</p>
                            </div>
                        </div>
                        <div>
                            <button 
                                style={{
                                    padding: '8px',
                                    color: '#6b7280',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                                onClick={toggleSearch}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = '#3b82f6';
                                    e.currentTarget.style.backgroundColor = '#eff6ff';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = '#6b7280';
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                                title="Pesquisar"
                            >
                                <Search size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Barra de Pesquisa */}
            {showSearch && (
                <div style={{
                    backgroundColor: 'white',
                    borderBottom: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{
                        maxWidth: '1280px',
                        margin: '0 auto',
                        padding: '16px 24px'
                    }}>
                        <div style={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <Search size={20} style={{
                                position: 'absolute',
                                left: '12px',
                                color: '#9ca3af',
                                zIndex: 1
                            }} />
                            <input
                                type="text"
                                placeholder="Pesquisar por módulos, funcionalidades ou categorias..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                style={{
                                    width: '100%',
                                    paddingLeft: '40px',
                                    paddingRight: searchTerm ? '40px' : '12px',
                                    paddingTop: '12px',
                                    paddingBottom: '12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    outline: 'none',
                                    fontSize: '16px',
                                    transition: 'all 0.2s ease'
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = '#3b82f6';
                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = '#d1d5db';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                                autoFocus
                            />
                            {searchTerm && (
                                <button 
                                    onClick={clearSearch}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        padding: '4px',
                                        color: '#9ca3af',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'color 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = '#6b7280';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = '#9ca3af';
                                    }}
                                    title="Limpar pesquisa"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginTop: '12px',
                            fontSize: '14px',
                            color: '#6b7280'
                        }}>
                            <Filter size={16} style={{ marginRight: '8px' }} />
                            <span>
                                {filteredSections.length} de {menuSections.length} módulos encontrados
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <div style={{
                maxWidth: '1280px',
                margin: '0 auto',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '32px'
            }}>
            
                {/* Cards de Resumo */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '24px'
                }}>
                    {cards.map((card, index) => (
                        <StatusCard key={`card-${index}`} card={card} />
                    ))}
                </div>

                {/* Resultado da pesquisa */}
                {searchTerm && (
                    <div>
                        <h3 style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#111827',
                            marginBottom: '16px'
                        }}>
                            Resultados da pesquisa para "{searchTerm}"
                        </h3>
                        {filteredSections.length === 0 && (
                            <div style={{
                                textAlign: 'center',
                                padding: '48px',
                                backgroundColor: 'white',
                                borderRadius: '12px'
                            }}>
                                <Search size={48} style={{
                                    color: '#9ca3af',
                                    marginBottom: '16px'
                                }} />
                                <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                                    Nenhum módulo encontrado para sua pesquisa.
                                </p>
                                <button 
                                    onClick={clearSearch}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#2563eb';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#3b82f6';
                                    }}
                                >
                                    Limpar pesquisa
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Menu Principal */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                    gap: '24px'
                }}>
                    {filteredSections.map((section) => (
                        <SectionCard 
                            key={section.id} 
                            section={section} 
                            searchTerm={searchTerm}
                            onItemClick={handleItemClick}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
});

Administracao.displayName = 'Administracao';
