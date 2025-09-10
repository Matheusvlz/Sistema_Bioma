import React, { useState, useEffect, useMemo } from 'react';
import styles from './css/cadastrar_motorista.module.css';
import { invoke } from "@tauri-apps/api/core";
import { Edit3, Trash2, Plus, X, Save, AlertTriangle, Search } from 'lucide-react';

interface Motorista {
  id: number;
  nome: string;
  cnh: string;
}

const Cadastrar_Motorista: React.FC = () => {
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCadastroModalOpen, setIsCadastroModalOpen] = useState(false);
  const [isEdicaoModalOpen, setIsEdicaoModalOpen] = useState(false);
  const [isExclusaoModalOpen, setIsExclusaoModalOpen] = useState(false);
  const [motoristaSelecionado, setMotoristaSelecionado] = useState<Motorista | null>(null);
  const [novoMotorista, setNovoMotorista] = useState({
    nome: '',
    cnh: ''
  });
  const [motoristaEditando, setMotoristaEditando] = useState({
    id: 0,
    nome: '',
    cnh: ''
  });

  // Filtrar motoristas baseado no termo de pesquisa
  const motoristasFiltrados = useMemo(() => {
    if (!searchTerm.trim()) {
      return motoristas;
    }
    
    const termoBusca = searchTerm.toLowerCase().trim();
    return motoristas.filter(motorista => 
      motorista.nome.toLowerCase().includes(termoBusca) ||
      motorista.cnh.toLowerCase().includes(termoBusca)
    );
  }, [motoristas, searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleExcluirClick = (motorista: Motorista) => {
    setMotoristaSelecionado(motorista);
    setIsExclusaoModalOpen(true);
  };

  const confirmarExclusao = () => {
    if (motoristaSelecionado) {
      setMotoristas(motoristas.filter(m => m.id !== motoristaSelecionado.id));
      setIsExclusaoModalOpen(false);
      setMotoristaSelecionado(null);
    }
  };

  const handleEditarClick = (motorista: Motorista) => {
    setMotoristaEditando({ ...motorista });
    setIsEdicaoModalOpen(true);
  };

  const handleSalvarEdicao = () => {
    setMotoristas(motoristas.map(m => 
      m.id === motoristaEditando.id ? motoristaEditando : m
    ));
    setIsEdicaoModalOpen(false);
    setMotoristaEditando({ id: 0, nome: '', cnh: '' });
  };

  const handleCadastrar = () => {
    setIsCadastroModalOpen(true);
  };

  const handleFecharModal = () => {
    setIsCadastroModalOpen(false);
    setIsEdicaoModalOpen(false);
    setIsExclusaoModalOpen(false);
    setNovoMotorista({ nome: '', cnh: '' });
    setMotoristaSelecionado(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, isEdicao = false) => {
    const { name, value } = e.target;
    
    if (isEdicao) {
      setMotoristaEditando(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setNovoMotorista(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulando adição à lista (substitua pela chamada real ao backend)
    const novoId = motoristas.length > 0 ? Math.max(...motoristas.map(m => m.id)) + 1 : 1;
    setMotoristas([...motoristas, { id: novoId, ...novoMotorista }]);
    handleFecharModal();
  };

  useEffect(() => {
    const buscarDados = async () => {
      try {
        const resultado = await invoke<Motorista[]>('buscar_motoristas');
        setMotoristas(resultado);
      } catch (err) {
        console.error("Erro ao buscar agendamentos:", err);
      } 
    };

    buscarDados();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Motoristas</h1>
        <button className={styles.primaryButton} onClick={handleCadastrar}>
          <Plus size={20} />
          Cadastrar
        </button>
      </div>

      {/* Barra de Pesquisa */}
      <div className={styles.searchContainer}>
        <div className={styles.searchInputWrapper}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Pesquisar por nome ou CNH..."
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
            {motoristasFiltrados.length} de {motoristas.length} motoristas encontrados
          </span>
        )}
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.tableHeader}>
            <tr>
              <th className={styles.tableHead}>Motorista</th>
              <th className={styles.tableHead}>CNH</th>
              <th className={styles.tableHead}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {motoristasFiltrados.length === 0 ? (
              <tr>
                <td colSpan={3} className={styles.emptyState}>
                  {searchTerm 
                    ? `Nenhum motorista encontrado para "${searchTerm}"`
                    : 'Nenhum motorista cadastrado'
                  }
                </td>
              </tr>
            ) : (
              motoristasFiltrados.map((motorista) => (
                <tr key={motorista.id} className={styles.tableRow}>
                  <td className={styles.tableCell}>{motorista.nome}</td>
                  <td className={styles.tableCell}>{motorista.cnh}</td>
                  <td className={`${styles.tableCell} ${styles.actions}`}>
                    <button 
                      onClick={() => handleEditarClick(motorista)}
                      className={styles.editButton}
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => handleExcluirClick(motorista)}
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
              <h2>Cadastrar Motorista</h2>
              <button className={styles.closeButton} onClick={handleFecharModal}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label htmlFor="nome">Nome do Motorista</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={novoMotorista.nome}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="cnh">Número da CNH</label>
                <input
                  type="text"
                  id="cnh"
                  name="cnh"
                  value={novoMotorista.cnh}
                  onChange={handleInputChange}
                  required
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
      {isEdicaoModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Editar Motorista</h2>
              <button className={styles.closeButton} onClick={handleFecharModal}>
                <X size={20} />
              </button>
            </div>
            
            <form className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label htmlFor="editNome">Nome do Motorista</label>
                <input
                  type="text"
                  id="editNome"
                  name="nome"
                  value={motoristaEditando.nome}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="editCnh">Número da CNH</label>
                <input
                  type="text"
                  id="editCnh"
                  name="cnh"
                  value={motoristaEditando.cnh}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </div>
              
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelButton} onClick={handleFecharModal}>
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className={styles.saveButton}
                  onClick={handleSalvarEdicao}
                >
                  <Save size={18} />
                  Salvar
                </button>
              </div>
            </form>
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
              <p>Tem certeza que deseja excluir o motorista <strong>{motoristaSelecionado?.nome}</strong>?</p>
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

export default Cadastrar_Motorista;