import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Car, 
  Gauge, 
  Plus, 
  RefreshCw, 
  Send,
  FileText,
  MapPin,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import styles from './css/Viagem.module.css';
import { invoke } from "@tauri-apps/api/core";

// Interface que define o formato dos dados do formulário
interface FormState {
  motorista: string;
  veiculo: string;
  quilometragemInicial: string;
  quilometragemFinal: string;
  descricao: string;
  inicioData: string;
  inicioHora: string;
  terminoData: string;
  terminoHora: string;
  descricaoInicio: string;
  descricaoTermino: string;
}

interface Motorista {
  id: number;
  nome: string;
  cnh: string;
}

interface Veiculo {
  id: number;
  nome: string;
  marca: string;
  placa: string;
  ano: string;
}

// Interface que define o formato do payload para o backend Tauri
export interface FrotaViagemInput {
  descricao: string;
  origem: string;
  destino: string;
  data_inicio: string; // Formato ISO 8601
  quilometragem_inicial: number;
  quilometragem_final: number | null;
  veiculo: number;
  motorista: number;
  data_termino: string | null;
}

// Função para obter data atual no formato YYYY-MM-DD
const getToday = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Função para obter hora atual no formato HH:MM
const getCurrentTime = (): string => {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
};

const Cadastrar_Viagem: React.FC = () => {
  const [formData, setFormData] = useState<FormState>({
    motorista: '',
    veiculo: '',
    quilometragemInicial: '',
    quilometragemFinal: '',
    descricao: '',
    inicioData: getToday(), // Valor padrão: data atual
    inicioHora: getCurrentTime(), // Valor padrão: hora atual
    terminoData: '',
    terminoHora: '',
    descricaoInicio: '',
    descricaoTermino: '',
  });
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [activeSection, setActiveSection] = useState<string>('periodo');
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  useEffect(() => {
    const buscarDados = async () => {
      try {
        const resultado = await invoke<Motorista[]>('buscar_motoristas');
        setMotoristas(resultado);
      } catch (err) {
        console.error("Erro ao buscar motoristas:", err);
      } 
    };

    buscarDados();
  }, []);

  useEffect(() => {
    const buscarDados = async () => {
      try {
        const resultado = await invoke<Veiculo[]>('buscar_veiculos_e_marcas');
        setVeiculos(resultado);
      } catch (err) {
        console.error("Erro ao buscar veículos:", err);
      } 
    };

    buscarDados();
  }, []);
    
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Validação básica para campos obrigatórios
      if (!formData.motorista || !formData.veiculo || !formData.quilometragemInicial || !formData.descricaoInicio || !formData.inicioData || !formData.inicioHora) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
      }

      // 2. Validação de quilometragem
      const quilometragemInicial = parseFloat(formData.quilometragemInicial);
      const quilometragemFinal = formData.quilometragemFinal ? parseFloat(formData.quilometragemFinal) : null;
      
      if (isNaN(quilometragemInicial) || quilometragemInicial < 0) {
        alert('A quilometragem inicial deve ser um número válido e positivo.');
        return;
      }
      
      if (quilometragemFinal !== null && (isNaN(quilometragemFinal) || quilometragemFinal <= quilometragemInicial)) {
        alert('A quilometragem final deve ser um número válido e maior que a inicial.');
        return;
      }

      // 3. Formatar data e hora para o formato ISO 8601
      const inicioCompleto = `${formData.inicioData}T${formData.inicioHora}:00`;
      const terminoCompleto = (formData.terminoData && formData.terminoHora) 
          ? `${formData.terminoData}T${formData.terminoHora}:00` 
          : null;

      // 4. Validar datas
      const dataInicio = new Date(inicioCompleto);
      if (isNaN(dataInicio.getTime())) {
        alert('Data e hora de início inválidas.');
        return;
      }
      
      if (terminoCompleto) {
        const dataTermino = new Date(terminoCompleto);
        if (isNaN(dataTermino.getTime())) {
          alert('Data e hora de término inválidas.');
          return;
        }
        if (dataTermino <= dataInicio) {
          alert('A data de término deve ser posterior à data de início.');
          return;
        }
      }

      // 5. Encontrar os IDs do motorista e veículo pelos nomes
      const motoristaObj = motoristas.find(m => m.nome === formData.motorista);
      const veiculoObj = veiculos.find(v => v.nome === formData.veiculo);
      
      if (!motoristaObj) {
        alert('Motorista selecionado não encontrado. Por favor, selecione novamente.');
        return;
      }
      
      if (!veiculoObj) {
        alert('Veículo selecionado não encontrado. Por favor, selecione novamente.');
        return;
      }

      // 6. Criar o payload
      const payload: FrotaViagemInput = {
        descricao: formData.descricao || '',
        origem: formData.descricaoInicio,
        destino: formData.descricaoTermino || '',
        data_inicio: inicioCompleto,
        quilometragem_inicial: quilometragemInicial,
        quilometragem_final: quilometragemFinal,
        veiculo: veiculoObj.id,
        motorista: motoristaObj.id,
        data_termino: terminoCompleto,
      };
      
      console.log('Enviando payload:', payload);

      // 7. Chamar o comando Tauri
      const response = await invoke<any>('criar_frota_viagem', { payload });
      
      console.log('Viagem criada com sucesso:', response);
      alert('Viagem cadastrada com sucesso!');
      
      // 8. Limpar o formulário após o sucesso, mas manter os valores padrão de data/hora
      setFormData({
        motorista: '',
        veiculo: '',
        quilometragemInicial: '',
        quilometragemFinal: '',
        descricao: '',
        inicioData: getToday(), // Resetar para data atual
        inicioHora: getCurrentTime(), // Resetar para hora atual
        terminoData: '',
        terminoHora: '',
        descricaoInicio: '',
        descricaoTermino: '',
      });
      
    } catch (error) {
      console.error('Erro ao cadastrar viagem:', error);
      
      // Tratamento de erro mais detalhado
      let errorMessage = 'Erro desconhecido ao cadastrar viagem.';
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert(`Erro ao cadastrar viagem: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? '' : section);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.header}>
          <MapPin size={32} className={styles.headerIcon} />
          <h1 className={styles.title}>Cadastrar Viagem</h1>
          <div className={styles.headerDetail}></div>
        </div>
        
        <div className={styles.scrollContainer}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.card}>
              <div 
                className={styles.cardHeader} 
                onClick={() => toggleSection('periodo')}
              >
                <div className={styles.cardTitle}>
                  <Clock size={20} />
                  <span>Período da Viagem</span>
                </div>
                {activeSection === 'periodo' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              <div className={`${styles.cardContent} ${activeSection === 'periodo' ? styles.expanded : styles.collapsed}`}>
                <div className={styles.headerFields}>
                  {/* Campo de Início */}
                  <div className={styles.dateTimeField}>
                    <label htmlFor="inicioData" className={styles.label}>
                      <Calendar size={16} />
                      Início *
                    </label>
                    <div className={styles.dateInputGroup}>
                      <div className={styles.inputWithIcon}>
                        <input
                          type="date"
                          id="inicioData"
                          name="inicioData"
                          value={formData.inicioData}
                          onChange={handleInputChange}
                          className={styles.input}
                          required
                        />
                        <div className={styles.greenHighlight}></div>
                      </div>
                      <div className={styles.inputWithIcon}>
                        <input
                          type="time"
                          id="inicioHora"
                          name="inicioHora"
                          value={formData.inicioHora}
                          onChange={handleInputChange}
                          className={styles.input}
                          required
                        />
                        <Clock size={18} className={styles.inputIcon} />
                        <div className={styles.greenHighlight}></div>
                      </div>
                    </div>
                    <div className={styles.textAreaContainer}>
                      <textarea
                        id="descricaoInicio"
                        name="descricaoInicio"
                        rows={2}
                        value={formData.descricaoInicio}
                        onChange={handleInputChange}
                        className={styles.textArea}
                        placeholder="Descreva o local e a situação de início... *"
                        required
                      />
                      <div className={styles.greenHighlight}></div>
                    </div>
                  </div>
                  
                  {/* Campo de Término */}
                  <div className={styles.dateTimeField}>
                    <label htmlFor="terminoData" className={styles.label}>
                      <Calendar size={16} />
                      Término
                    </label>
                    <div className={styles.dateInputGroup}>
                      <div className={styles.inputWithIcon}>
                        <input
                          type="date"
                          id="terminoData"
                          name="terminoData"
                          value={formData.terminoData}
                          onChange={handleInputChange}
                          className={styles.input}
                        />
                        <div className={styles.greenHighlight}></div>
                      </div>
                      <div className={styles.inputWithIcon}>
                        <input
                          type="time"
                          id="terminoHora"
                          name="terminoHora"
                          value={formData.terminoHora}
                          onChange={handleInputChange}
                          className={styles.input}
                        />
                        <Clock size={18} className={styles.inputIcon} />
                        <div className={styles.greenHighlight}></div>
                      </div>
                    </div>
                    <div className={styles.textAreaContainer}>
                      <textarea
                        id="descricaoTermino"
                        name="descricaoTermino"
                        rows={2}
                        value={formData.descricaoTermino}
                        onChange={handleInputChange}
                        className={styles.textArea}
                        placeholder="Descreva o local e a situação de término..."
                      />
                      <div className={styles.greenHighlight}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div 
                className={styles.cardHeader} 
                onClick={() => toggleSection('descricao')}
              >
                <div className={styles.cardTitle}>
                  <FileText size={20} />
                  <span>Descrição</span>
                </div>
                {activeSection === 'descricao' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              <div className={`${styles.cardContent} ${activeSection === 'descricao' ? styles.expanded : styles.collapsed}`}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="descricao" className={styles.label}>
                    Detalhes da Viagem
                  </label>
                  <div className={styles.textAreaContainer}>
                    <textarea
                      id="descricao"
                      name="descricao"
                      rows={4}
                      value={formData.descricao}
                      onChange={handleInputChange}
                      className={styles.textArea}
                      placeholder="Descreva o propósito e destino da viagem..."
                    />
                    <div className={styles.greenHighlight}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.card}>
                <div 
                  className={styles.cardHeader} 
                  onClick={() => toggleSection('motorista')}
                >
                  <div className={styles.cardTitle}>
                    <User size={20} />
                    <span>Motorista</span>
                  </div>
                  {activeSection === 'motorista' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                <div className={`${styles.cardContent} ${activeSection === 'motorista' ? styles.expanded : styles.collapsed}`}>
                  <div className={styles.selectGroup}>
                    <label htmlFor="motorista" className={styles.label}>
                      Selecione o Motorista *
                    </label>
                    <div className={styles.selectWrapper}>
                      <div className={styles.selectContainer}>
                        <select
                          id="motorista"
                          name="motorista"
                          value={formData.motorista}
                          onChange={handleInputChange}
                          className={styles.select}
                          required
                        >
                          <option value="">-- Selecione um motorista --</option>
                          {motoristas.map((motorista) => (
                            <option key={motorista.id} value={motorista.nome}>
                              {motorista.nome}
                            </option>
                          ))}
                        </select>
                        <User size={18} className={styles.selectIcon} />
                        <div className={styles.greenHighlight}></div>
                      </div>
                      <div className={styles.selectButtons}>
                        <button type="button" className={styles.iconButton}>
                          <Plus size={18} />
                        </button>
                        <button type="button" className={styles.iconButton}>
                          <RefreshCw size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={styles.card}>
                <div 
                  className={styles.cardHeader} 
                  onClick={() => toggleSection('veiculo')}
                >
                  <div className={styles.cardTitle}>
                    <Car size={20} />
                    <span>Veículo</span>
                  </div>
                  {activeSection === 'veiculo' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                <div className={`${styles.cardContent} ${activeSection === 'veiculo' ? styles.expanded : styles.collapsed}`}>
                  <div className={styles.selectGroup}>
                    <label htmlFor="veiculo" className={styles.label}>
                      Selecione o Veículo *
                    </label>
                    <div className={styles.selectWrapper}>
                      <div className={styles.selectContainer}>
                        <select
                          id="veiculo"
                          name="veiculo"
                          value={formData.veiculo}
                          onChange={handleInputChange}
                          className={styles.select}
                          required
                        >
                          <option value="">-- Selecione um veículo --</option>
                          {veiculos.map((veiculo) => (
                            <option key={veiculo.id} value={veiculo.nome}>
                              {veiculo.nome} - {veiculo.placa}
                            </option>
                          ))}
                        </select>
                        <Car size={18} className={styles.selectIcon} />
                        <div className={styles.greenHighlight}></div>
                      </div>
                      <div className={styles.selectButtons}>
                        <button type="button" className={styles.iconButton}>
                          <Plus size={18} />
                        </button>
                        <button type="button" className={styles.iconButton}>
                          <RefreshCw size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div 
                className={styles.cardHeader} 
                onClick={() => toggleSection('quilometragem')}
              >
                <div className={styles.cardTitle}>
                  <Gauge size={20} />
                  <span>Quilometragem</span>
                </div>
                {activeSection === 'quilometragem' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              <div className={`${styles.cardContent} ${activeSection === 'quilometragem' ? styles.expanded : styles.collapsed}`}>
                <div className={styles.inputGroup}>
                  <div className={styles.field}>
                    <label htmlFor="quilometragemInicial" className={styles.label}>
                      Quilometragem Inicial *
                    </label>
                    <div className={styles.inputWithIcon}>
                      <input
                        type="number"
                        id="quilometragemInicial"
                        name="quilometragemInicial"
                        value={formData.quilometragemInicial}
                        onChange={handleInputChange}
                        className={styles.input}
                        placeholder="0"
                        min="0"
                        step="0.1"
                        required
                      />
                      <Gauge size={18} className={styles.inputIcon} />
                      <div className={styles.greenHighlight}></div>
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="quilometragemFinal" className={styles.label}>
                      Quilometragem Final
                    </label>
                    <div className={styles.inputWithIcon}>
                      <input
                        type="number"
                        id="quilometragemFinal"
                        name="quilometragemFinal"
                        value={formData.quilometragemFinal}
                        onChange={handleInputChange}
                        className={styles.input}
                        placeholder="0"
                        min="0"
                        step="0.1"
                      />
                      <Gauge size={18} className={styles.inputIcon} />
                      <div className={styles.greenHighlight}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isLoading}
            >
              <Send size={20} className={styles.buttonIcon} />
              {isLoading ? 'Cadastrando...' : 'Cadastrar Viagem'}
              <div className={styles.buttonDetail}></div>
            </button>
          </form>
        </div>

        <div className={styles.footer}>
          <div className={styles.footerDetail}></div>
        </div>
      </div>
    </div>
  );
};

export default Cadastrar_Viagem;