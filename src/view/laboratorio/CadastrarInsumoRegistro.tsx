// src/view/laboratorio/CadastrarInsumoRegistro.tsx
// Componente de formulário (modal) para "Cadastro de Registro de Insumo"

import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  ApiResponse,
  InsumoOption,
  FornecedorOption,
  ReceitaEstoqueItem,
  InsumoRegistroDetalhado,
  RegistroInsumoFrontendPayload,
  MateriaPrimaRegistroDisponivel,
  RegistroMateriaPrimaPayload,
} from '../../types/insumo';
import styles from './styles/CadastrarInsumoRegistro.module.css';

// Nomes dos tipos que exigem receita (conforme lógica Java)
const TIPOS_COM_RECEITA = ['Meio de cultura', 'Solução/Reagente'];
const TIPOS_EQUIPAMENTO = ['Equipamento'];

interface CadastrarInsumoRegistroProps {
  onSalvar: () => void;
  onCancelar: () => void;
  itemParaEdicao: InsumoRegistroDetalhado | null;
  tipoIdDefault: number;
  tipoNomeDefault: string;
  insumosDoTipo: InsumoOption[]; // Recebe os insumos já carregados pela tela-pai
}

/**
 * Hook customizado para gerenciar a "receita"
 * (a seleção de registros de MP e suas quantidades)
 */
const useReceita = () => {
  // Map<mp_registro_id, quantidade_string>
  const [receita, setReceita] = useState<Map<number, string>>(new Map());

  // Adiciona/Remove um item da receita (quando o checkbox é clicado)
  const toggleItemReceita = (
    mpEstoque: MateriaPrimaRegistroDisponivel,
    checked: boolean
  ) => {
    const novaReceita = new Map(receita);
    if (checked) {
      // Adiciona ao Map, usando a quantidade restante como placeholder/padrão
      novaReceita.set(mpEstoque.id, mpEstoque.quant_restante);
    } else {
      // Remove do Map
      novaReceita.delete(mpEstoque.id);
    }
    setReceita(novaReceita);
  };

  // Atualiza a quantidade de um item selecionado
  const setQuantidadeReceita = (mp_registro_id: number, quantidade: string) => {
    const novaReceita = new Map(receita);
    if (novaReceita.has(mp_registro_id)) {
      novaReceita.set(mp_registro_id, quantidade);
    }
    setReceita(novaReceita);
  };

  // Popula o estado da receita no modo de edição
  const setReceitaParaEdicao = async (insumo_registro_id: number) => {
    // TODO: Implementar a busca da receita salva (impr)
    // Por enquanto, fica vazio na edição, pois a API de 'buscar_registro_completo'
    // não retorna a sub-receita. Isso seria uma melhoria futura.
    console.warn("setReceitaParaEdicao não implementado - API precisa ser estendida");
    setReceita(new Map());
  };
  
  // Limpa a receita
  const limparReceita = () => setReceita(new Map());

  return { receita, toggleItemReceita, setQuantidadeReceita, setReceitaParaEdicao, limparReceita };
};


