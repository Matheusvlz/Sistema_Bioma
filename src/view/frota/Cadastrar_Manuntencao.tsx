import React, { useState, useEffect } from 'react';
import styles from './css/cadastrar_manutencao.module.css';
import { invoke } from "@tauri-apps/api/core";
import { 
  Plus, RefreshCw, Calendar, Car,  Wrench, 
  FileText, Drill, ChevronDown, Check, 
  Save, X, AlertCircle, Clock, Gauge
} from 'lucide-react';
import { WindowManager } from "../../hooks/WindowManager";

interface Veiculo {
  id: number;
  nome: string;
  marca?: string;
  placa?: string;
}

interface TipoManutencao {
  id: number;
  nome: string;
}



const Cadastrar_Manutencao: React.FC = () => {
  const [dataManutencao, setDataManutencao] = useState('');
  const [veiculoSelecionado, setVeiculoSelecionado] = useState<number | ''>('');
  const [tipoManutencaoSelecionado, setTipoManutencaoSelecionado] = useState<number | ''>('');
  const [kmAtual, setKmAtual] = useState<number | ''>('');
 
  const [descricao, setDescricao] = useState('');

  const [horaManutencao, setHoraManutencao] = useState('');
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [tiposManutencao, setTiposManutencao] = useState<TipoManutencao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNovoTipoModal, setShowNovoTipoModal] = useState(false);
  const [novoTipoNome, setNovoTipoNome] = useState('');
  const [dataProximaTroca, setDataProximaTroca] = useState('');
const [horaProximaTroca, setHoraProximaTroca] = useState('');
  // Funções para buscar dados
  const buscarVeiculos = async () => {
    try {
      const resultado = await invoke<Veiculo[]>('buscar_veiculos_e_marcas');
      setVeiculos(resultado);
    } catch (err) {
      console.error("Erro ao buscar veículos:", err);
      setError("Erro ao carregar veículos.");
    }
  };

  const buscarTiposManutencao = async () => {
    try {
      const resultado = await invoke<TipoManutencao[]>('buscar_tipos_manutencao');
      setTiposManutencao(resultado);
    } catch (err) {
      console.error("Erro ao buscar tipos de manutenção:", err);
      setError("Erro ao carregar tipos de manutenção.");
    }
  };

  useEffect(() => {
    const carregarDadosIniciais = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([
        buscarVeiculos(),
        buscarTiposManutencao()
      ]);
      setLoading(false);
    };
    carregarDadosIniciais();
  }, []);

  // Auto-dismiss messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);
// Adicione este useEffect no seu componente
  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    const formattedTime = today.toTimeString().split(' ')[0].substring(0, 5);
    
    setDataManutencao(formattedDate);
    setHoraManutencao(formattedTime);
  }, []);
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleLimparFormulario = () => {
   setDataManutencao('');
   setVeiculoSelecionado('');
   setTipoManutencaoSelecionado('');
   setKmAtual('');
   setDescricao('');
   setError(null);
   setSuccess(null);
   };

  const handleCadastrarNovoTipo = async () => {
    if (!novoTipoNome.trim()) {
      setError('Por favor, informe um nome para o novo tipo de manutenção.');
      return;
    }

    try {
      await invoke('criar_tipo_manutencao', {
         payload: { nome: novoTipoNome.trim() } 
        });
         setSuccess('Tipo de manutenção adicionado com sucesso!');
    } catch (err: any) {
      console.error("Erro ao criar tipo de manutenção:", err);
      setError(`Erro ao criar tipo de manutenção: ${err.toString()}`);
    }
  };

