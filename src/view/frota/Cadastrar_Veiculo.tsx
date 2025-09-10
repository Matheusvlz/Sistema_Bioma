import React, { useState, useEffect, useMemo } from 'react';
import styles from './css/cadastrar_motorista.module.css';
import { invoke } from "@tauri-apps/api/core";
import { Edit3, Trash2, Plus, X, Save, AlertTriangle, Search } from 'lucide-react';

interface Veiculo {
  id: number;
  veiculo: string;
  marca: string;
  placa: string;
  ano: string;
}

const Cadastrar_Veiculo: React.FC = () => {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCadastroModalOpen, setIsCadastroModalOpen] = useState(false);
  const [isEdicaoModalOpen, setIsEdicaoModalOpen] = useState(false);
  const [isExclusaoModalOpen, setIsExclusaoModalOpen] = useState(false);
  const [veiculoSelecionado, setVeiculoSelecionado] = useState<Veiculo | null>(null);
  const [novoVeiculo, setNovoVeiculo] = useState({
    veiculo: '',
    marca: '',
    placa: '',
    ano: ''
  });
  const [veiculoEditando, setVeiculoEditando] = useState({
    id: 0,
    veiculo: '',
    marca: '',
    placa: '',
    ano: ''
  });

  // Filtrar veículos baseado no termo de pesquisa
  const veiculosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) {
      return veiculos;
    }
    
    const termoBusca = searchTerm.toLowerCase().trim();
    return veiculos.filter(veiculo => 
      veiculo.veiculo.toLowerCase().includes(termoBusca) ||
      veiculo.marca.toLowerCase().includes(termoBusca) ||
      veiculo.placa.toLowerCase().includes(termoBusca) ||
      veiculo.ano.toLowerCase().includes(termoBusca)
    );
  }, [veiculos, searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleExcluirClick = (veiculo: Veiculo) => {
    setVeiculoSelecionado(veiculo);
    setIsExclusaoModalOpen(true);
  };

  const confirmarExclusao = () => {
    if (veiculoSelecionado) {
      setVeiculos(veiculos.filter(v => v.id !== veiculoSelecionado.id));
      setIsExclusaoModalOpen(false);
      setVeiculoSelecionado(null);
    }
  };

  const handleEditarClick = (veiculo: Veiculo) => {
    setVeiculoEditando({ ...veiculo });
    setIsEdicaoModalOpen(true);
  };

  const handleSalvarEdicao = () => {
    setVeiculos(veiculos.map(v => 
      v.id === veiculoEditando.id ? veiculoEditando : v
    ));
    setIsEdicaoModalOpen(false);
    setVeiculoEditando({ id: 0, veiculo: '', marca: '', placa: '', ano: '' });
  };

  const handleCadastrar = () => {
    setIsCadastroModalOpen(true);
  };

  const handleFecharModal = () => {
    setIsCadastroModalOpen(false);
    setIsEdicaoModalOpen(false);
    setIsExclusaoModalOpen(false);
    setNovoVeiculo({ veiculo: '', marca: '', placa: '', ano: '' });
    setVeiculoSelecionado(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, isEdicao = false) => {
    const { name, value } = e.target;
    
    if (isEdicao) {
      setVeiculoEditando(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setNovoVeiculo(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const novoId = veiculos.length > 0 ? Math.max(...veiculos.map(v => v.id)) + 1 : 1;
    setVeiculos([...veiculos, { id: novoId, ...novoVeiculo }]);
    handleFecharModal();
  };

  useEffect(() => {
    const buscarDados = async () => {
      try {
        const resultado = await invoke<Veiculo[]>('buscar_veiculos_e_marcasyy');
        setVeiculos(resultado);
      } catch (err) {
        console.error("Erro ao buscar veículos:", err);
      } 
    };

    buscarDados();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Veículos</h1>
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
            placeholder="Pesquisar por veículo, marca, placa ou ano..."
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
            {veiculosFiltrados.length} de {veiculos.length} veículos encontrados
          </span>
        )}
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.tableHeader}>
            <tr>
              <th className={styles.tableHead}>Veículo</th>
              <th className={styles.tableHead}>Marca</th>
              <th className={styles.tableHead}>Placa</th>
              <th className={styles.tableHead}>Ano</th>
              <th className={styles.tableHead}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {veiculosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyState}>
                  {searchTerm 
                    ? `Nenhum veículo encontrado para "${searchTerm}"`
                    : 'Nenhum veículo cadastrado'
                  }
                </td>
              </tr>
            ) : (
              veiculosFiltrados.map((veiculo) => (
                <tr key={veiculo.id} className={styles.tableRow}>
                  <td className={styles.tableCell}>{veiculo.veiculo}</td>
                  <td className={styles.tableCell}>{veiculo.marca}</td>
                  <td className={styles.tableCell}>{veiculo.placa}</td>
                  <td className={styles.tableCell}>{veiculo.ano}</td>
                  <td className={`${styles.tableCell} ${styles.actions}`}>
                    <button 
                      onClick={() => handleEditarClick(veiculo)}
                      className={styles.editButton}
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => handleExcluirClick(veiculo)}
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
              <h2>Cadastrar Veículo</h2>
              <button className={styles.closeButton} onClick={handleFecharModal}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label htmlFor="veiculo">Veículo</label>
                <input
                  type="text"
                  id="veiculo"
                  name="veiculo"
                  value={novoVeiculo.veiculo}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="marca">Marca</label>
                <input
                  type="text"
                  id="marca"
                  name="marca"
                  value={novoVeiculo.marca}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="placa">Placa</label>
                <input
                  type="text"
                  id="placa"
                  name="placa"
                  value={novoVeiculo.placa}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="ano">Ano</label>
                <input
                  type="text"
                  id="ano"
                  name="ano"
                  value={novoVeiculo.ano}
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
              <h2>Editar Veículo</h2>
              <button className={styles.closeButton} onClick={handleFecharModal}>
                <X size={20} />
              </button>
            </div>
            
            <form className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label htmlFor="editVeiculo">Veículo</label>
                <input
                  type="text"
                  id="editVeiculo"
                  name="veiculo"
                  value={veiculoEditando.veiculo}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="editMarca">Marca</label>
                <input
                  type="text"
                  id="editMarca"
                  name="marca"
                  value={veiculoEditando.marca}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="editPlaca">Placa</label>
                <input
                  type="text"
                  id="editPlaca"
                  name="placa"
                  value={veiculoEditando.placa}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="editAno">Ano</label>
                <input
                  type="text"
                  id="editAno"
                  name="ano"
                  value={veiculoEditando.ano}
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
              <p>Tem certeza que deseja excluir o veículo <strong>{veiculoSelecionado?.veiculo}</strong>?</p>
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

export default Cadastrar_Veiculo;