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

interface UsuarioCliente {
    id: number;
    nome: string;
    usuario: string;
    ultimoacesso: string;
    ativo: boolean;
    relatorios_email: boolean;
    notif_cadastrada: boolean;
    notif_iniciada: boolean;
    notif_relatorio: boolean;
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

interface UsuarioClienteResponse {
    success: boolean;
    data?: UsuarioCliente[];
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

    // Estados para a primeira guia
    const [clienteSelecionadoPrimeira, setClienteSelecionadoPrimeira] = useState<Cliente | null>(null);
    const [usuariosCliente, setUsuariosCliente] = useState<UsuarioCliente[]>([]);
    const [usuarioSelecionadoPrimeira, setUsuarioSelecionadoPrimeira] = useState<UsuarioCliente | null>(null);
    const [setoresPortalPrimeira, setSetoresPortalPrimeira] = useState<SetorPortal[]>([]);
    const [loadingPrimeira, setLoadingPrimeira] = useState(false);

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

    const dropdownClientesPrimeiraConfig = {
        enabled: true,
        placeholder: "Buscar cliente por nome ou razão...",
        type: 'cliente' as const,
        onSearch: buscarClientesDropdown,
        onSelect: (item: Cliente | Usuario) => {
            if ('fantasia' in item || 'razao' in item) {
                handleClienteSelectPrimeira(item as Cliente);
            }
        }
    };

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

