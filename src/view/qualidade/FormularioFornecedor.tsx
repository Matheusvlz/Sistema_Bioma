// Local: src/view/qualidade/FormularioFornecedor.tsx

import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import styles from './styles/FormularioGenerico.module.css';
import { IMaskInput } from 'react-imask';
// IMPORTANTE: Ajuste o caminho para o seu componente Modal se for diferente
import { Modal } from '../../components/Modal';

// --- Interfaces para Tipagem Forte (Sincronizadas com o Backend Final) ---

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

// Resposta da API
interface FornecedorCategoria {
    ID: number;
    NOME: string;
}

interface FornecedorObservacao {
    DATA_OBSERVACAO?: string;
    OBSERVACAO?: string;
    ESTADO?: boolean;
}

interface FornecedorQualificacao {
    ID: number;
    DATA_QUALIFICACAO?: string;
    RELATORIO?: string;
    CERTIFICACAO?: string;
    VALIDADE?: string;
    AVALIACAO?: string;
}

// Payload para salvar (enviado para o Tauri)
interface SalvarObservacaoPayload {
    data_observacao?: string;
    observacao?: string;
    estado: boolean;
}

interface SalvarQualificacaoPayload {
    data_qualificacao?: string;
    relatorio?: string;
    certificacao?: string;
    validade?: string;
    avaliacao?: string;
}

interface SalvarFornecedorPayload {
    nome: string;
    fantasia: string;
    documento?: string;
    inscricao_estadual?: string;
    endereco?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
    telefone?: string;
    celular?: string;
    email?: string;
    site?: string;
    contato?: string;
    qualificado: number; // -1, 0, 1
    obsoleto: boolean;
    categorias?: number[];
    observacoes?: SalvarObservacaoPayload[];
    qualificacoes?: SalvarQualificacaoPayload[];
}

// Dados completos recebidos do Tauri (para edição)
interface FornecedorDetalhado {
    id: number;
    nome?: string;
    fantasia?: string;
    documento?: string;
    inscricao_estadual?: string;
    endereco?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
    telefone?: string;
    celular?: string;
    email?: string;
    site?: string;
    contato?: string;
    qualificado?: number;
    obsoleto?: boolean;
    categorias: FornecedorCategoria[];
    observacoes: FornecedorObservacao[];
    qualificacoes: FornecedorQualificacao[];
}

// Props que o componente aceita
interface FormularioFornecedorProps {
    fornecedorId?: number;
    onSave: (fornecedor: FornecedorDetalhado) => void;
    onCancel: () => void;
}

// Estado inicial para um novo fornecedor
const initialState: SalvarFornecedorPayload = {
    nome: '',
    fantasia: '',
    documento: '',
    inscricao_estadual: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: 'SP',
    cep: '',
    telefone: '',
    celular: '',
    email: '',
    site: '',
    contato: '',
    qualificado: 0, // Padrão 'Não'
    obsoleto: false, // Padrão 'Não'
    categorias: [],
    observacoes: [],
    qualificacoes: [],
};

// Estado inicial para os sub-formulários das abas
const initialQualificacaoState = { data_qualificacao: '', relatorio: '', certificacao: '', validade: '', avaliacao: '0' };
const initialObservacaoState = { data_observacao: '', observacao: '', estado: false };

const UFs = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
type ModalType = 'success' | 'error' | 'warning' | 'confirm';

