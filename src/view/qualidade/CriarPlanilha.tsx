import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Settings, 
  Download, 
  Upload,
  Edit3,
  Copy,
  Trash2,
  FileSpreadsheet,
  BarChart3,
  Folder,
  RefreshCw,
  Zap,
  X,
  FileText,
  FolderPen
} from 'lucide-react';
import styles from './styles/criarplanilha.module.css';
import { WindowManager } from '../../hooks/WindowManager';
interface Planilha {
  id: string;
  nome: string;
  descricao: string;
  dataModificacao: string;
  tipo: 'template' | 'personalizada';
  categoria: string;
  autor: string;
}

interface ModalCreateProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFromScratch: () => void;
  onCreateFromTemplate: () => void;
}

const ModalCreate: React.FC<ModalCreateProps> = ({ 
  isOpen, 
  onClose, 
    onCreateFromTemplate 
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles["modal-overlay"]} onClick={onClose}>
      <div className={styles["modal"]} onClick={(e) => e.stopPropagation()}>
        <div className={styles["modal-header"]}>
          <h2 className={styles["modal-title"]}>Criar Nova Planilha</h2>
          <button className={styles["close-button"]} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className={styles["modal-options"]}>
          {/* CORREÇÃO APLICADA AQUI */}
          <div className={styles["option-card"]} onClick={() => {
            WindowManager.openCadastrarPlanilha();
            onClose(); // Também é uma boa prática fechar o modal após a ação
          }}>
            <div className={styles["option-icon"]}>
              <FileSpreadsheet size={40} />
            </div>
            <h3 className={styles["option-title"]}>Criar do Zero</h3>
            <p className={styles["option-description"]}>
              Comece com uma planilha em branco e construa do seu jeito
            </p>
          </div>
          
          <div className={styles["option-card"]} onClick={onCreateFromTemplate}>
            <div className={styles["option-icon"]}>
              <FolderPen size={40} />
            </div>
            <h3 className={styles["option-title"]}>Usar Template</h3>
            <p className={styles["option-description"]}>
              Escolha um modelo pré-definido para começar rapidamente
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export const CriarPlanilha: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('todas');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Dados mockados para demonstração
  const planilhas: Planilha[] = [
    {
      id: '1',
      nome: 'Controle Financeiro Pessoal',
      descricao: 'Planilha para controle de receitas e despesas mensais',
      dataModificacao: '2024-01-15',
      tipo: 'template',
      categoria: 'Financeiro',
      autor: 'Sistema'
    },
    {
      id: '2',
      nome: 'Relatório de Vendas Q4',
      descricao: 'Análise de vendas do último trimestre com gráficos',
      dataModificacao: '2024-01-10',
      tipo: 'personalizada',
      categoria: 'Vendas',
      autor: 'João Silva'
    },
    {
      id: '3',
      nome: 'Inventário de Produtos',
      descricao: 'Controle de estoque e movimentação de produtos',
      dataModificacao: '2024-01-08',
      tipo: 'personalizada',
      categoria: 'Estoque',
      autor: 'Maria Santos'
    },
    {
      id: '4',
      nome: 'Planejamento de Projetos',
      descricao: 'Template para gerenciamento de cronograma e tarefas',
      dataModificacao: '2024-01-05',
      tipo: 'template',
      categoria: 'Projetos',
      autor: 'Sistema'
    },
    {
      id: '5',
      nome: 'Análise de Performance',
      descricao: 'Dashboard de KPIs e métricas de performance',
      dataModificacao: '2024-01-03',
      tipo: 'personalizada',
      categoria: 'Analytics',
      autor: 'Pedro Costa'
    },
    {
      id: '6',
      nome: 'Controle de Orçamento',
      descricao: 'Planejamento e acompanhamento de orçamento anual',
      dataModificacao: '2024-01-02',
      tipo: 'template',
      categoria: 'Financeiro',
      autor: 'Sistema'
    },
    {
      id: '7',
      nome: 'Relatório de Marketing',
      descricao: 'Métricas de campanhas e ROI de marketing digital',
      dataModificacao: '2024-01-01',
      tipo: 'personalizada',
      categoria: 'Marketing',
      autor: 'Ana Costa'
    },
    {
      id: '8',
      nome: 'Gestão de Recursos Humanos',
      descricao: 'Controle de funcionários, férias e benefícios',
      dataModificacao: '2023-12-28',
      tipo: 'template',
      categoria: 'RH',
      autor: 'Sistema'
    }
  ];

  const filtros = [
    { id: 'todas', label: 'Todas' },
    { id: 'template', label: 'Templates' },
    { id: 'personalizada', label: 'Personalizadas' },
    { id: 'recentes', label: 'Recentes' }
  ];

  const planilhasFiltradas = useMemo(() => {
    let resultado = planilhas;

    // Filtro por busca
    if (searchTerm) {
      resultado = resultado.filter(planilha =>
        planilha.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        planilha.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        planilha.categoria.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por tipo
    if (selectedFilter !== 'todas') {
      if (selectedFilter === 'recentes') {
        resultado = resultado.sort((a, b) => 
          new Date(b.dataModificacao).getTime() - new Date(a.dataModificacao).getTime()
        ).slice(0, 3);
      } else {
        resultado = resultado.filter(planilha => planilha.tipo === selectedFilter);
      }
    }

    return resultado;
  }, [searchTerm, selectedFilter]);

  const handleCreateFromScratch = () => {
    setIsModalOpen(false);
    alert('Criando planilha do zero...');
  };

  const handleCreateFromTemplate = () => {
    setIsModalOpen(false);
    alert('Abrindo galeria de templates...');
  };

  const handleEditTemplate = () => {
    alert('Abrindo editor de templates...');
  };

  const handleImportPlanilha = () => {
    alert('Abrindo importador de planilhas...');
  };

  const handleExportPlanilha = (id: string) => {
    alert(`Exportando planilha ${id}...`);
  };

  const handleEditPlanilha = (id: string) => {
    alert(`Editando planilha ${id}...`);
  };

  const handleDuplicatePlanilha = (id: string) => {
    alert(`Duplicando planilha ${id}...`);
  };

  const handleDeletePlanilha = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta planilha?')) {
      alert(`Excluindo planilha ${id}...`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const totalPlanilhas = planilhas.length;
  const totalTemplates = planilhas.filter(p => p.tipo === 'template').length;
  const totalPersonalizadas = planilhas.filter(p => p.tipo === 'personalizada').length;

  return (
    <div className={styles["scroll-container"]}>
      <div className={styles["container"]}>
        <div className={styles["header"]}>
          <div>
            <h1 className={styles["title"]}>Gerenciar Planilhas</h1>
            <p className={styles["subtitle"]}>
              Crie, edite e organize suas planilhas e templates
            </p>
          </div>
          <div className={styles["main-actions"]}>
            <button 
              className={styles["secondary-button"]}
              onClick={handleEditTemplate}
            >
              <Settings size={18} />
              Editar Templates
            </button>
            <button 
              className={styles["secondary-button"]}
              onClick={handleImportPlanilha}
            >
              <Upload size={18} />
              Importar
            </button>
            <button 
              className={styles["primary-button"]}
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={18} />
              Nova Planilha
            </button>
          </div>
        </div>

        <div className={styles["search-section"]}>
          <div className={styles["search-container"]}>
            <Search className={styles["search-icon"]} size={20} />
            <input
              type="text"
              placeholder="Buscar planilhas por nome, descrição ou categoria..."
              className={styles["search-input"]}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className={styles["filters-container"]}>
            {filtros.map(filtro => (
              <button
                key={filtro.id}
                className={`${styles["filter-chip"]} ${selectedFilter === filtro.id ? styles["active"] : ''}`}
                onClick={() => setSelectedFilter(filtro.id)}
              >
                {filtro.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles["content-grid"]}>
          <div className={styles["planilhas-list"]}>
            <div className={styles["list-header"]}>
              <h2 className={styles["list-title"]}>
                {planilhasFiltradas.length} planilha(s) encontrada(s)
              </h2>
              <FileSpreadsheet size={24} />
            </div>
            
            <div className={styles["planilhas-scroll-container"]}>
              {planilhasFiltradas.length === 0 ? (
                <div className={styles["empty-state"]}>
                  <div className={styles["empty-icon"]}>
                    <FileText size={64} />
                  </div>
                  <h3 className={styles["empty-title"]}>Nenhuma planilha encontrada</h3>
                  <p className={styles["empty-description"]}>
                    Tente ajustar os filtros ou criar uma nova planilha
                  </p>
                  <button 
                    className={styles["primary-button"]}
                    onClick={() => setIsModalOpen(true)}
                  >
                    <Plus size={18} />
                    Criar Primeira Planilha
                  </button>
                </div>
              ) : (
                planilhasFiltradas.map(planilha => (
                  <div key={planilha.id} className={styles["planilha-item"]}>
                    <div className={styles["planilha-header"]}>
                      <div>
                        <h3 className={styles["planilha-name"]}>{planilha.nome}</h3>
                        <span className={styles["planilha-date"]}>
                          Modificado em {formatDate(planilha.dataModificacao)} • {planilha.autor}
                        </span>
                      </div>
                      <span className={styles["filter-chip"]}>
                        {planilha.categoria}
                      </span>
                    </div>
                    
                    <p className={styles["planilha-description"]}>
                      {planilha.descricao}
                    </p>
                    
                    <div className={styles["planilha-actions"]}>
                      <button 
                        className={`${styles["action-button"]} ${styles["primary"]}`}
                        onClick={() => handleEditPlanilha(planilha.id)}
                      >
                        <Edit3 size={14} />
                        Abrir
                      </button>
                      <button 
                        className={styles["action-button"]}
                        onClick={() => handleDuplicatePlanilha(planilha.id)}
                      >
                        <Copy size={14} />
                        Duplicar
                      </button>
                      <button 
                        className={styles["action-button"]}
                        onClick={() => handleExportPlanilha(planilha.id)}
                      >
                        <Download size={14} />
                        Exportar
                      </button>
                      <button 
                        className={styles["action-button"]}
                        onClick={() => handleDeletePlanilha(planilha.id)}
                        style={{ color: '#dc2626' }}
                      >
                        <Trash2 size={14} />
                        Excluir
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={styles["sidebar"]}>
            <div className={styles["sidebar-section"]}>
              <h3 className={styles["sidebar-title"]}>Estatísticas</h3>
              <div className={styles["stats-card"]}>
                <p className={styles["stats-number"]}>{totalPlanilhas}</p>
                <p className={styles["stats-label"]}>Total de Planilhas</p>
              </div>
              <div className={styles["stats-card"]}>
                <p className={styles["stats-number"]}>{totalTemplates}</p>
                <p className={styles["stats-label"]}>Templates Disponíveis</p>
              </div>
              <div className={styles["stats-card"]}>
                <p className={styles["stats-number"]}>{totalPersonalizadas}</p>
                <p className={styles["stats-label"]}>Planilhas Personalizadas</p>
              </div>
            </div>

            <div className={styles["sidebar-section"]}>
              <h3 className={styles["sidebar-title"]}>Ações Rápidas</h3>
              
              <div className={styles["quick-action"]} onClick={() => setIsModalOpen(true)}>
                <Plus className={styles["quick-action-icon"]} size={20} />
                <span className={styles["quick-action-text"]}>Nova Planilha</span>
              </div>
              
              <div className={styles["quick-action"]} onClick={handleEditTemplate}>
                <Settings className={styles["quick-action-icon"]} size={20} />
                <span className={styles["quick-action-text"]}>Gerenciar Templates</span>
              </div>
              
              <div className={styles["quick-action"]} onClick={handleImportPlanilha}>
                <Upload className={styles["quick-action-icon"]} size={20} />
                <span className={styles["quick-action-text"]}>Importar Planilha</span>
              </div>
              
              <div className={styles["quick-action"]}>
                <BarChart3 className={styles["quick-action-icon"]} size={20} />
                <span className={styles["quick-action-text"]}>Relatórios</span>
              </div>
              
              <div className={styles["quick-action"]}>
                <RefreshCw className={styles["quick-action-icon"]} size={20} />
                <span className={styles["quick-action-text"]}>Sincronizar</span>
              </div>
              
              <div className={styles["quick-action"]}>
                <Zap className={styles["quick-action-icon"]} size={20} />
                <span className={styles["quick-action-text"]}>Automações</span>
              </div>
            </div>

            <div className={styles["sidebar-section"]}>
              <h3 className={styles["sidebar-title"]}>Categorias</h3>
              {['Financeiro', 'Vendas', 'Estoque', 'Projetos', 'Analytics', 'Marketing', 'RH'].map(categoria => (
                <div key={categoria} className={styles["quick-action"]}>
                  <Folder className={styles["quick-action-icon"]} size={20} />
                  <span className={styles["quick-action-text"]}>{categoria}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <ModalCreate
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreateFromScratch={handleCreateFromScratch}
          onCreateFromTemplate={handleCreateFromTemplate}
        />
      </div>
    </div>
  );
};