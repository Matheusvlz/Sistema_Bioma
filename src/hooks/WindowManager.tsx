import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { availableMonitors } from '@tauri-apps/api/window'

export interface WindowConfig {
  label: string;
  title: string;
  url: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  center?: boolean;
  resizable?: boolean;
  maximized?: boolean;
  data?: any;
  allowMultiple?: boolean;
}

export class WindowManager {
  private static windows: Map<string, WebviewWindow> = new Map();
  private static windowCounters: Map<string, number> = new Map();

  private static generateUniqueId(baseLabel: string): string {
    const counter = this.windowCounters.get(baseLabel) || 0;
    this.windowCounters.set(baseLabel, counter + 1);
    return `${baseLabel}-${counter + 1}`;
  }

  static async openWindow(config: WindowConfig): Promise<WebviewWindow> {
    try {
      let finalLabel = config.label;

      if (config.allowMultiple !== false) {
        finalLabel = this.generateUniqueId(config.label);
      } else {
        if (this.windows.has(config.label)) {
          const existingWindow = this.windows.get(config.label);
          if (existingWindow) {
            await existingWindow.setFocus();
            if (config.data) {
              await existingWindow.emit('window-data', config.data);
            }
            return existingWindow;
          }
        }
      }

      const webview = new WebviewWindow(finalLabel, {
        url: config.url,
        title: config.title,
        width: config.width || 1200,
        height: config.height || 800,
        x: config.x,
        y: config.y,
        resizable: config.resizable !== false,
        maximized: config.maximized || false,
        center: config.center !== false,
        decorations: true,
        alwaysOnTop: false,
        skipTaskbar: false,
      });

      await new Promise<void>((resolve, reject) => {
        webview.once('tauri://created', () => resolve());
        webview.once('tauri://error', (e) => reject(e));
        setTimeout(() => reject(new Error('Timeout ao criar janela')), 10000);
      });

      this.windows.set(config.label, webview);

      if (config.data) {
        webview.once('window-ready', async () => {
          try {
            await webview.emit('window-data', config.data);
          } catch (error) {
            console.error('Erro ao enviar dados para a janela:', error);
          }
        });
      }

      webview.once('tauri://destroyed', () => {
        this.windows.delete(config.label);
      });

      return webview;

    } catch (error) {
      console.error('Erro ao abrir janela:', error);
      throw error;
    }
  }

  static async closeWindow(label: string): Promise<void> {
    const window = this.windows.get(label);
    if (window) {
      await window.close();
      this.windows.delete(label);
    }
  }

  static isWindowOpen(label: string): boolean {
    return this.windows.has(label);
  }

  static getWindow(label: string): WebviewWindow | undefined {
    return this.windows.get(label);
  }

  static async closeAllWindows(): Promise<void> {
    const promises = Array.from(this.windows.values()).map(window => window.close());
    await Promise.all(promises);
    this.windows.clear();
    this.windowCounters.clear();
  }

