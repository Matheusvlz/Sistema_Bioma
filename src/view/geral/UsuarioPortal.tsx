import React, { useState, useCallback, useEffect } from 'react';
import { FaUser, FaUsers, FaBuilding, FaShieldAlt, FaPlus, FaCheck, FaTimes, FaTrash, FaUserCheck, FaPlay,
        FaFileAlt, FaEnvelope, FaToggleOn, FaToggleOff, FaFilePdf, FaHistory, FaBan  } from 'react-icons/fa';
import styles from './css/UsuarioPortal.module.css';
import { SearchLayout } from '../../components/SearchLayout';
import { core } from "@tauri-apps/api";
import { WindowManager } from '../../hooks/WindowManager';
import { listen } from '@tauri-apps/api/event';
import { Modal } from '../../components/Modal';
import { useModal } from "../../hooks/useModal";

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
    relatorio_email: boolean;
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

interface VerificarEmail {
    id: number;
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

interface VerificarEmailResponse {
    success: boolean;
    data?: VerificarEmail[];
    message?: string;
}

interface InvokeResponse {
    success: boolean;
    data?: any;
    message?: string;
}

export const UsuarioPortal: React.FC = () => {
    const { modal, showSuccess, showError, showWarning, showConfirm, closeModal } = useModal();
    const [guiaAtiva, setGuiaAtiva] = useState<'primeira' | 'segunda'>('primeira');

    // Estados para a primeira guia
    const [clienteSelecionadoPrimeira, setClienteSelecionadoPrimeira] = useState<Cliente | null>(null);
    const [usuariosCliente, setUsuariosCliente] = useState<UsuarioCliente[]>([]);
    const [usuarioSelecionadoPrimeira, setUsuarioSelecionadoPrimeira] = useState<UsuarioCliente | null>(null);
    const [setoresPortalPrimeira, setSetoresPortalPrimeira] = useState<SetorPortal[]>([]);
    const [loadingPrimeira, setLoadingPrimeira] = useState(false);
    const [emailVerificado, setEmailVerificado] = useState<VerificarEmail | null>(null);

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

    // Estados para a nova seção de cadastro
    const [nomeUsuario, setNomeUsuario] = useState('');
    const [emailUsuario, setEmailUsuario] = useState('');

    useEffect(() => {
        const setupSetorListener = async () => {
            try {
                // Verifica se há cliente selecionado em qualquer uma das guias
                const clienteAtivo = guiaAtiva === 'primeira' ? clienteSelecionadoPrimeira : clienteSelecionado;
                if (!clienteAtivo) return;

                const unlisten = await listen('setor-updated', async () => {
                    console.log('Evento setor-updated recebido, recarregando setores...');
                    try {
                        const clienteId = guiaAtiva === 'primeira' ? clienteSelecionadoPrimeira?.id : clienteSelecionado?.id;

                        if (!clienteId) return;

                        const setorResponse: SetorClienteResponse = await core.invoke('buscar_todos_setores_cliente', {
                            clienteId: clienteId,
                        });

                        if (setorResponse.success && setorResponse.data) {
                            setSetoresCliente(setorResponse.data);
                            console.log(`Setores atualizados para cliente ${clienteId} na guia ${guiaAtiva}`);
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
    }, [clienteSelecionado, clienteSelecionadoPrimeira, guiaAtiva]);
    
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
        if ((!usuarioSelecionado || !clienteSelecionado) || (!usuarioSelecionadoPrimeira || !clienteSelecionadoPrimeira)) return;

        const setor = setoresCliente.find(s => s.id === setorId);
        const novoStatus = !setor?.do_cliente;

        try {
            const response: InvokeResponse = await core.invoke('alterar_setor_cliente', {
                request: {
                    clienteId: guiaAtiva === 'primeira' ? clienteSelecionadoPrimeira.id : clienteSelecionado.id,
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

                guiaAtiva === 'primeira' ? handleSelecionarUsuario(usuarioSelecionadoPrimeira) : handleSelecionarCliente(clienteSelecionado);
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
                            {guiaAtiva === 'primeira' ? clienteSelecionadoPrimeira?.fantasia || clienteSelecionadoPrimeira?.razao : clienteSelecionado?.fantasia || clienteSelecionado?.razao}
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
        if (!clienteSelecionadoPrimeira) return;

        setUsuarioSelecionadoPrimeira(usuario);
        setLoadingPrimeira(true);

        try {
            const response: SetorResponse = await core.invoke('buscar_setores_portal', {
                usuarioId: usuario.id,
                clienteId: clienteSelecionadoPrimeira.id
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

    const handleNotificacaoCadastrada = async (usuarioId: number) => { 
        if (!clienteSelecionadoPrimeira) return;
        const usuario = usuariosCliente.find(u => u.id === usuarioId);
        if (!usuario) return;

        const novoStatus = !usuario.notif_cadastrada;

        const executar = async () => {
            try {
                const response: InvokeResponse = await core.invoke('configurar_usuarios', {
                    request: {
                        usuarioId: usuarioId,
                        status: novoStatus,
                        tipo: 'notif_cadastrada'
                    }
                });
                
                if (response.success) {
                    handleClienteSelectPrimeira(clienteSelecionadoPrimeira);
                    showSuccess(`Sucesso`, `Usuário ${usuario.notif_cadastrada ? 'não receberá' : 'receberá'} notificação cadastrada.`);
                }
            } catch (error) {
                showError(`Erro`, `Erro ao modificar usuário\n` + String(error));
            }
            //closeModal();
        };

        showConfirm(`Confirme modificação`, `Tem certeza que deseja modificar notificação cadastrada deste usuário?`, executar);
    };

    const handleNotificacaoIniciada = async (usuarioId: number) => {
        if (!clienteSelecionadoPrimeira) return;
        const usuario = usuariosCliente.find(u => u.id === usuarioId);
        if (!usuario) return;
        
        const novoStatus = !usuario.notif_iniciada;

        const executar = async () => {
            try {
                const response: InvokeResponse = await core.invoke('configurar_usuarios', {
                    request: {
                        usuarioId: usuarioId,
                        status: novoStatus,
                        tipo: 'notif_iniciada'
                    }
                });
                
                if (response.success) {
                    handleClienteSelectPrimeira(clienteSelecionadoPrimeira);
                    showSuccess(`Sucesso`, `Usuário ${usuario.notif_iniciada ? 'não receberá' : 'receberá'} notificação iniciada.`);
                }        
            } catch (error) {
                showError(`Erro`, `Erro ao modificar usuário\n` + String(error));
            }
            //closeModal();
        };

        showConfirm(`Confirme modificação`, `Tem certeza que deseja modificar notificação iniciada deste usuário?`, executar);
    };

    const handleNotificacaoRelatorio = async (usuarioId: number) => {
        if (!clienteSelecionadoPrimeira) return;
        const usuario = usuariosCliente.find(u => u.id === usuarioId);
        if (!usuario) return;

        const novoStatus = !usuario.notif_relatorio;

        const executar = async () => {
            try {
                const response: InvokeResponse = await core.invoke('configurar_usuarios', {
                    request: {
                        usuarioId: usuarioId,
                        status: novoStatus,
                        tipo: 'notif_relatorio'
                    }
                });
                
                if (response.success) {
                    handleClienteSelectPrimeira(clienteSelecionadoPrimeira);
                    showSuccess(`Sucesso`, `Usuário ${usuario.notif_relatorio ? 'não receberá' : 'receberá'} notificação relatório.`);
                }   
            } catch (error) {
                showError(`Erro`, `Erro ao modificar usuário\n` + String(error));
            }
            //closeModal()
        };

        showConfirm(`Confirme modificação`, `Tem certeza que deseja modificar notificação relatório deste usuário?`, executar);
    };

    const handleReenviarEmail = async (usuarioId: number) => {
        if (!clienteSelecionadoPrimeira) return;
        const usuario = usuariosCliente.find(u => u.id === usuarioId);
        if (!usuario) return;

        if(!usuario.ativo) { showWarning(`Aviso`, 'Este usuário está desativado.'); return; }
        if(usuario.ultimoacesso) { showWarning(`Aviso`, 'Este já acesssou o portal.\nSolicite o acesso ao \"Esqueci minha senha\"'); return; }

        const executar = async () => {
            try {
                const response: InvokeResponse = await core.invoke('reenviar_email_usuario', {
                    request: {
                        usuarioId: usuarioId,
                        email: usuario.usuario,
                        nome: usuario.nome
                    }
                });
                
                if (response.success) {
                    showSuccess(`Sucesso`, `Email enviado com sucesso ao usuário.`);
                } 
            } catch (error) {
                showError(`Erro`, `Erro ao enviar email ao usuário\n` + String(error));
            }
            //closeModal();
        };

        showConfirm(`Confirme modificação`, `Deseja reenviar email com os dados de acesso ao usuário?`, executar);
    };

    const handleRemoverCadastro = async (usuarioId: number) => {
        if (!clienteSelecionadoPrimeira) return;

        const executar = async () => {
            try {
                const response: InvokeResponse = await core.invoke('remover_cadastro_usuario', {
                    usuarioId: usuarioId,
                    clienteId: clienteSelecionadoPrimeira.id
                });

                if (response.success && clienteSelecionadoPrimeira) {
                    handleClienteSelectPrimeira(clienteSelecionadoPrimeira);
                    showSuccess(`Sucesso`, `Usuário removido com sucesso.`);
                }
            } catch (error) {
                showError(`Erro`, `Erro ao remover usuário\n` + String(error));
            }
            //closeModal()
        };

        showConfirm(`Confirme modificação`, `Tem certeza que deseja remover o usuário?`, executar);
    };

    const handleToggleAtivarDesativar = async (usuarioId: number) => {
        if (!clienteSelecionadoPrimeira) return;
        const usuario = usuariosCliente.find(u => u.id === usuarioId);
        if (!usuario) return;

        const novoStatus = !usuario.ativo;
        
        const executar = async () => {
            try {
                const response: InvokeResponse = await core.invoke('configurar_usuarios', {
                    request: {
                        usuarioId: usuarioId,
                        status: novoStatus,
                        tipo: 'ativar'
                    }
                });

                if (response.success && clienteSelecionadoPrimeira) {
                    handleClienteSelectPrimeira(clienteSelecionadoPrimeira);
                    showSuccess(`Sucesso`, `Usuário ${usuario.ativo ? 'desativado' : 'ativado'} com sucesso.`);

                }
            } catch (error) {
                showError(`Erro`, `Erro ao ${usuario.ativo ? 'desativar' : 'ativar'} usuário\n` + String(error));
            }
            //closeModal()
        };

        showConfirm(`Confirme ${usuario.ativo ? 'desativação' : 'ativação'}`, `Tem certeza que deseja ${usuario.ativo ? 'desativar' : 'ativar'} o usuário?`, executar);
    };

    const handleRelatorioEmail = async (usuarioId: number) => {
        if (!clienteSelecionadoPrimeira) return;
        const usuario = usuariosCliente.find(u => u.id === usuarioId);
        if (!usuario) return;

        const novoStatus = !usuario.relatorio_email;

        const executar = async () => {
            try {
                const response: InvokeResponse = await core.invoke('configurar_usuarios', {
                    request: {
                        usuarioId: usuarioId,
                        status: novoStatus,
                        tipo: 'relatorioEmail'
                    }
                });

                if (response.success && clienteSelecionadoPrimeira) {
                    handleClienteSelectPrimeira(clienteSelecionadoPrimeira);
                    showSuccess(`Sucesso`, `Usuário ${usuario.relatorio_email ? 'não receberá' : 'receberá'} relatórios por email.`);
                }
            } catch (error) {
                showError(`Erro`, `Erro ao modificar usuário\n` + String(error));
            }
            //closeModal();
        };

        showConfirm(`Confirme modificação`, `Tem certeza que deseja modificar relatório por email?`, executar);
    };

    const handleExcluirUsuario = async (usuarioId: number) => {
        if (!clienteSelecionadoPrimeira) return;

        const executar = async () => {
            try {
                const response: InvokeResponse = await core.invoke('excluir_usuario_cliente', {
                    usuarioId: usuarioId,
                });

                if (response.success) {
                    handleClienteSelectPrimeira(clienteSelecionadoPrimeira);
                    showSuccess(`Sucesso`, `Usuário excluído com sucesso.`);
                }
            } catch (error) {
                showError(`Erro`, `Erro ao excluir usuário\n` + String(error));
            }
            //closeModal();
        };

        showConfirm(`Confirme exclusão`, `Tem certeza que deseja excluir este usuário?`, executar);
    };

    const handleLimparCampos = () => {
        setNomeUsuario('');
        setEmailUsuario('');
    };

    const handleEnviarCadastro = async () => {
        if (!nomeUsuario.trim() || !emailUsuario.trim()) {
            showWarning('Campos obrigatórios', 'Por favor, preencha o nome e o e-mail.');
            return;
        }
        const email = usuariosCliente.find(u => u.usuario === emailUsuario);
        if (email) {
            showWarning('Usuário existente', 'Esse email já está cadastrado para o cliente selecionado.');
            return;
        }

        const executar = async () => {
            try {
                const emailResponse: VerificarEmailResponse = await core.invoke('verificar_email', {
                    request: {
                        email: emailUsuario
                    }
                });  
                
                if (emailResponse.success && emailResponse.data && emailResponse.data.length > 0) {
                    setEmailVerificado(emailResponse.data[0])
                    alert(JSON.stringify(emailResponse.data));
                    const executar = async () => {
                        if (!emailVerificado || !clienteSelecionadoPrimeira) return;

                        try {
                            const response: InvokeResponse = await core.invoke('cadastrar_usuario', {
                                request: {
                                    usuarioId: emailVerificado.id,
                                    clienteId: clienteSelecionadoPrimeira.id,
                                    nome: nomeUsuario,
                                    email: emailUsuario
                                }
                            });                
                            
                            if (response.success) {
                                if(clienteSelecionadoPrimeira) handleClienteSelectPrimeira(clienteSelecionadoPrimeira);
                                handleLimparCampos();
                                showSuccess('Sucesso', 'Usuário cadastrado com sucesso!');
                            }
                        } catch (error) {
                            showError('Erro', 'Erro ao cadastrar usuário: ' + String(error));
                        }
                        //closeModal();
                    };

                    showConfirm(`Confirme usuário`, `Esse email já está cadastrado para outro cliente.\nDeseja adicionar ${emailUsuario} para o cliente selecionado?`, executar);
                } else {
                    try {
                        const response: InvokeResponse = await core.invoke('cadastrar_usuario', {
                            request: {
                                clienteId: clienteSelecionadoPrimeira?.id,
                                nome: nomeUsuario,
                                email: emailUsuario
                            }
                        });                
                        
                        if (response.success) {
                            if(clienteSelecionadoPrimeira) handleClienteSelectPrimeira(clienteSelecionadoPrimeira);
                            handleLimparCampos();
                            showSuccess('Sucesso', 'Usuário cadastrado com sucesso!');
                        }
                    } catch (error) {
                        showError('Erro', 'Erro ao cadastrar usuário: ' + String(error));
                    }
                }
            } catch (error) {
                showError('Erro', 'Erro ao verificar email: ' + String(error));
                setUsuariosCliente([]);
            }
            //closeModal();
        };

        showConfirm(`Confirme cadastro`, `Deseja cadastrar o usuário?`, executar);
    };

    const handleAbrirHistorico = async (usuarioId: number) => {
        try {
            await WindowManager.openHistoricoUsuario(usuarioId);
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
                </div>

                <SearchLayout
                    fields={[]}
                    onSearch={() => { }}
                    onClear={() => { setClienteSelecionadoPrimeira(null); setUsuariosCliente([]); setUsuarioSelecionadoPrimeira(null); setSetoresPortalPrimeira([]);}}
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

            {/* Nova Seção de Cadastro de Usuário */}
            {clienteSelecionadoPrimeira && (
                <div className={styles["secao"]}>
                    <div className={styles["secao-header"]}>
                        <h3><FaUser /> Cadastrar Novo Usuário</h3>
                    </div>

                    <div className={styles["cadastro-usuario-form"]}>
                        <input
                            type="text"
                            placeholder="Nome do usuário"
                            value={nomeUsuario}
                            onChange={(e) => setNomeUsuario(e.target.value)}
                            className={styles["campo-nome"]}
                            autoComplete="off"
                        />

                        <input
                            type="email"
                            placeholder="E-mail do usuário"
                            value={emailUsuario}
                            onChange={(e) => setEmailUsuario(e.target.value)}
                            className={styles["campo-email"]}
                            autoComplete="off"
                        />

                        <button
                            type="button"
                            onClick={handleLimparCampos}
                            className={styles["btn-limpar"]}
                            title="Limpar campos"
                        >
                            <FaTimes />
                        </button>

                        <button
                            type="button"
                            onClick={handleEnviarCadastro}
                            className={styles["btn-enviar"]}
                            title="Enviar cadastro"
                        >
                            Enviar
                        </button>
                    </div>
                </div>
            )}

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
                                                        <span>Relatórios por email: <strong>{usuario.relatorio_email ? 'Sim' : 'Não'}</strong></span>
                                                    </div>
                                                    <div className={styles["detalhe-item"]}>
                                                        <span>Cadastrada: <strong>{usuario.notif_cadastrada ? 'Receber' : 'Não Receber'}</strong></span>
                                                    </div>
                                                    <div className={styles["detalhe-item"]}>
                                                        <span>Iniciada: <strong>{usuario.notif_iniciada ? 'Receber' : 'Não Receber'}</strong></span>
                                                    </div>
                                                    <div className={styles["detalhe-item"]}>
                                                        <span>Relatórios: <strong>{usuario.notif_relatorio ? 'Receber' : 'Não Receber'}</strong></span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={styles["usuario-acoes"]}>
                                                <button
                                                    className={`${styles["btn-acao"]} ${usuario.notif_cadastrada ? styles["btn-ativar"] : styles["btn-desativar"]}`}
                                                    onClick={(e) => {e.stopPropagation(); handleNotificacaoCadastrada(usuario.id);}}
                                                    title="Notificação Cadastrada"
                                                >
                                                    <FaUserCheck />
                                                </button>
                                                <button
                                                    className={`${styles["btn-acao"]} ${usuario.notif_iniciada ? styles["btn-ativar"] : styles["btn-desativar"]}`}
                                                    onClick={(e) => {e.stopPropagation(); handleNotificacaoIniciada(usuario.id);}}
                                                    title="Notificação Iniciada"
                                                >
                                                    <FaPlay />
                                                </button>
                                                <button
                                                    className={`${styles["btn-acao"]} ${usuario.notif_relatorio ? styles["btn-ativar"] : styles["btn-desativar"]}`}
                                                    onClick={(e) => {e.stopPropagation(); handleNotificacaoRelatorio(usuario.id);}}
                                                    title="Notificação Relatório"
                                                >
                                                    <FaFileAlt />
                                                </button>
                                                <button
                                                    className={styles["btn-acao"]}
                                                    onClick={(e) => {e.stopPropagation(); handleReenviarEmail(usuario.id);}}
                                                    title="Reenviar Email"
                                                >
                                                    <FaEnvelope />
                                                </button>
                                                <button
                                                    className={styles["btn-acao"]}
                                                    onClick={(e) => {e.stopPropagation(); handleRemoverCadastro(usuario.id);}}
                                                    title="Remover Cadastro"
                                                >
                                                    <FaBan />
                                                </button>
                                                <button
                                                    className={`${styles["btn-acao"]} ${usuario.ativo ? styles["btn-desativar"] : styles["btn-ativar"]}`}
                                                    onClick={(e) => {e.stopPropagation(); handleToggleAtivarDesativar(usuario.id);}}
                                                    title={usuario.ativo ? 'Desativar' : 'Ativar'}
                                                >
                                                    {usuario.ativo ? <FaToggleOff /> : <FaToggleOn />}
                                                </button>
                                                <button
                                                    className={`${styles["btn-acao"]} ${usuario.relatorio_email ? styles["btn-ativar"] : styles["btn-desativar"]}`}
                                                    onClick={(e) => {e.stopPropagation(); handleRelatorioEmail(usuario.id);}}
                                                    title="Relatório por Email"
                                                >
                                                    <FaFilePdf />
                                                </button>
                                                <button
                                                    className={styles["btn-acao"]}
                                                    onClick={(e) => {e.stopPropagation(); handleAbrirHistorico(usuario.id);}}
                                                    title="Histórico"
                                                >
                                                    <FaHistory />
                                                </button>
                                                <button
                                                    className={styles["btn-excluir-usuario"]}
                                                    onClick={(e) => {e.stopPropagation(); handleExcluirUsuario(usuario.id);}}
                                                    title="Excluir Usuário"
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

        const executar = async () => {
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

                    showSuccess(`Sucesso`, `Cliente removido com sucesso.`);
                }
            } catch (error) {
                showError(`Erro`, `Erro ao remover cliente\n` + String(error));
            }
            //closeModal();
        };

        showConfirm(`Confirme remoção`, `Tem certeza que deseja remover este cliente?`, executar);
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
                    onClear={() => { setUsuarioSelecionado(null); setClientesUsuario([]); setClienteSelecionado(null); setSetoresPortal([]); }}
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
            <Modal {...modal} onClose={closeModal} onConfirm={modal.onConfirm} />
        </div>
    );
};
