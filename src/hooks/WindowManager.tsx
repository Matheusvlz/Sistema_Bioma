import { WebviewWindow } from '@tauri-apps/api/webviewWindow'

export interface WindowConfig {
  label: string;
  title: string;
  url: string;
  width?: number;
  height?: number;
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
        resizable: config.resizable !== false,
        maximized: config.maximized || false,
        center: true,
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
      height: 600,
      data: clienteData,
      allowMultiple: true
    });
  }

  static async openVisualizarCliente(clienteData?: any): Promise<WebviewWindow> {
    return this.openWindow({
      label: 'visualizar-cliente',
      title: 'Visualizar Cliente',
      url: '/#/visualizar-cliente',
      width: 900,
      height: 600,
      data: clienteData,
      allowMultiple: true
    });
  }

   static async openChat(): Promise<WebviewWindow>
    {
    return this.openWindow({
      label: 'chat',
      title: 'Chat',
      url: '/#/chat',
      width: 1200,
      height: 900,
      allowMultiple: true
    });
  }
}