  static async openCadastroClientes(clienteData?: any): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'cadastro-clientes',
      title: 'Cadastro de Clientes',
      url: '/#/cadastrar-clientes',
      width: 900,
      height: 700,
      data: clienteData,
      allowMultiple: true
    });
  }

  static async openVisualizarCliente(clienteData?: any): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'visualizar-clientes',
      title: 'Visualizar Clientes',
      url: '/#/visualizar-clientes',
      width: 1200,
      height: 800,
      data: clienteData,
      allowMultiple: true
    });
  }

  static async openCadastrarCategoria(): Promise<WebviewWindow> {
    try {
      const monitors = await availableMonitors();
      if (!monitors || monitors.length === 0) {
        throw new Error('Não foi possível obter informações dos monitores');
      }

      const primaryMonitor = monitors[0];
      const screenWidth = primaryMonitor.size.width;
      const screenHeight = primaryMonitor.size.height;
      const taskbarHeight = 70;
      
      const windowWidth = 500;
      const windowHeight = screenHeight - taskbarHeight;
      const windowX = screenWidth - windowWidth;
      const windowY = 0;

      return this.openWindow({
        label: 'gerenciar-categoria',
        title: 'Gerenciar Categoria',
        url: '/#/gerenciar-categoria',
        width: windowWidth,
        height: windowHeight,
        allowMultiple: true,
        x: windowX,
        y: windowY,
        center: false,
        resizable: true,
        data: { openedBy: 'cadastrar-cliente' }
      });
    } catch (error) {
      console.error('Erro ao abrir janela de cadastrar categoria:', error);
      return this.openWindow({
        label: 'gerenciar-categoria',
        title: 'Gerenciar Categoria',
        url: '/#/gerenciar-categoria',
        width: 500,
        height: 800,
        allowMultiple: true,
        data: { openedBy: 'cadastrar-cliente' }
      });
    }
  }

  static async openGerenciarSetor(): Promise<WebviewWindow> {
    try {
      const monitors = await availableMonitors();
      if (!monitors || monitors.length === 0) {
        throw new Error('Não foi possível obter informações dos monitores');
      }

      const primaryMonitor = monitors[0];
      const screenWidth = primaryMonitor.size.width;
      const screenHeight = primaryMonitor.size.height;
      const taskbarHeight = 70;
      
      const windowWidth = 500;
      const windowHeight = screenHeight - taskbarHeight;
      const windowX = screenWidth - windowWidth;
      const windowY = 0;

      return this.openWindow({
        label: 'gerenciar-setor',
        title: 'Gerenciar Setor',
        url: '/#/gerenciar-setor',
        width: windowWidth,
        height: windowHeight,
        allowMultiple: true,
        x: windowX,
        y: windowY,
        center: false,
        resizable: true,
        data: { openedBy: 'cadastro-usuario-portal' }
      });
    } catch (error) {
      console.error('Erro ao abrir janela de cadastrar setor:', error);
      return this.openWindow({
        label: 'gerenciar-setor',
        title: 'Gerenciar Setor',
        url: '/#/gerenciar-setor',
        width: 500,
        height: 800,
        allowMultiple: true,
        data: { openedBy: 'cadastro-usuario-portal' }
      });
    }
  }

  static async openUsuarioPortal(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'cadastro-usuario-portal',
      title: 'Gerenciar Usuários do Portal',
      url: '/#/cadastro-usuario-portal',
      width: 900,
      height: 700,
      allowMultiple: true
    });
  }

  static async openCadastrarConsultor(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'cadastrar-consultor',
      title: 'Cadastrar Consultor',
      url: '/#/cadastrar-consultor', // Garanta que sua rota React exista!
      width: 1200,
      height: 900,
      allowMultiple: true, // Permite abrir mais de uma janela de cadastro
    });
  }

  static async openChat(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'chat',
      title: 'Chat',
      url: '/#/chat',
      width: 1200,
      height: 600,
      allowMultiple: true
    });
  }

    static async openCreatePlanilha(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'criar-planilha',
      title: 'Criar Planilha',
      url: '/#/criar-planilha',
      width: 1200,
      height: 600,
      allowMultiple: true
    });
  }

      static async openCadastrarPlanilha(planilhaData?: any): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'cadastrar-planilha',
      title: 'Cadastrar Planilha',
      url: '/#/cadastrar-planilha',
      width: 1200,
      height: 600,
      allowMultiple: true,
      data: planilhaData
    });
  }

  static async openPlanilha(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'planilha-laboratorio',
      title: 'Planilha',
      url: '/#/planilha-laboratorio',
      width: 1200,
      height: 600,
      allowMultiple: true
    });
  } 

  static async openHistoricoUsuario(usuarioId?: any): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'historico-usuario',
      title: 'Histórico do Usuário',
      url: '/#/historico-usuario',
      width: 900,
      height: 700,
      data: usuarioId,
      allowMultiple: true
    });
  }
  static async openCadastrarAmostra(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'cadastrar-amostra',
      title: 'Cadastrar Amostra',
      url: '/#/cadastrar-amostra',
      width: 1200,
      height: 600,
      allowMultiple: true
    });
  }
    static async openVisualizarAmostas(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'visualizar-amostras',
      title: 'Visulizar Amostras',
      url: '/#/visualizar-amostras',
      width: 1200,
      height: 600,
      allowMultiple: true
    });
  }
  // LAB TERCEIRIZADO
  
  static async openCadastrarLabTerceirizado(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'cadastrar-laboratorio-terceirizado',
      title: 'Gerir Laboratórios Terceirizados',
      url: '/#/cadastrar-laboratorio-terceirizado',
      width: 1200,
      height: 800,
      allowMultiple: true,
    });
  }
  
  // TIPOS

  static async openGerenciarTipos(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'estrutura-tipo', 
      title: 'Gerir Tipos',
      url: '/#/estrutura-tipo', 
      width: 900,
      height: 700,
      allowMultiple: false,
    });
  }

  // GRUPOS

  static async openGerenciarGrupos(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'estrutura-grupo',
      title: 'Gerir Grupos',
      url: '/#/estrutura-grupo',
      width: 900,
      height: 700,
      allowMultiple: false, 
    });
  }

    static async openCastrarCondutor(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'cadastrar-motorista',
      title: 'Cadastrar Motorista',
      url: '/#/cadastrar-motorista',
      width: 900,
      height: 700,
      allowMultiple: false, 
    });
  }


  // Matriz

  static async openGerenciarMatrizes(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'estrutura-matriz',
      title: 'Gerir Matrizes',
      url: '/#/estrutura-matriz',
      width: 900,
      height: 700,
      allowMultiple: false,
    });
  }

  // Unidade

  static async openGerenciarUnidades(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'estrutura-unidade',
      title: 'Gerir Unidades',
      url: '/#/estrutura-unidade',
      width: 900,
      height: 700,
      allowMultiple: false,
    });
  }

  // Paramtetros

  static async openGerenciarParametros(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'estrutura-parametro',
      title: 'Gerir Parâmetros',
      url: '/#/estrutura-parametro',
      width: 1200, 
      height: 800,
      allowMultiple: false,
    });
  }

  // PG coletas

  static async openGerenciarPGColeta(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'estrutura-pg-coleta',
      title: 'Gerir PG de Coleta',
      url: '/#/estrutura-pg-coleta',
      width: 900,
      height: 700,
      allowMultiple: false,
    });
  }

  // POP

  static async openGerenciarPops(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'estrutura-pop',
      title: 'Gerir POPs',
      url: '/#/estrutura-pop',
      width: 1200, // Um pouco maior para acomodar a tabela
      height: 800,
      allowMultiple: false,
    });
  }

  // Tecnicas

  static async openGerenciarTecnicas(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'estrutura-tecnica',
      title: 'Gerir Técnicas',
      url: '/#/estrutura-tecnica',
      width: 900,
      height: 700,
      allowMultiple: false,
    });
  }

  // Identificação

  static async openGerenciarIdentificacoes(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'estrutura-identificacao',
      title: 'Gerir Identificações',
      url: '/#/estrutura-identificacao',
      width: 900,
      height: 700,
      allowMultiple: false,
    });
  }

  // Metodologias

  static async openGerenciarMetodologias(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'estrutura-metodologia',
      title: 'Gerir Metodologias',
      url: '/#/estrutura-metodologia',
      width: 900,
      height: 700,
      allowMultiple: false,
    });
  }

  // legislacao

  static async openGerenciarLegislacoes(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'estrutura-legislacao',
      title: 'Gerir Legislações',
      url: '/#/estrutura-legislacao',
      width: 900,
      height: 700,
      allowMultiple: false,
    });
  }

  // Categorias

  static async openGerenciarCategorias(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'estrutura-categoria',
      title: 'Gerir Categorias',
      url: '/#/estrutura-categoria',
      width: 900,
      height: 700,
      allowMultiple: false,
    });
  }

  // Formas de Contato

  static async openGerenciarFormasContato(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'estrutura-forma-contato',
      title: 'Gerir Formas de Contato',
      url: '/#/estrutura-forma-contato',
      width: 900,
      height: 700,
      allowMultiple: false,
    });
  }

    static async openGerenciarVeiculos(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'cadastrar-veiculo',
      title: 'Cadastrar Veículo',
      url: '/#/cadastrar-veiculo',
      width: 900,
      height: 700,
      allowMultiple: false,
    });
  }

  static async openGerenciarObservacoes(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'estrutura-observacao',
      title: 'Gerir Observações',
      url: '/#/estrutura-observacao',
      width: 900,
      height: 700,
      allowMultiple: false,
    });
  }

    static async openCadastrarPosto(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'cadastrar-posto',
      title: 'Cadastrar posto',
      url: '/#/cadastrar-posto',
         width: 1400, // Tela maior para a tabela complexa
      height: 900,
      allowMultiple: false,
    });
  }

  static async openGerenciarSubMatrizes(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'estrutura-submatriz',
      title: 'Gerir Submatrizes',
      url: '/#/estrutura-submatriz',
      width: 900,
      height: 700,
      allowMultiple: false,
    });
  }

     static async openCadastrarViagem(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'cadastrar-viagem',
      title: 'Cadastrar viagem',
      url: '/#/cadastrar-viagem',
      width: 900,
      height: 700,
  // Parametro X POP
    });
  }

  static async openGerenciarParametroPop(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'rel-parametro-pop',
      title: 'Gerir Parâmetro x POP',
      url: '/#/rel-parametro-pop',
      width: 1300, // Tela maior para a tabela complexa
      height: 800,
      allowMultiple: false,
    });
  }

     static async openVisualizarViagem(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'visualizar-viagem',
      title: 'Visualizar viagem',
      url: '/#/visualizar-viagem',
      width: 900,
      height: 700,
      allowMultiple: false,
    });
  }


       static async openVisualizarAbastecimento(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'visualizar-abastecimento',
      title: 'Visualizar abastecimento',
      url: '/#/visualizar-abastecimento',
      width: 900,
      height: 700,
      allowMultiple: false,
    });
  }

  


      static async openCadastrarAbastecimento(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'cadastrar_abastecimento',
      title: 'Cadastrar Abastecimento',
      url: '/#/cadastrar_abastecimento',
         width: 1400, // Tela maior para a tabela complexa
      height: 900,
      allowMultiple: false,
    });
  }

