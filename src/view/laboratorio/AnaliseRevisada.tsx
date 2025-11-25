import React, { useState, useEffect, useCallback, memo } from 'react';
import { 
  CheckCircle, RefreshCw, FileText, AlertTriangle, 
  PenTool, Filter, X, ChevronDown, Loader2, Download,
  AlertCircle, Eye
} from 'lucide-react';
import { invoke } from "@tauri-apps/api/core";
import styles from './styles/AnaliseRevisada.module.css';

// ==================== INTERFACES ====================

interface AnaliseDTO {
  id_grupo: number;
  cliente_fantasia: string;
  data_lab?: string;
  data_inicio?: string;
  data_termino?: string;
  data_agendada?: string;
  ass_liberacao?: string;
  amostras_texto: string;
  tem_observacao: boolean;
  obs_texto?: string;
}

interface ClienteDTO {
  id: number;
  fantasia?: string;
}

interface RelatorioResponse {
  pdfBase64?: string;
  erro?: string;
}

interface AssinarRequest {
  ids: number[];
  usuario_id: number;
}

// ==================== COMPONENTE PRINCIPAL ====================

export const AnaliseRevisada: React.FC = memo(() => {
  // --- Estados de Dados ---
  const [analises, setAnalises] = useState<AnaliseDTO[]>([]);
  const [clientes, setClientes] = useState<ClienteDTO[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [obsNecessariaIds, setObsNecessariaIds] = useState<Set<number>>(new Set());

  // --- Estados de Carregamento ---
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [pdfLoadingId, setPdfLoadingId] = useState<number | null>(null);
  
  // --- Estados de UI ---
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string>('relatorio.pdf');
  const [modalObs, setModalObs] = useState<{open: boolean, texto: string}>({
    open: false, 
    texto: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ==================== EFEITOS ====================

  useEffect(() => {
    carregarClientes();
    carregarAnalises();
  }, []);

  useEffect(() => {
    carregarAnalises();
  }, [selectedCliente]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 7000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (pdfUrl) closePdf();
        if (modalObs.open) setModalObs({ open: false, texto: '' });
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [pdfUrl, modalObs]);

  // ==================== FUNÇÕES DE CARREGAMENTO ====================

  const carregarClientes = useCallback(async () => {
    try {
      console.log('🔄 Carregando clientes...');
      const data = await invoke<ClienteDTO[]>('proxy_listar_clientes_revisao');
      console.log('✅ Clientes carregados:', data);
      setClientes(data || []);
    } catch (err) {
      console.error("❌ Erro ao carregar clientes:", err);
      setError(`Erro ao carregar lista de clientes: ${err}`);
    }
  }, []);

  const carregarAnalises = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const clienteId = selectedCliente ? parseInt(selectedCliente) : null;
      
      console.log('🔄 Carregando análises...', { clienteId });
      
      const data = await invoke<AnaliseDTO[]>('proxy_listar_analises_revisadas', {
        clienteId
      });
      
      console.log('✅ Análises carregadas:', data);
      
      setAnalises(data || []);
      setSelectedIds(new Set());
      
      // Inicializa todas as análises como "exigem observação"
      if (data && data.length > 0) {
        setObsNecessariaIds(new Set(data.map(a => a.id_grupo)));
      }
    } catch (err) {
      console.error("❌ Erro ao carregar análises:", err);
      setError(`Erro ao carregar análises: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [selectedCliente]);

  // ==================== FUNÇÕES DE PDF ====================

  const base64ToPdfUrl = useCallback((base64: string): string => {
    try {
      const binaryString = window.atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('❌ Erro ao converter base64 para PDF:', error);
      throw new Error('Erro ao processar PDF');
    }
  }, []);

  const formatarData = useCallback((dataStr?: string): string | null => {
    if (!dataStr) {
      console.warn('⚠️ Data vazia ou undefined');
      return null;
    }
    
    const trimmed = dataStr.trim();
    console.log('🔄 Formatando data:', trimmed);
    
    // Formato: YYYY-MM-DD (já correto)
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const formatted = trimmed.split(' ')[0];
      console.log('✅ Data já no formato correto:', formatted);
      return formatted;
    }
    
    // Formato: DD/MM/YYYY HH:mm -> YYYY-MM-DD
    if (/^\d{2}\/\d{2}\/\d{4}/.test(trimmed)) {
      const [datePart] = trimmed.split(' ');
      const [dia, mes, ano] = datePart.split('/');
      const formatted = `${ano}-${mes}-${dia}`;
      console.log('✅ Data convertida de DD/MM/YYYY:', formatted);
      return formatted;
    }
    
    // Tenta parsear como Date
    try {
      const data = new Date(trimmed);
      if (!isNaN(data.getTime())) {
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const dia = String(data.getDate()).padStart(2, '0');
        const formatted = `${ano}-${mes}-${dia}`;
        console.log('✅ Data parseada como Date:', formatted);
        return formatted;
      }
    } catch (e) {
      console.error('❌ Erro ao parsear data:', e);
    }
    
    console.error('❌ Formato de data não reconhecido:', trimmed);
    return null;
  }, []);

const handleVisualizarPDF = useCallback(async (
  idGrupo: number, 
  dataLab?: string, 
  amostraTexto?: string
) => {
  setPdfLoadingId(idGrupo);
  console.log('📄 Iniciando geração de PREVIEW (PRÉ-ASSINATURA)...', { idGrupo });

  try {
    console.log('📤 Enviando requisição para Tauri (PREVIEW):', { idGrupo });

    // ✅ CORREÇÃO: Usar o comando de PREVIEW (não precisa de data)
    const response = await invoke<RelatorioResponse>(
      'gerar_relatorio_preview', // ← MUDOU: era 'gerar_relatorio_final2'
      { idGrupo } // ← SEM 'dataEntrada'
    );

    console.log('📥 Resposta recebida:', {
      temPDF: !!response.pdfBase64,
      temErro: !!response.erro,
      tamanhoPDF: response.pdfBase64?.length
    });

    if (response.erro) {
      setError(`Erro ao gerar relatório: ${response.erro}`);
    } else if (response.pdfBase64) {
      console.log('✅ Convertendo PDF base64 para URL...');
      const url = base64ToPdfUrl(response.pdfBase64);
      setPdfUrl(url);
      setPdfName(`preview_${amostraTexto || idGrupo}.pdf`);
      console.log('✅ Preview pronto para visualização');
    } else {
      setError("Erro inesperado: PDF não foi retornado pelo serviço");
    }
  } catch (err) {
    console.error('❌ Erro completo:', err);
    const errorMsg = err instanceof Error 
      ? err.message 
      : 'Falha ao comunicar com o serviço de relatórios';
    setError(errorMsg);
  } finally {
    setPdfLoadingId(null);
  }
}, [base64ToPdfUrl]);

  const closePdf = useCallback(() => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      console.log('🗑️ URL do PDF liberada');
    }
    setPdfUrl(null);
    setPdfName('relatorio.pdf');
  }, [pdfUrl]);

  const handleDownloadPDF = useCallback(() => {
    if (!pdfUrl) return;
    
    console.log('💾 Iniciando download:', pdfName);
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = pdfName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log('✅ Download iniciado');
  }, [pdfUrl, pdfName]);

  // ==================== FUNÇÕES DE ASSINATURA ====================

  const handleAssinar = useCallback(async () => {
    if (selectedIds.size === 0) {
      setError("Selecione ao menos um relatório para assinar");
      return;
    }

    const ids = Array.from(selectedIds);
    console.log('🔍 Verificando observações para:', ids);

    // Verifica se algum item exige observação mas não tem
    for (const id of ids) {
      const item = analises.find(a => a.id_grupo === id);
      if (obsNecessariaIds.has(id) && !item?.tem_observacao) {
        setError(
          `O grupo ${id} (${item?.cliente_fantasia}) está marcado como ` +
          `"Exige Obs." mas não possui observações registradas. ` +
          `Por favor, adicione uma observação antes de assinar.`
        );
        return;
      }
    }

    const confirmMsg = 
      `Tem certeza que deseja autenticar ${ids.length} relatório(s)?\n\n` +
      `Esta ação criará certificados permanentes e não poderá ser desfeita.`;

    if (!confirm(confirmMsg)) {
      console.log('❌ Assinatura cancelada pelo usuário');
      return;
    }

    setProcessing(true);
    setError(null);
    console.log('📝 Iniciando processo de assinatura...', { ids });

    try {
      // TODO: Substituir por ID do usuário logado real
      const usuarioId = 1; 
      
      const request: AssinarRequest = { 
        ids, 
        usuario_id: usuarioId 
      };

      console.log('📤 Enviando requisição de assinatura:', request);

      await invoke('proxy_assinar_relatorios', request);
      
      console.log('✅ Assinatura concluída com sucesso');
      setSuccessMessage(`✅ ${ids.length} relatório(s) assinado(s) com sucesso!`);
      setSelectedIds(new Set());
      
      // Recarrega a lista após 1.5s
      setTimeout(() => {
        console.log('🔄 Recarregando lista de análises...');
        carregarAnalises();
      }, 1500);
    } catch (err) {
      console.error('❌ Erro ao assinar:', err);
      setError(`❌ Erro ao assinar relatórios: ${err}`);
    } finally {
      setProcessing(false);
    }
  }, [selectedIds, analises, obsNecessariaIds, carregarAnalises]);

  // ==================== MANIPULADORES DE UI ====================

  const toggleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(analises.map(a => a.id_grupo)));
      console.log('✅ Todos selecionados');
    } else {
      setSelectedIds(new Set());
      console.log('❌ Todos desmarcados');
    }
  }, [analises]);

  const toggleSelectRow = useCallback((id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
      console.log('❌ Desmarcado:', id);
    } else {
      newSet.add(id);
      console.log('✅ Marcado:', id);
    }
    setSelectedIds(newSet);
  }, [selectedIds]);

  const toggleObsNecessaria = useCallback((id: number) => {
    const newSet = new Set(obsNecessariaIds);
    if (newSet.has(id)) {
      newSet.delete(id);
      console.log('❌ Obs não necessária:', id);
    } else {
      newSet.add(id);
      console.log('✅ Obs necessária:', id);
    }
    setObsNecessariaIds(newSet);
  }, [obsNecessariaIds]);

  // ==================== RENDER ====================

  const renderTableRow = useCallback((row: AnaliseDTO) => (
    <div 
      key={row.id_grupo} 
      className={`${styles.tableRow} ${selectedIds.has(row.id_grupo) ? styles.selected : ''}`}
    >
      {/* Checkbox de Seleção */}
      <div className={styles.tableCellCheckbox}>
        <input 
          type="checkbox"
          checked={selectedIds.has(row.id_grupo)}
          onChange={() => toggleSelectRow(row.id_grupo)}
          className={styles.tableCheckbox}
          title="Selecionar para assinatura"
        />
      </div>

      {/* Cliente e Amostras */}
      <div className={styles.tableCell}>
        <span className={styles.clientName} title={row.cliente_fantasia}>
          {row.cliente_fantasia}
        </span>
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
          <span style={{ fontWeight: 500 }}>Amostras:</span>{' '}
          <span className={styles.amostrasBadge}>{row.amostras_texto}</span>
        </div>
      </div>

      {/* Cronograma */}
      <div className={styles.tableCell}>
        <div className={styles.cronogramaList}>
          {row.data_lab && (
            <span className={styles.dataLabBadge} title="Data de laboratório">
              Lab: {row.data_lab}
            </span>
          )}
          {row.data_inicio && (
            <span className={styles.cronogramaItem} title="Data de início">
              Início: {row.data_inicio}
            </span>
          )}
          {row.data_termino && (
            <span className={styles.cronogramaItem} title="Data de término">
              Fim: {row.data_termino}
            </span>
          )}
        </div>
      </div>

      {/* Liberação */}
      <div className={styles.liberacaoCell}>
        {row.data_agendada ? (
          <>
            <span className={styles.liberacaoData} title="Data agendada para liberação">
              {row.data_agendada}
            </span>
            {row.ass_liberacao && (
              <span className={styles.liberacaoUsuario} title="Responsável">
                Por: {row.ass_liberacao}
              </span>
            )}
          </>
        ) : (
          <span style={{ color: '#d1d5db' }} title="Sem agendamento">
            Não agendada
          </span>
        )}
      </div>

      {/* Ações */}
      <div className={styles.acaoCell}>
        <div className={styles.acaoBotoes}>
          {/* Botão Observação */}
          <button
            onClick={() => setModalObs({
              open: true, 
              texto: row.obs_texto || 'Sem observações registradas'
            })}
            className={`${styles.botaoObs} ${row.tem_observacao ? styles.temObservacao : ''}`}
            title={row.tem_observacao ? 'Ver observações' : 'Sem observações'}
          >
            <AlertTriangle size={16} />
          </button>

          {/* Botão PDF */}
          <button
            onClick={() => handleVisualizarPDF(
              row.id_grupo, 
              row.data_lab, 
              row.amostras_texto
            )}
            disabled={pdfLoadingId === row.id_grupo}
            className={`${styles.botaoAcao} ${styles.botaoPdf}`}
            title="Visualizar PDF"
          >
            {pdfLoadingId === row.id_grupo ? (
              <>
                <Loader2 size={14} className={styles.spin} />
                Gerando...
              </>
            ) : (
              <>
                <Eye size={14} />
                PDF
              </>
            )}
          </button>
        </div>

        {/* Checkbox "Exige Obs." */}
        <label 
          className={styles.checkboxExigeObs}
          title="Marcar se este relatório exige observação obrigatória"
        >
          <input 
            type="checkbox"
            checked={obsNecessariaIds.has(row.id_grupo)}
            onChange={() => toggleObsNecessaria(row.id_grupo)}
          />
          Exige Obs.
        </label>
      </div>
    </div>
  ), [
    selectedIds, 
    toggleSelectRow, 
    obsNecessariaIds, 
    toggleObsNecessaria, 
    handleVisualizarPDF, 
    pdfLoadingId
  ]);

  // ==================== JSX PRINCIPAL ====================

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerTitle}>
            <div className={styles.headerIcon}>
              <CheckCircle size={32} />
            </div>
            <div className={styles.headerTitleText}>
              <h1>Análise Revisada</h1>
              <p>Validação e Assinatura Digital de Relatórios</p>
            </div>
          </div>
          
          <div className={styles.headerActions}>
            <button 
              onClick={() => carregarAnalises()} 
              disabled={loading}
              className={`${styles.buttonRefresh} ${loading ? styles.spin : ''}`}
              title="Atualizar lista"
            >
              <RefreshCw size={18} />
              Atualizar
            </button>
            <button 
              onClick={handleAssinar}
              disabled={processing || selectedIds.size === 0}
              className={styles.buttonAssinar}
              title={`Assinar ${selectedIds.size} relatório(s) selecionado(s)`}
            >
              {processing ? (
                <>
                  <Loader2 size={18} className={styles.spin} />
                  Assinando...
                </>
              ) : (
                <>
                  <PenTool size={18} />
                  Assinar ({selectedIds.size})
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mensagens de Feedback */}
      {error && (
        <div className={`${styles.feedbackContainer} ${styles.feedbackError}`}>
          <AlertTriangle size={20} />
          <span>{error}</span>
          <button 
            className={styles.feedbackClose} 
            onClick={() => setError(null)}
            aria-label="Fechar mensagem de erro"
          >
            <X size={16} />
          </button>
        </div>
      )}
      
      {successMessage && (
        <div className={`${styles.feedbackContainer} ${styles.feedbackSuccess}`}>
          <CheckCircle size={20} />
          <span>{successMessage}</span>
          <button 
            className={styles.feedbackClose} 
            onClick={() => setSuccessMessage(null)}
            aria-label="Fechar mensagem de sucesso"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filtros */}
      <div className={styles.filterSection}>
        <div className={styles.filterGroup}>
          <Filter className={styles.filterIcon} size={16} />
          <select 
            value={selectedCliente}
            onChange={(e) => setSelectedCliente(e.target.value)}
            className={styles.selectFilter}
            disabled={loading}
          >
            <option value="">Todos os Clientes</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>
                {c.fantasia || `Cliente ${c.id}`}
              </option>
            ))}
          </select>
          <ChevronDown className={`${styles.filterIcon} ${styles.chevron}`} size={16} />
        </div>
        <span className={styles.filterInfo}>
          {analises.length} registro{analises.length !== 1 ? 's' : ''} encontrado{analises.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Conteúdo Principal */}
      <div className={styles.contentSection}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <Loader2 className={styles.loadingSpinner} size={48} />
            <p className={styles.loadingText}>Carregando análises...</p>
          </div>
        ) : analises.length === 0 ? (
          <div className={styles.emptyContainer}>
            <AlertCircle className={styles.emptyIcon} size={64} />
            <p className={styles.emptyTitle}>Nenhuma análise revisada encontrada</p>
            <p className={styles.emptySubtitle}>
              {selectedCliente 
                ? 'Não há análises revisadas para o cliente selecionado' 
                : 'Selecione um cliente ou aguarde novas análises serem revisadas'
              }
            </p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            {/* Cabeçalho da Tabela */}
            <div className={styles.tableHeader}>
              <input 
                type="checkbox"
                onChange={(e) => toggleSelectAll(e.target.checked)}
                checked={selectedIds.size === analises.length && analises.length > 0}
                className={styles.tableCheckbox}
                title="Selecionar/Desmarcar todos"
              />
              <div>Cliente / Amostras</div>
              <div>Cronograma</div>
              <div>Liberação</div>
              <div>Ações</div>
            </div>

            {/* Corpo da Tabela */}
            <div className={styles.tableBody}>
              {analises.map(row => renderTableRow(row))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Visualização de PDF */}
      {pdfUrl && (
        <div className={styles.modalOverlay} onClick={closePdf}>
          <div 
            className={styles.modal} 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '90vw', width: '1200px', height: '90vh' }}
          >
            <div className={styles.modalPdfHeader}>
              <div>
                <div className={styles.modalTitle}>Visualização de Relatório</div>
                <div className={styles.modalSubtitle}>{pdfName}</div>
              </div>
              <div className={styles.modalPdfControls}>
                <button 
                  onClick={handleDownloadPDF} 
                  className={styles.buttonDownload}
                  title="Baixar PDF"
                >
                  <Download size={16} />
                  Download
                </button>
                <button 
                  onClick={closePdf} 
                  className={styles.modalClose}
                  title="Fechar"
                  aria-label="Fechar visualização"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <iframe 
              src={pdfUrl} 
              className={styles.pdfViewer} 
              title="Visualizador de PDF"
              style={{ 
                width: '100%', 
                height: 'calc(100% - 60px)', 
                border: 'none' 
              }}
            />
          </div>
        </div>
      )}

      {/* Modal de Observação */}
      {modalObs.open && (
        <div 
          className={styles.modalOverlay} 
          onClick={() => setModalObs({ open: false, texto: '' })}
        >
          <div 
            className={styles.modal} 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '600px' }}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} />
                Observações do Grupo
              </div>
              <button 
                onClick={() => setModalObs({ open: false, texto: '' })} 
                className={styles.modalClose}
                aria-label="Fechar modal de observações"
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalObsContent}>
              <textarea 
                readOnly 
                className={styles.textareaObs}
                value={modalObs.texto}
                style={{ 
                  minHeight: '200px', 
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>
            <div className={styles.modalObsFooter}>
              <button 
                onClick={() => setModalObs({open: false, texto: ''})} 
                className={styles.buttonFechar}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

AnaliseRevisada.displayName = 'AnaliseRevisada';

export default AnaliseRevisada;