import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { core } from "@tauri-apps/api";
import { useRouter } from '../routes/Router';
import { 
    AlertCircle, 
    Users, 
    Truck, 
    FileText, 
    Globe, 
    Building,
    Handshake,
    Wallet,
    Search,
    X,
    TrendingUp,
    RefreshCw,
    CheckCircle2,
    UserPlus,
    Package
} from "lucide-react";
import { WindowManager } from '../hooks/WindowManager';
import styles from './css/Geral.module.css';

// Interfaces (mantendo as mesmas)
interface BaseData {
  id: number;
}

interface ClienteSemCadastro extends BaseData {
  nome_cliente: string | null;
  documento: string | null;
  telefone: string | null;
  contato: string | null;
  email: string | null;
  origem: string | null;
}

interface ClienteDetalhes {
  id: number;
  nome_cliente: string | null;
  documento: string | null;
  telefone: string | null;
  email: string | null;
  origem: string | null;
}

interface AmostraPreCadastrada extends BaseData {
  identificacao: string | null;
  dtcoleta_formatada: string | null;
  datacoleta: string | null;
  horacoleta: string | null;
  isfabricacao: boolean | null;
  fabricacao: string | null;
  validade: string | null;
  lote: string | null;
  total: number;
}

interface ColetaItem extends BaseData {
  numero: string | null;
  prefixo: string | null;
  data_coleta: string | null;
  cliente: string | null;
}

interface SolicitacaoUsuario extends BaseData {
  nome_completo: string | null;
  email: string | null;
  created_at: string | null;
  cliente: number | null;
  fantasia: string | null;
  cliente_cod: number | null;
}

interface ColetaPortal extends BaseData {
  protocolo: string | null;
  num_protocolo: string | null;
  descricao: string | null;
  cliente_email: string | null;
  urgencia: boolean | null;
  itens: string | null;
  created_at: string | null;
  finalizado: boolean | null;
  fantasia: string | null;
  id_cliente: number | null;
}

type GeralData = ClienteSemCadastro[] | AmostraPreCadastrada[] | ColetaItem[] | SolicitacaoUsuario[] | ColetaPortal[];

interface GeralResponse {
  success: boolean;
  data?: GeralData;
  message?: string;
}

interface GroupedAmostra {
  date: string;
  samples: AmostraPreCadastrada[];
}

// Componente StatusCard
const StatusCard = React.memo(({ card, onClick }) => (
    <div 
        className={`${styles.statusCard} ${onClick ? styles.clickable : ''}`}
        onClick={onClick}
    >
        <div className={styles.statusCardHeader}>
            <div className={styles.statusCardIcon}>
                {card.loading ? (
                    <RefreshCw className={styles.spinning} size={20} />
                ) : (
                    card.icon
                )}
            </div>
            {card.count > 0 && (
                <span className={styles.statusCardBadge}>
                    {card.count}
                </span>
            )}
        </div>
        <h3 className={styles.statusCardValue}>{card.value}</h3>
        <p className={styles.statusCardTitle}>{card.title}</p>
        {card.change && (
            <div className={styles.statusCardTrend}>
                <TrendingUp size={16} />
            </div>
        )}
    </div>
));

// Componente SectionItem
const SectionItem = React.memo(({ item, onItemClick }) => {
    const handleClick = useCallback(() => {
        onItemClick(item.index);
    }, [item.index, onItemClick]);

    return (
        <button
            className={styles.sectionItem}
            onClick={handleClick}
            title={item.description}
        >
            <div className={styles.sectionItemIcon}>
                {item.icon}
            </div>
            <div className={styles.sectionItemContent}>
                <div className={styles.sectionItemName}>
                    {item.name}
                </div>
                <div className={styles.sectionItemDescription}>
                    {item.description}
                </div>
            </div>
        </button>
    );
});