static async openGerenciarLegislacaoParametro(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'rel-legislacao-parametro',
      title: 'Gerir Legislação x Parâmetro',
      url: '/#/rel-legislacao-parametro',
      // Combinando as duas versões: tamanho maior + centralizado
      width: 1400,
      height: 900,
      center: true,
      allowMultiple: false,
    });
  }

  // Mantendo as novas funções que seu amigo criou
  static async openCadastrarManutencao(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'cadastrar-manutencao',
      title: 'Cadastrar Manutenção',
      url: '/#/cadastrar-manutencao',
      width: 1000,
      height: 900,
      allowMultiple: false,
    });
  }

  static async openVisualizarManutencao(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'visualizar-manutencao',
      title: 'Visualizar Manutenção',
      url: '/#/visualizar-manutencao',
      width: 1200,
      height: 900,
      allowMultiple: false,
    });
  }

  static async openLocalizacao(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'localizacao-temporeal',
      title: 'Localização em Tempo Real',
      url: '/#/localizacao-temporeal',
      width: 1200,
      height: 900,
      allowMultiple: false,
    });
  }

    // Gerir LQ e Incerteza
    static async openGerenciarLqIncerteza(): Promise<WebviewWindow> {
        return this.openWindow({
            label: 'rel-limite-quantificacao', // O 'label' deve corresponder à chave da rota
            title: 'Gerir Limite de Quantificação e Incerteza', // O título que aparecerá na janela
            url: '/#/rel-limite-quantificacao', // A URL interna para a nova tela
            width: 1280,
            height: 800,
            center: true, // Garante que a janela abre no centro
            allowMultiple: false, // Impede que múltiplas janelas iguais sejam abertas
        });
    }


       static async openGerenciarPacotes(): Promise<WebviewWindow> {
        return this.openWindow({
            label: 'rel-pacote-parametro',
            title: 'Gerir Pacotes de Parâmetros',
            url: '/#/rel-pacote-parametro',
            width: 1024,
            height: 768,
            center: true,
            allowMultiple: false,
        });
    }

    static async openCadastrarPacote(pacoteId?: number): Promise<WebviewWindow> {
        const url = pacoteId 
            ? `/#/cadastrar-pacote?id=${pacoteId}` 
            : '/#/cadastrar-pacote';
        
        return this.openWindow({
            label: `cadastrar-pacote-${pacoteId || 'novo'}`,
            title: pacoteId ? 'Editar Pacote de Parâmetros' : 'Novo Pacote de Parâmetros',
            url: url,
            width: 1280,
            height: 800,
            center: true,
            allowMultiple: true, // Permite abrir múltiplos cadastros
        });
    }

    static async openAnalisarColetores(): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'analisar-coletores',
      // MUDANÇA AQUI para consistência:
      title: 'Relatório de Coletores', 
      url: '/#/analisar-coletores',
      width: 1280,
      height: 800,
      allowMultiple: false,
    });
  }