const CadastrarInsumoRegistro: React.FC<CadastrarInsumoRegistroProps> = ({
  onSalvar,
  onCancelar,
  itemParaEdicao,
  tipoIdDefault,
  tipoNomeDefault,
  insumosDoTipo,
}) => {
  // --- ESTADOS DE DADOS DE SUPORTE ---
  const [loadingSuporte, setLoadingSuporte] = useState(true);
  const [errorSuporte, setErrorSuporte] = useState<string | null>(null);
  const [fornecedores, setFornecedores] = useState<FornecedorOption[]>([]);
  const [receitaEstoque, setReceitaEstoque] = useState<ReceitaEstoqueItem[]>([]);
  const { receita, toggleItemReceita, setQuantidadeReceita, setReceitaParaEdicao, limparReceita } = useReceita();

  // --- ESTADOS DE DADOS DO FORMULÁRIO ---
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [errorSubmit, setErrorSubmit] = useState<string | null>(null);
  const [insumoId, setInsumoId] = useState<string>('');
  const [registro, setRegistro] = useState(''); // Lote ou Patrimônio
  const [fabricante, setFabricante] = useState('');
  const [volume, setVolume] = useState('');
  const [dataPreparo, setDataPreparo] = useState(''); // YYYY-MM-DD
  const [validade, setValidade] = useState(''); // YYYY-MM-DD
  const [quantidade, setQuantidade] = useState('');
  const [fatorCorrecao, setFatorCorrecao] = useState('');
  const [notaFiscal, setNotaFiscal] = useState('');
  const [garantia, setGarantia] = useState('');
  const [garantiaTempo, setGarantiaTempo] = useState('Dias');
  const [fornecedorId, setFornecedorId] = useState<string>('');
  const [dataCompra, setDataCompra] = useState(''); // YYYY-MM-DD
  const [valorEquipamento, setValorEquipamento] = useState('');
  const [modelo, setModelo] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [observacao, setObservacao] = useState('');
  const [faixaMin, setFaixaMin] = useState('');
  const [faixaMax, setFaixaMax] = useState('');
  const [desvios, setDesvios] = useState('');
  const [foraDeUso, setForaDeUso] = useState(false);
  const [portatil, setPortatil] = useState(false);
  
  // --- DERIVAÇÃO DE ESTADO (Lógica de UI Dinâmica) ---
  const [tipoNome, setTipoNome] = useState(tipoNomeDefault);
  const [insumoSelecionado, setInsumoSelecionado] = useState<InsumoOption | null>(null);
  
  const mostrarReceita = TIPOS_COM_RECEITA.includes(tipoNome);
  const mostrarCamposEquipamento = TIPOS_EQUIPAMENTO.includes(tipoNome);
  const labelRegistro = mostrarCamposEquipamento ? 'Patrimônio' : 'Lote';

  // --- FUNÇÕES DE CARREGAMENTO (EFEITOS) ---

  // Carrega dados de suporte (Fornecedores)
  useEffect(() => {
    const carregarSuporte = async () => {
      setLoadingSuporte(true);
      setErrorSuporte(null);
      try {
        const resFornecedores = await invoke<ApiResponse<FornecedorOption[]>>(
          'listar_fornecedores_dropdown_tauri'
        );
        if (resFornecedores.success && resFornecedores.data) {
          setFornecedores(resFornecedores.data);
        } else {
          throw new Error(resFornecedores.message || 'Falha ao carregar fornecedores.');
        }
      } catch (err: any) {
        setErrorSuporte(err.message || `Erro fatal ao carregar suporte: ${String(err)}`);
      } finally {
        setLoadingSuporte(false);
      }
    };
    carregarSuporte();
  }, []);

  // Popula o formulário se for modo de edição
  useEffect(() => {
    if (itemParaEdicao) {
      setTipoNome(itemParaEdicao.tipo_nome);
      setInsumoId(itemParaEdicao.insumo_id.toString());
      setRegistro(itemParaEdicao.registro || '');
      setFabricante(itemParaEdicao.fabricante || '');
      setVolume(itemParaEdicao.volume || '');
      setDataPreparo(itemParaEdicao.data_preparo || '');
      setValidade(itemParaEdicao.validade || '');
      setQuantidade(itemParaEdicao.quantidade || '');
      setFatorCorrecao(itemParaEdicao.fator_correcao || '');
      setNotaFiscal(itemParaEdicao.nota_fiscal || '');
      setGarantia(itemParaEdicao.garantia?.toString() || '');
      setGarantiaTempo(itemParaEdicao.garantia_tempo || 'Dias');
      setFornecedorId(itemParaEdicao.fornecedor_id?.toString() || '');
      setDataCompra(itemParaEdicao.data_compra || '');
      setValorEquipamento(itemParaEdicao.valor_equipamento || '');
      setModelo(itemParaEdicao.modelo || '');
      setNumeroSerie(itemParaEdicao.numero_serie || '');
      setObservacao(itemParaEdicao.observacao || '');
      setFaixaMin(itemParaEdicao.faixa_min || '');
      setFaixaMax(itemParaEdicao.faixa_max || '');
      setDesvios(itemParaEdicao.desvios || '');
      setForaDeUso(itemParaEdicao.fora_de_uso);
      setPortatil(itemParaEdicao.portatil);
      
      // Popula a receita (se aplicável)
      if (TIPOS_COM_RECEITA.includes(itemParaEdicao.tipo_nome)) {
        // Esta função precisa ser implementada se a edição de receita for necessária
        setReceitaParaEdicao(itemParaEdicao.id);
      }
    }
  }, [itemParaEdicao, setReceitaParaEdicao]);
  
  // Carrega a "Receita e Estoque de MP" quando o Insumo é selecionado
  useEffect(() => {
    const carregarReceita = async () => {
      if (!insumoId || !mostrarReceita) {
        setReceitaEstoque([]);
        limparReceita(); // Limpa seleção de MP se o insumo mudar
        return;
      }
      
      setLoadingSuporte(true); // Reusa o loading do formulário
      try {
        const res = await invoke<ApiResponse<ReceitaEstoqueItem[]>>(
          'buscar_receita_e_estoque_mp_tauri',
          { insumoId: Number(insumoId) }
        );
        if (res.success && res.data) {
          setReceitaEstoque(res.data);
        } else {
          setErrorSuporte(res.message || 'Falha ao carregar receita do insumo.');
        }
      } catch (err: any) {
         setErrorSuporte(err.message || `Erro ao carregar receita: ${String(err)}`);
      } finally {
        setLoadingSuporte(false);
      }
    };
    
    carregarReceita();
  }, [insumoId, mostrarReceita, limparReceita]);

  // --- HANDLERS ---
  
  const handleInsumoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
     const novoInsumoId = e.target.value;
     setInsumoId(novoInsumoId);
     // Atualiza o insumo selecionado para pegar a 'unidade'
     const insumo = insumosDoTipo.find(i => i.id.toString() === novoInsumoId) || null;
     setInsumoSelecionado(insumo);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSubmit(true);
    setErrorSubmit(null);
    
    // Validações (replicando lógica 'verificaCampos')
    if (!insumoId || insumoId === '0') {
      setErrorSubmit('Informe o insumo.');
      setLoadingSubmit(false);
      return;
    }
    if (!registro.trim()) {
      setErrorSubmit(`Informe o ${labelRegistro}.`);
      setLoadingSubmit(false);
      return;
    }
    
    // Formata o payload
    const materiasPrimasPayload: RegistroMateriaPrimaPayload[] = [];
    if (mostrarReceita) {
      for (const [mp_registro_id, qtd] of receita.entries()) {
        const qtdNum = parseFloat(qtd.replace(',', '.'));
        if (!qtd.trim() || isNaN(qtdNum) || qtdNum <= 0) {
            setErrorSubmit('Informe uma quantidade válida para todas as matérias-primas selecionadas.');
            setLoadingSubmit(false);
            return;
        }
         materiasPrimasPayload.push({
            materia_prima_registro_id: mp_registro_id,
            quantidade: qtd.replace(',', '.'),
         });
      }
      if (receitaEstoque.length > 0 && materiasPrimasPayload.length === 0) {
         setErrorSubmit('Selecione ao menos um lote de matéria-prima para a receita.');
         setLoadingSubmit(false);
         return;
      }
    }
    
    const payload: RegistroInsumoFrontendPayload = {
      insumo_id: Number(insumoId),
      registro: registro || null,
      fabricante: fabricante || null,
      volume: volume || null,
      data_preparo: dataPreparo || null,
      validade: validade || null,
      quantidade: quantidade || null,
      fator_correcao: fatorCorrecao || null,
      nota_fiscal: notaFiscal || null,
      garantia: garantia ? Number(garantia) : null,
      garantia_tempo: garantia ? garantiaTempo : null,
      fornecedor_id: fornecedorId ? Number(fornecedorId) : null,
      data_compra: dataCompra || null,
      valor_equipamento: valorEquipamento || null,
      modelo: modelo || null,
      numero_serie: numeroSerie || null,
      observacao: observacao || null,
      faixa_min: faixaMin || null,
      faixa_max: faixaMax || null,
      desvios: desvios || null,
      fora_de_uso: foraDeUso,
      portatil: portatil,
      materias_primas: materiasPrimasPayload,
    };
    
    try {
      const comando = itemParaEdicao ? 'editar_insumo_registro_tauri' : 'criar_insumo_registro_tauri';
      const args = itemParaEdicao ? { id: itemParaEdicao.id, payload } : { payload };

      const res = await invoke<ApiResponse<InsumoRegistroDetalhado>>(comando, args);

      if (res.success) {
        onSalvar(); // Sucesso!
      } else {
        setErrorSubmit(res.message || 'Ocorreu um erro ao salvar.');
      }
    } catch (err: any) {
      setErrorSubmit(err.message || `Erro fatal ao salvar: ${String(err)}`);
    } finally {
      setLoadingSubmit(false);
    }
  };
  
  // --- RENDERIZAÇÃO ---
  
  const renderizarCamposDinamicos = () => {
    // Campos Padrão (Meio de Cultura, Reagente, Vidraria, Acessório)
    const camposPadrao = (
      <>
        <div className={styles.formGroup}>
          <label htmlFor="fabricante">Fabricante</label>
          <input
            id="fabricante" type="text" value={fabricante}
            onChange={(e) => setFabricante(e.target.value)}
            disabled={loadingSubmit}
          />
        </div>
        {tipoNome === 'Vidraria' && (
          <div className={styles.formGroup}>
            <label htmlFor="volume">Volume</label>
            <input
              id="volume" type="text" value={volume}
              onChange={(e) => setVolume(e.target.value)}
              disabled={loadingSubmit}
            />
          </div>
        )}
      </>
    );

    // Campos de Lote (Meio de Cultura, Reagente)
    const camposLote = (
      <>
        <div className={styles.formGroup}>
          <label htmlFor="dataPreparo">Data Preparo/Receb.</label>
          <input
            id="dataPreparo" type="date" value={dataPreparo}
            onChange={(e) => setDataPreparo(e.target.value)}
            disabled={loadingSubmit}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="validade">Validade</label>
          <input
            id="validade" type="date" value={validade}
            onChange={(e) => setValidade(e.target.value)}
            disabled={loadingSubmit}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="quantidade">
            Quantidade {insumoSelecionado?.unidade ? `(${insumoSelecionado.unidade})` : ''}
          </label>
          <input
            id="quantidade" type="number" step="0.0001" value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            disabled={loadingSubmit}
          />
        </div>
      </>
    );

    // Campos de Equipamento
    const camposEquipamento = (
      <>
        <div className={styles.formGroup}>
          <label htmlFor="fabricante">Fabricante</label>
          <input
            id="fabricante" type="text" value={fabricante}
            onChange={(e) => setFabricante(e.target.value)}
            disabled={loadingSubmit}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="modelo">Modelo</label>
          <input
            id="modelo" type="text" value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            disabled={loadingSubmit}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="numeroSerie">Nº de Série</label>
          <input
            id="numeroSerie" type="text" value={numeroSerie}
            onChange={(e) => setNumeroSerie(e.target.value)}
            disabled={loadingSubmit}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="fornecedorId">Fornecedor</label>
          <select
            id="fornecedorId"
            value={fornecedorId}
            onChange={(e) => setFornecedorId(e.target.value)}
            disabled={loadingSubmit || loadingSuporte}
          >
            <option value="">Selecione...</option>
            {fornecedores.map((f) => (
              <option key={f.id} value={f.id}>{f.nome}</option>
            ))}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="notaFiscal">Nota Fiscal</label>
          <input
            id="notaFiscal" type="text" value={notaFiscal}
            onChange={(e) => setNotaFiscal(e.target.value)}
            disabled={loadingSubmit}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="dataCompra">Data da Compra</label>
          <input
            id="dataCompra" type="date" value={dataCompra}
            onChange={(e) => setDataCompra(e.target.value)}
            disabled={loadingSubmit}
          />
        </div>
         <div className={styles.formGroup}>
          <label htmlFor="valorEquipamento">Valor (R$)</label>
          <input
            id="valorEquipamento" type="number" step="0.01" value={valorEquipamento}
            onChange={(e) => setValorEquipamento(e.target.value)}
            disabled={loadingSubmit}
          />
        </div>
        <div className={styles.formGroup} style={{ flexBasis: '100%' }}>
          <label htmlFor="garantia">Garantia</label>
          <div className={styles.inputWithAddon}>
            <input
              id="garantia" type="number" value={garantia}
              onChange={(e) => setGarantia(e.target.value)}
              disabled={loadingSubmit}
              className={styles.inputGarantia}
            />
            <select
              value={garantiaTempo}
              onChange={(e) => setGarantiaTempo(e.target.value)}
              disabled={loadingSubmit}
              className={styles.selectAddon}
            >
              <option value="Dias">Dias</option>
              <option value="Meses">Meses</option>
            </select>
          </div>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="faixaMin">Faixa de Uso (Min)</label>
          <input
            id="faixaMin" type="text" value={faixaMin}
            onChange={(e) => setFaixaMin(e.target.value)}
            disabled={loadingSubmit}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="faixaMax">Faixa de Uso (Max)</label>
          <input
            id="faixaMax" type="text" value={faixaMax}
            onChange={(e) => setFaixaMax(e.target.value)}
            disabled={loadingSubmit}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="desvios">Desvios Permitidos (±)</label>
          <input
            id="desvios" type="number" step="0.01" value={desvios}
            onChange={(e) => setDesvios(e.target.value)}
            disabled={loadingSubmit}
          />
        </div>
      </>
    );

    // Seleciona quais campos renderizar
    switch (tipoNome) {
      case 'Equipamento':
        return camposEquipamento;
      case 'Meio de cultura':
        return <>{camposPadrao}{camposLote}</>;
      case 'Solução/Reagente':
        return (
          <>
            {camposPadrao}
            {camposLote}
            <div className={styles.formGroup}>
              <label htmlFor="fatorCorrecao">Fator de Correção</label>
              <input
                id="fatorCorrecao" type="number" step="0.0001" value={fatorCorrecao}
                onChange={(e) => setFatorCorrecao(e.target.value)}
                disabled={loadingSubmit}
              />
            </div>
          </>
        );
      case 'Vidraria':
      case 'Acessório':
        return camposPadrao;
      default:
        return <p>Selecione um tipo de insumo para ver os campos.</p>;
    }
  };

  const renderizarReceita = () => (
    <div className={styles.receitaContainer}>
      <h4 className={styles.receitaHeader}>Matérias-Primas Consumidas</h4>
      {loadingSuporte && <div className={styles.spinnerSmall}></div>}
      
      {receitaEstoque.length === 0 && !loadingSuporte && (
         <p className={styles.receitaEmpty}>Este insumo não requer matérias-primas.</p>
      )}
      
      {receitaEstoque.map(item => (
        <div key={item.mp_requerida.id} className={styles.receitaGrupo}>
          <label className={styles.receitaMpNome}>
            {item.mp_requerida.nome} 
            <span>(Necessário: {parseFloat(item.mp_requerida.quantidade).toFixed(4)} {item.mp_requerida.unidade})</span>
          </label>
          
          <div className={styles.receitaEstoqueWrapper}>
            {item.estoque_disponivel.length === 0 && (
               <p className={styles.receitaEstoqueEmpty}>Nenhum lote de estoque encontrado para esta Matéria-Prima.</p>
            )}
            {item.estoque_disponivel.map(mpEstoque => {
              const isChecked = receita.has(mpEstoque.id);
              return (
                <div key={mpEstoque.id} className={styles.receitaEstoqueItem}>
                  <div className={styles.formCheck}>
                    <input
                      type="checkbox"
                      id={`mp-reg-${mpEstoque.id}`}
                      checked={isChecked}
                      onChange={(e) => toggleItemReceita(mpEstoque, e.target.checked)}
                      disabled={loadingSubmit || (itemParaEdicao && !itemParaEdicao.editable)}
                    />
                    <label htmlFor={`mp-reg-${mpEstoque.id}`}>
                      Lote: {mpEstoque.lote_fabricante || 'N/A'} (Restante: {parseFloat(mpEstoque.quant_restante).toFixed(4)})
                      <span>Val: {mpEstoque.validade ? new Date(mpEstoque.validade + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'}</span>
                    </label>
                  </div>
                   <div className={styles.mpInputGroup}>
                      <input
                        type="number"
                        step="0.0001"
                        placeholder="0.0000"
                        value={receita.get(mpEstoque.id) || ''}
                        onChange={(e) => setQuantidadeReceita(mpEstoque.id, e.target.value)}
                        disabled={!isChecked || loadingSubmit || (itemParaEdicao && !itemParaEdicao.editable)}
                        className={styles.qtdInput}
                      />
                      <span className={styles.qtdUnidade}>{item.mp_requerida.unidade || 'N/A'}</span>
                   </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  );
  
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h2>{itemParaEdicao ? 'Editar Registro' : 'Novo Registro'} de Insumo</h2>
          <button onClick={onCancelar} className={styles.closeButton}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          {errorSuporte && <div className={styles.errorSubmit}>{errorSuporte}</div>}
          
          {loadingSuporte && !itemParaEdicao && (
             <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <span>Carregando dados...</span>
             </div>
          )}

          {!loadingSuporte && (
             <>
                <div className={styles.formGrid}>
                  {/* --- CAMPOS FIXOS --- */}
                  <div className={styles.formGroup}>
                    <label htmlFor="tipo">Tipo</label>
                    <input id="tipo" type="text" value={tipoNomeDefault} disabled />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="insumoId">Insumo</label>
                    <select
                      id="insumoId"
                      value={insumoId}
                      onChange={handleInsumoChange}
                      disabled={loadingSubmit || (itemParaEdicao && !itemParaEdicao.editable)}
                    >
                      <option value="" disabled>Selecione...</option>
                      {insumosDoTipo.map((i) => (
                        <option key={i.id} value={i.id}>{i.nome}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="registro">{labelRegistro}</label>
                    <input
                      id="registro" type="text" value={registro}
                      onChange={(e) => setRegistro(e.target.value)}
                      disabled={loadingSubmit}
                    />
                  </div>
                  
                  {/* --- CAMPOS DINÂMICOS --- */}
                  {renderizarCamposDinamicos()}
                  
                  {/* --- CAMPOS COMUNS (OBS/FLAGS) --- */}
                  <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                    <label htmlFor="observacao">Observação</label>
                    <textarea
                      id="observacao"
                      value={observacao}
                      onChange={(e) => setObservacao(e.target.value)}
                      disabled={loadingSubmit}
                      rows={3}
                    />
                  </div>
                  
                  <div className={styles.checkboxContainer}>
                      <div className={styles.formCheck}>
                        <input
                          type="checkbox" id="foraDeUso"
                          checked={foraDeUso}
                          onChange={(e) => setForaDeUso(e.target.checked)}
                          disabled={loadingSubmit}
                        />
                        <label htmlFor="foraDeUso">Fora de Uso</label>
                      </div>
                      {mostrarCamposEquipamento && (
                        <div className={styles.formCheck}>
                          <input
                            type="checkbox" id="portatil"
                            checked={portatil}
                            onChange={(e) => setPortatil(e.target.checked)}
                            disabled={loadingSubmit}
                          />
                          <label htmlFor="portatil">Portátil</label>
                        </div>
                      )}
                  </div>
                </div>

                {/* --- SEÇÃO DA RECEITA (Condicional) --- */}
                {mostrarReceita && renderizarReceita()}
             </>
          )}

          {/* --- AÇÕES --- */}
          <div className={styles.modalFooter}>
            {errorSubmit && <div className={styles.errorSubmit}>{errorSubmit}</div>}
            <div className={styles.buttonRow}>
              <button type="button" onClick={onCancelar} disabled={loadingSubmit} className={styles.buttonSecondary}>
                Cancelar
              </button>
              <button type="submit" disabled={loadingSubmit || loadingSuporte} className={styles.buttonPrimary}>
                {loadingSubmit ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CadastrarInsumoRegistro;
