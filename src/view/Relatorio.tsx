import React, { useState, useMemo, useCallback, memo, useEffect } from "react";
import {
  FileBarChart,
  Calendar,
  Clock,
  ChevronRight,
  FileText,
  Printer,
  Download,
  Share2,
  UploadCloud,
  Mail,
  Users,
  Settings,
  MessageSquare,
  Globe,
  UserCheck,
  Building,
  ClipboardList
} from "lucide-react";
import styles from './css/Relatorio.module.css'; // Supondo um novo arquivo CSS com estilo similar

// --- Interfaces para Tipagem ---
interface AgendamentoItem {
  id: number;
  hora: string;
  descricao: string;
  cliente: string;
  tipo: 'Coleta' | 'Análise' | 'Reunião';
}

interface MenuItem {
  name: string;
  icon: React.ElementType;
  description: string;
}

interface MenuSection {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  category: string;
  items: MenuItem[];
  subsections?: { title: string; items: MenuItem[] }[];
}


// --- Componentes Reutilizáveis Otimizados (mesmo padrão do Laboratorio.tsx) ---

const SectionItem = memo(({ item, onItemClick }: { item: MenuItem; onItemClick: (name: string) => void }) => {
  const handleClick = useCallback(() => {
    onItemClick(item.name);
  }, [item.name, onItemClick]);

  return (
    <button
      className={styles["section-item"]}
      onClick={handleClick}
      title={item.description}
    >
      <div className={styles["section-item-icon"]}>
        <item.icon />
      </div>
      <div className={styles["section-item-content"]}>
        <span className={styles["section-item-text"]}>{item.name}</span>
        <span className={styles["section-item-description"]}>{item.description}</span>
      </div>
    </button>
  );
});

