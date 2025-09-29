import React, { useState, useEffect } from 'react';
import { Calendar, Receipt, User, Building, Clipboard, Tag, Package, MapPin, Droplet, Thermometer, Palette, Cloud, FlaskConical, Gauge, Scale, XCircle, Edit, Eye, Trash2 } from 'lucide-react';
import { invoke } from "@tauri-apps/api/core";
import styles from './css/CadastrarColeta.module.css';
import { listen } from '@tauri-apps/api/event';
import { emit } from '@tauri-apps/api/event';
import { WindowManager } from '../../hooks/WindowManager';

// Interfaces para os dados do backend
interface ColetaData {
  numero?: number;
  idcliente?: number;
  prefixo?: string;
  data_coleta?: string;
  responsavel_coleta?: string;
  plano_amostragem?: string;
  cliente?: string;
  acompanhante?: string;
  acompanhante_doc?: string;
  acompanhante_cargo?: string;
  coletor?: string;
  fantasia?: string;
  pre_cadastrado?: boolean;
  observacao?: string;
  registro?: string;
}

interface CustomAmostra
{
  type: String;
  data_content: DataContent;

}

interface DataContent
{
  amostra: Amostra[];
  coleta: Coleta;
}
 interface SingleAmostraResponse {
    success: boolean;
    data: AmostraData | null; // Use null for optional data
    message: string | null; // Use null for optional messages
}

interface AmostraData {
  id: number;
  numero?: number;
  hc?: string; // hora formatada
  hora_coleta?: string;
  identificacao?: string;
  complemento?: string;
  identificacao_frasco?: string;
  condicoes_amb?: string;
  ph?: string;
  cloro?: string;
  temperatura?: string;
  solido_dissolvido_total?: string;
  condutividade?: string;
  oxigenio_dissolvido?: string;
  pre_cadastrado?: boolean;
  idusuario?: number;
  observacao?: string;
  terceirizada?: boolean;
  vazao?: string;
  vazao_unidade?: string;
  cor?: string;
  turbidez?: string;
  ncoletada_motivo?: string;
  coletada?: boolean;
  responsavel_coleta?: string;
  plano_amostragem?: string;
  duplicata?: boolean;
}

interface Equipamentos {
  nome?: string;
  registro?: string;
}

interface ColetaCompleta {
  coleta: ColetaData;
  amostras: AmostraData[];
  equipamentos: Equipamentos[];
}

interface Cliente {
    idcoleta: number;
}
interface ColetaResponse {
  success: boolean;
  data?: ColetaCompleta;
  message?: string;
}

// Interface para os dados da Coleta (formato do frontend)
interface Coleta {
  id?: number;
  idcliente?: number;
  dataRegistro: string;
  reciboColeta: string;
  cliente: string;
  dataColeta: string;
  acompanhante: string;
  documento: string;
  cargo: string;
  coletor: string;
  observacao: string;
  equipamentos: string[];
}

// Interface para os dados da Amostra (formato do frontend)
interface Amostra {
  id?: number;
  coletaId?: number;
  hora: string;
  identificacao: string;
  complemento: string;
  ponto: string;
  coletadoPor: string;
  condicoesAmbientais: string;
  vazao: string;
  ph: string;
  cloro: string;
  temperatura: string;
  cor: string;
  turbidez: string;
  sdt: string;
  condutividade: string;
}

