// AlterarPopModal.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  RefreshCw,
  AlertCircle,
  Loader,
  Save,
  Wrench,
  FlaskConical,
  BookOpen,
} from "lucide-react";
import { emit } from "@tauri-apps/api/event"; // listen e getCurrentWindow não são mais necessários aqui
import { invoke } from "@tauri-apps/api/core";
import styles from './styles/AlterarPopModal.module.css';

// ============ INTERFACES ============

interface WindowData {
  idResultado: number;
  idUsuario: number;
  idLegislacao: number;
  idParametro: number;
  idLegislacaoParametro: number; // ID do POP/Técnica atual
  nomeParametro: string;
  nomeAmostra: string;
}

interface PopAlternativo {
  id_nova_leg_par: number; // ID que será usado para a alteração
  pop: string;
  limite: string;
}

interface TauriResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// ============ NOVA INTERFACE DE PROPS ============
interface Props {
    data: WindowData;
    onClose: () => void;
}

const AlterarPopModal: React.FC<Props> = ({ data, onClose }) => {
  // O estado windowData foi removido, usamos a 'data' da prop
  const [pops, setPops] = useState<PopAlternativo[]>([]);
  const [popSelecionado, setPopSelecionado] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [popAtual, setPopAtual] = useState<PopAlternativo | null>(null);

  // A função fecharJanela agora chama a prop onClose
  const fecharJanela = useCallback(() => {
    onClose();
  }, [onClose]);

  const carregarPops = useCallback(async (dataToLoad: WindowData) => {
    setLoading(true);
    setError(null);
    setPopSelecionado(null);

    const { idLegislacao, idParametro, idLegislacaoParametro } = dataToLoad;

    try {
      console.log("🔍 Buscando POPs alternativos...");

      const response = await invoke("buscar_pops_alternativos", {
        idLegislacao: idLegislacao,
        idParametro: idParametro,
        idLegislacaoParametroAtual: idLegislacaoParametro,
      }) as TauriResponse<PopAlternativo[]>;

      if (response.success && response.data) {
        const todosPops = response.data;

        // 1. Encontrar o POP atual (idLegislacaoParametro)
        const currentPop = todosPops.find(
          (p) => p.id_nova_leg_par === idLegislacaoParametro
        );

        // 2. Filtrar a lista para exibir apenas os alternativos
        const alternativos = todosPops.filter(
          (p) => p.id_nova_leg_par !== idLegislacaoParametro
        );
        
        setPopAtual(currentPop || null);
        setPops(alternativos);
        setPopSelecionado(alternativos.length > 0 ? alternativos[0].id_nova_leg_par : null);
        
      } else {
        setError(response.message || "Não foi possível carregar os POPs alternativos.");
        setPops([]);
      }
    } catch (err: any) {
      setError(err.message || "Erro de conexão ao buscar POPs.");
      setPops([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAlterarPop = async () => {
    // Usa 'data' da prop em vez de 'windowData'
    if (!data || !popSelecionado) {
      setError("Selecione um POP alternativo para continuar.");
      return;
    }

    setSalvando(true);
    setError(null);

    try {
      const response = await invoke("alterar_pop_resultado", {
        idResultado: data.idResultado,
        idNovaLegislacaoParametro: popSelecionado,
      }) as TauriResponse<any>;

      if (response.success) {
        // Dispara um evento para atualizar o AmostraDetailModal (ou a tela de resultados)
        await emit('pop-alterado-sucesso', { 
            idResultado: data.idResultado, 
            idNovoPop: popSelecionado 
        });
        
        alert("POP/Técnica alterado com sucesso!");
        // Chama 'fecharJanela' (que chama onClose) para fechar o modal
        fecharJanela(); 

      } else {
        setError(response.message || "Erro ao tentar alterar o POP/Técnica.");
      }
    } catch (err: any) {
      setError(err.message || "Erro de conexão ao salvar a alteração.");
    } finally {
      setSalvando(false);
    }
  };

  // ============ useEffect MODIFICADO ============
  // Remove o listener de 'window-data'
  // Adiciona um useEffect para carregar os POPs quando o componente é montado com os dados
  useEffect(() => {
    if (data) {
        carregarPops(data);
    }
  }, [data, carregarPops]); // Depende da 'data' da prop

  // A tela de "Aguardando dados" foi removida,
  // pois o componente pai (AmostraDetailModal) só vai renderizar este
  // quando 'data' (popModalData) não for nulo.

  const popSelecionadoDetalhes = pops.find(p => p.id_nova_leg_par === popSelecionado);

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <div className={styles.iconContainer}>
              <Wrench className={styles.headerIcon} />
            </div>
            <div>
              <h1 className={styles.title}>Alterar POP / Técnica</h1>
              <p className={styles.subtitle}>
                <FlaskConical size={14} /> Amostra **{data.nomeAmostra}**
              </p>
            </div>
          </div>
          <button
            onClick={fecharJanela} // Chama o onClose da prop
            className={styles.closeButton}
            aria-label="Fechar"
          >
            <X size={24} />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.infoBox}>
            <span className={styles.infoLabel}>Parâmetro:</span>
            <span className={styles.infoValue}>**{data.nomeParametro}**</span>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <AlertCircle className={styles.errorIcon} size={20} />
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className={styles.loadingCenter}>
            <Loader className={styles.spinningLoader} size={32} />
            <span>Buscando alternativas...</span>
          </div>
        )}
        
        {!loading && (
            <>
                {/* POP ATUAL */}
                <div className={styles.popAtualCard}>
                    <BookOpen size={20} className={styles.popAtualIcon} />
                    <div className={styles.popAtualInfo}>
                        <h3 className={styles.popAtualTitle}>POP/Técnica Atual</h3>
                        <p className={styles.popAtualDetails}>
                            **{popAtual?.pop || 'N/A'}**
                        </p>
                        <p className={styles.popAtualLimite}>
                            Limite: {popAtual?.limite || 'N/A'}
                        </p>
                    </div>
                </div>

                {/* Alternativas */}
                <h3 className={styles.alternativasTitle}>
                    {pops.length > 0 ? 'Selecione a Nova Opção:' : 'Nenhuma alternativa encontrada.'}
                </h3>
                
                <div className={styles.alternativasGrid}>
                    {pops.map((pop) => (
                        <div 
                            key={pop.id_nova_leg_par} 
                            className={`${styles.popCard} ${pop.id_nova_leg_par === popSelecionado ? styles.selectedPop : ''}`}
                            onClick={() => setPopSelecionado(pop.id_nova_leg_par)}
                        >
                            <input 
                                type="radio" 
                                name="pop_alternativo" 
                                checked={pop.id_nova_leg_par === popSelecionado}
                                readOnly
                                className={styles.popRadio}
                            />
                            <div className={styles.popDetails}>
                                <span className={styles.popName}>{pop.pop}</span>
                                <span className={styles.popLimit}>Limite: {pop.limite}</span>
                            </div>
                        </div>
                    ))}
                </div>
                
                {popSelecionadoDetalhes && (
                    <div className={styles.popSelecionadoDetalhe}>
                        Você irá alterar o POP de **{popAtual?.pop || 'N/A'}** para: 
                        <span className={styles.novoPopNome}> {popSelecionadoDetalhes.pop}</span>
                    </div>
                )}
            </>
        )}
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <button
          onClick={fecharJanela} // Chama o onClose da prop
          className={styles.btnCancel}
          disabled={salvando}
        >
          Cancelar
        </button>
        
        <button
          onClick={handleAlterarPop}
          disabled={salvando || loading || !popSelecionado}
          className={styles.btnSave}
        >
          {salvando ? (
            <>
              <Loader className={styles.spinningIcon} size={18} />
              <span>Aplicando...</span>
            </>
          ) : (
            <>
              <Save size={18} />
              <span>Confirmar Alteração</span>
            </>
          )}
        </button>
      </footer>
    </div>
  );
};

export default AlterarPopModal;