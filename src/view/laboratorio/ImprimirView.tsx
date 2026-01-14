import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Printer, RefreshCw, Filter, Eye, Check, X, 
  ChevronLeft, ChevronRight, Loader2, Search,
  AlertTriangle, Server, Mail, Download, FileText
} from 'lucide-react';
import { invoke } from "@tauri-apps/api/core";
import styles from './styles/Imprimir.module.css';

// ==================== INTERFACES ====================

interface RelatorioDTO {
  id_grupo: number;
  numero_relatorio: string;
  cliente_fantasia: string;
  amostras_texto: string;
  protocolo_cliente?: string;
  data_inicio?: string;
  data_termino?: string;
  impresso: boolean;
  internet: boolean;
  relatorio_email: boolean;
  ano: string;
  mes: string;
  certificado_numero: string;
}

interface PaginacaoResponse {
  dados: RelatorioDTO[];
  total: number;
  pagina_atual: number;
  total_paginas: number;
}

interface ClienteDTO {
  id: string;
  fantasia: string;
}

interface FiltroImprimir {
  impresso: number;
  online: number;
  enviado_email: number;
  cliente_id?: string;
  data_inicio?: string;
  data_fim?: string;
  pagina: number;
  por_pagina: number;
}

interface ProgressoItem {
  id_grupo: number;
  status: 'aguardando' | 'processando' | 'sucesso' | 'erro';
  mensagem: string;
  timestamp?: string;
}

// ==================== COMPONENTE PRINCIPAL ====================