// Componente SectionCard
const SectionCard = React.memo(({ section, onItemClick }) => (
    <div className={styles.sectionCard}>
        <div className={styles.sectionCardHeader}>
            <div className={styles.sectionCardHeaderContent}>
                <div>
                    <h3 className={styles.sectionCardTitle}>{section.title}</h3>
                    <p className={styles.sectionCardSubtitle}>
                        {section.items.length} opções disponíveis
                    </p>
                    <span className={styles.sectionCardCategory}>
                        {section.category}
                    </span>
                </div>
                <div className={styles.sectionCardIcon}>
                    {section.icon}
                </div>
            </div>
        </div>
        
        <div className={styles.sectionCardBody}>
            <div className={styles.sectionItemsList}>
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

// Modal Component
const Modal = React.memo(({ 
    isOpen, 
    onClose, 
    title, 
    content, 
    isAmostraModal,
    isColetaModal,
    coletas 
}) => {
    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <button className={styles.modalClose} onClick={onClose}>
                    <X size={20} />
                </button>
                <h2 className={styles.modalTitle}>{title}</h2>
                
                <div className={styles.modalList}>
                    {isAmostraModal ? (
                        (content as GroupedAmostra[]).map((group, groupIndex) => (
                            <div key={`group-${groupIndex}`} className={styles.modalCard}>
                                <div className={styles.modalCardHeader}>
                                    {group.date}
                                </div>
                                <div className={styles.modalCardContent}>
                                    {group.samples.map((amostra, sampleIndex) => (
                                        <div key={`sample-${sampleIndex}`} className={styles.modalSampleRow}>
                                            <span className={styles.modalLabel}>Identificação:</span>
                                            <span>{amostra.identificacao || 'N/A'}</span>
                                            {amostra.horacoleta && (
                                                <span className={styles.modalTime}>({amostra.horacoleta})</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button className={styles.modalButton}>
                                    Abrir
                                </button>
                            </div>
                        ))
                    ) : (
                        (content as string[]).map((item, index) => (
                            <div key={`item-${index}`} className={styles.modalCard}>
                                <div className={styles.modalCardContent}>
                                    {item.split('\n').map((line, lineIndex) => (
                                        <p key={`line-${lineIndex}`} className={styles.modalText}>
                                            {line}
                                        </p>
                                    ))}
                                </div>
                                <button 
                                    className={styles.modalButton}
                                    onClick={() => {
                                        if (isColetaModal && coletas[index]) {
                                            WindowManager.openCadastrarColeta(coletas[index].id);
                                        }
                                    }}
                                >
                                    Abrir
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
});

// ClienteModal Component
const ClienteModal = React.memo(({ isOpen, onClose, cliente, onNovoCadastro, onCadastroExistente }) => {
    if (!isOpen || !cliente) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <button className={styles.modalClose} onClick={onClose}>
                    <X size={20} />
                </button>
                <h2 className={styles.modalTitle}>Cliente Não Cadastrado</h2>
                
                <div className={styles.clienteDetails}>
                    <p><strong>Nome:</strong> {cliente.nome_cliente || 'Não informado'}</p>
                    <p><strong>Documento:</strong> {cliente.documento || 'Não informado'}</p>
                    <p><strong>Telefone:</strong> {cliente.telefone || 'Não informado'}</p>
                    <p><strong>Email:</strong> {cliente.email || 'Não informado'}</p>
                </div>

                <div className={styles.modalActions}>
                    <button 
                        className={`${styles.modalButton} ${styles.buttonSuccess}`}
                        onClick={() => onNovoCadastro(cliente)}
                    >
                        Novo Cadastro
                    </button>
                    <button 
                        className={`${styles.modalButton} ${styles.buttonPrimary}`}
                        onClick={onCadastroExistente}
                    >
                        Cadastro Existente
                    </button>
                    <button 
                        className={`${styles.modalButton} ${styles.buttonSecondary}`}
                        onClick={onClose}
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
});

export const Geral: React.FC = () => {
    const { navigate } = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalContent, setModalContent] = useState<(string | GroupedAmostra)[]>([]);
    const [isAmostraModal, setIsAmostraModal] = useState(false);
    const [isColetaModal, setIsColetaModal] = useState(false);
    
    const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
    const [clienteSelecionado, setClienteSelecionado] = useState<ClienteDetalhes | null>(null);
    
    const [clientesSemCadastro, setClientesSemCadastro] = useState<ClienteSemCadastro[]>([]);
    const [amostrasPreCadastradas, setAmostrasPreCadastradas] = useState<AmostraPreCadastrada[]>([]);
    const [coletas, setColetas] = useState<ColetaItem[]>([]);
    const [solicitacoesUsuarios, setSolicitacoesUsuarios] = useState<SolicitacaoUsuario[]>([]);
    const [coletasPortal, setColetasPortal] = useState<ColetaPortal[]>([]);
    
    const [loadingStates, setLoadingStates] = useState({
        clientes: false,
        amostras: false,
        coletas: false,
        solicitacoes: false,
        portal: false,
    });
    
    const [isReloading, setIsReloading] = useState(false);

    // Routing maps
    const subtitleRoutes = {
        clientes: [
            'cadastrar-clientes', 'visualizar-clientes', 'gerenciar-categoria',
            'cadastro-usuario-portal', 'gerenciar-setor', 'cadastrar-consultor',
            'cadastrar-laboratorio-terceirizado'
        ],
        estruturas: [
            'estrutura-tipo', 'estrutura-grupo', 'estrutura-matriz', 'estrutura-unidade',
            'estrutura-parametro', 'estrutura-pg-coleta', 'estrutura-pop', 'estrutura-tecnica',
            'estrutura-identificacao', 'estrutura-metodologia', 'estrutura-legislacao',
            'estrutura-categoria', 'estrutura-forma-contato', 'estrutura-observacao', 'estrutura-submatriz'
        ],
        relacionamentos: [
            'rel-parametro-pop', 'rel-limite-quantificacao', 'rel-legislacao-parametro',
            'rel-pacote-parametro', 'rel-tecnica-etapa'
        ],
        contas: ['cadastrar-calculo', 'visualizar-calculo']
    };

    const handleSubtitleNavigation = async (category: keyof typeof subtitleRoutes, index: number) => {
        const route = subtitleRoutes[category][index];
        if (!route) return;
        
        try {
            switch (route) {
                case 'cadastrar-clientes':
                    await WindowManager.openCadastroClientes();
                    break;
                case 'visualizar-clientes':
                    await WindowManager.openVisualizarCliente();
                    break;
                case 'gerenciar-categoria':
                    await WindowManager.openCadastrarCategoria();
                    break;
                case 'cadastro-usuario-portal':
                    await WindowManager.openUsuarioPortal();
                    break;
                case 'gerenciar-setor':
                    await WindowManager.openGerenciarSetor();
                    break;
                case 'cadastrar-consultor':
                    await WindowManager.openCadastrarConsultor();
                    break;
                case 'cadastrar-laboratorio-terceirizado':
                    await WindowManager.openCadastrarLabTerceirizado();
                    break;
                case 'rel-tecnica-etapa':
                    await WindowManager.openGerenciarTecnicaEtapa();
                    break;
                case 'estrutura-tipo':
                    await WindowManager.openGerenciarTipos();
                    break;
                case 'estrutura-grupo':
                    await WindowManager.openGerenciarGrupos();
                    break;
                case 'estrutura-matriz':
                    await WindowManager.openGerenciarMatrizes();
                    break;
                case 'estrutura-unidade':
                    await WindowManager.openGerenciarUnidades();
                    break;
                case 'estrutura-parametro':
                    await WindowManager.openGerenciarParametros();
                    break;
                case 'estrutura-pg-coleta':
                    await WindowManager.openGerenciarPGColeta();
                    break;
                case 'estrutura-pop':
                    await WindowManager.openGerenciarPops();
                    break;
                case 'estrutura-tecnica':
                    await WindowManager.openGerenciarTecnicas();
                    break;
                case 'estrutura-identificacao':
                    await WindowManager.openGerenciarIdentificacoes();
                    break;
                case 'estrutura-metodologia':
                    await WindowManager.openGerenciarMetodologias();
                    break;
                case 'estrutura-legislacao':
                    await WindowManager.openGerenciarLegislacoes();
                    break;
                case 'estrutura-categoria':
                    await WindowManager.openGerenciarCategorias();
                    break;
                case 'estrutura-forma-contato':
                    await WindowManager.openGerenciarFormasContato();
                    break;
                case 'estrutura-observacao':
                    await WindowManager.openGerenciarObservacoes();
                    break;
                case 'estrutura-submatriz':
                    await WindowManager.openGerenciarSubMatrizes();
                    break;
                case 'rel-parametro-pop':
                    await WindowManager.openGerenciarParametroPop();
                    break;
                case 'rel-legislacao-parametro':
                    await WindowManager.openGerenciarLegislacaoParametro();
                    break;
                case 'rel-limite-quantificacao':
                    await WindowManager.openGerenciarLqIncerteza();
                    break;
                case 'rel-pacote-parametro':
                    await WindowManager.openGerenciarPacotes();
                    break;
                default:
                    navigate(route as any);
                    break;
            }
        } catch (error) {
            console.error(`Erro ao tentar abrir a janela para a rota '${route}':`, error);
        }
    };

    // Data loading functions
    useEffect(() => {
        carregarDados();
    }, []);

    const setLoading = (key: keyof typeof loadingStates, value: boolean) => {
        setLoadingStates(prev => ({ ...prev, [key]: value }));
    };

    const carregarDados = async () => {
        setIsReloading(true);
        await Promise.all([
            carregarClientesSemCadastro(),
            carregarAmostras(),
            carregarColetas(),
            carregarSolicitacoes(),
            carregarPortal(),
        ]);
        setIsReloading(false);
    };

    const carregarClientesSemCadastro = async () => {
        setLoading('clientes', true);
        try {
            const response: GeralResponse = await core.invoke('buscar_clientes_sem_cadastro');
            if (response.success && response.data) {
                setClientesSemCadastro(response.data as ClienteSemCadastro[]);
            }
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        } finally {
            setLoading('clientes', false);
        }
    };

    const carregarAmostras = async () => {
        setLoading('amostras', true);
        try {
            const response: GeralResponse = await core.invoke('buscar_amostras_pre_cadastradas');
            if (response.success && response.data) {
                setAmostrasPreCadastradas(response.data as AmostraPreCadastrada[]);
            }
        } catch (error) {
            console.error('Erro ao carregar amostras:', error);
        } finally {
            setLoading('amostras', false);
        }
    };

    const carregarColetas = async () => {
        setLoading('coletas', true);
        try {
            const response: GeralResponse = await core.invoke('buscar_coletas');
            if (response.success && response.data) {
                setColetas(response.data as ColetaItem[]);
            }
        } catch (error) {
            console.error('Erro ao carregar coletas:', error);
        } finally {
            setLoading('coletas', false);
        }
    };

    const carregarSolicitacoes = async () => {
        setLoading('solicitacoes', true);
        try {
            const response: GeralResponse = await core.invoke('buscar_solicitacoes_usuarios');
            if (response.success && response.data) {
                setSolicitacoesUsuarios(response.data as SolicitacaoUsuario[]);
            }
        } catch (error) {
            console.error('Erro ao carregar solicitações:', error);
        } finally {
            setLoading('solicitacoes', false);
        }
    };

    const carregarPortal = async () => {
        setLoading('portal', true);
        try {
            const response: GeralResponse = await core.invoke('buscar_coletas_portal');
            if (response.success && response.data) {
                setColetasPortal(response.data as ColetaPortal[]);
            }
        } catch (error) {
            console.error('Erro ao carregar portal:', error);
        } finally {
            setLoading('portal', false);
        }
    };

    // Format functions
    const formatarClientes = (clientes: ClienteSemCadastro[]): string[] => {
        return clientes.map(cliente => {
            const nome = cliente.nome_cliente || 'Nome não informado';
            const doc = cliente.documento ? `Doc: ${cliente.documento}` : 'Documento não informado';
            const telefone = cliente.telefone ? `Tel: ${cliente.telefone}` : 'Telefone não informado';
            const email = cliente.email ? `Email: ${cliente.email}` : 'Email não informado';
            const contato = cliente.contato ? `Contato: ${cliente.contato}` : 'Contato não informado';
            return `${nome}\n${doc}\n${telefone}\n${contato}\n${email}`;
        });
    };

    const agruparAmostrasPorData = (amostras: AmostraPreCadastrada[]): GroupedAmostra[] => {
        const grouped: { [key: string]: AmostraPreCadastrada[] } = {};
        
        amostras.forEach(amostra => {
            const dateKey = amostra.dtcoleta_formatada || 'Data Desconhecida';
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(amostra);
        });
        
        return Object.keys(grouped).map(date => ({
            date,
            samples: grouped[date],
        }));
    };

    const formatarColetas = (coletas: ColetaItem[]): string[] => {
        return coletas.map(coleta => {
            const numero = coleta.numero || 'S/N';
            const prefixo = coleta.prefixo || '';
            const cliente = coleta.cliente || 'Cliente não informado';
            const data = coleta.data_coleta || '';
            return `${prefixo}${numero}\nCliente: ${cliente}\nData: ${data}`;
        });
    };

    const formatarSolicitacoes = (solicitacoes: SolicitacaoUsuario[]): string[] => {
        return solicitacoes.map(sol => {
            const nome = sol.nome_completo || 'Nome não informado';
            const email = sol.email || 'Email não informado';
            const fantasia = sol.fantasia ? `Empresa: ${sol.fantasia}` : 'Empresa não informada';
            return `${nome}\n${email}\n${fantasia}`;
        });
    };

    const formatarColetasPortal = (coletas: ColetaPortal[]): string[] => {
        return coletas.map(coleta => {
            const protocolo = coleta.protocolo || coleta.num_protocolo || 'Sem protocolo';
            const fantasia = coleta.fantasia || 'Cliente não informado';
            const urgencia = coleta.urgencia ? ' (URGENTE)' : '';
            return `Protocolo: ${protocolo}\nCliente: ${fantasia}${urgencia}`;
        });
    };

    // Modal handlers
    const openModal = useCallback((title: string, content: (string | GroupedAmostra)[], isAmostra: boolean = false, isColeta: boolean = false) => {
        setModalTitle(title);
        setModalContent(content);
        setIsAmostraModal(isAmostra);
        setIsColetaModal(isColeta);
        setIsModalOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setModalTitle('');
        setModalContent([]);
        setIsAmostraModal(false);
        setIsColetaModal(false);
    }, []);

    const openClienteModal = useCallback((cliente: ClienteSemCadastro) => {
        const clienteDetalhes: ClienteDetalhes = {
            id: cliente.id,
            nome_cliente: cliente.nome_cliente,
            documento: cliente.documento,
            telefone: cliente.telefone,
            email: cliente.email,
            origem: cliente.origem
        };
        setClienteSelecionado(clienteDetalhes);
        setIsClienteModalOpen(true);
    }, []);

    const closeClienteModal = useCallback(() => {
        setIsClienteModalOpen(false);
        setClienteSelecionado(null);
    }, []);

    const handleNovoCadastro = useCallback(async (cliente: ClienteDetalhes) => {
        try {
            const clienteData = {
                id: cliente.id,
                nome_cliente: cliente.nome_cliente,
                documento: cliente.documento,
                telefone: cliente.telefone,
                email: cliente.email,
                origem: cliente.origem
            };
            
            await WindowManager.openHistoricoUsuario(clienteData);
            closeClienteModal();
        } catch (error) {
            console.error('Erro ao abrir janela de cadastro:', error);
            navigate('cadastrar-clientes' as any);
            localStorage.setItem('clientePreenchimento', JSON.stringify(cliente));
            closeClienteModal();
        }
    }, [closeClienteModal, navigate]);

    const handleCadastroExistente = useCallback(async () => {
        try {
            await WindowManager.openVisualizarCliente();
            closeClienteModal();
        } catch (error) {
            console.error('Erro ao abrir janela de visualização:', error);
            navigate('visualizar-clientes' as any);
            closeClienteModal();
        }
    }, [closeClienteModal, navigate]);

    // Card data
    const statusCards = useMemo(() => [
        {
            title: "Clientes não Cadastrados",
            value: clientesSemCadastro.length.toString(),
            count: clientesSemCadastro.length,
            icon: <AlertCircle size={20} />,
            loading: loadingStates.clientes,
            modalContent: formatarClientes(clientesSemCadastro),
            isAmostra: false,
            isColeta: false,
        },
        {
            title: "Amostras Pré-Cadastradas",
            value: amostrasPreCadastradas.length.toString(),
            count: amostrasPreCadastradas.length,
            icon: <CheckCircle2 size={20} />,
            loading: loadingStates.amostras,
            modalContent: agruparAmostrasPorData(amostrasPreCadastradas),
            isAmostra: true,
            isColeta: false,
        },
        {
            title: "Coletas para Cadastrar",
            value: coletas.length.toString(),
            count: coletas.length,
            icon: <Truck size={20} />,
            loading: loadingStates.coletas,
            modalContent: formatarColetas(coletas),
            isAmostra: false,
            isColeta: true,
        },
        {
            title: "Solicitação de Usuários",
            value: solicitacoesUsuarios.length.toString(),
            count: solicitacoesUsuarios.length,
            icon: <UserPlus size={20} />,
            loading: loadingStates.solicitacoes,
            modalContent: formatarSolicitacoes(solicitacoesUsuarios),
            isAmostra: false,
            isColeta: false,
        },
        {
            title: "Solicitações do Portal",
            value: coletasPortal.length.toString(),
            count: coletasPortal.length,
            icon: <Globe size={20} />,
            loading: loadingStates.portal,
            modalContent: formatarColetasPortal(coletasPortal),
            isAmostra: false,
            isColeta: false,
        },
    ], [clientesSemCadastro, amostrasPreCadastradas, coletas, solicitacoesUsuarios, coletasPortal, loadingStates]);

    // Menu sections
    const menuSections = useMemo(() => [
        {
            id: "clientes",
            title: "Gestão de Clientes",
            icon: <Users size={32} />,
            category: "clientes",
            items: [
                { name: "Cadastrar Clientes", icon: <UserPlus size={16} />, description: "Adicionar novos clientes ao sistema", index: 0 },
                { name: "Visualizar Clientes", icon: <Search size={16} />, description: "Consultar e gerenciar clientes", index: 1 },
                { name: "Gerenciar Categorias", icon: <Package size={16} />, description: "Configurar categorias de clientes", index: 2 },
                { name: "Cadastro de Usuário no Portal", icon: <Globe size={16} />, description: "Adicionar usuários ao portal", index: 3 },
                { name: "Gerenciar Setores", icon: <Building size={16} />, description: "Configurar setores da empresa", index: 4 },
                { name: "Gerenciar Consultores", icon: <Users size={16} />, description: "Administrar consultores", index: 5 },
                { name: "Cadastrar Laboratório Terceirizado", icon: <Building size={16} />, description: "Adicionar laboratórios parceiros", index: 6 },
            ]
        },
        {
            id: "estruturas",
            title: "Estruturas",
            icon: <Building size={32} />,
            category: "estruturas",
            items: [
                { name: "Tipo", icon: <FileText size={16} />, description: "Gerenciar tipos", index: 0 },
                { name: "Grupo", icon: <Users size={16} />, description: "Configurar grupos", index: 1 },
                { name: "Matriz", icon: <Package size={16} />, description: "Administrar matrizes", index: 2 },
                { name: "Unidade", icon: <Building size={16} />, description: "Gerenciar unidades", index: 3 },
                { name: "Parâmetro", icon: <FileText size={16} />, description: "Configurar parâmetros", index: 4 },
                { name: "PG de Coleta", icon: <Package size={16} />, description: "Gerenciar PG de coleta", index: 5 },
                { name: "POP", icon: <FileText size={16} />, description: "Administrar POPs", index: 6 },
                { name: "Técnica", icon: <FileText size={16} />, description: "Configurar técnicas", index: 7 },
                { name: "Identificação", icon: <FileText size={16} />, description: "Gerenciar identificações", index: 8 },
                { name: "Metodologia", icon: <FileText size={16} />, description: "Configurar metodologias", index: 9 },
                { name: "Legislação", icon: <FileText size={16} />, description: "Administrar legislações", index: 10 },
                { name: "Categoria", icon: <Package size={16} />, description: "Gerenciar categorias", index: 11 },
                { name: "Forma de Contato", icon: <FileText size={16} />, description: "Configurar formas de contato", index: 12 },
                { name: "Observação", icon: <FileText size={16} />, description: "Administrar observações", index: 13 },
                { name: "Submatriz", icon: <Package size={16} />, description: "Gerenciar submatrizes", index: 14 }
            ]
        },
        {
            id: "relacionamentos",
            title: "Relacionamentos",
            icon: <Handshake size={32} />,
            category: "relacionamentos",
            items: [
                { name: "Parâmetro e POP", icon: <FileText size={16} />, description: "Vincular parâmetros aos POPs", index: 0 },
                { name: "Limite de Quantificação e Incerteza", icon: <FileText size={16} />, description: "Definir limites e incertezas", index: 1 },
                { name: "Legislação e Parâmetro", icon: <FileText size={16} />, description: "Associar legislações aos parâmetros", index: 2 },
                { name: "Pacote de Parâmetro", icon: <Package size={16} />, description: "Criar pacotes de parâmetros", index: 3 },
                { name: "Técnica e Etapa", icon: <FileText size={16} />, description: "Relacionar técnicas com etapas", index: 4 }
            ]
        },
        {
            id: "contas",
            title: "Gestão de Contas",
            icon: <Wallet size={32} />,
            category: "contas",
            items: [
                { name: "Cadastrar Cálculo", icon: <FileText size={16} />, description: "Adicionar novos cálculos ao sistema", index: 0 },
                { name: "Visualizar Cálculo", icon: <Search size={16} />, description: "Consultar cálculos existentes", index: 1 }
            ]
        }
    ], []);

    // Filter sections based on search
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

    // Callbacks
    const handleReload = useCallback(() => {
        carregarDados();
    }, []);

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

    const handleItemClick = useCallback((category: string, index: number) => {
        handleSubtitleNavigation(category as keyof typeof subtitleRoutes, index);
    }, []);

    return (
    <>
        <div className={styles.container}>
            {/* 👇 DIV ADICIONADA PARA CRIAR O CONTAINER FIXO 👇 */}
            <div className={styles.stickyTop}>
                {/* Header */}
                <header className={styles.header}>
                    <div className={styles.headerContent}>
                        <div className={styles.headerLeft}>
                            <div className={styles.headerIcon}>
                                <Package size={24} />
                            </div>
                            <div>
                                <h1 className={styles.headerTitle}>Central de Gestão</h1>
                                <p className={styles.headerSubtitle}>Monitoramento e Controle Geral do Sistema</p>
                            </div>
                        </div>
                        <div className={styles.headerActions}>
                            <button 
                                className={styles.reloadButton}
                                onClick={handleReload}
                                disabled={isReloading}
                            >
                                <RefreshCw size={18} className={isReloading ? styles.spinning : ''} />
                                {isReloading ? 'Recarregando...' : 'Recarregar'}
                            </button>
                            <button 
                                className={styles.searchButton}
                                onClick={toggleSearch}
                                title="Pesquisar"
                            >
                                <Search size={20} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Search Bar (agora dentro do container fixo) */}
                {showSearch && (
                    <div className={styles.searchBar}>
                        <div className={styles.searchContainer}>
                            <div className={styles.searchInputWrapper}>
                                <Search size={20} className={styles.searchIcon} />
                                <input
                                    type="text"
                                    placeholder="Pesquisar por módulos, funcionalidades ou categorias..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className={styles.searchInput}
                                    autoFocus
                                />
                                {searchTerm && (
                                    <button 
                                        onClick={clearSearch}
                                        className={styles.clearButton}
                                        title="Limpar pesquisa"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                            <div className={styles.searchInfo}>
                                {filteredSections.length} de {menuSections.length} módulos encontrados
                            </div>
                        </div>
                    </div>
                )}
            </div>
             {/* 👆 FIM DA DIV ADICIONADA 👆 */}

            {/* Conteúdo rolável da página */}
            <div className={styles.content}>
                {/* Status Cards */}
                <div className={styles.statusGrid}>
                    {statusCards.map((card, index) => (
                        <StatusCard 
                            key={`status-${index}`}
                            card={card}
                            onClick={() => !card.loading && card.count > 0 && openModal(card.title, card.modalContent, card.isAmostra, card.isColeta)}
                        />
                    ))}
                </div>

                {/* Search Results */}
                {searchTerm && filteredSections.length === 0 && (
                    <div className={styles.noResults}>
                        <Search size={48} />
                        <p>Nenhum módulo encontrado para sua pesquisa.</p>
                        <button onClick={clearSearch} className={styles.primaryButton}>
                            Limpar pesquisa
                        </button>
                    </div>
                )}

                {/* Menu Sections */}
                <div className={styles.sectionsGrid}>
                    {filteredSections.map((section) => (
                        <SectionCard 
                            key={section.id}
                            section={section}
                            onItemClick={(index) => handleItemClick(section.category, index)}
                        />
                    ))}
                </div>
            </div>
        </div>

        {/* Modals */}
        <Modal
            isOpen={isModalOpen}
            onClose={closeModal}
            title={modalTitle}
            content={modalContent}
            isAmostraModal={isAmostraModal}
            isColetaModal={isColetaModal}
            coletas={coletas}
        />

        <ClienteModal
            isOpen={isClienteModalOpen}
            onClose={closeClienteModal}
            cliente={clienteSelecionado}
            onNovoCadastro={handleNovoCadastro}
            onCadastroExistente={handleCadastroExistente}
        />
    </>
);
};

Geral.displayName = 'Geral';