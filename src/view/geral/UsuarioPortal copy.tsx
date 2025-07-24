import React, { useState, useCallback, useEffect } from 'react';
import { FaUser, FaUsers, FaBuilding, FaShieldAlt, FaPlus, FaCheck, FaTimes, FaTrash } from 'react-icons/fa';
import styles from './css/UsuarioPortal.module.css';
import { SearchLayout } from '../../components/SearchLayout';
import { core } from "@tauri-apps/api";
import { WindowManager } from '../../hooks/WindowManager';
import { listen } from '@tauri-apps/api/event';

interface Usuario {
    id: number;
    nome: string;
    usuario: string;
}

interface Cliente {
    id: number;
    fantasia?: string;
    razao?: string;
}

interface SetorPortal {
    id: number;
    nome: string;
    do_usuario: boolean;
}

interface SetorCliente {
    id: number;
    nome: string;
    do_cliente: boolean;
}

interface UsuarioResponse {
    success: boolean;
    data?: Usuario[];
    message?: string;
}

interface ClienteResponse {
    success: boolean;
    data?: Cliente[];
    message?: string;
}

interface SetorResponse {
    success: boolean;
    data?: SetorPortal[];
    message?: string;
}

interface SetorClienteResponse {
    success: boolean;
    data?: SetorCliente[];
    message?: string;
}

interface InvokeResponse {
    success: boolean;
    data?: any;
    message?: string;
}

