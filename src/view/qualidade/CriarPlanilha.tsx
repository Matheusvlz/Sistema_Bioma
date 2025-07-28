import React, { useState, useMemo, useEffect } from 'react';
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
  FolderPen,
  Loader2
} from 'lucide-react';
import styles from './styles/criarplanilha.module.css';
import { WindowManager } from '../../hooks/WindowManager';
import { invoke } from '@tauri-apps/api/core';

// Interface para dados do template do servidor
interface TemplateData {
  id?: number;
  caminho_arquivo: string;
  nome_arquivo: string;
  tag?: string;
  tipo: string;
  json_data_base64?: string;
  updated_at: string | null; // O backend pode retornar uma string de data ou null
}
interface ReponseType {
type: String;
templateData?: TemplateData | null; 
}
// Interface adaptada para exibição
interface Planilha {
  id: string;
  nome: string;
  descricao: string;
  dataModificacao: string; // Garantimos que este campo será sempre uma string de data válida
  tipo: 'template' | 'personalizada';
  categoria: string;
  autor: string;
  templateData?: TemplateData; // Dados originais do servidor
}

interface ModalCreateProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFromScratch: () => void;
  onCreateFromTemplate: () => void;
}

interface ModalTemplateProps {
  isOpen: boolean;
  onClose: () => void;
  templates: Planilha[];
  onSelectTemplate: (planilha: Planilha) => void;
  loading: boolean;
}

