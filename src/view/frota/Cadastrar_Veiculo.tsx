import React, { useState, useEffect, useMemo } from 'react';
import styles from './css/cadastrar_motorista.module.css';
import { invoke } from "@tauri-apps/api/core";
import { Edit3, Trash2, Plus, X, Save, AlertTriangle, Search } from 'lucide-react';

interface Veiculo {
  id: number;
  nome: string; // Mudança: era 'veiculo' no frontend, mas é 'nome' no backend
  marca: number; // Mudança: agora é o ID da marca, não o nome
  placa: string;
  ano: string;
}

interface Marca {
  id: number;
  nome: string;
}

interface VeiculoDisplay extends Omit<Veiculo, 'marca'> {
  marcaNome: string; // Para exibição na tabela
}

const Cadastrar_Veiculo: React.FC = () => {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCadastroModalOpen, setIsCadastroModalOpen] = useState(false);
  const [isEdicaoModalOpen, setIsEdicaoModalOpen] = useState(false);
  const [isExclusaoModalOpen, setIsExclusaoModalOpen] = useState(false);
  const [veiculoSelecionado, setVeiculoSelecionado] = useState<VeiculoDisplay | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [novoVeiculo, setNovoVeiculo] = useState({
    nome: '',
    marca: 0,
    placa: '',
    ano: ''
  });
  
  const [veiculoEditando, setVeiculoEditando] = useState({
    id: 0,
    nome: '',
    marca: 0,
    placa: '',
    ano: ''
  });

  // Converter veículos para formato de exibição (com nome da marca)
  const veiculosDisplay = useMemo(() => {
    return veiculos.map(veiculo => {
      const marca = marcas.find(m => m.id === veiculo.marca);
      return {
        ...veiculo,
        marcaNome: marca?.nome || 'Marca não encontrada'
      };
    });
  }, [veiculos, marcas]);

  // Filtrar veículos baseado no termo de pesquisa
  const veiculosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) {
      return veiculosDisplay;
    }
    
    const termoBusca = searchTerm.toLowerCase().trim();
    return veiculosDisplay.filter(veiculo => 
      (veiculo.nome && veiculo.nome.toLowerCase().includes(termoBusca)) ||
      (veiculo.marcaNome && veiculo.marcaNome.toLowerCase().includes(termoBusca)) ||
      (veiculo.placa && veiculo.placa.toLowerCase().includes(termoBusca)) ||
      (veiculo.ano && veiculo.ano.toLowerCase().includes(termoBusca))
    );
  }, [veiculosDisplay, searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleExcluirClick = (veiculo: VeiculoDisplay) => {
    setVeiculoSelecionado(veiculo);
    setIsExclusaoModalOpen(true);
  };

  const confirmarExclusao = async () => {
    if (!veiculoSelecionado) return;

    setLoading(true);
    setError(null);

    try {
      await invoke('deletar_veiculo', { id: veiculoSelecionado.id });
      
      // Atualizar a lista local
      setVeiculos(veiculos.filter(v => v.id !== veiculoSelecionado.id));
      
      setIsExclusaoModalOpen(false);
      setVeiculoSelecionado(null);
    } catch (err) {
      setError(`Erro ao excluir veículo: ${err}`);
      console.error("Erro ao excluir veículo:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditarClick = (veiculo: VeiculoDisplay) => {
    const veiculoOriginal = veiculos.find(v => v.id === veiculo.id);
    if (veiculoOriginal) {
      setVeiculoEditando({ ...veiculoOriginal });
      setIsEdicaoModalOpen(true);
    }
  };

  const handleSalvarEdicao = async () => {
    setLoading(true);
    setError(null);

    try {
      const veiculoAtualizado = await invoke<Veiculo>('atualizar_veiculo', {
        id: veiculoEditando.id,
        nome: veiculoEditando.nome,
        marca: veiculoEditando.marca,
        placa: veiculoEditando.placa,
        ano: veiculoEditando.ano
      });

      // Atualizar a lista local
      setVeiculos(veiculos.map(v => 
        v.id === veiculoEditando.id ? veiculoAtualizado : v
      ));
      
      setIsEdicaoModalOpen(false);
      setVeiculoEditando({ id: 0, nome: '', marca: 0, placa: '', ano: '' });
    } catch (err) {
      setError(`Erro ao atualizar veículo: ${err}`);
      console.error("Erro ao atualizar veículo:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCadastrar = () => {
    setIsCadastroModalOpen(true);
  };

  const handleFecharModal = () => {
    setIsCadastroModalOpen(false);
    setIsEdicaoModalOpen(false);
    setIsExclusaoModalOpen(false);
    setNovoVeiculo({ nome: '', marca: 0, placa: '', ano: '' });
    setVeiculoSelecionado(null);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, isEdicao = false) => {
    const { name, value } = e.target;
    
    // Converter para número se for o campo marca
    const processedValue = name === 'marca' ? parseInt(value) || 0 : value;
    
    if (isEdicao) {
      setVeiculoEditando(prev => ({
        ...prev,
        [name]: processedValue
      }));
    } else {
      setNovoVeiculo(prev => ({
        ...prev,
        [name]: processedValue
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!novoVeiculo.nome || !novoVeiculo.marca || !novoVeiculo.placa || !novoVeiculo.ano) {
      setError('Todos os campos são obrigatórios');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const veiculoCriado = await invoke<Veiculo>('criar_veiculo', {
        nome: novoVeiculo.nome,
        marca: novoVeiculo.marca,
        ano: novoVeiculo.ano,
        placa: novoVeiculo.placa
      });

      // Atualizar a lista local
      setVeiculos([...veiculos, veiculoCriado]);
      
      handleFecharModal();
    } catch (err) {
      setError(`Erro ao cadastrar veículo: ${err}`);
      console.error("Erro ao cadastrar veículo:", err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      setError(null);

      try {
        // Carregar veículos e marcas em paralelo
        const [veiculosResult, marcasResult] = await Promise.all([
          invoke<Veiculo[]>('buscar_veiculos_e_marcas'),
          invoke<Marca[]>('buscar_marcas')
        ]);

        setVeiculos(veiculosResult);
        setMarcas(marcasResult);
      } catch (err) {
        setError(`Erro ao carregar dados: ${err}`);
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Veículos</h1>
        <button className={styles.primaryButton} onClick={handleCadastrar} disabled={loading}>
          <Plus size={20} />
          Cadastrar
        </button>
      </div>

      {/* Exibir erro se houver */}
      {error && (
        <div className={styles.errorMessage}>
          {error}
          <button onClick={() => setError(null)} className={styles.closeError}>
            <X size={16} />
          </button>
        </div>
      )}

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
            disabled={loading}
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
        {/* Indicador de scroll se necessário */}
       
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
            {loading ? (
              // Skeleton loading
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={`loading-${index}`} className={`${styles.tableRow} ${styles.tableLoadingSkeleton}`}>
                  <td className={styles.tableCell}>&nbsp;</td>
                  <td className={styles.tableCell}>&nbsp;</td>
                  <td className={styles.tableCell}>&nbsp;</td>
                  <td className={styles.tableCell}>&nbsp;</td>
                  <td className={styles.tableCell}>&nbsp;</td>
                </tr>
              ))
            ) : veiculosFiltrados.length === 0 ? (
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
                  <td className={styles.tableCell}>{veiculo.nome}</td>
                  <td className={styles.tableCell}>{veiculo.marcaNome}</td>
                  <td className={styles.tableCell}>{veiculo.placa}</td>
                  <td className={styles.tableCell}>{veiculo.ano}</td>
                  <td className={`${styles.tableCell} ${styles.actions}`}>
                    <button 
                      onClick={() => handleEditarClick(veiculo)}
                      className={styles.editButton}
                      disabled={loading}
                      title="Editar veículo"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => handleExcluirClick(veiculo)}
                      className={styles.dangerButton}
                      disabled={loading}
                      title="Excluir veículo"
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
              <button className={styles.closeButton} onClick={handleFecharModal} disabled={loading}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label htmlFor="nome">Veículo</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={novoVeiculo.nome}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="marca">Marca</label>
                <select
                  id="marca"
                  name="marca"
                  value={novoVeiculo.marca}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                >
                  <option value={0}>Selecione uma marca</option>
                  {marcas.map((marca) => (
                    <option key={marca.id} value={marca.id}>
                      {marca.nome}
                    </option>
                  ))}
                </select>
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
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>
              
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelButton} onClick={handleFecharModal} disabled={loading}>
                  Cancelar
                </button>
                <button type="submit" className={styles.saveButton} disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar'}
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
              <button className={styles.closeButton} onClick={handleFecharModal} disabled={loading}>
                <X size={20} />
              </button>
            </div>
            
            <form className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label htmlFor="editNome">Veículo</label>
                <input
                  type="text"
                  id="editNome"
                  name="nome"
                  value={veiculoEditando.nome}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="editMarca">Marca</label>
                <select
                  id="editMarca"
                  name="marca"
                  value={veiculoEditando.marca}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                  disabled={loading}
                >
                  <option value={0}>Selecione uma marca</option>
                  {marcas.map((marca) => (
                    <option key={marca.id} value={marca.id}>
                      {marca.nome}
                    </option>
                  ))}
                </select>
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
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>
              
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelButton} onClick={handleFecharModal} disabled={loading}>
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className={styles.saveButton}
                  onClick={handleSalvarEdicao}
                  disabled={loading}
                >
                  <Save size={18} />
                  {loading ? 'Salvando...' : 'Salvar'}
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
              <button className={styles.closeButton} onClick={handleFecharModal} disabled={loading}>
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.confirmationContent}>
              <AlertTriangle size={48} className={styles.warningIcon} />
              <p>Tem certeza que deseja excluir o veículo <strong>{veiculoSelecionado?.nome}</strong>?</p>
              <p>Esta ação não poderá ser desfeita.</p>
            </div>
            
            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelButton} onClick={handleFecharModal} disabled={loading}>
                Cancelar
              </button>
              <button 
                type="button" 
                className={styles.dangerButton}
                onClick={confirmarExclusao}
                disabled={loading}
              >
                <Trash2 size={18} />
                {loading ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cadastrar_Veiculo;