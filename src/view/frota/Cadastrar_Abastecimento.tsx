import React, { useState, useEffect } from 'react';
import styles from './css/cadastrar_abastecimento.module.css';
import { invoke } from "@tauri-apps/api/core";
import { 
  Plus, RefreshCw, Calendar, Car, User, Fuel, 
  DollarSign, Receipt, MapPin, Gauge, Clock, 
  Zap, ChevronDown, Check, Save, X 
} from 'lucide-react';
import { WindowManager } from "../../hooks/WindowManager";
interface Veiculo {
  id: number;
  nome: string;
  marca?: string;
  placa?: string;
}

interface Motorista {
  id: number;
  nome: string;
  cnh?: string;
}

interface Posto {
  id: number;
  nome: string;
  endereco?: string;
}

const Cadastrar_Abastecimento: React.FC = () => {
  const [dataAbastecimento, setDataAbastecimento] = useState('');
  const [horaAbastecimento, setHoraAbastecimento] = useState('');
  const [veiculoSelecionado, setVeiculoSelecionado] = useState<number | ''>('');
  const [motoristaSelecionado, setMotoristaSelecionado] = useState<number | ''>('');
  const [kmAtual, setKmAtual] = useState<number | ''>('');
  const [combustivelSelecionado, setCombustivelSelecionado] = useState<number | ''>(''); // Alterado para número
  const [valorPorLitro, setValorPorLitro] = useState<number | ''>('');
  const [litrosAbastecidos, setLitrosAbastecidos] = useState<number | ''>('');
  const [valorTotal, setValorTotal] = useState<number | ''>('');
  // O campo valorPago não existe no backend, então pode ser removido se não tiver outra utilidade
  // const [valorPago, setValorPago] = useState<number | ''>(''); 
  const [postoSelecionado, setPostoSelecionado] = useState<number | ''>('');
  const [nf, setNf] = useState('');

  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [postos, setPostos] = useState<Posto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mapeamento de combustível para o ID numérico esperado pelo backend
  const combustiveis = [
    { id: 1, nome: 'Gasolina' },
    { id: 2, nome: 'Etanol' },
    { id: 3, nome: 'Diesel' },
    { id: 4, nome: 'GNV' },
  ];

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

  const buscarMotoristas = async () => {
    try {
      const resultado = await invoke<Motorista[]>('buscar_motoristas');
      setMotoristas(resultado);
    } catch (err) {
      console.error("Erro ao buscar motoristas:", err);
      setError("Erro ao carregar motoristas.");
    }
  };

  const buscarPostos = async () => {
    try {
      const resultado = await invoke<Posto[]>('buscar_postos');
      setPostos(resultado);
    } catch (err) {
      console.error("Erro ao buscar postos:", err);
      setError("Erro ao carregar postos.");
    }
  };

  useEffect(() => {
    const carregarDadosIniciais = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([
        buscarVeiculos(),
        buscarMotoristas(),
        buscarPostos()
      ]);
      setLoading(false);
    };
    carregarDadosIniciais();
  }, []);

  // Calcular Valor Total
  useEffect(() => {
    if (typeof valorPorLitro === 'number' && typeof litrosAbastecidos === 'number' && valorPorLitro > 0 && litrosAbastecidos > 0) {
      setValorTotal(parseFloat((valorPorLitro * litrosAbastecidos).toFixed(2)));
    } else {
      setValorTotal('');
    }
  }, [valorPorLitro, litrosAbastecidos]);

  // Auto-dismiss messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleLimparFormulario = () => {
    setDataAbastecimento('');
    setHoraAbastecimento('');
    setVeiculoSelecionado('');
    setMotoristaSelecionado('');
    setKmAtual('');
    setCombustivelSelecionado('');
    setValorPorLitro('');
    setLitrosAbastecidos('');
    setValorTotal('');
    setPostoSelecionado('');
    setNf('');
    setError(null);
    setSuccess(null);
  };

  const handleCadastrar = async () => {
    setError(null);
    setSuccess(null);
    
    // Validação básica
    if (!dataAbastecimento || !horaAbastecimento || !veiculoSelecionado || !motoristaSelecionado || 
        !kmAtual || !combustivelSelecionado || !valorPorLitro || !litrosAbastecidos || 
        !valorTotal || !postoSelecionado) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);

    const dataHoraCompleta = `${dataAbastecimento}T${horaAbastecimento}:00`;

    // ** Objeto que será enviado para o backend Rust **
    const payload = {
      data: dataHoraCompleta,
      veiculo: veiculoSelecionado,
      motorista: motoristaSelecionado,
      quilometragem: kmAtual,
      combustivel: combustivelSelecionado,
      valor_litro: String(valorPorLitro), // Enviar como string para precisão com BigDecimal
      litro: String(litrosAbastecidos),   // Enviar como string para precisão com BigDecimal
      valor: String(valorTotal),          // Enviar como string para precisão com BigDecimal
      posto: postoSelecionado,
      notafiscal: nf || null, // Enviar null se estiver vazio
      foto: null // Campo foto não está no formulário, então enviamos null
    };

    try {
      await invoke('criar_frota_abastecimento', { payload });
      
      setSuccess('Abastecimento cadastrado com sucesso!');
      
      // Limpar formulário após 2 segundos
      setTimeout(() => {
        handleLimparFormulario();
      }, 2000);

    } catch (err: any) {
      console.error("Erro ao cadastrar abastecimento:", err);
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
          <Zap size={32} className={styles.titleIcon} />
          <h1 className={styles.title}>Cadastro de Abastecimento</h1>
        </div>
        <p className={styles.subtitle}>Registre todos os detalhes do abastecimento de forma rápida e eficiente</p>
      </div>

      <div className={styles.content}>
        {error && (
          <div className={styles.errorMessage}>
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
          {/* Data e Hora */}
          <div className={styles.formGroup}>
            <label htmlFor="dataAbastecimento" className={styles.label}>
              <Calendar size={18} />
              <span>Data do Abastecimento</span>
            </label>
            <input 
              type="date" 
              id="dataAbastecimento" 
              className={styles.inputField}
              value={dataAbastecimento}
              onChange={(e) => setDataAbastecimento(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="horaAbastecimento" className={styles.label}>
              <Clock size={18} />
              <span>Hora do Abastecimento</span>
            </label>
            <input 
              type="time" 
              id="horaAbastecimento" 
              className={styles.inputField}
              value={horaAbastecimento}
              onChange={(e) => setHoraAbastecimento(e.target.value)}
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

          {/* Motorista */}
          <div className={styles.formGroup}>
            <label htmlFor="motoristaSelecionado" className={styles.label}>
              <User size={18} />
              <span>Motorista</span>
            </label>
            <div className={styles.selectContainer}>
              <select 
                id="motoristaSelecionado" 
                className={styles.selectField}
                value={motoristaSelecionado}
                onChange={(e) => setMotoristaSelecionado(Number(e.target.value))}
                required
              >
                <option value="">Selecione um motorista...</option>
                {motoristas.map(m => (
                  <option key={m.id} value={m.id}>{m.nome}</option>
                ))}
              </select>
              <ChevronDown size={18} className={styles.selectArrow} />
              <div className={styles.buttonGroup}>
                <button 
                  className={styles.iconButton} 
                  onClick={() => WindowManager.openCastrarCondutor()}
                  title="Adicionar motorista"
                  type="button"
                >
                  <Plus size={18} />
                </button>
                <button 
                  className={styles.iconButton} 
                  onClick={buscarMotoristas}
                  title="Recarregar motoristas"
                  type="button"
                >
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* KM */}
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

          {/* Combustível */}
          <div className={styles.formGroup}>
            <label htmlFor="combustivelSelecionado" className={styles.label}>
              <Fuel size={18} />
              <span>Tipo de Combustível</span>
            </label>
            <div className={styles.selectContainer}>
              <select 
                id="combustivelSelecionado" 
                className={styles.selectField}
                value={combustivelSelecionado}
                onChange={(e) => setCombustivelSelecionado(Number(e.target.value))}
                required
              >
                <option value="">Selecione o combustível...</option>
                {combustiveis.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              <ChevronDown size={18} className={styles.selectArrow} />
            </div>
          </div>

          {/* Valor/Litro */}
          <div className={styles.formGroup}>
            <label htmlFor="valorPorLitro" className={styles.label}>
              <DollarSign size={18} />
              <span>Valor por Litro (R$)</span>
            </label>
            <div className={styles.inputWithPrefix}>
              <span className={styles.currencySymbol}>R$</span>
              <input 
                type="number" 
                id="valorPorLitro" 
                className={styles.inputField}
                value={valorPorLitro}
                onChange={(e) => setValorPorLitro(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0,000"
                step="0.001"
                min="0"
                required
              />
            </div>
          </div>

          {/* Litros */}
          <div className={styles.formGroup}>
            <label htmlFor="litrosAbastecidos" className={styles.label}>
              <Fuel size={18} />
              <span>Litros Abastecidos</span>
            </label>
            <input 
              type="number" 
              id="litrosAbastecidos" 
              className={styles.inputField}
              value={litrosAbastecidos}
              onChange={(e) => setLitrosAbastecidos(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0,000"
              step="0.001"
              min="0"
              required
            />
          </div>

          {/* Valor Total */}
          <div className={styles.formGroup}>
            <label htmlFor="valorTotal" className={styles.label}>
              <DollarSign size={18} />
              <span>Valor Total (R$)</span>
            </label>
            <div className={styles.inputWithPrefix}>
              <span className={styles.currencySymbol}>R$</span>
              <input 
                type="text" 
                id="valorTotal" 
                className={styles.inputField}
                value={typeof valorTotal === 'number' ? valorTotal.toFixed(2).replace('.', ',') : ''}
                readOnly
                placeholder="0,00"
                style={{ backgroundColor: '#f9fafb', cursor: 'not-allowed' }}
              />
            </div>
          </div>

          {/* Posto */}
          <div className={styles.formGroup}>
            <label htmlFor="postoSelecionado" className={styles.label}>
              <MapPin size={18} />
              <span>Posto de Combustível</span>
            </label>
            <div className={styles.selectContainer}>
              <select 
                id="postoSelecionado" 
                className={styles.selectField}
                value={postoSelecionado}
                onChange={(e) => setPostoSelecionado(Number(e.target.value))}
                required
              >
                <option value="">Selecione um posto...</option>
                {postos.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
              <ChevronDown size={18} className={styles.selectArrow} />
              <div className={styles.buttonGroup}>
                <button 
                  className={styles.iconButton} 
                  onClick={() => WindowManager.openCadastrarPosto()}
                  title="Adicionar posto"
                  type="button"
                >
                  <Plus size={18} />
                </button>
                <button 
                  className={styles.iconButton} 
                  onClick={buscarPostos}
                  title="Recarregar postos"
                  type="button"
                >
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* NF */}
          <div className={styles.formGroup}>
            <label htmlFor="nf" className={styles.label}>
              <Receipt size={18} />
              <span>Número da Nota Fiscal</span>
            </label>
            <input 
              type="text" 
              id="nf" 
              className={styles.inputField}
              value={nf}
              onChange={(e) => setNf(e.target.value)}
              placeholder="Opcional"
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
            disabled={isSubmitting || !valorTotal} // Desabilita se o valor total não for calculado
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
                Cadastrar Abastecimento
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cadastrar_Abastecimento;