const ModalTemplate: React.FC<ModalTemplateProps> = ({ 
  isOpen, 
  onClose, 
  templates, 
  onSelectTemplate,
  loading 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredTemplates = useMemo(() => {
    if (!searchTerm) return templates;
    
    return templates.filter(template =>
      template.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.categoria.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [templates, searchTerm]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Data inválida';
      }
      return date.toLocaleDateString('pt-BR', {
          day: '2-digit', month: '2-digit', year: 'numeric'
      });
    } catch {
      return 'Data inválida';
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles["modal-overlay"]} onClick={onClose}>
      <div className={styles["modal"]} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '80vh' }}>
        <div className={styles["modal-header"]}>
          <h2 className={styles["modal-title"]}>Escolher Template</h2>
          <button className={styles["close-button"]} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className={styles["search-container"]} style={{ margin: '20px 0' }}>
          <Search className={styles["search-icon"]} size={20} />
          <input
            type="text"
            placeholder="Buscar templates..."
            className={styles["search-input"]}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '0 20px' }}>
          {loading ? (
            <div className={styles["loading-state"]}>
              <Loader2 size={48} className="animate-spin" />
              <p>Carregando templates...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className={styles["empty-state"]}>
              <div className={styles["empty-icon"]}>
                <FolderPen size={64} />
              </div>
              <h3 className={styles["empty-title"]}>
                {searchTerm ? 'Nenhum template encontrado' : 'Nenhum template disponível'}
              </h3>
              <p className={styles["empty-description"]}>
                {searchTerm 
                  ? 'Tente ajustar o termo de busca' 
                  : 'Não há templates cadastrados no sistema'
                }
              </p>
            </div>
          ) : (
            filteredTemplates.map(template => (
              <div 
                key={template.id} 
                className={styles["planilha-item"]} 
                style={{ cursor: 'pointer', marginBottom: '12px' }}
                onClick={() => {
                  onSelectTemplate(template);
                  onClose();
                }}
              >
                <div className={styles["planilha-header"]}>
                  <div>
                    <h3 className={styles["planilha-name"]}>{template.nome}</h3>
                    <span className={styles["planilha-date"]}>
                      Modificado em {formatDate(template.dataModificacao)} • {template.autor}
                    </span>
                  </div>
                  <span className={styles["filter-chip"]}>
                    {template.categoria}
                  </span>
                </div>
                
                <p className={styles["planilha-description"]}>
                  {template.descricao}
                </p>
                
                <div className={styles["planilha-actions"]}>
                  <button 
                    className={`${styles["action-button"]} ${styles["primary"]}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTemplate(template);
                      onClose();
                    }}
                  >
                    <Copy size={14} />
                    Usar Template
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const ModalCreate: React.FC<ModalCreateProps> = ({ 
  isOpen, 
  onClose, 
  onCreateFromTemplate 
}) => {
  if (!isOpen) return null;
 const handleWindowOpen = () => {
    const dataEdit: ReponseType = {
        type: "Criar",
        templateData: null
      };

     WindowManager.openCadastrarPlanilha(dataEdit);
  };
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
          <div className={styles["option-card"]} onClick={() => {
            
            handleWindowOpen();
            onClose();
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
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [planilhas, setPlanilhas] = useState<Planilha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para converter TemplateData em Planilha
  const convertTemplateToPlannilha = (template: TemplateData): Planilha => {
    const categoria = template.tag || 'Geral';
    const tipo: 'template' | 'personalizada' = template.tipo === 'template' ? 'template' : 'personalizada';
    const descricao = `Planilha ${tipo === 'template' ? 'modelo' : 'personalizada'} - ${template.nome_arquivo}`;

    return {
      id: template.id?.toString() || Math.random().toString(),
      nome: template.nome_arquivo.replace(/\.[^/.]+$/, ''), // Remove extensão
      descricao,
      // CORREÇÃO: Trata o caso de 'updated_at' ser nulo.
      // Se for nulo, usamos uma data antiga como fallback para evitar erros.
      dataModificacao: template.updated_at || new Date(0).toISOString(),
      tipo,
      categoria,
      autor: tipo === 'template' ? 'Sistema' : 'Usuário',
      templateData: template
    };
  };

  // Carregar planilhas do servidor
  const loadPlanilhas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Carregando templates do servidor...');
      const templates = await invoke<TemplateData[]>('list_templates');
      console.log('Templates carregados:', templates);
      
      const planilhasConvertidas = templates.map(convertTemplateToPlannilha);
      setPlanilhas(planilhasConvertidas);
      
    } catch (err) {
      console.error('Erro ao carregar planilhas:', err);
      const errorMessage = typeof err === 'string' ? err : 'Erro desconhecido ao carregar planilhas.';
      setError(errorMessage);
      setPlanilhas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlanilhas();
  }, []);

  const filtros = [
    { id: 'todas', label: 'Todas' },
    { id: 'template', label: 'Templates' },
    { id: 'personalizada', label: 'Personalizadas' },
    { id: 'recentes', label: 'Recentes' }
  ];

  const planilhasFiltradas = useMemo(() => {
    let resultado = [...planilhas]; // Criar uma cópia para não modificar o estado original

    if (searchTerm) {
      resultado = resultado.filter(planilha =>
        planilha.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        planilha.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        planilha.categoria.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedFilter !== 'todas') {
      if (selectedFilter === 'recentes') {
        resultado.sort((a, b) => 
          new Date(b.dataModificacao).getTime() - new Date(a.dataModificacao).getTime()
        );
      } else {
        resultado = resultado.filter(planilha => planilha.tipo === selectedFilter);
      }
    }

    return resultado;
  }, [searchTerm, selectedFilter, planilhas]);

  // Filtra apenas os templates para o modal
  const templatesDisponiveis = useMemo(() => {
    return planilhas.filter(planilha => planilha.tipo === 'template');
  }, [planilhas]);

  const handleCreateFromScratch = () => {
    setIsModalOpen(false);
    alert('Criando planilha do zero...');
  };

  const handleCreateFromTemplate = () => {
    setIsModalOpen(false);
    setIsTemplateModalOpen(true);
  };

  const handleSelectTemplate = (template: Planilha) => {
    handleDuplicatePlanilha(template);
  };

  const handleExportPlanilha = async (id: string) => {
    try {
      const planilha = planilhas.find(p => p.id === id);
      if (planilha?.templateData?.id) {
        alert(`Exportando planilha ${planilha.nome}...`);
      }
    } catch (err) {
      console.error('Erro ao exportar planilha:', err);
      alert('Erro ao exportar planilha');
    }
  };

  const handleEditPlanilha = async (planilha: Planilha) => {
  try {

    // Caso contrário, buscar o template usando o ID da planilha
    const templateId = Number(planilha.templateData?.id);
    
    // Verificar se o ID é válido
    if (isNaN(templateId)) {
      throw new Error('ID da planilha não é um número válido');
    }

    const templateData = await invoke<TemplateData>('get_template_by_id', { 
      id: templateId 
    });

    const dataEdit: ReponseType = {
      type: "Editar",
      templateData: templateData
    };

    WindowManager.openCadastrarPlanilha(dataEdit);
    
  } catch (err) {
    console.error('Erro ao carregar template para edição:', err);
    alert('Erro ao abrir planilha para edição');
  }
};

  const handleDuplicatePlanilha = async (planilha: Planilha) => {
 try {
    const templateId = Number(planilha.templateData?.id);
    
    // Verificar se o ID é válido
    if (isNaN(templateId)) {
      throw new Error('ID da planilha não é um número válido');
    }

    const templateData = await invoke<TemplateData>('get_template_by_id', { 
      id: templateId 
    });

    const dataEdit: ReponseType = {
      type: "Duplicar",
      templateData: templateData
    };

    WindowManager.openCadastrarPlanilha(dataEdit);
    
  } catch (err) {
    console.error('Erro ao carregar template para edição:', err);
    alert('Erro ao abrir planilha para edição');
  }
  };

  const handleDeletePlanilha = async (id: string) => {
    const planilha = planilhas.find(p => p.id === id);
    if (!planilha?.templateData?.id) return;
    
    if (confirm(`Tem certeza que deseja excluir a planilha "${planilha.nome}"?`)) {
      try {
        await invoke('delete_template', { id: planilha.templateData.id });
        alert(`Planilha "${planilha.nome}" excluída com sucesso!`);
        loadPlanilhas();
      } catch (err) {
        console.error('Erro ao excluir planilha:', err);
        alert('Erro ao excluir planilha');
      }
    }
  };

  const handleRefresh = () => {
    loadPlanilhas();
  };

  // Função de formatação de data mais segura
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Verifica se a data é válida antes de formatar
      if (isNaN(date.getTime())) {
        return 'Data inválida';
      }
      return date.toLocaleDateString('pt-BR', {
          day: '2-digit', month: '2-digit', year: 'numeric'
      });
    } catch {
      return 'Data inválida';
    }
  };

  const totalPlanilhas = planilhas.length;
  const totalTemplates = planilhas.filter(p => p.tipo === 'template').length;
  const totalPersonalizadas = planilhas.filter(p => p.tipo === 'personalizada').length;
  const categorias = Array.from(new Set(planilhas.map(p => p.categoria))).sort();

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
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              Atualizar
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

        {error && (
          <div className={styles["error-message"]}>
            <p>Erro: {error}</p>
            <button onClick={handleRefresh} className={styles["retry-button"]}>
              Tentar novamente
            </button>
          </div>
        )}

        <div className={styles["content-grid"]}>
          <div className={styles["planilhas-list"]}>
            <div className={styles["list-header"]}>
              <h2 className={styles["list-title"]}>
                {loading ? 'Carregando...' : `${planilhasFiltradas.length} planilha(s) encontrada(s)`}
              </h2>
              <FileSpreadsheet size={24} />
            </div>
            
            <div className={styles["planilhas-scroll-container"]}>
              {loading ? (
                <div className={styles["loading-state"]}>
                  <Loader2 size={48} className="animate-spin" />
                  <p>Carregando planilhas do servidor...</p>
                </div>
              ) : planilhasFiltradas.length === 0 ? (
                <div className={styles["empty-state"]}>
                  <div className={styles["empty-icon"]}>
                    <FileText size={64} />
                  </div>
                  <h3 className={styles["empty-title"]}>
                    {error ? 'Erro ao carregar planilhas' : 'Nenhuma planilha encontrada'}
                  </h3>
                  <p className={styles["empty-description"]}>
                    {error 
                      ? 'Verifique sua conexão e tente novamente' 
                      : 'Tente ajustar os filtros ou criar uma nova planilha'
                    }
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
                        onClick={() => handleEditPlanilha(planilha)}
                      >
                        <Edit3 size={14} />
                        Abrir
                      </button>
                      <button 
                        className={styles["action-button"]}
                        onClick={() => handleDuplicatePlanilha(planilha)}
                      >
                        <Copy size={14} />
                        Duplicar
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
        
              <div className={styles["quick-action"]} onClick={handleRefresh}>
                <RefreshCw className={styles["quick-action-icon"]} size={20} />
                <span className={styles["quick-action-text"]}>Sincronizar</span>
              </div>
              
            </div>

            <div className={styles["sidebar-section"]}>
              <h3 className={styles["sidebar-title"]}>Categorias</h3>
              {categorias.length > 0 ? (
                categorias.map(categoria => (
                  <div key={categoria} className={styles["quick-action"]}>
                    <Folder className={styles["quick-action-icon"]} size={20} />
                    <span className={styles["quick-action-text"]}>{categoria}</span>
                  </div>
                ))
              ) : (
                <div className={styles["quick-action"]}>
                  <Folder className={styles["quick-action-icon"]} size={20} />
                  <span className={styles["quick-action-text"]}>Nenhuma categoria</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <ModalCreate
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreateFromScratch={handleCreateFromScratch}
          onCreateFromTemplate={handleCreateFromTemplate}
        />

        <ModalTemplate
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          templates={templatesDisponiveis}
          onSelectTemplate={handleSelectTemplate}
          loading={loading}
        />
      </div>
    </div>
  );
};