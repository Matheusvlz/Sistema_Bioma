// Ficheiro: src/view/administracao/RelatorioAnalise/components/BarraFerramentas.tsx

import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import Select from 'react-select';
import { FiGrid, FiList } from 'react-icons/fi';
import styles from '../RelatorioAnalise.module.css';
import {
  Filtros, DropdownOption, ApiResponse, ClienteDropdown, UsuarioDropdown, CidadeDropdown,
} from '../types';

interface Props {
  filtros: Filtros;
  onFiltroChange: (novosFiltros: Filtros) => void;
  viewMode: 'detalhado' | 'agregado';
  onViewModeChange: (modo: 'detalhado' | 'agregado') => void;
}

export const BarraFerramentas: React.FC<Props> = ({
  filtros, onFiltroChange, viewMode, onViewModeChange,
}) => {
  const [clientes, setClientes] = useState<DropdownOption[]>([]);
  const [coletores, setColetores] = useState<DropdownOption[]>([]);
  const [cidades, setCidades] = useState<DropdownOption[]>([]);

  useEffect(() => {
    const carregarDropdowns = async () => {
      try {
        const [resClientes, resColetores, resCidades] = await Promise.all([
          invoke<ApiResponse<ClienteDropdown[]>>('get_clientes_analise_command'),
          invoke<ApiResponse<UsuarioDropdown[]>>('get_coletores_analise_command'),
          invoke<ApiResponse<CidadeDropdown[]>>('get_cidades_analise_command'),
        ]);

        if (resClientes.success && resClientes.data) {
          // CORREÇÃO AQUI: Usando c.nome_fantasia (snake_case)
          setClientes(resClientes.data.map((c) => ({ value: c.id, label: c.nome_fantasia })));
        }
        if (resColetores.success && resColetores.data) {
          setColetores(resColetores.data.map((u) => ({ value: u.id, label: u.nome })));
        }
        if (resCidades.success && resCidades.data) {
          setCidades(resCidades.data.map((c) => ({ value: c.cidade, label: c.cidade })));
        }
      } catch (error) {
        console.error("Erro ao carregar dados dos filtros:", error);
      }
    };
    carregarDropdowns();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onFiltroChange({ ...filtros, [name]: value });
  };

  const handleSelectChange = (
    selectedOption: DropdownOption | null,
    actionMeta: { name?: string }
  ) => {
    if (actionMeta.name) {
      onFiltroChange({ ...filtros, [actionMeta.name]: selectedOption ? selectedOption.value : null });
    }
  };

  const limparFiltros = () => {
    const hoje = new Date().toISOString().split('T')[0];
    onFiltroChange({ clienteId: null, coletorId: null, cidade: null, dataInicial: hoje, dataFinal: hoje });
  };

  return (
    <div className={styles.toolbarContainer}>
      <div className={styles.toolbar}>
        <div className={`${styles.filtroItem} ${styles.filtroPeriodo}`}>
          <label>Período</label>
          <div className={styles.dateRangePicker}>
            <input type="date" name="dataInicial" value={filtros.dataInicial} onChange={handleInputChange} />
            <span>-</span>
            <input type="date" name="dataFinal" value={filtros.dataFinal} onChange={handleInputChange} />
          </div>
        </div>
        <div className={styles.filtroItem}>
          <label>Cliente</label>
          <Select name="clienteId" options={clientes} isClearable isSearchable placeholder="Digite ou selecione..." onChange={handleSelectChange} value={clientes.find(c => c.value === filtros.clienteId) || null} noOptionsMessage={() => 'Nenhum cliente encontrado'} />
        </div>
        <div className={styles.filtroItem}>
          <label>Coletor</label>
          <Select name="coletorId" options={coletores} isClearable isSearchable placeholder="Digite ou selecione..." onChange={handleSelectChange} value={coletores.find(c => c.value === filtros.coletorId) || null} noOptionsMessage={() => 'Nenhum coletor encontrado'} />
        </div>
        <div className={styles.filtroItem}>
          <label>Cidade</label>
          <Select name="cidade" options={cidades} isClearable isSearchable placeholder="Digite ou selecione..." onChange={handleSelectChange} value={cidades.find(c => c.value === filtros.cidade) || null} noOptionsMessage={() => 'Nenhuma cidade encontrada'} />
        </div>
        <div className={styles.toolbarActions}>
          <div className={styles.viewToggle}>
            <button onClick={() => onViewModeChange('detalhado')} className={viewMode === 'detalhado' ? styles.active : ''} title="Visualizar Detalhado"><FiList /></button>
            <button onClick={() => onViewModeChange('agregado')} className={viewMode === 'agregado' ? styles.active : ''} title="Visualizar Agrupado"><FiGrid /></button>
          </div>
          <button onClick={limparFiltros} className={styles.limparButton}>Limpar Tudo</button>
        </div>
      </div>
    </div>
  );
};