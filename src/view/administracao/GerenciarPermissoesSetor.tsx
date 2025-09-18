import React, { useState, useEffect, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import styles from './css/GerenciarPermissoesSetor.module.css';

// --- Interfaces de Tipagem ---

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface Setor {
  id: number;
  nome: string | null;
}

interface UsuarioSimplificado {
  id: number;
  nome: string | null;
}

export const GerenciarPermissoesSetor: React.FC = () => {
    // Estados para dados e controle
    const [loading, setLoading] = useState({ initial: true, sector: false });
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Estados para o CRUD de Setores
    const [allSectors, setAllSectors] = useState<Setor[]>([]);
    const [selectedSectorId, setSelectedSectorId] = useState<number | null>(null);
    const [sectorNameInput, setSectorNameInput] = useState('');

    // Estados para o seletor de usuários
    const [masterUserList, setMasterUserList] = useState<UsuarioSimplificado[]>([]);
    const [assignedUsers, setAssignedUsers] = useState<UsuarioSimplificado[]>([]);
    const [selectedAvailable, setSelectedAvailable] = useState<Set<number>>(new Set());
    const [selectedAssigned, setSelectedAssigned] = useState<Set<number>>(new Set());

    // Efeito para carregar dados iniciais (setores e todos os usuários)
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [sectorsRes, usersRes] = await Promise.all([
                    invoke<ApiResponse<Setor[]>>('listar_setores_command'),
                    invoke<ApiResponse<UsuarioAdmin[]>>('listar_usuarios_admin_command') // Reutilizando o command existente
                ]);

                if (sectorsRes.success && sectorsRes.data) setAllSectors(sectorsRes.data);
                if (usersRes.success && usersRes.data) {
                    // Mapeando para UsuarioSimplificado
                    const simplifiedUsers = usersRes.data.map(u => ({ id: u.id, nome: u.nome_completo }));
                    setMasterUserList(simplifiedUsers);
                }
            } catch (err: any) {
                setError(err.message || 'Falha ao carregar dados iniciais.');
            } finally {
                setLoading(prevState => ({ ...prevState, initial: false }));
            }
        };
        loadInitialData();
    }, []);

    // Efeito para carregar os usuários de um setor quando ele é selecionado
    useEffect(() => {
        if (selectedSectorId === null) {
            setAssignedUsers([]);
            setSectorNameInput('');
            return;
        }

        const sector = allSectors.find(s => s.id === selectedSectorId);
        if (sector) setSectorNameInput(sector.nome || '');

        const loadSectorUsers = async () => {
            setLoading(prevState => ({ ...prevState, sector: true }));
            try {
                const res = await invoke<ApiResponse<UsuarioSimplificado[]>>('listar_usuarios_por_setor_command', { setorId: selectedSectorId });
                if (res.success && res.data) setAssignedUsers(res.data);
            } catch (err: any) {
                setError(err.message || `Falha ao carregar usuários para o setor.`);
            } finally {
                setLoading(prevState => ({ ...prevState, sector: false }));
            }
        };
        loadSectorUsers();
    }, [selectedSectorId, allSectors]);

    // Lógica para o seletor de lista dupla
    const availableUsers = useMemo(() => {
        const assignedIds = new Set(assignedUsers.map(u => u.id));
        return masterUserList.filter(u => !assignedIds.has(u.id));
    }, [masterUserList, assignedUsers]);
    
    const handleToggleSelection = (list: 'available' | 'assigned', userId: number) => {
        const updater = list === 'available' ? setSelectedAvailable : setSelectedAssigned;
        updater(prev => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) newSet.delete(userId);
            else newSet.add(userId);
            return newSet;
        });
    };
    
    const moveUsers = (direction: 'add' | 'remove' | 'addAll' | 'removeAll') => {
        if (direction === 'addAll') {
            setAssignedUsers([...masterUserList]);
        } else if (direction === 'removeAll') {
            setAssignedUsers([]);
        } else if (direction === 'add') {
            const toAdd = availableUsers.filter(u => selectedAvailable.has(u.id));
            setAssignedUsers(prev => [...prev, ...toAdd].sort((a, b) => a.nome?.localeCompare(b.nome || '') || 0));
            setSelectedAvailable(new Set());
        } else if (direction === 'remove') {
            setAssignedUsers(prev => prev.filter(u => !selectedAssigned.has(u.id)));
            setSelectedAssigned(new Set());
        }
    };

    // Lógica para salvar as permissões
    const handleSaveChanges = async () => {
        if (selectedSectorId === null) {
            setError("Nenhum setor selecionado para salvar as permissões.");
            return;
        }
        setLoading(prevState => ({ ...prevState, sector: true }));
        try {
            const usuariosIds = assignedUsers.map(u => u.id);
            const res = await invoke<ApiResponse<null>>('atualizar_usuarios_do_setor_command', { setorId: selectedSectorId, usuariosIds });
            if (res.success) {
                setSuccessMessage(res.message || "Permissões salvas com sucesso!");
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                setError(res.message || "Falha ao salvar permissões.");
            }
        } catch (err: any) {
            setError(err.message || "Erro grave ao salvar permissões.");
        } finally {
            setLoading(prevState => ({ ...prevState, sector: false }));
        }
    };

    const handleCreateSector = async () => {
        if (!sectorNameInput.trim()) {
            setError("O nome do setor não pode estar vazio.");
            return;
        }
        try {
            const res = await invoke<ApiResponse<Setor>>('criar_setor_command', { nome: sectorNameInput });
            if (res.success && res.data) {
                setSuccessMessage(`Setor "${res.data.nome}" criado com sucesso!`);
                setTimeout(() => setSuccessMessage(null), 3000);
                // Atualiza a lista de setores e seleciona o novo
                setAllSectors(prev => [...prev, res.data!].sort((a,b) => a.nome?.localeCompare(b.nome || '') || 0));
                setSelectedSectorId(res.data.id);
            } else {
                setError(res.message || "Falha ao criar setor.");
            }
        } catch (err: any) {
            setError(err.message || "Erro grave ao criar setor.");
        }
    };

    if (loading.initial) {
        return <div>Carregando dados iniciais...</div>; // TODO: Criar um componente de loading melhor
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h2>Gerenciar Permissões por Setor</h2>
            </header>

            <main className={styles.main}>
                {error && <div className={styles.error} onClick={() => setError(null)}>{error}</div>}
                {successMessage && <div className={styles.success} onClick={() => setSuccessMessage(null)}>{successMessage}</div>}

                <div className={styles.sectorCrudContainer}>
                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="sector-select">Selecionar Setor</label>
                        <select
                            id="sector-select"
                            className={styles.select}
                            value={selectedSectorId ?? ''}
                            onChange={(e) => setSelectedSectorId(e.target.value ? Number(e.target.value) : null)}
                        >
                            <option value="">-- Selecione um setor para editar permissões --</option>
                            {allSectors.map(sector => (
                                <option key={sector.id} value={sector.id}>{sector.nome}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="sector-name">Nome do Setor</label>
                        <input
                            id="sector-name"
                            className={styles.input}
                            type="text"
                            value={sectorNameInput}
                            onChange={(e) => setSectorNameInput(e.target.value)}
                            placeholder="Digite para criar ou editar..."
                        />
                    </div>
                    <button onClick={handleCreateSector} className={`${styles.button} ${styles.buttonPrimary}`}>
                        {allSectors.some(s => s.id === selectedSectorId) ? 'Salvar Edição' : 'Criar Novo Setor'}
                    </button>
                    {/* Botão de Excluir pode ser adicionado aqui */}
                </div>

                <div className={styles.shuttleContainer}>
                    <div className={styles.listBox}>
                        <div className={styles.boxHeader}>Usuários Disponíveis</div>
                        <ul className={styles.userList}>
                            {availableUsers.map(user => (
                                <li
                                    key={user.id}
                                    className={`${styles.userItem} ${selectedAvailable.has(user.id) ? styles.userItemSelected : ''}`}
                                    onClick={() => handleToggleSelection('available', user.id)}
                                >
                                    {user.nome}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className={styles.shuttleActions}>
                        <button onClick={() => moveUsers('addAll')} className={styles.actionButton} title="Adicionar Todos">»</button>
                        <button onClick={() => moveUsers('add')} className={styles.actionButton} title="Adicionar Selecionados" disabled={selectedAvailable.size === 0}>›</button>
                        <button onClick={() => moveUsers('remove')} className={styles.actionButton} title="Remover Selecionados" disabled={selectedAssigned.size === 0}>‹</button>
                        <button onClick={() => moveUsers('removeAll')} className={styles.actionButton} title="Remover Todos">«</button>
                    </div>

                    <div className={styles.listBox}>
                        <div className={styles.boxHeader}>Usuários no Setor</div>
                        <ul className={styles.userList}>
                            {assignedUsers.map(user => (
                                <li
                                    key={user.id}
                                    className={`${styles.userItem} ${selectedAssigned.has(user.id) ? styles.userItemSelected : ''}`}
                                    onClick={() => handleToggleSelection('assigned', user.id)}
                                >
                                    {user.nome}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <button onClick={handleSaveChanges} className={`${styles.button} ${styles.buttonPrimary} ${styles.savePermissionsButton}`} disabled={selectedSectorId === null || loading.sector}>
                    {loading.sector ? 'Salvando...' : 'Salvar Permissões do Setor'}
                </button>
            </main>
        </div>
    );
};