export const UsuarioPortal: React.FC = () => {
    const [guiaAtiva, setGuiaAtiva] = useState<'primeira' | 'segunda'>('primeira');

    // Estados para a segunda guia
    const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
    const [clientesUsuario, setClientesUsuario] = useState<Cliente[]>([]);
    const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
    const [setoresPortal, setSetoresPortal] = useState<SetorPortal[]>([]);
    const [loading, setLoading] = useState(false);

    // Estados para o modal de setores
    const [modalSetoresAberto, setModalSetoresAberto] = useState(false);
    const [setoresCliente, setSetoresCliente] = useState<SetorCliente[]>([]);
    const [loadingModal, setLoadingModal] = useState(false);

    useEffect(() => {
        const setupSetorListener = async () => {
            try {
                if (!clienteSelecionado) return;
                const unlisten = await listen('setor-updated', async () => {
                    console.log('Evento setor-updated recebido, recarregando setores...');
                    try {
                        const setorResponse: SetorClienteResponse = await core.invoke('buscar_todos_setores_cliente', {
                            clienteId: clienteSelecionado.id,
                        });
                        if (setorResponse.success && setorResponse.data) {
                            setSetoresCliente(setorResponse.data);
                        }
                    } catch (error) {
                        console.error('Erro ao recarregar setores:', error);
                    }
                });

                return unlisten;
            } catch (error) {
                console.error('Erro ao configurar listener de setores:', error);
            }
        };

        let setorUnlisten: (() => void) | undefined;
        setupSetorListener().then(unlisten => {
            setorUnlisten = unlisten;
        });

        return () => {
            if (setorUnlisten) {
                setorUnlisten();
            }
        };
    }, [clienteSelecionado]);

    async function buscarUsuariosDropdown(query: string): Promise<Usuario[]> {
        try {
            const response: UsuarioResponse = await core.invoke('buscar_usuarios_dropdown', {
                query: query.trim()
            });

            if (response.success && response.data) {
                return response.data;
            }
            return [];
        } catch (error) {
            console.error('Erro na busca de usuários:', error);
            return [];
        }
    }

    async function buscarClientesDropdown(query: string): Promise<Cliente[]> {
        try {
            const response: ClienteResponse = await core.invoke('buscar_clientes_dropdown', {
                query: query.trim()
            });

            if (response.success && response.data) {
                return response.data;
            }
            return [];
        } catch (error) {
            console.error('Erro na busca de clientes:', error);
            return [];
        }
    }

    const dropdownUsuariosConfig = {
        enabled: true,
        placeholder: "Buscar usuário por nome ou email...",
        type: 'usuario' as const,
        onSearch: buscarUsuariosDropdown,
        onSelect: (item: Cliente | Usuario) => {
            if ('nome' in item && 'usuario' in item) {
                handleUsuarioSelect(item as Usuario);
            }
        }
    };

    const dropdownClientesConfig = {
        enabled: true,
        type: 'cliente' as const,
        placeholder: "Buscar cliente para adicionar...",
        onSearch: buscarClientesDropdown,
        onSelect: (item: Cliente | Usuario) => {
            if ('fantasia' in item || 'razao' in item) {
                handleAdicionarCliente(item as Cliente);
            }
        }
    };

    const handleUsuarioSelect = async (usuario: Usuario) => {
        setUsuarioSelecionado(usuario);
        setLoading(true);

        try {
            const clientesResponse: ClienteResponse = await core.invoke('buscar_clientes_usuario', {
                usuarioId: usuario.id
            });

            if (clientesResponse.success && clientesResponse.data) {
                setClientesUsuario(clientesResponse.data);
            } else {
                setClientesUsuario([]);
            }

            setClienteSelecionado(null);
        } catch (error) {
            console.error('Erro ao buscar clientes do usuário:', error);
            setClientesUsuario([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelecionarCliente = async (cliente: Cliente) => {
        setClienteSelecionado(cliente);
        setLoading(true);

        try {
            const response: SetorResponse = await core.invoke('buscar_setores_portal', {
                usuarioId: usuarioSelecionado?.id,
                clienteId: cliente.id
            });

            if (response.success && response.data) {
                setSetoresPortal(response.data);
            }
        } catch (error) {
            console.error('Erro ao buscar setores:', error);
        } finally {
            setLoading(false);
        }
    };

    const togglePermissaoSetor = async (setorId: number) => {
        if (!usuarioSelecionado || !clienteSelecionado) return;

        const setor = setoresPortal.find(s => s.id === setorId);
        const novoStatus = !setor?.do_usuario;

        try {
            const response: InvokeResponse = await core.invoke('alterar_permissao_setor', {
                request: {
                    usuarioId: usuarioSelecionado.id,
                    setorId: setorId,
                    permitido: novoStatus
                }
            });

            if (response.success) {
                setSetoresPortal(prev =>
                    prev.map(s =>
                        s.id === setorId
                            ? { ...s, do_usuario: novoStatus }
                            : s
                    )
                );
            }
        } catch (error) {
            console.error('Erro ao alterar permissão:', error);
        }
    };

    const handleAdicionarCliente = async (cliente: Cliente) => {
        if (!usuarioSelecionado) return;

        try {
            const response: InvokeResponse = await core.invoke('adicionar_cliente_usuario', {
                usuarioId: usuarioSelecionado.id,
                clienteId: cliente.id
            });

            if (response.success) {
                handleUsuarioSelect(usuarioSelecionado);
            }
        } catch (error) {
            console.error('Erro ao adicionar cliente:', error);
        }
    };

    const handleRemoverCliente = async (cliente: Cliente) => {
        if (!usuarioSelecionado) return;

        try {
            const response: InvokeResponse = await core.invoke('remover_cliente_usuario', {
                usuarioId: usuarioSelecionado.id,
                clienteId: cliente.id
            });

            if (response.success) {
                handleUsuarioSelect(usuarioSelecionado);

                if (clienteSelecionado?.id === cliente.id) {
                    setClienteSelecionado(null);
                    setSetoresPortal([]);
                }
            }
        } catch (error) {
            console.error('Erro ao remover cliente:', error);
        }
    };

    const handleAbrirModalSetores = async () => {
        if (!clienteSelecionado) return;

        setModalSetoresAberto(true);
        setLoadingModal(true);

        try {
            const response: SetorClienteResponse = await core.invoke('buscar_todos_setores_cliente', {
                clienteId: clienteSelecionado.id,
            });

            if (response.success && response.data) {
                setSetoresCliente(response.data);
            }
        } catch (error) {
            console.error('Erro ao buscar setores do cliente:', error);
        } finally {
            setLoadingModal(false);
        }
    };

    const handleToggleSetorModal = async (setorId: number) => {
        if (!usuarioSelecionado || !clienteSelecionado) return;

        const setor = setoresCliente.find(s => s.id === setorId);
        const novoStatus = !setor?.do_cliente;

        try {
            const response: InvokeResponse = await core.invoke('alterar_setor_cliente', {
                request: {
                    clienteId: clienteSelecionado.id,
                    setorId: setorId,
                    permitido: novoStatus
                }
            });

            if (response.success) {
                setSetoresCliente(prev =>
                    prev.map(s =>
                        s.id === setorId
                            ? { ...s, do_cliente: novoStatus }
                            : s
                    )
                );

                handleSelecionarCliente(clienteSelecionado);
            }
        } catch (error) {
            console.error('Erro ao alterar setor do cliente:', error);
        }
    };

    const handleAbrirCadastroSetor = useCallback(async () => {
        try {
            await WindowManager.openGerenciarSetor();
        } catch (error) {
            console.error('Erro ao abrir janela de seto:', error);
        }
    }, []);

    const renderModalSetores = () => {
        if (!modalSetoresAberto) return null;

        return (
            <div className={styles["modal-overlay"]} onClick={() => setModalSetoresAberto(false)}>
                <div className={styles["modal-content"]} onClick={(e) => e.stopPropagation()}>
                    <div className={styles["modal-header"]}>
                        <h3>
                            {clienteSelecionado?.fantasia || clienteSelecionado?.razao}
                        </h3>
                        <div className={styles["setores-actions"]}>
                            <button
                                className={styles["btn-cadastrar-setor"]}
                                onClick={handleAbrirCadastroSetor}
                                title="Cadastrar novo setor"
                            >
                                <FaPlus />
                            </button>
                            <button
                                className={styles["modal-close"]}
                                onClick={() => setModalSetoresAberto(false)}
                            >
                                <FaTimes />
                            </button>
                        </div>
                    </div>

                    <div className={styles["modal-body"]}>
                        {loadingModal ? (
                            <div className={styles["loading-container"]}>
                                <div className={styles["loading-spinner"]}></div>
                                <span>Carregando setores...</span>
                            </div>
                        ) : (
                            <div className={styles["setores-modal-grid"]}>
                                {setoresCliente.map((setor) => (
                                    <div
                                        key={setor.id}
                                        className={`${styles["setor-modal-item"]} ${setor.do_cliente ? styles["ativo"] : styles["inativo"]}`}
                                        onClick={() => handleToggleSetorModal(setor.id)}
                                    >
                                        <div className={styles["setor-modal-info"]}>
                                            <h4>{setor.nome}</h4>
                                            <span className={styles["setor-modal-status"]}>
                                                {setor.do_cliente ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </div>
                                        <div className={styles["setor-modal-toggle"]}>
                                            {setor.do_cliente ? (
                                                <FaCheck className={styles["check-icon"]} />
                                            ) : (
                                                <FaTimes className={styles["times-icon"]} />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderPrimeiraGuia = () => (
        <div className={styles["guia-conteudo"]}>
            <div className={styles["primeira-guia-placeholder"]}>
                <div className={styles["placeholder-icon"]}>
                    <FaUser />
                </div>
                <h3>Primeira Guia</h3>
                <p>Esta guia será implementada conforme suas especificações.</p>
            </div>
        </div>
    );

    const renderSegundaGuia = () => (
        <div className={styles["guia-conteudo"]}>
            {/* Seção de Seleção de Usuário */}
            <div className={styles["secao"]}>
                <div className={styles["secao-header"]}>
                    <h3><FaUser /> Selecionar Usuário</h3>
                </div>

                <SearchLayout
                    fields={[]}
                    onSearch={() => { }}
                    onClear={() => { }}
                    dropdownSearch={dropdownUsuariosConfig}
                />

                {usuarioSelecionado && (
                    <div className={styles["usuario-selecionado"]}>
                        <div className={styles["usuario-card"]}>
                            <div className={styles["usuario-avatar"]}>
                                <FaUser />
                            </div>
                            <div className={styles["usuario-info"]}>
                                <h4>{usuarioSelecionado.nome}</h4>
                                <p>{usuarioSelecionado.usuario}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Seção de Clientes do Usuário */}
            {usuarioSelecionado && (
                <div className={styles["secao"]}>
                    <div className={styles["secao-header"]}>
                        <h3><FaBuilding /> Clientes do Usuário</h3>
                        <span className={styles["contador-clientes"]}>
                            {clientesUsuario.length} cliente{clientesUsuario.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {loading ? (
                        <div className={styles["loading-container"]}>
                            <div className={styles["loading-spinner"]}></div>
                            <span>Carregando clientes...</span>
                        </div>
                    ) : (
                        <>
                            {clientesUsuario.length > 0 ? (
                                <div className={styles["clientes-grid"]}>
                                    {clientesUsuario.map((cliente) => (
                                        <div
                                            key={cliente.id}
                                            className={`${styles["cliente-card"]} ${clienteSelecionado?.id === cliente.id ? styles["selecionado"] : ''}`}
                                            onClick={() => handleSelecionarCliente(cliente)}
                                        >
                                            <div className={styles["cliente-header"]}>
                                                <div className={styles["cliente-avatar"]}>
                                                    <FaBuilding />
                                                </div>
                                                <div className={styles["cliente-info"]}>
                                                    <h4>{cliente.fantasia || 'Fantasia não informado'}</h4>
                                                    <h6>{cliente.razao || 'Razão não informado'}</h6>
                                                </div>
                                            </div>
                                            <button
                                                className={styles["btn-remover-cliente"]}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoverCliente(cliente);
                                                }}
                                                title="Remover cliente"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles["empty-state"]}>
                                    <FaBuilding className={styles["empty-icon"]} />
                                    <h4>Nenhum cliente encontrado</h4>
                                    <p>Este usuário ainda não possui clientes associados.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Seção de Adicionar Cliente */}
            {usuarioSelecionado && (
                <div className={styles["secao"]}>
                    <div className={styles["secao-header"]}>
                        <h3><FaPlus /> Adicionar Cliente</h3>
                    </div>

                    <SearchLayout
                        fields={[]}
                        onSearch={() => { }}
                        onClear={() => { }}
                        dropdownSearch={dropdownClientesConfig}
                    />
                </div>
            )}

            {/* Seção de Permissões de Setores */}
            {clienteSelecionado && (
                <div className={styles["secao"]}>
                    <div className={styles["secao-header"]}>
                        <h3><FaShieldAlt /> Permissões de Setores</h3>
                        <div className={styles["setores-actions"]}>
                            <div className={styles["cliente-selecionado-info"]}>
                                <span>Cliente: <strong>{clienteSelecionado.fantasia || clienteSelecionado.razao}</strong></span>
                            </div>
                            <button
                                className={styles["btn-gerenciar-setores"]}
                                onClick={handleAbrirModalSetores}
                                title="Gerenciar setores"
                            >
                                <FaPlus />
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className={styles["loading-container"]}>
                            <div className={styles["loading-spinner"]}></div>
                            <span>Carregando permissões...</span>
                        </div>
                    ) : (
                        <div className={styles["setores-grid"]}>
                            {setoresPortal.map((setor) => {
                                const permitido = setor.do_usuario;

                                return (
                                    <div
                                        key={setor.id}
                                        className={`${styles["setor-card"]} ${permitido ? styles["permitido"] : styles["negado"]}`}
                                    >
                                        <div className={styles["setor-info"]}>
                                            <h4>{setor.nome}</h4>
                                            <span className={styles["setor-status"]}>
                                                {permitido ? 'Permitido' : 'Negado'}
                                            </span>
                                        </div>

                                        <div className={styles["setor-acoes"]}>
                                            <button
                                                className={`${styles["btn-permissao"]} ${permitido ? styles["btn-negar"] : styles["btn-permitir"]}`}
                                                onClick={() => togglePermissaoSetor(setor.id)}
                                            >
                                                {permitido ? (
                                                    <>
                                                        <FaTimes /> Negar
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaCheck /> Permitir
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                        </div>
                    )}
                </div>
            )}

            {/* Modais */}
            {renderModalSetores()}
        </div>
    );

    return (
        <div className={styles["cadastrar-usuario-container"]}>
            <div className={styles["page-header"]}>
                <h1 className={styles["page-title"]}>Cadastro de Usuário</h1>
            </div>

            <div className={styles["guias-container"]}>
                <div className={styles["guias-header"]}>
                    <button
                        className={`${styles["guia-btn"]} ${guiaAtiva === 'primeira' ? styles["ativa"] : ''}`}
                        onClick={() => setGuiaAtiva('primeira')}
                    >
                        <FaUser /> Usuários por Empresa
                    </button>
                    <button
                        className={`${styles["guia-btn"]} ${guiaAtiva === 'segunda' ? styles["ativa"] : ''}`}
                        onClick={() => setGuiaAtiva('segunda')}
                    >
                        <FaUsers /> Empresas por Usuário
                    </button>
                </div>

                <div className={styles["guia-conteudo-wrapper"]}>
                    {guiaAtiva === 'primeira' && renderPrimeiraGuia()}
                    {guiaAtiva === 'segunda' && renderSegundaGuia()}
                </div>
            </div>
        </div>
    );
};