const FormularioFornecedor: React.FC<FormularioFornecedorProps> = ({ fornecedorId, onSave, onCancel }) => {
    // --- Gerenciamento de Estado Abrangente ---
    const [formData, setFormData] = useState<SalvarFornecedorPayload>(initialState);
    const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<FornecedorCategoria[]>([]);
    const [activeTab, setActiveTab] = useState<'qualificacoes' | 'observacoes'>('qualificacoes');
    
    // Estado para os sub-formulários
    const [novaQualificacao, setNovaQualificacao] = useState<SalvarQualificacaoPayload>(initialQualificacaoState);
    const [novaObservacao, setNovaObservacao] = useState<SalvarObservacaoPayload>(initialObservacaoState);

    const [isLoading, setIsLoading] = useState(true);
    
    // Estados para controlar o seu modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', message: '', type: 'success' as ModalType });
    const [savedData, setSavedData] = useState<FornecedorDetalhado | null>(null);
    
    // --- Carregamento de Dados Iniciais ---
    useEffect(() => {
        const carregarDadosIniciais = async () => {
            setIsLoading(true);
            try {
                const categoriasRes = await invoke<ApiResponse<FornecedorCategoria[]>>('listar_categorias_fornecedor_tauri');
                if (categoriasRes.success && categoriasRes.data) {
                    setCategoriasDisponiveis(categoriasRes.data);
                } else {
                    throw new Error(categoriasRes.message || 'Falha ao carregar categorias.');
                }

                if (fornecedorId) {
                    const res = await invoke<ApiResponse<FornecedorDetalhado>>('buscar_fornecedor_detalhado_tauri', { id: fornecedorId });
                    if (res.success && res.data) {
                        // Transforma os dados recebidos para o formato do payload de salvar
                        setFormData({
                            nome: res.data.nome || '',
                            fantasia: res.data.fantasia || '',
                            documento: res.data.documento || '',
                            inscricao_estadual: res.data.inscricao_estadual || '',
                            endereco: res.data.endereco || '',
                            numero: res.data.numero || '',
                            bairro: res.data.bairro || '',
                            cidade: res.data.cidade || '',
                            uf: res.data.uf || 'SP',
                            cep: res.data.cep || '',
                            telefone: res.data.telefone || '',
                            celular: res.data.celular || '',
                            email: res.data.email || '',
                            site: res.data.site || '',
                            contato: res.data.contato || '',
                            qualificado: res.data.qualificado ?? 0,
                            obsoleto: res.data.obsoleto ?? false,
                            categorias: res.data.categorias.map(c => c.ID),
                            observacoes: res.data.observacoes.map(o => ({
                                data_observacao: o.DATA_OBSERVACAO?.split('T')[0] || '',
                                observacao: o.OBSERVACAO || '',
                                estado: o.ESTADO ?? false,
                            })),
                            qualificacoes: res.data.qualificacoes.map(q => ({
                                data_qualificacao: q.DATA_QUALIFICACAO?.split('T')[0] || '',
                                relatorio: q.RELATORIO || '',
                                certificacao: q.CERTIFICACAO || '',
                                validade: q.VALIDADE?.split('T')[0] || '',
                                avaliacao: q.AVALIACAO || '0',
                            })),
                        });
                    } else {
                        throw new Error(res.message || 'Fornecedor não encontrado.');
                    }
                }
            } catch (err: any) {
                setModalContent({ title: 'Erro na Carga', message: err.message || 'Ocorreu um erro desconhecido.', type: 'error' });
                setIsModalOpen(true);
            } finally {
                setIsLoading(false);
            }
        };

        carregarDadosIniciais();
    }, [fornecedorId]);

    // --- Handlers de Interação ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMaskedInputChange = (value: string | undefined, name: string) => {
        setFormData(prev => ({ ...prev, [name]: value || '' }));
    };

    const handleCheckboxChange = (id: number) => {
        setFormData(prev => {
            const newCategorias = prev.categorias?.includes(id)
                ? prev.categorias.filter(catId => catId !== id)
                : [...(prev.categorias || []), id];
            return { ...prev, categorias: newCategorias };
        });
    };
    
    const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const parsedValue = name === 'qualificado' ? parseInt(value, 10) : value === 'true';
        setFormData(prev => ({ ...prev, [name]: parsedValue }));
    };

    const handleAbrirPasta = async () => {
        if (!formData.fantasia) {
            setModalContent({ title: 'Atenção', message: 'Preencha o nome Fantasia para abrir a pasta.', type: 'warning' });
            setIsModalOpen(true);
            return;
        }
        try {
            await invoke('abrir_pasta_fornecedor_tauri', { fantasia: formData.fantasia });
        } catch (err: any) {
            setModalContent({ title: 'Erro', message: err.message || 'Não foi possível abrir a pasta.', type: 'error' });
            setIsModalOpen(true);
        }
    };
    
    // --- Handlers para Listas Dinâmicas ---

    const handleAddQualificacao = () => {
        if (!novaQualificacao.data_qualificacao || !novaQualificacao.validade) {
            setModalContent({ title: 'Atenção', message: 'Data e Validade são obrigatórias para a qualificação.', type: 'warning' });
            setIsModalOpen(true);
            return;
        }
        setFormData(prev => ({
            ...prev,
            qualificacoes: [...(prev.qualificacoes || []), novaQualificacao]
        }));
        setNovaQualificacao(initialQualificacaoState);
    };

    const handleRemoveQualificacao = (index: number) => {
        setFormData(prev => ({
            ...prev,
            qualificacoes: prev.qualificacoes?.filter((_, i) => i !== index)
        }));
    };
    
    const handleAddObservacao = () => {
        if (!novaObservacao.data_observacao || !novaObservacao.observacao) {
            setModalContent({ title: 'Atenção', message: 'Data e Observação são obrigatórias.', type: 'warning' });
            setIsModalOpen(true);
            return;
        }
        setFormData(prev => ({
            ...prev,
            observacoes: [...(prev.observacoes || []), { ...novaObservacao, estado: false }]
        }));
        setNovaObservacao(initialObservacaoState);
    };

    const handleRemoveObservacao = (index: number) => {
        setFormData(prev => ({
            ...prev,
            observacoes: prev.observacoes?.filter((_, i) => i !== index)
        }));
    };

    // --- Submissão do Formulário ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            const command = fornecedorId ? 'editar_fornecedor_tauri' : 'cadastrar_fornecedor_tauri';
            const params = fornecedorId ? { id: fornecedorId, payload: formData } : { payload: formData };
            
            const response = await invoke<ApiResponse<FornecedorDetalhado>>(command, params);

            if (response.success && response.data) {
                setModalContent({ title: 'Sucesso!', message: response.message || 'Operação realizada com sucesso!', type: 'success' });
                setSavedData(response.data);
                setIsModalOpen(true);
            } else {
                throw new Error(response.message || "Falha ao salvar fornecedor.");
            }
        } catch (err: any) {
            setModalContent({ title: 'Erro ao Salvar', message: err.message || "Erro desconhecido.", type: 'error' });
            setIsModalOpen(true);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        if (modalContent.type === 'success' && savedData) {
            onSave(savedData);
        }
    };
    
    // --- Renderização ---
    if (isLoading && !fornecedorId) {
        return <div className={styles.loading}>Carregando...</div>;
    }

    return (
        <div className={styles.container}>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.header}>
                    <h2>{fornecedorId ? 'Editar' : 'Cadastrar'} Fornecedor</h2>
                    <button type="button" onClick={handleAbrirPasta} className={styles.btnOutline}>Abrir Pasta</button>
                </div>
                
                {/* DADOS CADASTRAIS */}
                <div className={styles.formRow}>
                    <div className={`${styles.formGroup} ${styles.flex2}`}>
                        <label>Fantasia</label>
                        <input name="fantasia" value={formData.fantasia || ''} onChange={handleInputChange} required />
                    </div>
                    <div className={`${styles.formGroup} ${styles.flex3}`}>
                        <label>Razão Social</label>
                        <input name="nome" value={formData.nome || ''} onChange={handleInputChange} required />
                    </div>
                </div>
                <div className={styles.formRow}>
                    <div className={`${styles.formGroup} ${styles.flex1}`}>
                        <label>CNPJ</label>
                        <IMaskInput
                            mask="00.000.000/0000-00"
                            name="documento"
                            value={formData.documento || ''}
                            onAccept={(value) => handleMaskedInputChange(String(value), 'documento')}
                        />
                    </div>
                    <div className={`${styles.formGroup} ${styles.flex1}`}>
                        <label>Inscrição Estadual</label>
                        <input name="inscricao_estadual" value={formData.inscricao_estadual || ''} onChange={handleInputChange} />
                    </div>
                </div>
                <div className={styles.formRow}>
                    <div className={`${styles.formGroup} ${styles.flex3}`}>
                        <label>Endereço</label>
                        <input name="endereco" value={formData.endereco || ''} onChange={handleInputChange} />
                    </div>
                    <div className={`${styles.formGroup} ${styles.flex1}`}>
                        <label>Número</label>
                        <input name="numero" value={formData.numero || ''} onChange={handleInputChange} />
                    </div>
                    <div className={`${styles.formGroup} ${styles.flex1}`}>
                        <label>CEP</label>
                         <IMaskInput
                            mask="00000-000"
                            name="cep"
                            value={formData.cep || ''}
                            onAccept={(value) => handleMaskedInputChange(String(value), 'cep')}
                        />
                    </div>
                </div>
                <div className={styles.formRow}>
                     <div className={`${styles.formGroup} ${styles.flex2}`}>
                        <label>Bairro</label>
                        <input name="bairro" value={formData.bairro || ''} onChange={handleInputChange} />
                    </div>
                     <div className={`${styles.formGroup} ${styles.flex2}`}>
                        <label>Cidade</label>
                        <input name="cidade" value={formData.cidade || ''} onChange={handleInputChange} />
                    </div>
                     <div className={`${styles.formGroup} ${styles.flex1}`}>
                        <label>UF</label>
                        <select name="uf" value={formData.uf || 'SP'} onChange={handleInputChange}>
                            {UFs.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                        </select>
                    </div>
                </div>
                 <div className={styles.formRow}>
                    <div className={`${styles.formGroup} ${styles.flex1}`}>
                        <label>Telefone</label>
                        <IMaskInput
                            mask="(00) 0000-0000"
                            name="telefone"
                            value={formData.telefone || ''}
                            onAccept={(value) => handleMaskedInputChange(String(value), 'telefone')}
                        />
                    </div>
                     <div className={`${styles.formGroup} ${styles.flex1}`}>
                        <label>Celular</label>
                        <IMaskInput
                            mask="(00) 00000-0000"
                            name="celular"
                            value={formData.celular || ''}
                            onAccept={(value) => handleMaskedInputChange(String(value), 'celular')}
                        />
                    </div>
                </div>
                <div className={styles.formRow}>
                     <div className={`${styles.formGroup} ${styles.flex1}`}>
                        <label>Contato</label>
                        <input name="contato" value={formData.contato || ''} onChange={handleInputChange} />
                    </div>
                     <div className={`${styles.formGroup} ${styles.flex1}`}>
                        <label>E-mail</label>
                        <input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} />
                    </div>
                     <div className={`${styles.formGroup} ${styles.flex1}`}>
                        <label>Site</label>
                        <input name="site" value={formData.site || ''} onChange={handleInputChange} />
                    </div>
                </div>
                
                <div className={styles.sectionLabel}>Categoria</div>
                <div className={styles.checkboxGrid}>
                    {categoriasDisponiveis.map(cat => (
                        <div key={cat.ID} className={styles.checkboxItem}>
                            <input
                                type="checkbox"
                                id={`cat-${cat.ID}`}
                                checked={formData.categorias?.includes(cat.ID) || false}
                                onChange={() => handleCheckboxChange(cat.ID)}
                            />
                            <label htmlFor={`cat-${cat.ID}`}>{cat.NOME}</label>
                        </div>
                    ))}
                </div>

                <div className={styles.formRow} style={{marginTop: '1.5rem'}}>
                    <div className={styles.formGroup}>
                        <div className={styles.sectionLabel}>Qualificado</div>
                        <div className={styles.radioGroup}>
                           <input type="radio" id="q_sim" name="qualificado" value="1" checked={formData.qualificado === 1} onChange={handleRadioChange} />
                           <label htmlFor="q_sim">Sim</label>
                           <input type="radio" id="q_nao" name="qualificado" value="0" checked={formData.qualificado === 0} onChange={handleRadioChange} />
                           <label htmlFor="q_nao">Não</label>
                           <input type="radio" id="q_na" name="qualificado" value="-1" checked={formData.qualificado === -1} onChange={handleRadioChange} />
                           <label htmlFor="q_na">N.A.</label>
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <div className={styles.sectionLabel}>Obsoleto</div>
                        <div className={styles.radioGroup}>
                           <input type="radio" id="o_sim" name="obsoleto" value="true" checked={formData.obsoleto === true} onChange={handleRadioChange} />
                           <label htmlFor="o_sim">Sim</label>
                           <input type="radio" id="o_nao" name="obsoleto" value="false" checked={formData.obsoleto === false} onChange={handleRadioChange} />
                           <label htmlFor="o_nao">Não</label>
                        </div>
                    </div>
                </div>

                <div className={styles.tabContainer}>
                    <div className={styles.tabHeader}>
                        <button type="button" className={activeTab === 'qualificacoes' ? styles.tabActive : ''} onClick={() => setActiveTab('qualificacoes')}>Qualificação</button>
                        <button type="button" className={activeTab === 'observacoes' ? styles.tabActive : ''} onClick={() => setActiveTab('observacoes')}>Observações</button>
                    </div>
                    <div className={styles.tabContent}>
                        {activeTab === 'qualificacoes' && (
                            <div>
                                <div className={styles.subForm}>
                                    <input type="date" value={novaQualificacao.data_qualificacao} onChange={e => setNovaQualificacao(p => ({...p, data_qualificacao: e.target.value}))} />
                                    <input placeholder="Relatório" value={novaQualificacao.relatorio} onChange={e => setNovaQualificacao(p => ({...p, relatorio: e.target.value}))} />
                                    <input placeholder="Certificação" value={novaQualificacao.certificacao} onChange={e => setNovaQualificacao(p => ({...p, certificacao: e.target.value}))} />
                                    <input type="date" value={novaQualificacao.validade} onChange={e => setNovaQualificacao(p => ({...p, validade: e.target.value}))} />
                                    <select value={novaQualificacao.avaliacao} onChange={e => setNovaQualificacao(p => ({...p, avaliacao: e.target.value}))}>
                                        {Array.from({length: 11}, (_, i) => <option key={i} value={i}>{i}</option>)}
                                    </select>
                                    <button type="button" onClick={handleAddQualificacao}>Incluir</button>
                                </div>
                                <table className={styles.dataTable}>
                                    <thead>
                                        <tr>
                                            <th>Data</th><th>Relatório</th><th>Certificação</th><th>Validade</th><th>Avaliação</th><th>Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.qualificacoes?.map((q, index) => (
                                            <tr key={index}>
                                                <td>{q.data_qualificacao}</td><td>{q.relatorio}</td><td>{q.certificacao}</td><td>{q.validade}</td><td>{q.avaliacao}</td>
                                                <td><button type="button" className={styles.btnRemove} onClick={() => handleRemoveQualificacao(index)}>Remover</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {activeTab === 'observacoes' && (
                           <div>
                                <div className={styles.subForm}>
                                    <input type="date" value={novaObservacao.data_observacao} onChange={e => setNovaObservacao(p => ({...p, data_observacao: e.target.value}))} />
                                    <input placeholder="Observação" style={{flex:1}} value={novaObservacao.observacao} onChange={e => setNovaObservacao(p => ({...p, observacao: e.target.value}))} />
                                    <button type="button" onClick={handleAddObservacao}>Incluir</button>
                                </div>
                                <table className={styles.dataTable}>
                                    <thead>
                                        <tr>
                                            <th>Data</th><th>Observação</th><th>Situação</th><th>Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.observacoes?.map((o, index) => (
                                            <tr key={index}>
                                                <td>{o.data_observacao}</td><td>{o.observacao}</td><td>{o.estado ? 'Finalizado' : 'Em Aberto'}</td>
                                                <td><button type="button" className={styles.btnRemove} onClick={() => handleRemoveObservacao(index)}>Remover</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                           </div>
                        )}
                    </div>
                </div>

                <div className={styles.formActions}>
                    <button type="button" onClick={onCancel} className={styles.btnSecondary} disabled={isLoading}>Cancelar</button>
                    <button type="submit" className={styles.btnPrimary} disabled={isLoading}>
                        {isLoading ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </form>
            
            <Modal
                isOpen={isModalOpen}
                title={modalContent.title}
                message={modalContent.message}
                type={modalContent.type}
                onClose={handleCloseModal}
            />
        </div>
    );
};

export default FormularioFornecedor;