const handleCadastrar = async () => {
    setError(null);
    setSuccess(null);
    
    // Validação básica
    if (!dataManutencao || !horaManutencao || !veiculoSelecionado || !tipoManutencaoSelecionado || !kmAtual) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);

    const fullDateTime = `${dataManutencao}T${horaManutencao}:00`;
    const fullProximaTrocaDateTime = (dataProximaTroca && horaProximaTroca) ? `${dataProximaTroca}T${horaProximaTroca}:00` : null;

    const payload = {
        data: fullDateTime,
        data_realizada: fullDateTime,
        data_manutencao: fullDateTime,
        tipo: tipoManutencaoSelecionado,
        veiculo: veiculoSelecionado,
        km: Number(kmAtual),
        observacao: descricao || null,
        proxima: fullProximaTrocaDateTime
    };

    try {
      await invoke('criar_frota_manutencao', { payload });
      
      setSuccess('Manutenção cadastrada com sucesso!');
      
      // Limpar formulário após 2 segundos
      setTimeout(() => {
        handleLimparFormulario();
      }, 2000);

    } catch (err: any) {
      console.error("Erro ao cadastrar manutenção:", err);
      setError(`Erro: ${err.toString()}`);
    } finally {
      setIsSubmitting(false);
    }
};
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <Wrench size={32} className={styles.titleIcon} />
          <h1 className={styles.title}>Cadastro de Manutenção</h1>
        </div>
        <p className={styles.subtitle}>Registre todas as manutenções de forma rápida e eficiente</p>
      </div>

      <div className={styles.content}>
        {error && (
          <div className={styles.errorMessage}>
            <AlertCircle size={18} />
            <span>{error}</span>
            <button onClick={() => setError(null)} aria-label="Fechar mensagem de erro">
              <X size={18} />
            </button>
          </div>
        )}

        {success && (
          <div className={styles.successMessage}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Check size={18} />
              <span>{success}</span>
            </div>
          </div>
        )}

        <div className={styles.formGrid}>
          {/* Data */}
           <div className={styles.formGroup}>
        <label htmlFor="dataManutencao" className={styles.label}>
            <Calendar size={18} />
            <span>Data e Hora da Manutenção</span>
        </label>
        <input 
            type="date" 
            id="dataManutencao" 
            className={styles.inputField}
            value={dataManutencao}
            onChange={(e) => setDataManutencao(e.target.value)}
            required
        />
        <input 
            type="time" 
            id="horaManutencao" 
            className={styles.inputField}
            value={horaManutencao}
            onChange={(e) => setHoraManutencao(e.target.value)}
            required
        />
    </div>

          {/* Veículo */}
          <div className={styles.formGroup}>
            <label htmlFor="veiculoSelecionado" className={styles.label}>
              <Car size={18} />
              <span>Veículo</span>
            </label>
            <div className={styles.selectContainer}>
              <select 
                id="veiculoSelecionado" 
                className={styles.selectField}
                value={veiculoSelecionado}
                onChange={(e) => setVeiculoSelecionado(Number(e.target.value))}
                required
              >
                <option value="">Selecione um veículo...</option>
                {veiculos.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.nome} {v.marca && `- ${v.marca}`} {v.placa && `(${v.placa})`}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} className={styles.selectArrow} />
              <div className={styles.buttonGroup}>
                <button 
                  className={styles.iconButton} 
                  onClick={() => WindowManager.openGerenciarVeiculos()}
                  title="Adicionar veículo"
                  type="button"
                >
                  <Plus size={18} />
                </button>
                <button 
                  className={styles.iconButton} 
                  onClick={buscarVeiculos}
                  title="Recarregar veículos"
                  type="button"
                >
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Tipo de Manutenção */}
          <div className={styles.formGroup}>
            <label htmlFor="tipoManutencaoSelecionado" className={styles.label}>
              <Drill size={18} />
              <span>Tipo de Manutenção</span>
            </label>
            <div className={styles.selectContainer}>
              <select 
                id="tipoManutencaoSelecionado" 
                className={styles.selectField}
                value={tipoManutencaoSelecionado}
                onChange={(e) => setTipoManutencaoSelecionado(Number(e.target.value))}
                required
              >
                <option value="">Selecione o tipo...</option>
                {tiposManutencao.map(t => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
              <ChevronDown size={18} className={styles.selectArrow} />
              <div className={styles.buttonGroup}>
                <button 
                  className={styles.iconButton} 
                  onClick={() => setShowNovoTipoModal(true)}
                  title="Adicionar tipo de manutenção"
                  type="button"
                >
                  <Plus size={18} />
                </button>
                <button 
                  className={styles.iconButton} 
                  onClick={buscarTiposManutencao}
                  title="Recarregar tipos"
                  type="button"
                >
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Quilometragem */}
          <div className={styles.formGroup}>
            <label htmlFor="kmAtual" className={styles.label}>
              <Gauge size={18} />
              <span>Quilometragem Atual</span>
            </label>
            <input 
              type="number" 
              id="kmAtual" 
              className={styles.inputField}
              value={kmAtual}
              onChange={(e) => setKmAtual(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Ex: 12500"
              min="0"
              required
            />
          </div>

    

          {/* Próxima Troca */}
          {/* Próxima Troca (Data e Hora) */}
{/* Próxima Troca (Data e Hora) */}
<div className={styles.formGroup}>
    <label htmlFor="dataProximaTroca" className={styles.label}>
      <Clock size={18} />
      <span>Dia da próxima Troca</span>
    </label>
    <input 
      type="date" 
      id="dataProximaTroca" 
      className={styles.inputField}
      value={dataProximaTroca}
      onChange={(e) => setDataProximaTroca(e.target.value)}
    />

</div>
    <div className={styles.formGroup}>

      <label htmlFor="horaProximaTroca" className={styles.label}>
      <Clock size={18} />
      <span>Próxima Troca Hora</span>
    </label>
    <input 
      type="time" 
      id="horaProximaTroca" 
      className={styles.inputField}
      value={horaProximaTroca}
      onChange={(e) => setHoraProximaTroca(e.target.value)}
    />
</div>

          {/* Descrição */}
          <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="descricao" className={styles.label}>
              <FileText size={18} />
              <span>Descrição</span>
            </label>
            <textarea 
              id="descricao" 
              className={styles.textareaField}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Detalhes da manutenção, peças substituídas, observações..."
              rows={3}
            />
          </div>
        </div>

        <div className={styles.actionBar}>
          <button 
            className={styles.cancelButton}
            onClick={handleLimparFormulario}
            type="button"
            disabled={isSubmitting}
          >
            <X size={18} />
            Limpar Formulário
          </button>
          <button 
            className={styles.submitButton}
            onClick={handleCadastrar}
            disabled={isSubmitting}
            type="button"
          >
            {isSubmitting ? (
              <>
                <div className={styles.spinner} style={{ width: '18px', height: '18px', margin: 0 }}></div>
                Cadastrando...
              </>
            ) : (
              <>
                <Save size={18} />
                Cadastrar Manutenção
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal para adicionar novo tipo de manutenção */}
      {showNovoTipoModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Adicionar Novo Tipo de Manutenção</h2>
              <button 
                onClick={() => {
                  setShowNovoTipoModal(false);
                  setNovoTipoNome('');
                }} 
                className={styles.closeButton}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label htmlFor="novoTipoNome" className={styles.label}>
                  <span>Nome do Tipo de Manutenção</span>
                </label>
                <input 
                  type="text" 
                  id="novoTipoNome" 
                  className={styles.inputField}
                  value={novoTipoNome}
                  onChange={(e) => setNovoTipoNome(e.target.value)}
                  placeholder="Ex: Troca de óleo, Alinhamento, Revisão geral..."
                  autoFocus
                />
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              <button 
                onClick={() => {
                  setShowNovoTipoModal(false);
                  setNovoTipoNome('');
                }} 
                className={styles.cancelButton}
                type="button"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCadastrarNovoTipo}
                className={styles.submitButton}
                type="button"
              >
                <Save size={18} />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cadastrar_Manutencao;