const CadastrarColeta: React.FC = () => {
   const [coleta, setColeta] = useState<Coleta>({
        // Initial state
        id: 0,
        idcliente: 0, // This is a number
        dataRegistro: new Date().toISOString().split('T')[0],
        reciboColeta: '',
        cliente: '',
        dataColeta: '',
        acompanhante: '',
        documento: '',
        cargo: '',
        coletor: '',
        observacao: '',
        equipamentos: []
    });

  const [amostras, setAmostras] = useState<Amostra[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [idColeta, setIdColeta] = useState<number | null>(null);
  const [coletaOriginal, setColetaOriginal] = useState<ColetaCompleta | null>(null);
  const [selectedAmostras, setSelectedAmostras] = useState<Set<number>>(new Set());
  const [expandedAmostra, setExpandedAmostra] = useState<number | null>(null);

  // --- NOVO ESTADO: Verifica se há duplicatas para renderizar o botão ---
  const [hasDuplicate, setHasDuplicate] = useState(false);

  // Lista de coletas existentes (exemplo - pode ser removido se não for necessário)
  const [coletasExistentes] = useState<Coleta[]>([]);

  // Lista de equipamentos disponíveis (será preenchida com dados do backend)
  const [equipamentosDisponiveis, setEquipamentosDisponiveis] = useState<string[]>([]);

  // Função para converter dados do backend para formato do frontend
   const convertColetaData = (data: ColetaCompleta): Coleta => {
        return {
            id: data.coleta.numero,
            idcliente: data.coleta.idcliente, // Ensure this value is properly mapped
            dataRegistro: data.coleta.registro || new Date().toISOString().split('T')[0],
            reciboColeta: data.coleta.prefixo || '',
            cliente: data.coleta.cliente || '',
            dataColeta: data.coleta.data_coleta || '',
            acompanhante: data.coleta.acompanhante || '',
            documento: data.coleta.acompanhante_doc || '',
            cargo: data.coleta.acompanhante_cargo || '',
            coletor: data.coleta.coletor || '',
            observacao: data.coleta.observacao || '',
            equipamentos: data.equipamentos.map(eq => eq.registro || eq.nome || '').filter(Boolean)
        };
    };

  // Função para converter amostras do backend para formato do frontend
// file: CadastrarColeta.tsx

const convertAmostrasData = (amostrasData: AmostraData[]): Amostra[] => {
    return amostrasData.map(amostra => ({
        id: amostra.id,
        coletaId: amostra.numero ?? 0, // Assuming 0 is an acceptable default for a number
        hora: amostra.hc || amostra.hora_coleta || '',
        identificacao: amostra.identificacao || '',
        complemento: amostra.complemento || '',
        ponto: amostra.identificacao_frasco || '',
        coletadoPor: amostra.responsavel_coleta || '',
        condicoesAmbientais: amostra.condicoes_amb || '',
        vazao: amostra.vazao || '',
        ph: amostra.ph || '',
        cloro: amostra.cloro || '',
        temperatura: amostra.temperatura || '',
        cor: amostra.cor || '',
        turbidez: amostra.turbidez || '',
        sdt: amostra.solido_dissolvido_total || '',
        condutividade: amostra.condutividade || ''
    }));
};

  // Função para buscar dados da coleta
 const getColetaData = async (idColeta: number) => {
        if (!idColeta) {
            console.error('ID da coleta não fornecido');
            return;
        }

        setLoading(true);
        try {
            console.log('Buscando coleta com ID:', idColeta);
            const response = await invoke<ColetaResponse>("buscar_coleta_referente", {
                idColeta: idColeta
            });

            console.log('Resposta do backend:', response);

            if (response.success && response.data) {
                const coletaData = convertColetaData(response.data);
                const amostrasData = convertAmostrasData(response.data.amostras);

                setColetaOriginal(response.data);

                // This is the key change: update the state with the new data
                setColeta(coletaData);
                setAmostras(amostrasData);
                setEquipamentosDisponiveis(response.data.equipamentos.map(eq => eq.registro || eq.nome || '').filter(Boolean));

                // The alert should be moved to a useEffect hook to run AFTER state updates
              // alert(coletaData.idcliente); // REMOVE THIS LINE

                setMessage({ text: 'Coleta carregada com sucesso!', type: 'success' });

                const hasAnyDuplicate = response.data.amostras.some(amostra => amostra.duplicata === true);
                setHasDuplicate(hasAnyDuplicate);
            } else {
                setMessage({
                    text: response.message || 'Erro ao carregar coleta',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Erro ao buscar coleta:', error);
            setMessage({
                text: 'Erro de comunicação com o backend',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

  const handleInputChange = (field: keyof Coleta, value: string) => {
    setColeta(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEquipamentoToggle = (equipamento: string) => {
    setColeta(prev => ({
      ...prev,
      equipamentos: prev.equipamentos.includes(equipamento)
        ? prev.equipamentos.filter(e => e !== equipamento)
        : [...prev.equipamentos, equipamento]
    }));
  };

  const adicionarAmostra = () => {
    const novaAmostra: Amostra = {
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      identificacao: 'ETE',
      complemento: 'Saída',
      ponto: '01',
      coletadoPor: 'Bioma',
      condicoesAmbientais: 'Ambiente Aberto',
      vazao: 'N.A.',
      ph: '6,89',
      cloro: 'N.A.',
      temperatura: 'N.A.',
      cor: 'N.A.',
      turbidez: 'N.A.',
      sdt: 'N.A.',
      condutividade: 'N.A.'
    };
    setAmostras(prev => [...prev, novaAmostra]);
  };

  const removerAmostra = (index: number) => {
    setAmostras(prev => prev.filter((_, i) => i !== index));
  };

  const handleAmostraChange = (index: number, field: keyof Amostra, value: string) => {
    setAmostras(prev => prev.map((amostra, i) => 
      i === index ? { ...amostra, [field]: value } : amostra
    ));
  };

const handleCadastrarAmostras = () => {
    if (selectedAmostras.size === 0) {
        setMessage({ text: "Nenhuma amostra selecionada para cadastrar.", type: 'error' });
        return;
    }

    // Filtra apenas as amostras selecionadas
    const amostrasParaCadastro = Array.from(selectedAmostras).map(index => amostras[index]);

    // Cria o objeto CustomAmostra com a estrutura correta
    const cadastrarData: CustomAmostra = {
        type: "cadastrar_coleta",
        data_content: {
            amostra: amostrasParaCadastro,
            coleta: coleta
        }
    };

    // Chama o WindowManager para abrir a janela CadastrarAmostra
    try {
        WindowManager.openCadastrarAmostra(cadastrarData);
        // alert(JSON.stringify(cadastrarData));
        // Mensagem de sucesso
        setMessage({ 
            text: `${amostrasParaCadastro.length} amostra(s) enviada(s) para cadastro.`, 
            type: 'success' 
        });
    } catch (error) {
        console.error('Erro ao abrir janela CadastrarAmostra:', error);
        setMessage({ 
            text: 'Erro ao abrir janela de cadastro de amostras.', 
            type: 'error' 
        });
    }
};

// file: CadastrarColeta.tsx
const handleCadastrarNumero = async () => {
    if (selectedAmostras.size === 0) {
        setMessage({ text: "Nenhuma amostra selecionada para cadastrar.", type: 'error' });
        return;
    }

    setLoading(true);
    let successCount = 0;
    let failCount = 0;
    const errors = [];

    for (const index of selectedAmostras) {
        const amostra = amostras[index];

        if (!amostra.id || amostra.coletaId === null || amostra.coletaId === undefined) {
            console.error(`Amostra no índice ${index} não tem ID ou número de coleta válidos.`);
            errors.push(`Amostra no índice ${index}: ID ou número de coleta inválidos.`);
            failCount++;
            continue;
        }

        // --- CONVERSÃO DE STRING PARA NÚMERO ---
        const novoNumeroParsed = parseInt(String(amostra.coletaId), 10);

        // Verifica se a conversão foi bem-sucedida
        if (isNaN(novoNumeroParsed)) {
            console.error(`Amostra no índice ${index}: O número de coleta não é um número válido.`);
            errors.push(`Amostra no índice ${index}: O número de coleta não é um número válido.`);
            failCount++;
            continue;
        }

        try {
            const response: SingleAmostraResponse = await invoke('atualizar_numero_amostra', {
                idAmostra: amostra.id,
                novoNumero: novoNumeroParsed, // Passa o número convertido
            });

            if (response.success) {
                console.log(`Amostra #${amostra.id} atualizada com sucesso.`);
                successCount++;
            } else {
                console.error(`Falha ao atualizar amostra #${amostra.id}:`, response.message);
                errors.push(`Amostra #${amostra.id}: ${response.message || 'Erro desconhecido'}`);
                failCount++;
            }
        } catch (error) {
            console.error(`Erro ao invocar comando para amostra #${amostra.id}:`, error);
            errors.push(`Amostra #${amostra.id}: Erro de comunicação com o backend`);
            failCount++;
        }
    }

    setLoading(false);

    if (failCount === 0) {
        setMessage({
            text: `Todas as ${successCount} amostras selecionadas foram cadastradas com sucesso!`,
            type: 'success'
        });
        atualizarAmostras();
    } else {
        const fullMessage = `Foram atualizadas ${successCount} amostras, mas ${failCount} falharam. Detalhes: ${errors.join('; ')}.`;
        setMessage({ text: fullMessage, type: 'error' });
    }
};


  const toggleAmostraSelection = (index: number) => {
    setSelectedAmostras(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedAmostras.size === amostras.length) {
      // Se todas estiverem selecionadas, desmarque todas
      setSelectedAmostras(new Set());
    } else {
      // Se nem todas estiverem selecionadas, selecione todas
      const allIndices = new Set(amostras.map((_, index) => index));
      setSelectedAmostras(allIndices);
    }
  };

  const toggleAmostraExpansion = (index: number) => {
    setExpandedAmostra(prev => prev === index ? null : index);
  };

  // Função para atualizar as amostras do backend
  const atualizarAmostras = async () => {
    if (idColeta) {
      await getColetaData(idColeta);
    }
  };

  // useEffect para configurar o listener de eventos
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      try {
        unlisten = await listen('window-data', (event) => {
          console.log('Dados recebidos da janela pai:', event.payload);
          const receivedId = event.payload as number;
        
          setIdColeta(receivedId);
          getColetaData(receivedId);
        });

        await emit('window-ready');
      } catch (error) {
        alert("erro");
        console.error('Erro ao configurar listener:', error);
      }
    };

    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  // Limpar mensagens após 5 segundos
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className={styles.container}>
      {/* Mensagens de feedback */}
      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className={styles.loading}>
          Carregando dados da coleta...
        </div>
      )}

      <div className={styles.header}>
        <h1 className={styles.title}>
          {idColeta ? `Visualizar Coleta #${coleta.id}` : 'Cadastrar Coleta'}
        </h1>
        <div className={styles.headerActions}>
          <button className={styles.buttonSecondary}>
            Cancelar
          </button>
          <button className={styles.buttonPrimary}>
            Salvar Coleta
          </button>
        </div>
      </div>

      <div className={styles.mainContent}>
        {/* Seção Principal - Dados da Coleta */}
        <div className={styles.leftPanel}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Informações da Coleta</h2>
            </div>
            
            <div className={styles.cardContent}>
              {/* Informações da Coleta - Quadro Estático */}
              <div className={styles.infoGrid}>
                <div className={styles.infoGroup}>
                  <Calendar size={16} className={styles.icon} />
                  <span className={styles.infoLabel}>Data do registro:</span>
                  <span className={styles.infoValue}>{coleta.dataRegistro}</span>
                </div>
                <div className={styles.infoGroup}>
                  <Receipt size={16} className={styles.icon} />
                  <span className={styles.infoLabel}>Recibo de coleta:</span>
                  <span className={styles.infoValue}>{coleta.reciboColeta || 'N/A'}</span>
                </div>
                <div className={styles.infoGroup}>
                  <User size={16} className={styles.icon} />
                  <span className={styles.infoLabel}>Cliente:</span>
                  <span className={styles.infoValue}>{coleta.cliente || 'N/A'}</span>
                </div>
                <div className={styles.infoGroup}>
                  <Calendar size={16} className={styles.icon} />
                  <span className={styles.infoLabel}>Data da coleta:</span>
                  <span className={styles.infoValue}>{coleta.dataColeta || 'N/A'}</span>
                </div>
                <div className={styles.infoGroup}>
                  <User size={16} className={styles.icon} />
                  <span className={styles.infoLabel}>Acompanhante:</span>
                  <span className={styles.infoValue}>{coleta.acompanhante || 'N/A'}</span>
                </div>
                <div className={styles.infoGroup}>
                  <Clipboard size={16} className={styles.icon} />
                  <span className={styles.infoLabel}>Documento:</span>
                  <span className={styles.infoValue}>{coleta.documento || 'N/A'}</span>
                </div>
                <div className={styles.infoGroup}>
                  <Building size={16} className={styles.icon} />
                  <span className={styles.infoLabel}>Cargo:</span>
                  <span className={styles.infoValue}>{coleta.cargo || 'N/A'}</span>
                </div>
                <div className={styles.infoGroup}>
                  <User size={16} className={styles.icon} />
                  <span className={styles.infoLabel}>Coletor:</span>
                  <span className={styles.infoValue}>{coleta.coletor || 'N/A'}</span>
                </div>
              </div>

              {coleta.observacao && (
                <div className={styles.infoGroupFull}>
                  <span className={styles.infoLabel}>Observação:</span>
                  <span className={styles.infoValue}>{coleta.observacao}</span>
                </div>
              )}

              {/* Lista de Números de Coleta */}
              <div className={styles.coletaNumbersSection}>
                <h3 className={styles.coletaNumbersTitle}>Números de Coleta</h3>
                <div className={styles.coletaNumbersGrid}>
                  {amostras.map((amostra, index) => (
                    <span key={amostra.id || index} className={styles.coletaNumberTag}>
                      #{amostra.coletaId || `NOVA-${index + 1}`}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Painel Direito - Equipamentos */}
        <div className={styles.rightPanel}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Equipamentos</h2>
            </div>
            
            <div className={styles.cardContent}>
              <div className={styles.equipamentosGrid}>
                {equipamentosDisponiveis.length > 0 ? (
                  equipamentosDisponiveis.map(equipamento => (
                    <label key={equipamento} className={styles.equipamentoItem}>
                      <input
                        type="checkbox"
                        checked={coleta.equipamentos.includes(equipamento)}
                        onChange={() => handleEquipamentoToggle(equipamento)}
                        className={styles.checkbox}
                      />
                      <span className={styles.equipamentoLabel}>- {equipamento}</span>
                    </label>
                  ))
                ) : (
                  <p className={styles.noData}>Nenhum equipamento disponível</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Amostras - Largura completa */}
     <div className={styles.amostrasSection}>
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>
                        Amostras ({amostras.length})
                    </h2>
                    <div className={styles.amostrasActions}>
                        {amostras.length > 0 && (
                            <button
                                onClick={handleSelectAll}
                                className={styles.buttonSecondary}
                                disabled={loading}
                            >
                                {selectedAmostras.size === amostras.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                            </button>
                        )}
                        {/* --- BOTÃO DE DUPLICATA: Renderizado apenas se hasDuplicate for true --- */}
                        {hasDuplicate && (
                            <button className={styles.buttonPrimary}>
                                Cadastrar Duplicata
                            </button>
                        )}
                        <button onClick={atualizarAmostras} className={styles.buttonAdd} disabled={loading}>
                            Atualizar
                        </button>
                        {/* BOTÃO "Cadastrar" MODIFICADO */}
                        <button onClick={handleCadastrarAmostras} className={styles.buttonAdd}>
                            Cadastrar
                        </button>
                        <button onClick={adicionarAmostra} className={styles.buttonAdd}>
                            Terceirizar
                        </button>
                    </div>
                </div>

          <div className={styles.cardContent}>
            {amostras.length > 0 ? (
              <div className={styles.amostrasContainer}>
                {amostras.map((amostra, index) => (
                  <div key={amostra.id || index} className={styles.amostraCard}>
                    <div className={styles.amostraHeader}>
                      <div className={styles.amostraBasicInfo}>
                        <input
                          type="checkbox"
                          checked={selectedAmostras.has(index)}
                          onChange={() => toggleAmostraSelection(index)}
                          className={styles.checkbox}
                        />
                        <div className={styles.amostraMainData}>
                          <span className={styles.amostraId}>#{amostra.coletaId || `NOVA-${index + 1}`}</span>
                          <span className={styles.amostraTime}>{amostra.hora}</span>
                          <span className={styles.amostraLocation}>{amostra.identificacao} - {amostra.complemento}</span>
                        </div>
                      </div>
                      <div className={styles.amostraActions}>
                        <button 
                          onClick={() => toggleAmostraExpansion(index)}
                          className={styles.buttonIcon}
                          title="Ver detalhes"
                        >
                          <Eye size={16} />
                        </button>

                      </div>
                    </div>

                    {expandedAmostra === index && (
                      <div className={styles.amostraDetails}>
                        <div className={styles.detailsGrid}>
                           <div className={styles.detailGroup}>
                            <label className={styles.detailLabel}>Amostra </label>
                            <input
                              type="text"
                              value={amostra.coletaId ?? ''} // Corrected line
                              onChange={(e) => handleAmostraChange(index, 'coletaId', e.target.value)}
                              className={styles.detailInput}
                              />
                          </div>
                          <div className={styles.detailGroup}>
                            <label className={styles.detailLabel}>Hora</label>
                            <input
                              type="time"
                              value={amostra.hora}
                              onChange={(e) => handleAmostraChange(index, 'hora', e.target.value)}
                              className={styles.detailInput}
                            />
                          </div>
                          <div className={styles.detailGroup}>
                            <label className={styles.detailLabel}>Identificação</label>
                            <input
                              type="text"
                              value={amostra.identificacao}
                              onChange={(e) => handleAmostraChange(index, 'identificacao', e.target.value)}
                              className={styles.detailInput}
                            />
                          </div>
                          <div className={styles.detailGroup}>
                            <label className={styles.detailLabel}>Complemento</label>
                            <input
                              type="text"
                              value={amostra.complemento}
                              onChange={(e) => handleAmostraChange(index, 'complemento', e.target.value)}
                              className={styles.detailInput}
                            />
                          </div>
                          <div className={styles.detailGroup}>
                            <label className={styles.detailLabel}>Ponto</label>
                            <input
                              type="text"
                              value={amostra.ponto}
                              onChange={(e) => handleAmostraChange(index, 'ponto', e.target.value)}
                              className={styles.detailInput}
                            />
                          </div>
                          <div className={styles.detailGroup}>
                            <label className={styles.detailLabel}>Coletado por</label>
                            <input
                              type="text"
                              value={amostra.coletadoPor}
                              onChange={(e) => handleAmostraChange(index, 'coletadoPor', e.target.value)}
                              className={styles.detailInput}
                            />
                          </div>
                          <div className={styles.detailGroup}>
                            <label className={styles.detailLabel}>Condições Ambientais</label>
                            <input
                              type="text"
                              value={amostra.condicoesAmbientais}
                              onChange={(e) => handleAmostraChange(index, 'condicoesAmbientais', e.target.value)}
                              className={styles.detailInput}
                            />
                          </div>
                        </div>

                        <div className={styles.parametersSection}>
                          <h4 className={styles.parametersTitle}>Parâmetros Físico-Químicos</h4>
                          <div className={styles.parametersGrid}>
                            <div className={styles.parameterGroup}>
                              <Droplet size={16} className={styles.parameterIcon} />
                              <label className={styles.parameterLabel}>Vazão</label>
                              <input
                                type="text"
                                value={amostra.vazao}
                                onChange={(e) => handleAmostraChange(index, 'vazao', e.target.value)}
                                className={styles.parameterInput}
                              />
                            </div>
                            <div className={styles.parameterGroup}>
                              <FlaskConical size={16} className={styles.parameterIcon} />
                              <label className={styles.parameterLabel}>pH</label>
                              <input
                                type="text"
                                value={amostra.ph}
                                onChange={(e) => handleAmostraChange(index, 'ph', e.target.value)}
                                className={styles.parameterInput}
                              />
                            </div>
                            <div className={styles.parameterGroup}>
                              <Cloud size={16} className={styles.parameterIcon} />
                              <label className={styles.parameterLabel}>Cloro</label>
                              <input
                                type="text"
                                value={amostra.cloro}
                                onChange={(e) => handleAmostraChange(index, 'cloro', e.target.value)}
                                className={styles.parameterInput}
                              />
                            </div>
                            <div className={styles.parameterGroup}>
                              <Thermometer size={16} className={styles.parameterIcon} />
                              <label className={styles.parameterLabel}>Temperatura</label>
                              <input
                                type="text"
                                value={amostra.temperatura}
                                onChange={(e) => handleAmostraChange(index, 'temperatura', e.target.value)}
                                className={styles.parameterInput}
                              />
                            </div>
                            <div className={styles.parameterGroup}>
                              <Palette size={16} className={styles.parameterIcon} />
                              <label className={styles.parameterLabel}>Cor</label>
                              <input
                                type="text"
                                value={amostra.cor}
                                onChange={(e) => handleAmostraChange(index, 'cor', e.target.value)}
                                className={styles.parameterInput}
                              />
                            </div>
                            <div className={styles.parameterGroup}>
                              <Cloud size={16} className={styles.parameterIcon} />
                              <label className={styles.parameterLabel}>Turbidez</label>
                              <input
                                type="text"
                                value={amostra.turbidez}
                                onChange={(e) => handleAmostraChange(index, 'turbidez', e.target.value)}
                                className={styles.detailInput}
                              />
                            </div>
                            <div className={styles.parameterGroup}>
                              <Scale size={16} className={styles.parameterIcon} />
                              <label className={styles.parameterLabel}>SDT</label>
                              <input
                                type="text"
                                value={amostra.sdt}
                                onChange={(e) => handleAmostraChange(index, 'sdt', e.target.value)}
                                className={styles.parameterInput}
                              />
                            </div>
                            <div className={styles.parameterGroup}>
                              <Gauge size={16} className={styles.parameterIcon} />
                              <label className={styles.parameterLabel}>Condutividade</label>
                              <input
                                type="text"
                                value={amostra.condutividade}
                                onChange={(e) => handleAmostraChange(index, 'condutividade', e.target.value)}
                                className={styles.parameterInput}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noAmostras}>
                <Package size={48} className={styles.noAmostrasIcon} />
                <p className={styles.noAmostrasText}>Nenhuma amostra cadastrada</p>
                <button onClick={adicionarAmostra} className={styles.buttonPrimary}>
                  Adicionar primeira amostra
                </button>
              </div>
            )}

            <div className={styles.bottomActions}>
              <button onClick={handleCadastrarNumero} className={styles.buttonSecondary}>
                Cadastrar números de amostras
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CadastrarColeta;