export const ImprimirView: React.FC = () => {
  const [relatorios, setRelatorios] = useState<RelatorioDTO[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [progresso, setProgresso] = useState<Map<number, ProgressoItem>>(new Map());
  
  const [filtros, setFiltros] = useState<FiltroImprimir>({
    impresso: 1, // Padrão: Não impresso
    online: 1,   // Padrão: Não enviado
    enviado_email: 0,
    pagina: 1,
    por_pagina: 50,
  });
  
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paginacao, setPaginacao] = useState({
    total: 0,
    pagina_atual: 1,
    total_paginas: 1,
  });
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState<number | null>(null);
  
  // Estados para busca de cliente
  const [clienteSearchQuery, setClienteSearchQuery] = useState('');
  const [clienteSearchResults, setClienteSearchResults] = useState<ClienteDTO[]>([]);
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [selectedClienteObj, setSelectedClienteObj] = useState<ClienteDTO | null>(null);
  const [isSearchingCliente, setIsSearchingCliente] = useState(false);
  const clienteSearchRef = useRef<HTMLDivElement>(null);

  // Estados para datas
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const [configFTP] = useState({
    servidor: 'ftp.biomaambiental.com.br',
    login: 'ftpuser@biomaambiental.com.br',
    senha: 'bio354!377',
  });

  // Mensagem de erro/sucesso
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // ==================== EFFECTS ====================

  useEffect(() => {
    carregarRelatorios();
  }, []);

  useEffect(() => {
    carregarRelatorios();
  }, [filtros.pagina, filtros.impresso, filtros.online, filtros.enviado_email, filtros.cliente_id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clienteSearchRef.current && !clienteSearchRef.current.contains(event.target as Node)) {
        setShowClienteDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-hide notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // ==================== BUSCA DE CLIENTE ====================

  const buscarClientesDropdown = async (query: string): Promise<ClienteDTO[]> => {
    try {
      const response = await invoke<{ success: boolean; data?: ClienteDTO[]; message?: string }>('buscar_clientes_dropdown', {
        query: query.trim()
      });
      return response.success && response.data ? response.data : [];
    } catch (error) {
      console.error('Erro na busca dropdown:', error);
      return [];
    }
  };

  const handleClienteSearchChange = async (value: string) => {
    setClienteSearchQuery(value);
    
    if (value.trim().length >= 2) {
      setIsSearchingCliente(true);
      try {
        const results = await buscarClientesDropdown(value);
        setClienteSearchResults(results);
        setShowClienteDropdown(results.length > 0);
      } catch (error) {
        console.error('Erro na busca:', error);
        setClienteSearchResults([]);
        setShowClienteDropdown(false);
      } finally {
        setIsSearchingCliente(false);
      }
    } else {
      setClienteSearchResults([]);
      setShowClienteDropdown(false);
      if (value.trim().length === 0) {
        handleClearClienteSearch();
      }
    }
  };

  // CORREÇÃO PRINCIPAL AQUI:
  const handleClienteSelect = (cliente: ClienteDTO) => {
    setSelectedClienteObj(cliente);
    setClienteSearchQuery(cliente.fantasia);
    setShowClienteDropdown(false);
    setClienteSearchResults([]);
    
    // CORREÇÃO: Força a conversão do ID para String. 
    // O Rust espera Option<String>, mas o 'cliente.id' vindo da busca pode ser number.
    setFiltros(prev => ({ ...prev, cliente_id: String(cliente.id), pagina: 1 }));
  };

  const handleClearClienteSearch = () => {
    setClienteSearchQuery('');
    setSelectedClienteObj(null);
    setClienteSearchResults([]);
    setShowClienteDropdown(false);
    setFiltros(prev => ({ ...prev, cliente_id: undefined, pagina: 1 }));
  };

  // ==================== FUNÇÕES DE CARREGAMENTO ====================

  const carregarRelatorios = useCallback(async () => {
    setLoading(true);
    try {
      // Preparar filtros com datas
      const filtrosComDatas = {
        ...filtros,
        data_inicio: dataInicio || undefined,
        data_fim: dataFim || undefined
      };

      const data = await invoke<PaginacaoResponse>('proxy_listar_relatorios_imprimir', {
        filtro: filtrosComDatas,
      });
      
      setRelatorios(data.dados || []);
      setPaginacao({
        total: data.total,
        pagina_atual: data.pagina_atual,
        total_paginas: data.total_paginas,
      });
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Erro ao carregar relatórios:", err);
      setNotification({
        type: 'error',
        message: `Erro ao carregar relatórios: ${err}`
      });
    } finally {
      setLoading(false);
    }
  }, [filtros, dataInicio, dataFim]);

  // ==================== FUNÇÕES DE IMPRESSÃO ====================

  const handleImprimir = useCallback(async () => {
    if (selectedIds.size === 0) {
      setNotification({
        type: 'error',
        message: 'Selecione ao menos um relatório para enviar!'
      });
      return;
    }

    const confirmMsg = `Deseja enviar ${selectedIds.size} relatório(s) para o portal?\n\n` +
                       `Esta ação irá:\n` +
                       `- Gerar PDFs via microserviço Kotlin\n` +
                       `- Enviar via FTP para ${configFTP.servidor}\n` +
                       `- Marcar como impresso e online no banco de dados`;
    
    if (!confirm(confirmMsg)) return;

    setProcessing(true);
    const ids = Array.from(selectedIds);
    
    // Inicializar progresso
    const novoProgresso = new Map<number, ProgressoItem>();
    ids.forEach(id => {
      novoProgresso.set(id, {
        id_grupo: id,
        status: 'aguardando',
        mensagem: 'Aguardando processamento...',
      });
    });
    setProgresso(novoProgresso);

    try {
      console.log('📤 Enviando requisição com:', {
        ids_grupos: ids,
        servidor: configFTP.servidor
      });

      const resultados = await invoke<any[]>('proxy_imprimir_relatorios', {
        request: {
          ids_grupos: ids,
          usuario_id: 1,
          login_ftp: configFTP.login,
          senha_ftp: configFTP.senha,
          servidor_ftp: configFTP.servidor,
        },
      });

      console.log('📥 Resultados recebidos:', resultados);

      // Atualizar progresso com resultados
      let sucessos = 0;
      let erros = 0;

      resultados.forEach(res => {
        const status = res.status === 'sucesso' ? 'sucesso' : 'erro';
        if (status === 'sucesso') sucessos++;
        else erros++;

        novoProgresso.set(res.id_grupo, {
          id_grupo: res.id_grupo,
          status: status,
          mensagem: res.mensagem,
          timestamp: res.timestamp,
        });
      });

      setProgresso(new Map(novoProgresso));

      // Mostrar notificação de resumo
      setNotification({
        type: erros === 0 ? 'success' : 'error',
        message: `Processamento concluído: ${sucessos} sucesso(s), ${erros} erro(s)`
      });

      // Recarregar lista após 3 segundos
      setTimeout(() => {
        carregarRelatorios();
        setProgresso(new Map());
        setSelectedIds(new Set());
      }, 3000);

    } catch (err) {
      console.error('❌ Erro no processamento:', err);
      setNotification({
        type: 'error',
        message: `Erro ao processar relatórios: ${err}`
      });
      setProgresso(new Map());
    } finally {
      setProcessing(false);
    }
  }, [selectedIds, configFTP, carregarRelatorios]);

  // ==================== FUNÇÕES DE VISUALIZAÇÃO ====================

  const handleVisualizar = useCallback(async (rel: RelatorioDTO) => {
    setPdfLoading(rel.id_grupo);
    
    try {
      const dataCriacao = `${rel.ano}-${rel.mes.padStart(2, '0')}-01`;
      
      console.log('👁️ Visualizando:', {
        id_grupo: rel.id_grupo,
        data: dataCriacao
      });
      
      const pdfBase64 = await invoke<string>('proxy_visualizar_relatorio_imprimir', {
        idGrupo: rel.id_grupo,
        dataCriacao,
      });

      if (!pdfBase64 || pdfBase64.length < 100) {
        throw new Error('PDF retornado está vazio ou inválido');
      }

      const binaryString = window.atob(pdfBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setPdfUrl(url);
      
      setNotification({
        type: 'success',
        message: 'PDF gerado com sucesso!'
      });

    } catch (err) {
      console.error('Erro ao visualizar:', err);
      setNotification({
        type: 'error',
        message: `Erro ao gerar PDF: ${err}`
      });
    } finally {
      setPdfLoading(null);
    }
  }, []);

  const closePdf = useCallback(() => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    setPdfUrl(null);
  }, [pdfUrl]);

  const downloadPdf = useCallback(() => {
    if (!pdfUrl) return;
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'relatorio.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [pdfUrl]);

  // ==================== FUNÇÕES DE SELEÇÃO ====================

  const toggleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(relatorios.map(r => r.id_grupo)));
    } else {
      setSelectedIds(new Set());
    }
  }, [relatorios]);

  const toggleSelectRow = useCallback((id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  }, [selectedIds]);

  // ==================== FILTROS ====================

  const handleBuscar = () => {
    setFiltros(prev => ({ ...prev, pagina: 1 }));
    carregarRelatorios();
  };

  const handleLimpar = () => {
    setDataInicio('');
    setDataFim('');
    handleClearClienteSearch();
    setFiltros({
      impresso: 0,
      online: 0,
      enviado_email: 0,
      pagina: 1,
      por_pagina: 50,
    });
  };

  // ==================== RENDER HELPERS ====================

  const getStatusBadge = (rel: RelatorioDTO) => {
    const badges = [];
    
    if (rel.impresso) {
      badges.push(
        <span key="impresso" className={styles.badgeSuccess}>
          <Check size={12} /> Impresso
        </span>
      );
    }
    
    if (rel.internet) {
      badges.push(
        <span key="online" className={styles.badgeInfo}>
          <Server size={12} /> Portal
        </span>
      );
    }
    
    if (rel.relatorio_email) {
      badges.push(
        <span key="email" className={styles.badgeWarning}>
          <Mail size={12} /> Email
        </span>
      );
    }
    
    return badges.length > 0 ? (
      <div className={styles.badgeGroup}>{badges}</div>
    ) : (
      <span className={styles.badgeDefault}>Pendente</span>
    );
  };

  const getProgressoStatus = (id: number) => {
    const item = progresso.get(id);
    if (!item) return null;

    const config = {
      aguardando: { icon: <Loader2 size={14} className={styles.spin} />, className: styles.statusAguardando },
      processando: { icon: <Loader2 size={14} className={styles.spin} />, className: styles.statusProcessando },
      sucesso: { icon: <Check size={14} />, className: styles.statusSucesso },
      erro: { icon: <X size={14} />, className: styles.statusErro },
    }[item.status];

    return (
      <div className={`${styles.statusProgresso} ${config.className}`}>
        {config.icon}
        <span>{item.mensagem}</span>
        {item.timestamp && <small>{item.timestamp}</small>}
      </div>
    );
  };

  // ==================== RENDER ====================

  return (
    <div className={styles.container}>
      {/* Notification Toast */}
      {notification && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>
          {notification.type === 'success' ? <Check size={20} /> : <AlertTriangle size={20} />}
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerTitle}>
            <Printer size={32} />
            <div>
              <h1>Imprimir Relatórios</h1>
              <p>Gerenciamento e envio de relatórios para o portal</p>
            </div>
          </div>
          
          <div className={styles.headerActions}>
            <button 
              onClick={carregarRelatorios} 
              disabled={loading || processing}
              className={styles.buttonRefresh}
              title="Atualizar lista"
            >
              <RefreshCw size={18} className={loading ? styles.spin : ''} />
              Atualizar
            </button>
            
            <button 
              onClick={handleImprimir}
              disabled={processing || selectedIds.size === 0}
              className={styles.buttonPrimary}
              title={selectedIds.size === 0 ? 'Selecione relatórios primeiro' : `Enviar ${selectedIds.size} relatório(s)`}
            >
              {processing ? (
                <>
                  <Loader2 size={18} className={styles.spin} />
                  Processando...
                </>
              ) : (
                <>
                  <Printer size={18} />
                  Enviar Portal ({selectedIds.size})
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className={styles.filterSection}>
        <div className={styles.filterRow}>
          {/* Cliente */}
          <div className={styles.filterGroup} ref={clienteSearchRef}>
            <label>Cliente</label>
            <div className={styles.searchContainer}>
              <div className={styles.searchInputWrapper}>
                <span className={styles.searchInputIcon}></span>
                <input
                  type="text"
                  value={clienteSearchQuery}
                  onChange={(e) => handleClienteSearchChange(e.target.value)}
                  placeholder="Digite nome, CNPJ ou cidade..."
                  className={styles.searchInput}
                  disabled={loading || processing}
                />
                {clienteSearchQuery && (
                  <button className={styles.clearButton} onClick={handleClearClienteSearch}>
                    <X size={14} />
                  </button>
                )}
              </div>
              
              {showClienteDropdown && (
                <div className={styles.dropdown}>
                  {isSearchingCliente ? (
                    <div className={styles.dropdownItem}>
                      <Loader2 size={14} className={styles.spin} /> Buscando...
                    </div>
                  ) : (
                    clienteSearchResults.map((cliente) => (
                      <div
                        key={cliente.id}
                        className={styles.dropdownItem}
                        onClick={() => handleClienteSelect(cliente)}
                      >
                        {cliente.fantasia}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Data Início */}
          <div className={styles.filterGroup}>
            <label>Data Início</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className={styles.dateInput}
              disabled={loading || processing}
            />
          </div>

          {/* Data Fim */}
          <div className={styles.filterGroup}>
            <label>Data Fim</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className={styles.dateInput}
              disabled={loading || processing}
            />
          </div>

          {/* Impresso */}
          <div className={styles.filterGroup}>
            <label>Impresso</label>
            <select 
              value={filtros.impresso}
              onChange={(e) => setFiltros({...filtros, impresso: parseInt(e.target.value), pagina: 1})}
              disabled={loading || processing}
            >
              <option value="0">Todos</option>
              <option value="1">Não</option>
              <option value="2">Sim</option>
            </select>
          </div>

          {/* Online */}
          <div className={styles.filterGroup}>
            <label>Portal</label>
            <select 
              value={filtros.online}
              onChange={(e) => setFiltros({...filtros, online: parseInt(e.target.value), pagina: 1})}
              disabled={loading || processing}
            >
              <option value="0">Todos</option>
              <option value="1">Não Enviado</option>
              <option value="2">Enviado</option>
            </select>
          </div>

          {/* Email */}
          <div className={styles.filterGroup}>
            <label>Email</label>
            <select 
              value={filtros.enviado_email}
              onChange={(e) => setFiltros({...filtros, enviado_email: parseInt(e.target.value), pagina: 1})}
              disabled={loading || processing}
            >
              <option value="0">Todos</option>
              <option value="1">Não Enviado</option>
              <option value="2">Enviado</option>
            </select>
          </div>
        </div>

        <div className={styles.filterActions}>
          <button onClick={handleBuscar} disabled={loading || processing} className={styles.buttonSearch}>
            <Search size={16} /> Buscar
          </button>
          <button onClick={handleLimpar} disabled={loading || processing} className={styles.buttonClear}>
            <X size={16} /> Limpar
          </button>
        </div>

        <div className={styles.filterInfo}>
          <Filter size={16} />
          <span>{paginacao.total} registro(s) encontrado(s)</span>
          {selectedClienteObj && (
            <span className={styles.filterBadge}>
              Cliente: {selectedClienteObj.fantasia}
            </span>
          )}
          {selectedIds.size > 0 && (
            <span className={styles.filterBadgeSelected}>
              {selectedIds.size} selecionado(s)
            </span>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className={styles.tableSection}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <Loader2 className={styles.loadingSpinner} size={48} />
            <p>Carregando relatórios...</p>
          </div>
        ) : relatorios.length === 0 ? (
          <div className={styles.emptyContainer}>
            <FileText size={64} />
            <p>Nenhum relatório encontrado</p>
            <small>Ajuste os filtros para visualizar outros relatórios</small>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.thCheckbox}>
                      <input 
                        type="checkbox"
                        onChange={(e) => toggleSelectAll(e.target.checked)}
                        checked={selectedIds.size === relatorios.length && relatorios.length > 0}
                        disabled={processing}
                      />
                    </th>
                    <th>Cliente</th>
                    <th>Relatório</th>
                    <th>Período</th>
                    <th>Status</th>
                    <th className={styles.thActions}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {relatorios.map(rel => (
                    <tr 
                      key={rel.id_grupo}
                      className={selectedIds.has(rel.id_grupo) ? styles.rowSelected : ''}
                    >
                      <td className={styles.tdCheckbox}>
                        <input 
                          type="checkbox"
                          checked={selectedIds.has(rel.id_grupo)}
                          onChange={() => toggleSelectRow(rel.id_grupo)}
                          disabled={processing}
                        />
                      </td>

                      <td>
                        <div className={styles.cellCliente}>
                          <div className={styles.clienteName}>{rel.cliente_fantasia}</div>
                          <div className={styles.amostraInfo}>
                            Amostras: {rel.amostras_texto}
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className={styles.cellRelatorio}>
                          <div className={styles.relatorioNumero}>{rel.numero_relatorio}</div>
                          {rel.protocolo_cliente && (
                            <div className={styles.protocolo}>
                              Protocolo: {rel.protocolo_cliente}
                            </div>
                          )}
                        </div>
                      </td>

                      <td>
                        <div className={styles.cellPeriodo}>
                          {rel.data_inicio && <div>Início: {rel.data_inicio}</div>}
                          {rel.data_termino && <div>Fim: {rel.data_termino}</div>}
                        </div>
                      </td>

                      <td>
                        {progresso.has(rel.id_grupo) ? (
                          getProgressoStatus(rel.id_grupo)
                        ) : (
                          getStatusBadge(rel)
                        )}
                      </td>

                      <td className={styles.tdActions}>
                        <button
                          onClick={() => handleVisualizar(rel)}
                          disabled={pdfLoading === rel.id_grupo || processing}
                          className={styles.buttonView}
                          title="Visualizar PDF"
                        >
                          {pdfLoading === rel.id_grupo ? (
                            <Loader2 size={16} className={styles.spin} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Paginação */}
      {paginacao.total_paginas > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setFiltros({...filtros, pagina: filtros.pagina - 1})}
            disabled={filtros.pagina === 1 || loading || processing}
            className={styles.paginationButton}
          >
            <ChevronLeft size={18} />
          </button>
          
          <span className={styles.paginationInfo}>
            Página {paginacao.pagina_atual} de {paginacao.total_paginas}
          </span>
          
          <button
            onClick={() => setFiltros({...filtros, pagina: filtros.pagina + 1})}
            disabled={filtros.pagina === paginacao.total_paginas || loading || processing}
            className={styles.paginationButton}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Modal PDF */}
      {pdfUrl && (
        <div className={styles.modalOverlay} onClick={closePdf}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Visualização de Relatório</h3>
              <div className={styles.modalActions}>
                <button onClick={downloadPdf} className={styles.buttonDownload} title="Baixar PDF">
                  <Download size={18} />
                </button>
                <button onClick={closePdf} className={styles.modalClose} title="Fechar">
                  <X size={20} />
                </button>
              </div>
            </div>
            <iframe 
              src={pdfUrl} 
              className={styles.pdfViewer}
              title="PDF Viewer"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImprimirView;