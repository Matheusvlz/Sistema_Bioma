import React, { useState, useEffect, useMemo } from 'react';
import styles from './css/cadastrar_motorista.module.css'; // Certifique-se de criar este arquivo CSS
import { invoke } from "@tauri-apps/api/core";
import { Edit3, Trash2, Plus, X, Save, AlertTriangle, Search } from 'lucide-react';

interface Posto {
  id: number;
  nome: string;
  telefone: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
}

const Cadastrar_Posto: React.FC = () => {
  const [postos, setPostos] = useState<Posto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCadastroModalOpen, setIsCadastroModalOpen] = useState(false);
  const [isEdicaoModalOpen, setIsEdicaoModalOpen] = useState(false);
  const [isExclusaoModalOpen, setIsExclusaoModalOpen] = useState(false);
  const [isVisualizacaoModalOpen, setIsVisualizacaoModalOpen] = useState(false);
  const [postoSelecionado, setPostoSelecionado] = useState<Posto | null>(null);
  const [novoPosto, setNovoPosto] = useState({
    nome: '',
    telefone: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: ''
  });
  const [postoEditando, setPostoEditando] = useState<Posto | null>(null);

    const mascaraTelefone = (value: string) => {
    // Remove tudo que não for dígito
    const digitos = value.replace(/\D/g, '');
    let resultado = '';
    
    if (digitos.length > 0) {
      resultado = `(${digitos.substring(0, 2)}`;
    }
    if (digitos.length > 2) {
      resultado += `) ${digitos.substring(2, 7)}`;
    }
    if (digitos.length > 7) {
      resultado += `-${digitos.substring(7, 11)}`;
    }

    return resultado;
  };


  // Filtrar postos baseado no termo de pesquisa
  const postosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) {
      return postos;
    }
    
    const termoBusca = searchTerm.toLowerCase().trim();
    return postos.filter(posto => 
      posto.nome.toLowerCase().includes(termoBusca) ||
      posto.cidade.toLowerCase().includes(termoBusca) ||
      posto.bairro.toLowerCase().includes(termoBusca)
    );
  }, [postos, searchTerm]);

  // Funções de gerenciamento de estado e API
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleExcluirClick = (posto: Posto) => {
    setPostoSelecionado(posto);
    setIsExclusaoModalOpen(true);
  };

  const confirmarExclusao = async () => {
    if (postoSelecionado) {
      try {
        await invoke('deletar_posto', { id: postoSelecionado.id });
        setPostos(postos.filter(p => p.id !== postoSelecionado.id));
        handleFecharModal();
      } catch (err) {
        console.error("Erro ao deletar posto:", err);
      }
    }
  };

  const handleEditarClick = (posto: Posto) => {
    setPostoEditando({ ...posto });
    setIsEdicaoModalOpen(true);
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (postoEditando) {
      try {
        const postoAtualizado = await invoke<Posto>('atualizar_posto', { 
            id: postoEditando.id, 
            nome: postoEditando.nome,
            telefone: postoEditando.telefone,
            endereco: postoEditando.endereco,
            numero: postoEditando.numero,
            bairro: postoEditando.bairro,
            cidade: postoEditando.cidade,
            uf: postoEditando.uf,
        });
        setPostos(postos.map(p => p.id === postoAtualizado.id ? postoAtualizado : p));
        handleFecharModal();
      } catch (err) {
        console.error("Erro ao atualizar posto:", err);
      }
    }
  };

  const handleCadastrar = () => {
    setIsCadastroModalOpen(true);
  };
  
  // Função para abrir o modal de visualização
  const handleVerDadosClick = (posto: Posto) => {
    setPostoSelecionado(posto);
    setIsVisualizacaoModalOpen(true);
  };

  const handleFecharModal = () => {
    setIsCadastroModalOpen(false);
    setIsEdicaoModalOpen(false);
    setIsExclusaoModalOpen(false);
    setIsVisualizacaoModalOpen(false);
    setNovoPosto({ nome: '', telefone: '', endereco: '', numero: '', bairro: '', cidade: '', uf: '' });
    setPostoSelecionado(null);
    setPostoEditando(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, isEdicao = false) => {
    const { name, value } = e.target;
    
    if (isEdicao) {
      setPostoEditando(prev => (prev ? { ...prev, [name]: name === 'telefone' ? mascaraTelefone(value) : value } : null));
    } else {
      setNovoPosto(prev => ({ ...prev, [name]: name === 'telefone' ? mascaraTelefone(value) : value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const novoPostoCompleto = await invoke<Posto>('criar_posto', novoPosto);
      setPostos([...postos, novoPostoCompleto]);
      handleFecharModal();
    } catch (err) {
      console.error("Erro ao criar posto:", err);
    }
  };

  useEffect(() => {
    const buscarDados = async () => {
      try {
        const resultado = await invoke<Posto[]>('buscar_postos');
        setPostos(resultado);
      } catch (err) {
        console.error("Erro ao buscar postos:", err);
      } 
    };

    buscarDados();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Postos de Combustível</h1>
        <button className={styles.primaryButton} onClick={handleCadastrar}>
          <Plus size={20} />
          Cadastrar
        </button>
      </div>

      <div className={styles.searchContainer}>
        <div className={styles.searchInputWrapper}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Pesquisar por nome, cidade ou bairro..."
            value={searchTerm}
            onChange={handleSearchChange}
            className={styles.searchInput}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className={styles.clearSearchButton}
            >
              <X size={16} />
            </button>
          )}
        </div>
        {searchTerm && (
          <span className={styles.searchResults}>
            {postosFiltrados.length} de {postos.length} postos encontrados
          </span>
        )}
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.tableHeader}>
            <tr>
              <th className={styles.tableHead}>Nome</th>
              <th className={styles.tableHead}>Cidade</th>
              <th className={styles.tableHead}>Endereço</th>
              <th className={styles.tableHead}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {postosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={4} className={styles.emptyState}>
                  {searchTerm 
                    ? `Nenhum posto encontrado para "${searchTerm}"`
                    : 'Nenhum posto cadastrado'
                  }
                </td>
              </tr>
            ) : (
              postosFiltrados.map((posto) => (
                <tr key={posto.id} className={styles.tableRow} onClick={() => handleVerDadosClick(posto)}>
                  <td className={styles.tableCell}>{posto.nome}</td>
                  <td className={styles.tableCell}>{posto.cidade}</td>
                  <td className={styles.tableCell}>{posto.endereco}</td>
                  <td className={`${styles.tableCell} ${styles.actions}`}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEditarClick(posto); }}
                      className={styles.editButton}
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleExcluirClick(posto); }}
                      className={styles.dangerButton}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Cadastro */}
      {isCadastroModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Cadastrar Posto</h2>
              <button className={styles.closeButton} onClick={handleFecharModal}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label htmlFor="nome">Nome do Posto</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={novoPosto.nome}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
                  <div className={styles.formGroup}>
                <label htmlFor="telefone">Telefone</label>
                <input
                  type="text"
                  id="telefone"
                  name="telefone"
                  value={novoPosto.telefone}
                  onChange={handleInputChange}
                  maxLength={15}
                  placeholder="(99) 99999-9999"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="endereco">Endereço</label>
                <input
                  type="text"
                  id="endereco"
                  name="endereco"
                  value={novoPosto.endereco}
                  onChange={handleInputChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="numero">Número</label>
                <input
                  type="text"
                  id="numero"
                  name="numero"
                  value={novoPosto.numero}
                  onChange={handleInputChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="bairro">Bairro</label>
                <input
                  type="text"
                  id="bairro"
                  name="bairro"
                  value={novoPosto.bairro}
                  onChange={handleInputChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="cidade">Cidade</label>
                <input
                  type="text"
                  id="cidade"
                  name="cidade"
                  value={novoPosto.cidade}
                  onChange={handleInputChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="uf">UF</label>
                <input
                  type="text"
                  id="uf"
                  name="uf"
                  value={novoPosto.uf}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelButton} onClick={handleFecharModal}>
                  Cancelar
                </button>
                <button type="submit" className={styles.saveButton}>
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {isEdicaoModalOpen && postoEditando && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Editar Posto</h2>
              <button className={styles.closeButton} onClick={handleFecharModal}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSalvarEdicao} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label htmlFor="editNome">Nome do Posto</label>
                <input
                  type="text"
                  id="editNome"
                  name="nome"
                  value={postoEditando.nome}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </div>
              
                <div className={styles.formGroup}>
                <label htmlFor="editTelefone">Telefone</label>
                <input
                  type="text"
                  id="editTelefone"
                  name="telefone"
                  value={postoEditando.telefone}
                  onChange={(e) => handleInputChange(e, true)}
                  maxLength={15}
                  placeholder="(99) 99999-9999"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="editEndereco">Endereço</label>
                <input
                  type="text"
                  id="editEndereco"
                  name="endereco"
                  value={postoEditando.endereco}
                  onChange={(e) => handleInputChange(e, true)}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="editNumero">Número</label>
                <input
                  type="text"
                  id="editNumero"
                  name="numero"
                  value={postoEditando.numero}
                  onChange={(e) => handleInputChange(e, true)}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="editBairro">Bairro</label>
                <input
                  type="text"
                  id="editBairro"
                  name="bairro"
                  value={postoEditando.bairro}
                  onChange={(e) => handleInputChange(e, true)}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="editCidade">Cidade</label>
                <input
                  type="text"
                  id="editCidade"
                  name="cidade"
                  value={postoEditando.cidade}
                  onChange={(e) => handleInputChange(e, true)}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="editUf">UF</label>
               <input
            type="text"
            id="editUf"
            name="uf"
            value={postoEditando.uf}
            onChange={(e) => handleInputChange(e, true)}
            maxLength={2} // <-- Adicionado para limitar a 2 caracteres
            required
          />
              </div>
              
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelButton} onClick={handleFecharModal}>
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className={styles.saveButton}
                >
                  <Save size={18} />
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Visualização */}
      {isVisualizacaoModalOpen && postoSelecionado && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Dados do Posto</h2>
              <button className={styles.closeButton} onClick={handleFecharModal}>
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.detailsContent}>
              <div className={styles.detailItem}>
                <strong>Nome:</strong>
                <span>{postoSelecionado.nome}</span>
              </div>
              <div className={styles.detailItem}>
                <strong>Telefone:</strong>
                <span>{postoSelecionado.telefone || 'N/A'}</span>
              </div>
              <div className={styles.detailItem}>
                <strong>Endereço:</strong>
                <span>{postoSelecionado.endereco || 'N/A'}, {postoSelecionado.numero || 'S/N'}</span>
              </div>
              <div className={styles.detailItem}>
                <strong>Bairro:</strong>
                <span>{postoSelecionado.bairro || 'N/A'}</span>
              </div>
              <div className={styles.detailItem}>
                <strong>Cidade/UF:</strong>
                <span>{postoSelecionado.cidade || 'N/A'}/{postoSelecionado.uf || 'N/A'}</span>
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelButton} onClick={handleFecharModal}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {isExclusaoModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Confirmar Exclusão</h2>
              <button className={styles.closeButton} onClick={handleFecharModal}>
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.confirmationContent}>
              <AlertTriangle size={48} className={styles.warningIcon} />
              <p>Tem certeza que deseja excluir o posto <strong>{postoSelecionado?.nome}</strong>?</p>
              <p>Esta ação não poderá ser desfeita.</p>
            </div>
            
            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelButton} onClick={handleFecharModal}>
                Cancelar
              </button>
              <button 
                type="button" 
                className={styles.dangerButton}
                onClick={confirmarExclusao}
              >
                <Trash2 size={18} />
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cadastrar_Posto;