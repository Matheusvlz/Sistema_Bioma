import React, { useState, useMemo, useCallback, memo, useEffect } from "react";
import { 
  Truck, 
  Calendar, 
  User, 
  MapPin, 
  Plus, 
  Eye, 
  Settings, 
  Wrench, 
  Fuel, 
  Shield, 
  FileText, 
  Clock, 
  Route, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  Filter, 
  X, 
  TrendingUp,
  BarChart3,
  Car,
  Navigation,
  UserCheck,
  Gauge
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
// Componente de Card otimizado com memo
import { WindowManager } from "../hooks/WindowManager";

export interface AgendamentoDia {
  id: number;
  descricao: string;
  data: string; // NaiveDate é serializado como uma string no formato "YYYY-MM-DD"
  hora: string | null; // Option<NaiveTime> se torna string | null
  nome: string | null; // Option<String> se torna string | null
}


const StatusCard = memo(({ card }: { card: any }) => (
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



// Componente de Item de Agendamento
const AgendamentoItem = memo(({ agendamento }: { agendamento: any }) => (
  <div style={{
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '8px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
  }}>
    <div style={{
      color: 'rgba(191, 219, 254, 1)',
      fontSize: '14px',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center'
    }}>
      <Clock size={16} style={{ marginRight: '4px' }} />
      {agendamento.time}
    </div>
    <div style={{
      fontWeight: '600',
      marginBottom: '4px',
      color: 'white'
    }}>{agendamento.title}</div>
    <div style={{
      color: 'rgba(191, 219, 254, 1)',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center'
    }}>
      <MapPin size={12} style={{ marginRight: '4px' }} />
      {agendamento.location}
    </div>
  </div>
));

// Componente de Item de Seção otimizado
const SectionItem = memo(({ item, onItemClick }: { item: any; onItemClick: (name: string) => void }) => {
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

// Componente de Seção otimizado
const SectionCard = memo(({ section, searchTerm, onItemClick }: { 
  section: any; 
  searchTerm: string; 
  onItemClick: (name: string) => void;
}) => (
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
        {section.items.map((item: any, index: number) => (
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

export const Frota: React.FC = memo(() => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const [agendamentos, setAgendamentos] = useState<AgendamentoDia[]>([]);
  
  // Estado para controlar o carregamento dos dados
  const [loading, setLoading] = useState<boolean>(true);
  
  // Estado para armazenar mensagens de erro
  const [error, setError] = useState<string | null>(null);

  // useEffect para buscar os dados quando o componente for montado
  useEffect(() => {
    // Definimos uma função assíncrona dentro do useEffect
    const buscarDados = async () => {
      try {
        setLoading(true);
        setError(null);

        // Chama o comando do backend Rust 'buscar_agendamentos_hoje'
        // A função invoke retorna uma Promise que resolve com o valor de `Ok`
        // ou é rejeitada com o valor de `Err` do Result do Rust.
        const resultado = await invoke<AgendamentoDia[]>('buscar_agendamentos_hoje');
        
        // Atualiza o estado com os dados recebidos
        setAgendamentos(resultado);

      } catch (err) {
        // Se a Promise for rejeitada, o erro (a String do Rust) é capturado aqui
        console.error("Erro ao buscar agendamentos:", err);
        setError(err as string);
      } finally {
        // Garante que o estado de loading seja desativado ao final
        setLoading(false);
      }
    };

    // Chama a função para buscar os dados
    buscarDados();

  }, []); 
  // Dados estáticos memoizados para melhor performance
  const menuSections = useMemo(() => [
    {
      id: "veiculos",
      title: "Gestão de Veículos",
      icon: Car,
      gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
      category: "veículos",
      items: [
        { name: "Cadastrar motorista", icon: UserCheck, description: "Cadastrar novo motorista" },
        { name: "Cadastrar veículo", icon: Truck, description: "Adicionar veículo à frota" },
        { name: "Cadastrar posto", icon: MapPin, description: "Cadastrar posto de combustível" }
      ]
    },
    {
      id: "viagens",
      title: "Controle de Viagens",
      icon: Route,
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      category: "viagens",
      items: [
        { name: "Cadastrar viagem", icon: Plus, description: "Programar nova viagem" },
        { name: "Visualizar viagem", icon: Eye, description: "Consultar viagens programadas" },
        { name: "Visualizar viagem por dia", icon: Calendar, description: "Ver agenda diária de viagens" }
      ]
    },
    {
      id: "abastecimento",
      title: "Abastecimento",
      icon: Fuel,
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      category: "combustível",
      items: [
        { name: "Cadastrar abastecimento", icon: Plus, description: "Registrar abastecimento" },
        { name: "Visualizar abastecimento", icon: Eye, description: "Consultar histórico de abastecimentos" }
      ]
    },
    {
      id: "manutencao",
      title: "Manutenção",
      icon: Wrench,
      gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
      category: "manutenção",
      items: [
        { name: "Cadastrar manutenção", icon: Plus, description: "Agendar manutenção" },
        { name: "Visualizar manutenção", icon: Eye, description: "Consultar manutenções programadas" }
      ]
    },
    {
      id: "rastreamento",
      title: "Rastreamento",
      icon: Navigation,
      gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
      category: "monitoramento",
      items: [
        { name: "Localização em Tempo Real", icon: MapPin, description: "Ver localização atual dos veículos" },
        { name: "Histórico de Rotas", icon: Route, description: "Consultar rotas percorridas" },
        { name: "Alertas de Segurança", icon: Shield, description: "Gerenciar alertas de segurança" }
      ]
    },
    {
      id: "relatorios",
      title: "Relatórios e Análises",
      icon: BarChart3,
      gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
      category: "relatórios",
      items: [
        { name: "Consumo de Combustível", icon: Fuel, description: "Análise de consumo por veículo" },
        { name: "Quilometragem", icon: Gauge, description: "Relatório de quilometragem rodada" },
        { name: "Custos Operacionais", icon: FileText, description: "Análise de custos da frota" }
      ]
    }
  ], []);

  const cards = useMemo(() => [
    {
      title: "Veículos Ativos",
      value: "45",
      change: "+3",
      icon: Truck,
      iconBg: { backgroundColor: '#3b82f6' },
      changeBg: { backgroundColor: '#dcfce7', color: '#166534' },
      trendColor: '#10b981'
    },
    {
      title: "Viagens Hoje",
      value: "12",
      change: "+8%",
      icon: Route,
      iconBg: { backgroundColor: '#10b981' },
      changeBg: { backgroundColor: '#dcfce7', color: '#166534' },
      trendColor: '#10b981'
    },
    {
      title: "Manutenções Pendentes",
      value: "7",
      change: "-2",
      icon: Wrench,
      iconBg: { backgroundColor: '#f59e0b' },
      changeBg: { backgroundColor: '#fed7aa', color: '#9a3412' },
      trendColor: '#f59e0b'
    },
    {
      title: "Consumo Mensal",
      value: "2.8k L",
      change: "-5%",
      icon: Fuel,
      iconBg: { backgroundColor: '#8b5cf6' },
      changeBg: { backgroundColor: '#dcfce7', color: '#166534' },
      trendColor: '#10b981'
    },
    {
      title: "Alertas Ativos",
      value: "3",
      change: "-1",
      icon: AlertTriangle,
      iconBg: { backgroundColor: '#ef4444' },
      changeBg: { backgroundColor: '#fecaca', color: '#991b1b' },
      trendColor: '#ef4444'
    }
  ], []);

  // Filtrar seções baseado no termo de pesquisa - otimizado
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

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleItemClick = useCallback((itemName: string) => {
    console.log(`Clicado em: ${itemName}`);
switch(itemName)
{
  case "Cadastrar motorista" :
  WindowManager.openCastrarCondutor();
  break;
  case "Cadastrar veículo":
  WindowManager.openGerenciarVeiculos();
  break;
  case "Cadastrar posto":
  WindowManager.openCadastrarPosto();
  break;
  case "Cadastrar viagem":
  WindowManager.openCadastrarViagem();
  break;
  case "Visualizar viagem":
  WindowManager.openVisualizarViagem();
  break;
  case "Cadastrar abastecimento":
    WindowManager.openCadastrarAbastecimento();
  break;
  case "Visualizar abastecimento":
      WindowManager.openVisualizarAbastecimento();
  break;

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
                backgroundColor: '#3b82f6',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}>
                <Truck size={24} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#111827',
                  margin: 0
                }}>Frota</h1>
                <p style={{
                  color: '#6b7280',
                  marginTop: '4px',
                  margin: 0
                }}>Gestão e Controle da Frota</p>
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
        {/* Agendamentos do Dia - Seção especial no topo */}
   <div style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          borderRadius: '12px',
          padding: '24px',
          color: 'white',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              margin: 0,
              display: 'flex',
              alignItems: 'center'
            }}>
              <Calendar size={24} style={{ marginRight: '8px' }} />
              Agendamentos do Dia
            </h2>
            <span style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              padding: '4px 12px',
              borderRadius: '16px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {agendamentos.length} agendados
            </span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            {agendamentos.length > 0 ? (
              agendamentos.map((agendamento, index) => (
                <AgendamentoItem
                  key={index}
                  agendamento={{
                    time: agendamento.hora,
                    title: agendamento.descricao,
                    location: agendamento.nome
                  }}
                />
              ))
            ) : (
              <div style={{ padding: '16px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.8)' }}>
                Nenhum agendamento para hoje.
              </div>
            )}
          </div>
        </div>

        {/* Cards de Resumo */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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

Frota.displayName = 'Frota';