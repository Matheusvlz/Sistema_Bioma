import React, { useState, useEffect } from 'react';
import { FaUser, FaUsers, FaBuilding, FaShieldAlt, FaPlus, FaCheck, FaTimes } from 'react-icons/fa';
import styles from './css/UsuarioPortal.module.css';
import { SearchLayout } from '../../components/SearchLayout';
import { core } from "@tauri-apps/api";

interface Usuario {
    id: number;
    nome: string;
    usuario: string;
}

interface Cliente {
    id: number;
    fantasia?: string;
    razao?: string;
    documento?: string;
    cidade?: string;
    uf?: string;
    categoria?: string;
    consultor?: string;
    telefone?: string;
    email?: string;
}

interface SetorPortal {
    id: number;
    nome: string;
    do_usuario: boolean;
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

interface PermissaoSetor {
    setorId: number;
    permitido: boolean;
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
    const [permissoesSetores, setPermissoesSetores] = useState<PermissaoSetor[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {

    }, []);

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
            //            setPermissoesSetores([]);

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
                usuarioId: usuarioSelecionado.id,
                clienteId: clienteSelecionado.id,
                setorId: setorId,
                permitido: novoStatus
            });

            if (response.success) {
                // Atualizar estado local
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
                // Recarregar lista de clientes do usuário
                handleUsuarioSelect(usuarioSelecionado);
            }
        } catch (error) {
            console.error('Erro ao adicionar cliente:', error);
        }
    };

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

    const formatDocument = (doc: string) => {
        if (!doc) return '';
        const numbers = doc.replace(/\D/g, '');
        if (numbers.length === 11) {
            return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (numbers.length === 14) {
            return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        }
        return doc;
    };

    const formatPhone = (phone: string) => {
        if (!phone) return '';
        const numbers = phone.replace(/\D/g, '');
        if (numbers.length === 11) {
            return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (numbers.length === 10) {
            return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        return phone;
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
                                                    <h4>{cliente.fantasia || cliente.razao || 'Nome não informado'}</h4>
                                                    {cliente.documento && (
                                                        <span className={styles["cliente-documento"]}>
                                                            {formatDocument(cliente.documento)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className={styles["cliente-detalhes"]}>
                                                {cliente.telefone && (
                                                    <div className={styles["detalhe-item"]}>
                                                        <span>📞 {formatPhone(cliente.telefone)}</span>
                                                    </div>
                                                )}
                                                {cliente.email && (
                                                    <div className={styles["detalhe-item"]}>
                                                        <span>✉️ {cliente.email}</span>
                                                    </div>
                                                )}
                                                {(cliente.cidade || cliente.uf) && (
                                                    <div className={styles["detalhe-item"]}>
                                                        <span>📍 {cliente.cidade && cliente.uf ? `${cliente.cidade}/${cliente.uf}` : cliente.cidade || cliente.uf}</span>
                                                    </div>
                                                )}
                                            </div>
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
                        <div className={styles["cliente-selecionado-info"]}>
                            <span>Cliente: <strong>{clienteSelecionado.fantasia || clienteSelecionado.razao}</strong></span>
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
                                const permitido = setor.do_usuario; // Usar diretamente o do_usuario

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
                        <FaUser /> Primeira Guia
                    </button>
                    <button
                        className={`${styles["guia-btn"]} ${guiaAtiva === 'segunda' ? styles["ativa"] : ''}`}
                        onClick={() => setGuiaAtiva('segunda')}
                    >
                        <FaUsers /> Gerenciar Usuários
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