const SectionCard = memo(({ section, onItemClick }: { section: MenuSection; onItemClick: (name: string) => void; }) => (
  <div className={styles["section-card"]}>
    <div className={`${styles["section-header"]} ${section.color}`}>
      <div className={styles["section-header-content"]}>
        <div>
          <h3 className={styles["section-title"]}>{section.title}</h3>
          <p className={styles["section-subtitle"]}>
            {section.items.length} opções disponíveis
          </p>
          <span className={styles["section-category"]}>{section.category}</span>
        </div>
        <section.icon className={styles["section-icon"]} />
      </div>
    </div>
    <div className={styles["section-body"]}>
      {/* Verifica se existem subsections para uma renderização mais complexa */}
      {section.subsections ? (
        section.subsections.map((sub, index) => (
          <div key={`${section.id}-${index}`} className={styles["subsection-container"]}>
            <h4 className={styles["subsection-title"]}>{sub.title}</h4>
            <div className={styles["section-items"]}>
              {sub.items.map((item, itemIndex) => (
                <SectionItem
                  key={`${section.id}-${index}-${itemIndex}`}
                  item={item}
                  onItemClick={onItemClick}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className={styles["section-items"]}>
          {section.items.map((item, index) => (
            <SectionItem
              key={`${section.id}-${index}`}
              item={item}
              onItemClick={onItemClick}
            />
          ))}
        </div>
      )}
    </div>
  </div>
));


// --- Componente Principal: Relatorio ---

export const Relatorio: React.FC = memo(() => {
  const [agendamentos, setAgendamentos] = useState<AgendamentoItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulação de busca de dados
  const fetchAgendamentos = useCallback(async () => {
    setLoading(true);
    // Em um caso real, aqui viria uma chamada `invoke` para o backend
    setTimeout(() => {
      const mockData: AgendamentoItem[] = [
        { id: 1, hora: "09:00", descricao: "Coleta de amostra de água", cliente: "Indústria ABC", tipo: 'Coleta' },
        { id: 2, hora: "11:30", descricao: "Análise microbiológica lote #552", cliente: "Fazenda Sol Nascente", tipo: 'Análise' },
        { id: 3, hora: "14:00", descricao: "Reunião de alinhamento de resultados", cliente: "Consultoria Ambiental", tipo: 'Reunião' },
        { id: 4, hora: "16:15", descricao: "Coleta de efluentes", cliente: "Indústria XYZ", tipo: 'Coleta' },
      ];
      setAgendamentos(mockData);
      setLoading(false);
    }, 1000); // Simula 1 segundo de delay da rede
  }, []);

  useEffect(() => {
    fetchAgendamentos();
  }, [fetchAgendamentos]);

  // Dados estáticos das seções do menu, memoizados para performance
  const menuSections = useMemo((): MenuSection[] => [
    {
      id: "geral",
      title: "Relatórios Gerais",
      icon: ClipboardList,
      color: styles["bg-teal-500"],
      category: "operações",
      items: [
        { name: "Relatórios para gerar", icon: FileText, description: "Crie novos relatórios a partir de modelos" },
        { name: "Relatórios para imprimir", icon: Printer, description: "Acesse a fila de impressão de relatórios" },
        { name: "Relatórios offline", icon: Download, description: "Baixe relatórios para acesso sem internet" },
        { name: "Relatórios terceirizados", icon: Share2, description: "Envie e receba dados de laboratórios parceiros" },
        { name: "Relatórios por e-mail", icon: Mail, description: "Configure envios automáticos por e-mail" }
      ]
    },
    {
      id: "cadastro",
      title: "Gestão e Configuração",
      icon: Settings,
      color: styles["bg-indigo-500"],
      category: "configuração",
      items: [], // Items ficam dentro das subsections
      subsections: [
        {
          title: "Relatório de Ensaios",
          items: [
            { name: "Gerar relatório de ensaio", icon: FileText, description: "Gere laudos técnicos a partir de ensaios" },
            { name: "Observação de resultado", icon: MessageSquare, description: "Adicione notas a um resultado específico" },
            { name: "Observação em grupo", icon: Users, description: "Adicione notas a um lote de resultados" },
            { name: "Imprimir relatório de ensaio", icon: Printer, description: "Imprima laudos técnicos finalizados" },
            { name: "Enviar para internet", icon: Globe, description: "Disponibilize o laudo no portal do cliente" },
            { name: "Publicação", icon: UploadCloud, description: "Publique resultados em plataformas integradas" },
          ]
        },
        {
          title: "Análises",
          items: [
            { name: "Relatórios por clientes", icon: Building, description: "Filtre e visualize relatórios por cliente" },
            { name: "Relatórios por parâmetros", icon: UserCheck, description: "Consulte o histórico de análises por parâmetro" },
          ]
        }
      ]
    }
  ], []);

  // Callback para lidar com cliques nos itens do menu
  const handleItemClick = useCallback((itemName: string) => {
    console.log(`Ação acionada: ${itemName}`);
    // A lógica para abrir janelas (WindowManager) ou modais seria adicionada aqui
    // Ex: if (itemName === 'Gerar') { WindowManager.openGerarRelatorio(); }
  }, []);


  return (
    <div className={styles["relatorio-container"]}>
      {/* --- CABEÇALHO --- */}
      <header className={styles["relatorio-header"]}>
        <div className={styles["relatorio-header-content"]}>
          <div className={styles["relatorio-header-icon-container"]}>
            <FileBarChart className={styles["relatorio-header-icon"]} />
          </div>
          <div>
            <h1 className={styles["relatorio-title"]}>Relatórios e Publicações</h1>
            <p className={styles["relatorio-subtitle"]}>Geração, gestão e distribuição de resultados</p>
          </div>
        </div>
      </header>

      <main className={styles["relatorio-main"]}>
        {/* --- PRIMEIRA PARTE: INÍCIO (AGENDAMENTOS) --- */}
        <section className={styles["agendamentos-section"]}>
          <div className={styles["agendamentos-header"]}>
            <Calendar className={styles["agendamentos-icon"]} />
            <h2 className={styles["agendamentos-title"]}>Agendamentos para Hoje ({new Date().toLocaleDateString()})</h2>
          </div>
          <div className={styles["agendamentos-list"]}>
            {loading ? (
              <p className={styles["loading-text"]}>Carregando agendamentos...</p>
            ) : agendamentos.length > 0 ? (
              agendamentos.map(item => (
                <div key={item.id} className={styles["agendamento-item"]}>
                  <div className={styles["agendamento-time"]}>
                    <Clock size={16} />
                    <span>{item.hora}</span>
                  </div>
                  <div className={styles["agendamento-details"]}>
                    <p className={styles["agendamento-description"]}>{item.descricao}</p>
                    <span className={styles["agendamento-cliente"]}>{item.cliente}</span>
                  </div>
                  <div className={`${styles["agendamento-tag"]} ${styles[`tag-${item.tipo.toLowerCase()}`]}`}>
                    {item.tipo}
                  </div>
                  <ChevronRight className={styles["agendamento-chevron"]} />
                </div>
              ))
            ) : (
              <p className={styles["empty-text"]}>Não há agendamentos para hoje.</p>
            )}
          </div>
        </section>

        {/* --- SEGUNDA E TERCEIRA PARTES: RELATÓRIO E CADASTRO (MENU) --- */}
        <div className={styles["relatorio-menu-grid"]}>
          {menuSections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              onItemClick={handleItemClick}
            />
          ))}
        </div>
      </main>
    </div>
  );
});

Relatorio.displayName = 'Relatorio';
SectionItem.displayName = 'SectionItem';
SectionCard.displayName = 'SectionCard';