    const handleToggleSetorModal = async (setorId: number) => {
        if (!usuarioSelecionado || !clienteSelecionado) return;

        const setor = setoresCliente.find(s => s.id === setorId);
        const novoStatus = !setor?.do_cliente;

        try {
            const response: InvokeResponse = await core.invoke('alterar_setor_cliente', {
                request: {
                    clienteId: guiaAtiva === 'primeira' ? clienteSelecionadoPrimeira?.id : clienteSelecionado.id,
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

    //PRIMEIRA GUIA ***********************************************************

    const handleClienteSelectPrimeira = async (cliente: Cliente) => {
        setClienteSelecionadoPrimeira(cliente);
        setLoadingPrimeira(true);

        try {
            const usuariosResponse: UsuarioClienteResponse = await core.invoke('buscar_usuarios_cliente', {
                clienteId: cliente.id
            });

            if (usuariosResponse.success && usuariosResponse.data) {
                setUsuariosCliente(usuariosResponse.data);
                alert('Resposta stringify: ' + JSON.stringify(usuariosResponse));
            } else {
                setUsuariosCliente([]);
            }
        } catch (error) {
            console.error('Erro ao buscar usuários do cliente:', error);
            setUsuariosCliente([]);
        } finally {
            setLoadingPrimeira(false);
        }
    };
    
    const handleSelecionarUsuario = async (usuario: UsuarioCliente) => {
        setUsuarioSelecionadoPrimeira(usuario);
        setLoadingPrimeira(true);

        try {
            const response: SetorResponse = await core.invoke('buscar_setores_portal', {
                usuarioId: usuario.id,
                clienteId: clienteSelecionadoPrimeira?.id
            });

            if (response.success && response.data) {
                setSetoresPortalPrimeira(response.data);
            }
        } catch (error) {
            console.error('Erro ao buscar setores:', error);
        } finally {
            setLoadingPrimeira(false);
        }
    };

    const togglePermissaoSetorPrimeira = async (setorId: number) => {
        if (!clienteSelecionadoPrimeira) return;

        const setor = setoresPortalPrimeira.find(s => s.id === setorId);
        const novoStatus = !setor?.do_usuario;

        try {
            const response: InvokeResponse = await core.invoke('alterar_permissao_setor', {
                request: {
                    usuarioId: usuarioSelecionadoPrimeira?.id,
                    setorId: setorId,
                    permitido: novoStatus
                }
            });

            if (response.success) {
                setSetoresPortalPrimeira(prev =>
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

    const handleAbrirSetoresPrimeira = async () => {
        if (!clienteSelecionadoPrimeira) return;

        setModalSetoresAberto(true);
        setLoadingModal(true);

        try {
            const response: SetorClienteResponse = await core.invoke('buscar_todos_setores_cliente', {
                clienteId: clienteSelecionadoPrimeira.id,
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

    const handleAbrirAmostras = async () => {
        if (!clienteSelecionadoPrimeira) return;

        try {
            // TODO: Implementar abertura de amostras
            console.log('Abrir amostras para cliente:', clienteSelecionadoPrimeira.id);
        } catch (error) {
            console.error('Erro ao abrir amostras:', error);
        }
    };

    const handleExcluirUsuario = async (usuarioId: number) => {
        if (!clienteSelecionadoPrimeira) return;

        try {
            const response: InvokeResponse = await core.invoke('excluir_usuario_cliente', {
                usuarioId: usuarioId,
                clienteId: clienteSelecionadoPrimeira.id
            });

            if (response.success) {
                handleClienteSelectPrimeira(clienteSelecionadoPrimeira);
            }
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
        }
    };

    const handleNotificacaoCadastrada = async (usuarioId: number) => {
        try {
            const response: InvokeResponse = await core.invoke('enviar_notificacao_cadastrada', {
                usuarioId: usuarioId
            });
            console.log('Notificação cadastrada enviada:', response);
        } catch (error) {
            console.error('Erro ao enviar notificação cadastrada:', error);
        }
    };

    const handleNotificacaoIniciada = async (usuarioId: number) => {
        try {
            const response: InvokeResponse = await core.invoke('enviar_notificacao_iniciada', {
                usuarioId: usuarioId
            });
            console.log('Notificação iniciada enviada:', response);
        } catch (error) {
            console.error('Erro ao enviar notificação iniciada:', error);
        }
    };

    const handleNotificacaoRelatorio = async (usuarioId: number) => {
        try {
            const response: InvokeResponse = await core.invoke('enviar_notificacao_relatorio', {
                usuarioId: usuarioId
            });
            console.log('Notificação relatório enviada:', response);
        } catch (error) {
            console.error('Erro ao enviar notificação relatório:', error);
        }
    };

    const handleReenviarEmail = async (usuarioId: number) => {
        try {
            const response: InvokeResponse = await core.invoke('reenviar_email_usuario', {
                usuarioId: usuarioId
            });
            console.log('Email reenviado:', response);
        } catch (error) {
            console.error('Erro ao reenviar email:', error);
        }
    };

    const handleRemoverCadastro = async (usuarioId: number) => {
        try {
            const response: InvokeResponse = await core.invoke('remover_cadastro_usuario', {
                usuarioId: usuarioId
            });

            if (response.success && clienteSelecionadoPrimeira) {
                handleClienteSelectPrimeira(clienteSelecionadoPrimeira);
            }
        } catch (error) {
            console.error('Erro ao remover cadastro:', error);
        }
    };

    const handleToggleAtivarDesativar = async (usuarioId: number, ativar: boolean) => {
        try {
            const response: InvokeResponse = await core.invoke('toggle_ativar_usuario', {
                usuarioId: usuarioId,
                ativar: ativar
            });

            if (response.success && clienteSelecionadoPrimeira) {
                handleClienteSelectPrimeira(clienteSelecionadoPrimeira);
            }
        } catch (error) {
            console.error('Erro ao ativar/desativar usuário:', error);
        }
    };

    const handleRelatorioEmail = async (usuarioId: number) => {
        try {
            const response: InvokeResponse = await core.invoke('enviar_relatorio_email', {
                usuarioId: usuarioId
            });
            console.log('Relatório por email enviado:', response);
        } catch (error) {
            console.error('Erro ao enviar relatório por email:', error);
        }
    };

    const handleAbrirHistorico = async (usuarioId: number) => {
        try {
            // TODO: Implementar abertura do histórico
            console.log('Abrir histórico para usuário:', usuarioId);
        } catch (error) {
            console.error('Erro ao abrir histórico:', error);
        }
    };

    const renderPrimeiraGuia = () => (
        <div className={styles["guia-conteudo"]}>
            {/* Seção de Seleção de Cliente */}
            <div className={styles["secao"]}>
                <div className={styles["secao-header"]}>
                    <h3><FaBuilding /> Selecionar Cliente</h3>
                    {clienteSelecionadoPrimeira && (
                        <button
                            className={styles["btn-amostras"]}
                            onClick={handleAbrirAmostras}
                            title="Abrir amostras"
                        >
                            <FaPlus /> Amostras
                        </button>
                    )}
                </div>

                <SearchLayout
                    fields={[]}
                    onSearch={() => { }}
                    onClear={() => { }}
                    dropdownSearch={dropdownClientesPrimeiraConfig}
                />

                {clienteSelecionadoPrimeira && (
                    <div className={styles["cliente-selecionado-primeira"]}>
                        <div className={styles["cliente-card-primeira"]}>
                            <div className={styles["cliente-avatar"]}>
                                <FaBuilding />
                            </div>
                            <div className={styles["cliente-info"]}>
                                <h4>{clienteSelecionadoPrimeira.fantasia || 'Fantasia não informado'}</h4>
                                <p>{clienteSelecionadoPrimeira.razao || 'Razão não informado'}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Seção de Usuários do Cliente */}
            {clienteSelecionadoPrimeira && (
                <div className={styles["secao"]}>
                    <div className={styles["secao-header"]}>
                        <h3><FaUsers /> Usuários do Cliente</h3>
                        <span className={styles["contador-usuarios"]}>
                            {usuariosCliente.length} usuário{usuariosCliente.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {loadingPrimeira ? (
                        <div className={styles["loading-container"]}>
                            <div className={styles["loading-spinner"]}></div>
                            <span>Carregando usuários...</span>
                        </div>
                    ) : (
                        <>
                            {usuariosCliente.length > 0 ? (
                                <div className={styles["usuarios-lista"]}>
                                    {usuariosCliente.map((usuario) => (
                                        <div
                                            key={usuario.id}
                                            className={`${styles["usuario-cliente-card"]} ${usuario.ativo ? styles["ativo"] : styles["inativo"]}`}
                                            onClick={() => handleSelecionarUsuario(usuario)}
                                        >
                                            <div className={styles["usuario-cliente-info"]}>
                                                <div className={styles["usuario-cliente-principal"]}>
                                                    <div className={styles["usuario-avatar-pequeno"]}>
                                                        <FaUser />
                                                    </div>
                                                    <div className={styles["usuario-dados"]}>
                                                        <h4>{usuario.nome}</h4>
                                                        <p>{usuario.usuario}</p>
                                                        <span className={styles["ultimo-acesso"]}>
                                                            Último acesso: {usuario.ultimoacesso || 'Nunca'}
                                                        </span>
                                                    </div>
                                                    <div className={styles["usuario-status"]}>
                                                        <span className={`${styles["status-badge"]} ${usuario.ativo ? styles["ativo"] : styles["inativo"]}`}>
                                                            {usuario.ativo}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className={styles["usuario-cliente-detalhes"]}>
                                                    <div className={styles["detalhe-item"]}>
                                                        <span>Relatórios por email: <strong>{usuario.relatorios_email ? 'Sim' : 'Não'}</strong></span>
                                                    </div>
                                                    <div className={styles["detalhe-item"]}>
                                                        <span>Cadastrada: <strong>{usuario.notif_cadastrada ? 'Receebr' : 'Não Receber'}</strong></span>
                                                    </div>
                                                    <div className={styles["detalhe-item"]}>
                                                        <span>Iniciada: <strong>{usuario.notif_iniciada ? 'Receber' : 'Não Receber'}</strong></span>
                                                    </div>
                                                    <div className={styles["detalhe-item"]}>
                                                        <span>Relatórios: <strong>{usuario.notif_relatorio ? 'Receber' : 'Não Receber' }</strong></span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={styles["usuario-acoes"]}>
                                                <button
                                                    className={styles["btn-acao"]}
                                                    onClick={() => handleNotificacaoCadastrada(usuario.id)}
                                                    title="Notificação cadastrada"
                                                >
                                                    <FaUser />
                                                </button>
                                                <button
                                                    className={styles["btn-acao"]}
                                                    onClick={() => handleNotificacaoIniciada(usuario.id)}
                                                    title="Notificação iniciada"
                                                >
                                                    <FaPlus />
                                                </button>
                                                <button
                                                    className={styles["btn-acao"]}
                                                    onClick={() => handleNotificacaoRelatorio(usuario.id)}
                                                    title="Notificação relatório"
                                                >
                                                    <FaShieldAlt />
                                                </button>
                                                <button
                                                    className={styles["btn-acao"]}
                                                    onClick={() => handleReenviarEmail(usuario.id)}
                                                    title="Reenviar email"
                                                >
                                                    <FaUser />
                                                </button>
                                                <button
                                                    className={styles["btn-acao"]}
                                                    onClick={() => handleRemoverCadastro(usuario.id)}
                                                    title="Remover cadastro"
                                                >
                                                    <FaTimes />
                                                </button>
                                                <button
                                                    className={`${styles["btn-acao"]} ${usuario.ativo ? styles["btn-desativar"] : styles["btn-ativar"]}`}
                                                    onClick={() => handleToggleAtivarDesativar(usuario.id, !usuario.ativo)}
                                                    title={usuario.ativo ? 'Desativar' : 'Ativar'}
                                                >
                                                    {usuario.ativo ? <FaTimes /> : <FaCheck />}
                                                </button>
                                                <button
                                                    className={styles["btn-acao"]}
                                                    onClick={() => handleRelatorioEmail(usuario.id)}
                                                    title="Relatório por email"
                                                >
                                                    <FaUser />
                                                </button>
                                                <button
                                                    className={styles["btn-acao"]}
                                                    onClick={() => handleAbrirHistorico(usuario.id)}
                                                    title="Histórico"
                                                >
                                                    <FaShieldAlt />
                                                </button>
                                                <button
                                                    className={styles["btn-excluir-usuario"]}
                                                    onClick={() => handleExcluirUsuario(usuario.id)}
                                                    title="Excluir usuário"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles["empty-state"]}>
                                    <FaUsers className={styles["empty-icon"]} />
                                    <h4>Nenhum usuário encontrado</h4>
                                    <p>Este cliente ainda não possui usuários cadastrados.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Seção de Setores */}
            {clienteSelecionadoPrimeira && (
                <div className={styles["secao"]}>
                    <div className={styles["secao-header"]}>
                        <h3><FaShieldAlt /> Setores</h3>
                        <div className={styles["setores-actions"]}>
                            <div className={styles["cliente-selecionado-info"]}>
                                <span>Cliente: <strong>{clienteSelecionadoPrimeira.fantasia || clienteSelecionadoPrimeira.razao}</strong></span>
                            </div>
                            <button
                                className={styles["btn-gerenciar-setores"]}
                                onClick={handleAbrirSetoresPrimeira}
                                title="Carregar setores"
                            >
                                <FaPlus />
                            </button>
                        </div>
                    </div>

                    {setoresPortalPrimeira.length > 0 && (
                        <div className={styles["setores-grid"]}>
                            {setoresPortalPrimeira.map((setor) => {
                                const permitido = setor.do_usuario;

                                return (
                                    <div
                                        key={setor.id}
                                        className={`${styles["setor-card"]} ${permitido ? styles["permitido"] : styles["negado"]}`}
                                    >
                                        <div className={styles["setor-info"]}>
                                            <h4>{setor.nome}</h4>
                                            <span className={styles["setor-status"]}>
                                                {permitido ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </div>

                                        <div className={styles["setor-acoes"]}>
                                            <button
                                                className={`${styles["btn-permissao"]} ${permitido ? styles["btn-negar"] : styles["btn-permitir"]}`}
                                                onClick={() => togglePermissaoSetorPrimeira(setor.id)}
                                            >
                                                {permitido ? (
                                                    <>
                                                        <FaTimes /> Desativar
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaCheck /> Ativar
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
            {renderModalSetores()}
        </div>
    );

    //SEGUNDA GUIA ***********************************************************

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