static async openCadastrarUsuarioAdmin(): Promise<WebviewWindow> {
  return this.openWindow({
    label: 'cadastrar-usuario-admin',
    title: 'Cadastrar Novo Usuário',
    url: '/#/cadastrar-usuarios-admin', // <-- Ponto CRÍTICO a ser verificado
    width: 550,
    height: 750,
    allowMultiple: false,
  });
}

static async openGerenciarUsuarios(): Promise<WebviewWindow> {
  return this.openWindow({
    label: 'admin-usuarios',
    title: 'Gerenciar Usuários',
    url: '/#/admin-usuarios',
    width: 1200,
    height: 800,
    center: true,
    allowMultiple: false,
  });
}

static async openGerenciarPermissoesSetor(): Promise<WebviewWindow> {
  return this.openWindow({
    label: 'admin-permissoes-setor',
    title: 'Gerenciar Permissões por Setor',
    url: '/#/admin-permissoes-setor',
    width: 1000,
    height: 750,
    center: true,
    allowMultiple: false,
  });
}

static async openVisualizarHistorico(): Promise<WebviewWindow> {
  return this.openWindow({
    label: 'admin-historico',
    title: 'Visualizar Histórico de Atividades',
    url: '/#/admin-historico',
    width: 1280,
    height: 800,
    center: true,
    allowMultiple: false,
  });
}

   static async openGerenciarTecnicaEtapa(): Promise<WebviewWindow> {
    // A API do Tauri para criar uma nova janela
    const webview = new WebviewWindow('rel-tecnica-etapa', {
      url: '/#/rel-tecnica-etapa', // A rota do React que a nova janela deve carregar
      title: 'Gerenciar Técnicas e Etapas',
      width: 1400,
      height: 900,
      minWidth: 900,
      minHeight: 600,
    });

    















    

    // Essas duas linhas são importantes para garantir que a janela seja criada corretamente
    webview.once('tauri://created', function () {
      // A janela foi criada com sucesso
    });
    webview.once('tauri://error', function (e) {
      // Ocorreu um erro ao criar a janela
      console.error(e);
    });
    

    return webview;
  }

}
