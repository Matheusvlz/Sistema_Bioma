import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { core } from "@tauri-apps/api";
import { useRouter } from '../routes/Router';
import { FaUsers, FaTruck, FaFileAlt, FaGlobe, FaBuilding, FaHandshake, FaWallet, FaSpinner, FaSync } from 'react-icons/fa';
import { MdOutlineUnpublished, MdOutlinePlaylistAddCheck } from 'react-icons/md';
import { WindowManager } from '../hooks/WindowManager';
import styles from './css/Geral.module.css';

interface CardProps {
  title: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor?: string;
  onClick?: () => void;
  subtitles?: string[];
  loading?: boolean;
}

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

const Card: React.FC<CardProps & { onSubtitleClick?: (index: number) => void }> = React.memo(({
  title, icon, bgColor, textColor = '#fff', onClick, subtitles, loading, onSubtitleClick
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isClickable = onClick ? true : false;
  const colorClass = textColor === '#111827' ? `${styles["text-dark"]}` : `${styles["text-light"]}`;

  const handleMouseEnter = () => {
    if (subtitles && subtitles.length > 0) {
      setIsExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    setIsExpanded(false);
  };

  const handleSubtitleClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    onSubtitleClick?.(index);
  };

  return (
    <div
      className={`${styles["card-base"]} ${isClickable ? `${styles["card-clickable"]}` : ''} ${colorClass} ${isExpanded ? `${styles["expanded"]}` : ''}`}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ background: bgColor, color: textColor }}
    >
      <div className={styles["card-icon"]}>
        {loading ? <FaSpinner className={styles["spin"]} /> : icon}
      </div>
      <h3 className={styles["card-title"]}>{title}</h3>
      {subtitles && (
        <div className={styles["card-subtitles-container"]}>
          {subtitles.map((sub, index) => (
            <React.Fragment key={index}>
              <span
                className={`${styles["card-subtitle-item"]} ${styles["subtitle-clickable"]}`}
                onClick={(e) => handleSubtitleClick(e, index)}
                style={{ cursor: 'pointer' }}
              >
                {sub}
              </span>
              {index < subtitles.length - 1 && (
                <span className={styles["card-subtitle-separator"]} style={{ background: textColor }}></span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
});

Card.displayName = 'Card';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: (string | GroupedAmostra)[];
  isAmostraModal: boolean;
  modalTitle: string;
  clientesSemCadastro: ClienteSemCadastro[];
  openClienteModal: (cliente: ClienteSemCadastro) => void;
}

const Modal: React.FC<ModalProps> = React.memo(({ isOpen, onClose, title, content, isAmostraModal, modalTitle, clientesSemCadastro, openClienteModal }) => {
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  }, [onClose]);

  const handleContentClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleItemClick = useCallback((item: string | GroupedAmostra, index?: number) => {
    if (typeof item === 'string') {
      if (modalTitle.includes('Clientes não Cadastrados') && index !== undefined) {
        const cliente = clientesSemCadastro[index];
        if (cliente) {
          openClienteModal(cliente);
          return;
        }
      }
      alert(`Detalhes de: ${item}`);
    } else {
      alert(`Detalhes das amostras da data: ${item.date}`);
    }
  }, [modalTitle, clientesSemCadastro, openClienteModal]);

  if (!isOpen) return null;

  return (
    <div className={`${styles["modal-overlay"]} ${styles["modal-fade-in"]}`} onClick={handleOverlayClick}>
      <div className={styles["modal-content2"]} onClick={handleContentClick}>
        <button onClick={onClose} className={styles["modal-close-button"]} aria-label="Fechar Modal">&times;</button>
        <h2 className={styles["modal-title"]}>{title}</h2>
        <ul className={styles["modal-list"]}>
          {isAmostraModal ? (
            (content as GroupedAmostra[]).map((group, groupIndex) => (
              <li key={`group-${groupIndex}`} className={`${styles["modal-list-item"]} ${styles["modal-item-card"]}`}>
                <div className={styles["modal-item-content"]}>
                  <div className={styles["modal-date-header"]}>{group.date}</div>
                  {group.samples.map((amostra, sampleIndex) => (
                    <div key={`sample-${sampleIndex}`} className={styles["modal-item-row"]}>
                      <span className={styles["modal-label"]}>Identificação:</span>
                      <span className={styles["modal-item-text"]}>{amostra.identificacao || 'N/A'}</span>
                      <span className={styles["modal-identificacao"]}>{amostra.horacoleta ? `(${amostra.horacoleta})` : ''}</span>
                    </div>
                  ))}
                </div>
                <button className={styles["modal-button"]} onClick={() => handleItemClick(group)}>
                  Abrir
                </button>
              </li>
            ))
          ) : (
            (content as string[]).map((item, index) => (
              <li key={`item-${index}`} className={`${styles["modal-list-item"]} ${styles["modal-item-card"]}`}>
                <div className={styles["modal-item-content"]}>
                  {item.split('\n').map((line, lineIndex) => (
                    <p key={`line-${lineIndex}`} className={styles["modal-item-text"]}>{line}</p>
                  ))}
                </div>
                <button className={styles["modal-button"]} onClick={() => handleItemClick(item, index)}>
                  Abrir
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
});

Modal.displayName = 'Modal';

interface ClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: ClienteDetalhes | null;
  onNovoCadastro: (cliente: ClienteDetalhes) => void;
  onCadastroExistente: () => void;
}

const ClienteModal: React.FC<ClienteModalProps> = React.memo(({ isOpen, onClose, cliente, onNovoCadastro, onCadastroExistente }) => {
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  }, [onClose]);

  const handleContentClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  if (!isOpen || !cliente) return null;

  return (
    <div className={`${styles["modal-overlay"]} ${styles["modal-fade-in"]}`} onClick={handleOverlayClick}>
      <div className={styles["modal-content2"]} onClick={handleContentClick} style={{ maxWidth: '500px' }}>
        <button onClick={onClose} className={styles["modal-close-button"]} aria-label="Fechar Modal">&times;</button>
        <h2 className={styles["modal-title"]}>Cliente Não Cadastrado</h2>

        <div style={{ padding: '20px 0' }}>
          <p><strong>Nome:</strong> {cliente.nome_cliente || 'Não informado'}</p>
          <p><strong>Documento:</strong> {cliente.documento || 'Não informado'}</p>
          <p><strong>Telefone:</strong> {cliente.telefone || 'Não informado'}</p>
          <p><strong>Email:</strong> {cliente.email || 'Não informado'}</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className={styles["modal-button"]}
            onClick={() => onNovoCadastro(cliente)}
            style={{ backgroundColor: '#10B981', color: 'white' }}
          >
            Novo Cadastro
          </button>
          <button
            className={styles["modal-button"]}
            onClick={onCadastroExistente}
            style={{ backgroundColor: '#3B82F6', color: 'white' }}
          >
            Cadastro Existente
          </button>
          <button
            className={styles["modal-button"]}
            onClick={onClose}
            style={{ backgroundColor: '#6B7280', color: 'white' }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
});

ClienteModal.displayName = 'ClienteModal';

export const Geral: React.FC = () => {
  const { navigate } = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState<(string | GroupedAmostra)[]>([]);
  const [isAmostraModal, setIsAmostraModal] = useState(false);

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

  const subtitleRoutes = {
    clientes: [
      'cadastrar-clientes', 'visualizar-clientes', 'gerenciar-categoria',
      'cadastro-usuario-portal', 'cadastrar-setor-usuario', 'cadastrar-consultor',
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
    if (route) {
      if (category === 'clientes') {
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
            default:
              navigate(route as any);
              break;
          }
        } catch (error) {
          console.error('Erro ao abrir janela:', error);
          navigate(route as any);
        }
      } else {
        navigate(route as any);
      }
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const setLoading = (key: keyof typeof loadingStates, value: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  };

  const carregarDados = () => {
    carregarClientes();
    carregarAmostras();
    carregarColetas();
    carregarSolicitacoes();
    carregarPortal();
  };

  const handleReload = async () => {
    setIsReloading(true);
    try {
      await Promise.all([
        carregarClientes(),
        carregarAmostras(),
        carregarColetas(),
        carregarSolicitacoes(),
        carregarPortal()
      ]);
    } catch (error) {
      console.error('Erro ao recarregar dados:', error);
    } finally {
      setIsReloading(false);
    }
  };

  const carregarClientes = async () => {
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

  const openModal = useCallback((title: string, content: (string | GroupedAmostra)[], isAmostra: boolean = false) => {
    setModalTitle(title);
    setModalContent(content);
    setIsAmostraModal(isAmostra);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setModalTitle('');
    setModalContent([]);
    setIsAmostraModal(false);
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

      await WindowManager.openCadastroClientes(clienteData);
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

  const topCardsData = useMemo(() => [
    {
      title: `Clientes não Cadastrados ${clientesSemCadastro.length > 0 ? `(${clientesSemCadastro.length})` : ''}`,
      icon: <MdOutlineUnpublished />,
      bgColor: '#EF4444',
      modalContent: formatarClientes(clientesSemCadastro),
      loading: loadingStates.clientes,
      isAmostra: false,
    },
    {
      title: `Amostras Pré-Cadastradas ${amostrasPreCadastradas.length > 0 ? `(${amostrasPreCadastradas.length})` : ''}`,
      icon: <MdOutlinePlaylistAddCheck />,
      bgColor: '#F97316',
      modalContent: agruparAmostrasPorData(amostrasPreCadastradas),
      loading: loadingStates.amostras,
      isAmostra: true,
    },
    {
      title: `Coletas para Cadastrar ${coletas.length > 0 ? `(${coletas.length})` : ''}`,
      icon: <FaTruck />,
      bgColor: '#06B6D4',
      modalContent: formatarColetas(coletas),
      loading: loadingStates.coletas,
      isAmostra: false,
    },
    {
      title: `Solicitação de Cadastro de Usuários ${solicitacoesUsuarios.length > 0 ? `(${solicitacoesUsuarios.length})` : ''}`,
      icon: <FaFileAlt />,
      bgColor: '#8B5CF6',
      modalContent: formatarSolicitacoes(solicitacoesUsuarios),
      loading: loadingStates.solicitacoes,
      isAmostra: false,
    },
    {
      title: `Solicitações do Portal ${coletasPortal.length > 0 ? `(${coletasPortal.length})` : ''}`,
      icon: <FaGlobe />,
      bgColor: '#10B981',
      modalContent: formatarColetasPortal(coletasPortal),
      loading: loadingStates.portal,
      isAmostra: false,
    },
  ], [clientesSemCadastro, amostrasPreCadastradas, coletas, solicitacoesUsuarios, coletasPortal, loadingStates]);

  const bottomCardsData = useMemo(() => [
    {
      title: 'Clientes',
      icon: <FaUsers />,
      subtitles: ['Cadastrar Clientes', 'Visualizar Clientes', 'Gerenciar Categorias', 'Cadastro de Usuário no Portal', 'Cadastrar Setor de Usuário', 'Cadastrar Consultor', 'Cadastrar Laboratório Terceirizado'],
      category: 'clientes' as const,
    },
    {
      title: 'Estruturas',
      icon: <FaBuilding />,
      subtitles: ['Tipo', 'Grupo', 'Matriz', 'Unidade', 'Parâmetro', 'PG de Coleta', 'POP', 'Técnica', 'Identificação', 'Metodologia', 'Legislação', 'Categoria', 'Forma de Contato', 'Observação', 'Submatriz'],
      category: 'estruturas' as const,
    },
    {
      title: 'Relacionamentos',
      icon: <FaHandshake />,
      subtitles: ['Parâmetro e POP', 'Limite de Quantificação e Incerteza', 'Legislação e Parâmetro', 'Pacote de Parâmetro', 'Técnica e Etapa'],
      category: 'relacionamentos' as const,
    },
    {
      title: 'Contas',
      icon: <FaWallet />,
      subtitles: ['Cadastrar Cálculo', 'Visualizar Cálculo'],
      category: 'contas' as const,
    },
  ], []);

  const isAnyLoading = Object.values(loadingStates).some(loading => loading);

  return (
    <> {/* Added React Fragment here */}
      <div className={styles["geral-container"]}>
        <div className={styles["geral-header"]}>

          <h1 className={styles["geral-title"]}>
            Geral {isAnyLoading && <span style={{ fontSize: '14px', color: '#666' }}>(Carregando...)</span>}
          </h1>
          {/* Botão de Reload */}
          <button
            className={styles["reload-button"]}
            onClick={handleReload}
            disabled={isReloading}
            title="Recarregar dados"
          >
            <FaSync className={`${styles["reload-icon"]} ${isReloading ? `${styles["spinning"]}` : ''}`} />
            {isReloading ? 'Recarregando...' : 'Recarregar'}
          </button>
        </div>

        <div className={styles["top-cards-grid"]}>
          {topCardsData.map((card, index) => (
            <Card
              key={`top-${index}`}
              title={card.title}
              icon={card.icon}
              bgColor={card.bgColor}
              loading={card.loading}
              onClick={() => !card.loading && openModal(card.title, card.modalContent, card.isAmostra)}
            />
          ))}
        </div>

        <div className={styles["bottom-cards-container"]}>
          {bottomCardsData.map((card, index) => (
            <Card
              key={`bottom-${index}`}
              title={card.title}
              icon={card.icon}
              bgColor="#F3F4F6"
              textColor="#111827"
              subtitles={card.subtitles}
              onSubtitleClick={(subtitleIndex) => handleSubtitleNavigation(card.category, subtitleIndex)}
            />
          ))}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={modalTitle}
        content={modalContent}
        isAmostraModal={isAmostraModal}
        modalTitle={modalTitle}
        clientesSemCadastro={clientesSemCadastro}
        openClienteModal={openClienteModal}
      />

      <ClienteModal
        isOpen={isClienteModalOpen}
        onClose={closeClienteModal}
        cliente={clienteSelecionado}
        onNovoCadastro={handleNovoCadastro}
        onCadastroExistente={handleCadastroExistente}
      />
    </> // Added React Fragment here
  );
};