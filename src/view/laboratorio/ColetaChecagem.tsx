import React, { useState, useEffect } from 'react';
import { Loader2, Search, CheckCircle2, XCircle, AlertCircle, Copy, Save } from 'lucide-react';
import { listen } from '@tauri-apps/api/event';
import { emit } from '@tauri-apps/api/event';

import styles from './styles/ColetaChecagem.module.css';
// ==================== INTERFACES ====================
interface ChecagemItem {
    id: number; // MANTIDO: 'number' no JS/TS é suficiente para u64
    descricao: string;
    valor: string | null;
    comentario: string | null;
}

interface ParametroResultado {
    id_resultado: number;
    id_parametro_pop: number;
    nome_parametro: string;
    grupo_parametro: string | null;
    tecnica_nome: string | null;
    unidade: string | null;
    limite: string | null;
    resultado: string | null;
    em_campo: number | null;
}

interface AmostraAnalise {
     id_amostra: number; // MANTIDO: 'number' no JS/TS é suficiente para u64
    numero_amostra: number;
    id_analise: number;
    hora_coleta_analise: string | null;
    coletada: number | null;
    ncoletada_motivo: string | null;
    checagens: ChecagemItem[];
    parametros: ParametroResultado[];
}

interface Usuario {
  success: boolean;
  id: number;
  nome: string;
  privilegio: string;
  empresa?: string;
  ativo: boolean;
  nome_completo: string;
  cargo: string;
  numero_doc: string;
  profile_photo?: string; 
  dark_mode: boolean;
}


interface GrupoChecagem {
    id_grupo: number; // MANTIDO: 'number' no JS/TS é suficiente para u64
    amostra_min: number;
    amostra_max: number;
    data_coleta: string | null;
    hora_coleta: string | null;
    hora_coleta_ini: string | null;
    hora_coleta_ter: string | null;
    data_lab: string | null;
    hora_lab: string | null;
    data_checagem: string | null;
    usuario_checagem: string | null;
    versao: string | null;
    numero_versao: string | null;
    form_numero: number;
    form_revisao: number;
    amostras_analises: AmostraAnalise[];

}
interface ChecagemData {
  id_grupo_edit?: number;
  numero_ini?: number;
  numero_fim?: number;
}

// ==================== COMPONENTE PRINCIPAL ====================
const ColetaChecagem = () => {
    const [numeroIni, setNumeroIni] = useState('');
    const [numeroFim, setNumeroFim] = useState('');
    const [gruposChecagem, setGruposChecagem] = useState<GrupoChecagem[]>([]);
    const [activeGrupoTab, setActiveGrupoTab] = useState(0);
    const [activeAmostraTab, setActiveAmostraTab] = useState<{[key: number]: number}>({});
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [mesmaHoraColeta, setMesmaHoraColeta] = useState<{[key: number]: boolean}>({});
    const [idUsuarioLogado] = useState(1); // TODO: Obter do contexto de autenticação
    
    const ParsedDescription = ({ text }: { text: string }) => {
    // Remove as tags <html> e </html> que podem vir do banco
    const cleanedText = text.replace(/<\/?html>/g, '');
    
    // Separa o texto principal de possíveis sub-perguntas
    const mainParts = cleanedText.split('<br>');

    return (
        <div>
            {mainParts.map((part, index) => (
                <span key={index} className={styles.checkItemDescriptionPart}>
                    {part}
                </span>
            ))}
        </div>
    );
};
    // Listener para modo de edição (abertura da janela com ID específico)

  
    // Busca por faixa de números
    const handleBuscar = async () => {
        const ini = parseInt(numeroIni);
        const fim = parseInt(numeroFim);

        if (!numeroIni || !numeroFim || isNaN(ini) || isNaN(fim)) {
            setMessage('Preencha os números de amostra corretamente');
            setStatus('error');
            return;
        }

        if (fim - ini > 100) {
            setMessage('Informe um intervalo de até 100 amostras');
            setStatus('error');
            return;
        }

        await buscarDados({ numero_ini: ini, numero_fim: fim, id_grupo_edit: null });
    };

const handleBuscar2 = async (iniStr?: string, fimStr?: string) => { 
    // Use the passed values, or fall back to state if not provided (e.g., when called by a button)
    const currentIniStr = iniStr ?? numeroIni; 
    const currentFimStr = fimStr ?? numeroFim;

    const ini = parseInt(currentIniStr);
    const fim = parseInt(currentFimStr);

    if (!currentIniStr || !currentFimStr || isNaN(ini) || isNaN(fim)) {
        setMessage('Preencha os números de amostra corretamente');
        setStatus('error');
        return;
    }

    if (fim - ini > 100) {
        setMessage('Informe um intervalo de até 100 amostras');
        setStatus('error');
        return;
    }

    await buscarDados({ numero_ini: ini, numero_fim: fim, id_grupo_edit: null });
};

      const handleSalvarUm = async () => {
        
        // 1. Verifica se há um grupo ativo.
        if (!currentGrupo || !currentGrupo.id_grupo) {
            setMessage('Selecione um grupo de checagem válido para salvar.');
            setStatus('error');
            return;
        }

        

        if (currentGrupo.usuario_checagem) {
            if (!confirm('Este grupo já foi verificado. Deseja salvá-lo novamente (irá reescrever a checagem)?')) return;
        } else {
            if (!confirm('Deseja verificar e salvar as checagens deste grupo?')) return;
        }

        setStatus('loading');
        setMessage('Salvando dados...');
        
        try {
            // @ts-ignore - Tauri API
            const { invoke } = await import('@tauri-apps/api/core');
            const updatedUser: Usuario | null = await invoke('usuario_logado');
            // 2. Prepara o payload APENAS com o grupo ativo
            const payload = {
                // O grupo ativo é envolvido por um array para satisfazer a DTO do backend (Vec<GrupoChecagem>)
                grupos: [currentGrupo], 
                id_usuario_verificacao: updatedUser?.id, 
            };
            
            // 3. Chama o comando Tauri para salvar
            const result: string = await invoke('salvar_checagens_client', { payload });
            
            // 4. Sucesso
            setStatus('success');
            setMessage(result);
            alert('Checagem realizada com sucesso!');
            
            // 5. Recarrega APENAS o grupo atual para refletir o status de checado.
            // O handleBuscarPorId chama buscarDados, que re-busca e sobrescreve o estado
            // com o grupo recém-salvo, garantindo que a informação de verificação seja a do servidor.
            await handleBuscarPorId(currentGrupo.id_grupo);

        } catch (error) {
            console.error('Erro ao salvar checagens:', error);
            // O backend retorna a mensagem de erro formatada
            setMessage(`Erro ao salvar dados: ${error}`);
            setStatus('error');
        }
    };
     useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      try {
           unlisten = await listen('window-data', (event: any) => {
          console.log('Dados recebidos da janela pai:', event.payload);
          const received = event.payload as ChecagemData;
          
          // 1. ATUALIZA OS INPUTS
          const iniStr = received.numero_ini ? String(received.numero_ini) : '';
          const fimStr = received.numero_fim ? String(received.numero_fim) : '';
          
          setNumeroIni(iniStr);
          setNumeroFim(fimStr);
            
          // 2. CHAMA A BUSCA USANDO OS DADOS RECEBIDOS, E NÃO O ESTADO QUE AINDA NÃO FOI ATUALIZADO
          // Use handleBuscar2 passando os valores que você acabou de definir
          handleBuscar2(iniStr, fimStr); 
          
          // Se precisar buscar pelo ID do grupo:
          if (received.id_grupo_edit) {
               handleBuscarPorId(received.id_grupo_edit);
          } else {
               handleBuscar2(iniStr, fimStr); 
          }
          
        });

        await emit('window-ready');
      } catch (error) {
        alert("erro");
        console.error('Erro ao configurar listener:', error);
      }
    };

    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

    // Busca por ID específico (modo edição)
    const handleBuscarPorId = async (idGrupo: number) => {
        await buscarDados({ numero_ini: null, numero_fim: null, id_grupo_edit: idGrupo });
    };

    // Função principal de busca
    const buscarDados = async (payload: { numero_ini: number | null, numero_fim: number | null, id_grupo_edit: number | null }) => {
        setStatus('loading');
        setMessage('Buscando dados no servidor...');
        setGruposChecagem([]);
        setActiveGrupoTab(0);
        setActiveAmostraTab({});
        setMesmaHoraColeta({});

        try {
            // @ts-ignore - Tauri API
            const { invoke } = await import('@tauri-apps/api/core');
            
            const responseJson: string = await invoke('buscar_checagens_client', { payload });
            const grupos: GrupoChecagem[] = JSON.parse(responseJson);

            if (grupos.length === 0) {
                setMessage('Nenhum grupo de checagem encontrado para esta faixa');
                setStatus('error');
                setGruposChecagem([]);
                return;
            }

            // Inicializar valores padrão para checagens vazias
            const gruposProcessados = grupos.map(grupo => ({
                ...grupo,
                amostras_analises: grupo.amostras_analises.map(amostra => ({
                    ...amostra,
                    // Se coletada é null, assume que foi coletada (1)
                    coletada: amostra.coletada ?? 1,
                    checagens: amostra.checagens.map((c, idx) => ({
                        ...c,
                        // Inicializar com "Sim" para os primeiros 7 itens e "N.A." para o resto
                        // apenas se valor for null e grupo não foi verificado
                        valor: c.valor || (grupo.usuario_checagem ? null : (idx < 7 ? 'Sim' : 'N.A.'))
                    }))
                }))
            }));

            setGruposChecagem(gruposProcessados);
            setStatus('success');
            setMessage(`${grupos.length} grupo(s) encontrado(s) com sucesso`);
            setActiveGrupoTab(0);

            // Inicializar "mesma hora" se hora_coleta estiver preenchida
            const horasInit: {[key: number]: boolean} = {};
            gruposProcessados.forEach((grupo, idx) => {
                horasInit[idx] = !!grupo.hora_coleta;
            });
            setMesmaHoraColeta(horasInit);

        } catch (error) {
            console.error('Erro ao buscar checagens:', error);
            setMessage(`Erro ao buscar dados: ${error}`);
            setStatus('error');
            setGruposChecagem([]);
        }
    };

    // Copiar checagem da amostra atual para todas
    const handleCopiarChecagem = (grupoIdx: number, amostraIdx: number) => {
        if (!confirm('Deseja copiar a checagem desta amostra para todas as outras?')) return;

        setGruposChecagem(prev => {
            const newGrupos = [...prev];
            const grupo = newGrupos[grupoIdx];
            const amostraOrigem = grupo.amostras_analises[amostraIdx];

            grupo.amostras_analises.forEach((amostra, idx) => {
                // Não copia se a amostra já foi checada (tem usuario_checagem)
                if (idx !== amostraIdx && !grupo.usuario_checagem) {
                    amostra.checagens = amostraOrigem.checagens.map(c => ({...c}));
                }
            });

            return newGrupos;
        });

        setMessage('Checagem copiada com sucesso!');
        setStatus('success');
    };

    // Handlers de mudança
    const handleGrupoChange = (grupoIdx: number, field: keyof GrupoChecagem, value: any) => {
        setGruposChecagem(prev => {
            const newGrupos = [...prev];
            newGrupos[grupoIdx] = { ...newGrupos[grupoIdx], [field]: value };
            return newGrupos;
        });
    };

    const handleAmostraChange = (grupoIdx: number, amostraIdx: number, field: keyof AmostraAnalise, value: any) => {
        setGruposChecagem(prev => {
            const newGrupos = [...prev];
            const grupo = newGrupos[grupoIdx];
            grupo.amostras_analises[amostraIdx] = {
                ...grupo.amostras_analises[amostraIdx],
                [field]: value
            };
            return newGrupos;
        });
    };

    const handleChecagemChange = (grupoIdx: number, amostraIdx: number, checagemIdx: number, field: keyof ChecagemItem, value: any) => {
        setGruposChecagem(prev => {
            const newGrupos = [...prev];
            const amostra = newGrupos[grupoIdx].amostras_analises[amostraIdx];
            amostra.checagens[checagemIdx] = {
                ...amostra.checagens[checagemIdx],
                [field]: value
            };
            return newGrupos;
        });
    };

    // IMPLEMENTAÇÃO DO SALVAMENTO
    const handleSalvar = async () => {
        if (!confirm('Deseja verificar e salvar todas as amostras?')) return;
        
        setStatus('loading');
        setMessage('Salvando dados...');
        
        try {
            // @ts-ignore - Tauri API
            const { invoke } = await import('@tauri-apps/api/core');
             const updatedUser: Usuario | null = await invoke('usuario_logado');
            // Prepara o payload para o backend Rust
            const payload = {
                grupos: gruposChecagem,
                // O idUsuarioLogado deve ser o ID do usuário que está verificando
                id_usuario_verificacao: updatedUser?.id, 
            };
            
            // Chama o comando Tauri que invoca o endpoint de salvamento
            const result: string = await invoke('salvar_checagens_client', { payload });
            
            // Sucesso
            setStatus('success');
            setMessage(result);
            alert('Checagem realizada com sucesso!');
            
            // Opcional: Recarregar apenas o grupo atual para refletir o status de checado
            if (currentGrupo.id_grupo) {
                 await handleBuscarPorId(currentGrupo.id_grupo);
            } else {
                 // Se não tiver ID do grupo, apenas atualiza o estado de checado localmente
                 setGruposChecagem(prev => prev.map(grupo => {
                    if (grupo.id_grupo === currentGrupo.id_grupo) {
                        return { 
                            ...grupo, 
                            usuario_checagem: 'Você', // Ou obter o nome real
                            data_checagem: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                        };
                    }
                    return grupo;
                 }));
            }

        } catch (error) {
            console.error('Erro ao salvar checagens:', error);
            // O backend retorna a mensagem de erro formatada
            setMessage(`Erro ao salvar dados: ${error}`);
            setStatus('error');
        }
    };

    const currentGrupo = gruposChecagem[activeGrupoTab];

    return (
        <div style={{
            // ADICIONADO: overflowY: 'auto' para permitir a rolagem
            minHeight: '100vh',
            maxHeight: '100vh', // Para garantir que 100vh seja o limite de altura visível
            overflowY: 'auto', 
            background: 'linear-gradient(135deg, #f0f9f4 0%, #e6f7ed 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: 'white',
                padding: '24px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 600 }}>
                    Checagem de Recebimento de Amostra
                </h1>
                <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: '14px' }}>
                    Doc. Referência: PG 5.8-02
                </p>
            </div>

            {/* Search Panel */}
            <div style={{
                background: 'white',
                padding: '20px 24px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                borderBottom: '2px solid #d1fae5'
            }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontWeight: 500, color: '#047857' }}>Número da amostra</label>
                        <input
                            type="number"
                            value={numeroIni}
                            onChange={(e) => setNumeroIni(e.target.value)}
                            placeholder="De"
                            style={{
                                padding: '10px 14px',
                                border: '2px solid #d1fae5',
                                borderRadius: '8px',
                                width: '100px',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'all 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#059669'}
                            onBlur={(e) => e.target.style.borderColor = '#d1fae5'}
                        />
                        <span style={{ color: '#6b7280', fontWeight: 500 }}>a</span>
                        <input
                            type="number"
                            value={numeroFim}
                            onChange={(e) => setNumeroFim(e.target.value)}
                            placeholder="Até"
                            style={{
                                padding: '10px 14px',
                                border: '2px solid #d1fae5',
                                borderRadius: '8px',
                                width: '100px',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'all 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#059669'}
                            onBlur={(e) => e.target.style.borderColor = '#d1fae5'}
                        />
                    </div>
                    <button
                        onClick={handleBuscar}
                        disabled={status === 'loading'}
                        style={{
                            padding: '10px 24px',
                            background: status === 'loading' ? '#9ca3af' : '#059669',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            if (status !== 'loading') e.currentTarget.style.background = '#047857';
                        }}
                        onMouseLeave={(e) => {
                            if (status !== 'loading') e.currentTarget.style.background = '#059669';
                        }}
                    >
                        {status === 'loading' ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={18} />}
                        Buscar
                    </button>
                </div>

                {message && (
                    <div style={{
                        marginTop: '16px',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        background: status === 'error' ? '#fee2e2' : status === 'success' ? '#d1fae5' : '#fef3c7',
                        color: status === 'error' ? '#991b1b' : status === 'success' ? '#065f46' : '#92400e'
                    }}>
                        {status === 'error' && <XCircle size={18} />}
                        {status === 'success' && <CheckCircle2 size={18} />}
                        {status === 'loading' && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />}
                        {status === 'idle' && <AlertCircle size={18} />}
                        {message}
                    </div>
                )}
            </div>

            {/* Main Content */}
            {gruposChecagem.length > 0 && (
                <div style={{ padding: '24px', paddingBottom: '100px' /* Espaço para o footer sticky */ }}>
                    {/* Tabs de Grupos */}
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            display: 'flex',
                            borderBottom: '2px solid #d1fae5',
                            background: '#f0fdf4',
                            overflowX: 'auto'
                        }}>
                            {gruposChecagem.map((grupo, idx) => (
                                <button
                                    key={grupo.id_grupo}
                                    onClick={() => setActiveGrupoTab(idx)}
                                    style={{
                                        padding: '16px 24px',
                                        border: 'none',
                                        background: activeGrupoTab === idx ? 'white' : 'transparent',
                                        color: activeGrupoTab === idx ? '#059669' : '#6b7280',
                                        fontWeight: activeGrupoTab === idx ? 600 : 500,
                                        cursor: 'pointer',
                                        borderBottom: activeGrupoTab === idx ? '3px solid #059669' : 'none',
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.2s',
                                        fontSize: '14px'
                                    }}
                                >
                                    {grupo.amostra_min === grupo.amostra_max 
                                        ? grupo.amostra_min 
                                        : `${grupo.amostra_min}-${grupo.amostra_max}`}
                                    {grupo.versao && ` ${grupo.versao} ${grupo.numero_versao}`}
                                </button>
                            ))}
                        </div>

                        {currentGrupo && (
                            <div style={{ padding: '24px' }}>
                                {/* Informações do Formulário */}
                                <div style={{
                                    textAlign: 'right',
                                    color: '#6b7280',
                                    fontSize: '13px',
                                    marginBottom: '16px',
                                    fontWeight: 500
                                }}>
                                    FORM.: {String(currentGrupo.form_numero).padStart(4, '0')}/{String(currentGrupo.form_revisao).padStart(2, '0')}
                                </div>

                                {/* Status da Checagem */}
                                {currentGrupo.usuario_checagem ? (
                                    <div style={{
                                        background: '#d1fae5',
                                        border: '2px solid #059669',
                                        borderRadius: '8px',
                                        padding: '16px',
                                        marginBottom: '24px'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            color: '#065f46',
                                            fontWeight: 600
                                        }}>
                                            <CheckCircle2 size={20} />
                                            Amostra(s) verificada(s) por: {currentGrupo.usuario_checagem} - {currentGrupo.data_checagem}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{
                                        background: '#fef3c7',
                                        border: '2px solid #f59e0b',
                                        borderRadius: '8px',
                                        padding: '16px',
                                        marginBottom: '24px'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            color: '#92400e',
                                            fontWeight: 600
                                        }}>
                                            <AlertCircle size={20} />
                                            PENDENTE DE VERIFICAÇÃO
                                        </div>
                                    </div>
                                )}

                                {/* Dados de Coleta e Laboratório */}
                                <div style={{
                                    background: '#f0fdf4',
                                    border: '2px solid #d1fae5',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    marginBottom: '24px'
                                }}>
                                    <h3 style={{ margin: '0 0 16px', color: '#047857', fontSize: '16px' }}>
                                        Dados de Coleta e Recebimento
                                    </h3>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#047857', fontSize: '13px' }}>
                                                Data da coleta
                                            </label>
                                            <input
                                                type="text"
                                                value={currentGrupo.data_coleta || ''}
                                                onChange={(e) => handleGrupoChange(activeGrupoTab, 'data_coleta', e.target.value)}
                                                placeholder="DD/MM/AAAA"
                                                disabled={!!currentGrupo.usuario_checagem}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px',
                                                    border: '2px solid #d1fae5',
                                                    borderRadius: '6px',
                                                    fontSize: '14px',
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#047857', fontSize: '13px' }}>
                                                Hora da coleta
                                            </label>
                                            <input
                                                type="text"
                                                value={currentGrupo.hora_coleta || ''}
                                                onChange={(e) => handleGrupoChange(activeGrupoTab, 'hora_coleta', e.target.value)}
                                                placeholder="HH:MM"
                                                disabled={!!currentGrupo.usuario_checagem || !mesmaHoraColeta[activeGrupoTab]}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px',
                                                    border: '2px solid #d1fae5',
                                                    borderRadius: '6px',
                                                    fontSize: '14px',
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#047857', fontSize: '13px' }}>
                                                Data de entrada no lab.
                                            </label>
                                            <input
                                                type="text"
                                                value={currentGrupo.data_lab || ''}
                                                onChange={(e) => handleGrupoChange(activeGrupoTab, 'data_lab', e.target.value)}
                                                placeholder="DD/MM/AAAA"
                                                disabled={!!currentGrupo.usuario_checagem}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px',
                                                    border: '2px solid #d1fae5',
                                                    borderRadius: '6px',
                                                    fontSize: '14px',
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#047857', fontSize: '13px' }}>
                                                Hora de entrada no lab.
                                            </label>
                                            <input
                                                type="text"
                                                value={currentGrupo.hora_lab || ''}
                                                onChange={(e) => handleGrupoChange(activeGrupoTab, 'hora_lab', e.target.value)}
                                                placeholder="HH:MM"
                                                disabled={!!currentGrupo.usuario_checagem}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px',
                                                    border: '2px solid #d1fae5',
                                                    borderRadius: '6px',
                                                    fontSize: '14px',
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {!currentGrupo.usuario_checagem && (
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            color: '#047857',
                                            fontWeight: 500
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={mesmaHoraColeta[activeGrupoTab] || false}
                                                onChange={(e) => setMesmaHoraColeta(prev => ({...prev, [activeGrupoTab]: e.target.checked}))}
                                                style={{ width: '18px', height: '18px', accentColor: '#059669' }}
                                            />
                                            A hora da coleta é a mesma para todas as amostras
                                        </label>
                                    )}
                                </div>

                                {/* Tabs de Amostras */}
                                <div style={{
                                    border: '2px solid #d1fae5',
                                    borderRadius: '12px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        background: '#f0fdf4',
                                        borderBottom: '2px solid #d1fae5',
                                        overflowX: 'auto'
                                    }}>
                                        {currentGrupo.amostras_analises.map((amostra, idx) => (
                                            <button
                                                key={amostra.id_analise}
                                                onClick={() => setActiveAmostraTab(prev => ({...prev, [activeGrupoTab]: idx}))}
                                                style={{
                                                    padding: '14px 20px',
                                                    border: 'none',
                                                    background: (activeAmostraTab[activeGrupoTab] || 0) === idx ? 'white' : 'transparent',
                                                    color: (activeAmostraTab[activeGrupoTab] || 0) === idx ? '#059669' : '#6b7280',
                                                    fontWeight: (activeAmostraTab[activeGrupoTab] || 0) === idx ? 600 : 500,
                                                    cursor: 'pointer',
                                                    borderBottom: (activeAmostraTab[activeGrupoTab] || 0) === idx ? '3px solid #059669' : 'none',
                                                    whiteSpace: 'nowrap',
                                                    fontSize: '14px'
                                                }}
                                            >
                                                Amostra {amostra.numero_amostra}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Conteúdo da Amostra */}
                                    {(() => {
                                        const amostraIdx = activeAmostraTab[activeGrupoTab] || 0;
                                        const amostra = currentGrupo.amostras_analises[amostraIdx];
                                        const isColetada = amostra.coletada === 1;

                                        return (
                                            <div style={{ padding: '24px' }}>
                                                {/* Botão Copiar */}
                                                {!currentGrupo.usuario_checagem && (
                                                    <button
                                                        onClick={() => handleCopiarChecagem(activeGrupoTab, amostraIdx)}
                                                        style={{
                                                            padding: '10px 20px',
                                                            background: '#10b981',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            marginBottom: '20px',
                                                            fontSize: '14px'
                                                        }}
                                                    >
                                                        <Copy size={16} />
                                                        Copiar checagem para as outras amostras
                                                    </button>
                                                )}

                                                {/* Status Coletada */}
                                                <div style={{
                                                    background: isColetada ? '#d1fae5' : '#fee2e2',
                                                    border: `2px solid ${isColetada ? '#059669' : '#dc2626'}`,
                                                    borderRadius: '8px',
                                                    padding: '16px',
                                                    marginBottom: '20px'
                                                }}>
                                                    <label style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '12px',
                                                        cursor: 'pointer',
                                                        fontWeight: 600,
                                                        color: isColetada ? '#065f46' : '#991b1b'
                                                    }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={!isColetada}
                                                            onChange={(e) => handleAmostraChange(activeGrupoTab, amostraIdx, 'coletada', e.target.checked ? 0 : 1)}
                                                            disabled={!!currentGrupo.usuario_checagem}
                                                            style={{ width: '20px', height: '20px', accentColor: '#dc2626' }}
                                                        />
                                                        Amostra não coletada
                                                    </label>
                                                    {!isColetada && (
                                                        <input
                                                            type="text"
                                                            value={amostra.ncoletada_motivo || ''}
                                                            onChange={(e) => handleAmostraChange(activeGrupoTab, amostraIdx, 'ncoletada_motivo', e.target.value)}
                                                            placeholder="Motivo da não coleta..."
                                                            disabled={!!currentGrupo.usuario_checagem}
                                                            style={{
                                                                width: '100%',
                                                                marginTop: '12px',
                                                                padding: '10px 12px',
                                                                border: '2px solid #fca5a5',
                                                                borderRadius: '6px',
                                                                fontSize: '14px',
                                                                outline: 'none'
                                                            }}
                                                        />
                                                    )}
                                                </div>

                                                {/* Hora da Coleta da Amostra */}
                                                <div style={{ marginBottom: '24px' }}>
                                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#047857', fontSize: '14px' }}>
                                                        Hora da coleta
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={amostra.hora_coleta_analise || ''}
                                                        onChange={(e) => handleAmostraChange(activeGrupoTab, amostraIdx, 'hora_coleta_analise', e.target.value)}
                                                        placeholder="HH:MM"
                                                        disabled={!!currentGrupo.usuario_checagem || !isColetada || mesmaHoraColeta[activeGrupoTab]}
                                                        style={{
                                                            width: '200px',
                                                            padding: '10px 12px',
                                                            border: '2px solid #d1fae5',
                                                            borderRadius: '6px',
                                                            fontSize: '14px',
                                                            outline: 'none'
                                                        }}
                                                    />
                                                </div>

                                                <hr style={{ border: 'none', borderTop: '2px solid #d1fae5', margin: '24px 0' }} />

                                                {/* Items de Checagem */}
                                                <h4 style={{ margin: '0 0 16px', color: '#047857', fontSize: '16px', fontWeight: 600 }}>
                                                    Items de Checagem
                                                </h4>

                                                <div style={{ marginBottom: '12px', display: 'grid', gridTemplateColumns: 'auto 120px 1fr', gap: '12px', alignItems: 'center', fontWeight: 600, fontSize: '13px', color: '#047857', paddingBottom: '8px', borderBottom: '2px solid #d1fae5' }}>
                                                    <div></div>
                                                    <div style={{ textAlign: 'center' }}>Valor</div>
                                                    <div>Comentário</div>
                                                </div>

                                                {amostra.checagens.map((checagem, checIdx) => (
                                                    <div key={checagem.id} style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: 'auto 120px 1fr',
                                                        gap: '12px',
                                                        alignItems: 'center',
                                                        marginBottom: '12px',
                                                        padding: '12px',
                                                        background: checIdx % 2 === 0 ? '#f0fdf4' : 'white',
                                                        borderRadius: '6px'
                                                    }}>
                                                        <div className={styles.checkItemLabel}>
    <span>{checIdx + 1})</span>
    <ParsedDescription text={checagem.descricao} />
</div>
                                                        
                                                        {currentGrupo.usuario_checagem ? (
                                                            <div style={{
                                                                padding: '8px 12px',
                                                                background: checagem.valor === 'Sim' ? '#d1fae5' : checagem.valor === 'Não' ? '#fee2e2' : '#f3f4f6',
                                                                color: checagem.valor === 'Sim' ? '#065f46' : checagem.valor === 'Não' ? '#991b1b' : '#6b7280',
                                                                borderRadius: '6px',
                                                                textAlign: 'center',
                                                                fontWeight: 600,
                                                                fontSize: '13px'
                                                            }}>
                                                                {checagem.valor || 'N/A'}
                                                            </div>
                                                        ) : (
                                                            <select
                                                                value={checagem.valor || ''}
                                                                onChange={(e) => handleChecagemChange(activeGrupoTab, amostraIdx, checIdx, 'valor', e.target.value)}
                                                                disabled={!isColetada}
                                                                 className={styles.select} 
                                                                style={{
                                                                    padding: '8px 12px',
                                                                    border: '2px solid #d1fae5',
                                                                    borderRadius: '6px',
                                                                    fontSize: '14px',
                                                                    outline: 'none',
                                                                    cursor: 'pointer',
                                                                    background: 'white'
                                                                }}
                                                            >
                                                                <option value="">Selecione</option>
                                                                <option value="Sim">Sim</option>
                                                                <option value="Não">Não</option>
                                                                <option value="N.A.">N.A.</option>
                                                            </select>
                                                        )}

                                                        <input
                                                            type="text"
                                                            value={checagem.comentario || ''}
                                                            onChange={(e) => handleChecagemChange(activeGrupoTab, amostraIdx, checIdx, 'comentario', e.target.value)}
                                                            placeholder="Adicione um comentário..."
                                                            disabled={!!currentGrupo.usuario_checagem || !isColetada}
                                                            style={{
                                                                padding: '8px 12px',
                                                                border: '2px solid #d1fae5',
                                                                borderRadius: '6px',
                                                                fontSize: '14px',
                                                                outline: 'none'
                                                            }}
                                                        />
                                                    </div>
                                                ))}

                                                {/* Parâmetros em Campo */}
                                                {amostra.parametros.length > 0 && (
                                                    <>
                                                        <hr style={{ border: 'none', borderTop: '2px solid #d1fae5', margin: '32px 0 24px' }} />
                                                        <h4 style={{ margin: '0 0 16px', color: '#047857', fontSize: '16px', fontWeight: 600 }}>
                                                            Análises realizadas em campo
                                                        </h4>
                                                        <div style={{
                                                            background: '#f0fdf4',
                                                            border: '2px solid #d1fae5',
                                                            borderRadius: '8px',
                                                            padding: '16px'
                                                        }}>
                                                            {amostra.parametros.map((param) => (
                                                                <div key={param.id_resultado} style={{
                                                                    padding: '12px',
                                                                    marginBottom: '8px',
                                                                    background: 'white',
                                                                    borderRadius: '6px',
                                                                    fontSize: '14px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '12px'
                                                                }}>
                                                                    {currentGrupo.usuario_checagem ? (
                                                                        <span style={{ color: '#065f46', fontWeight: 600 }}>✓</span>
                                                                    ) : (
                                                                        // O campo 'em_campo' só pode ser 1 (marcado) ou 2 (excluído) ou NULL (não marcado)
                                                                        // Na tela de checagem, só mostramos os que são != 2
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={param.em_campo === 1}
                                                                            // Se já está como 'em_campo = 1', ele deve ser somente leitura
                                                                            disabled={param.em_campo === 1} 
                                                                            style={{ width: '18px', height: '18px', accentColor: '#059669' }}
                                                                        />
                                                                    )}
                                                                    <div style={{ flex: 1 }}>
                                                                        <strong style={{ color: '#047857' }}>{param.nome_parametro}</strong>
                                                                        {param.grupo_parametro && <span style={{ color: '#6b7280' }}> ({param.grupo_parametro})</span>}
                                                                        {param.tecnica_nome && <span style={{ color: '#6b7280' }}> - {param.tecnica_nome}</span>}
                                                                        <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                                                                            Limite: {param.limite || 'N/A'} {param.unidade || ''}
                                                                            {param.resultado && <span> | Resultado: <strong>{param.resultado}</strong></span>}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}

                                                {/* Botão Verificar Individual (Agora chama handleSalvar que verifica todos) */}
                                                {!currentGrupo.usuario_checagem && (
                                                    <div style={{ marginTop: '32px', textAlign: 'center' }}>
                                                        <button
                                                            onClick={handleSalvarUm}
                                                            style={{
                                                                padding: '14px 32px',
                                                                background: '#059669',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '8px',
                                                                fontWeight: 700,
                                                                cursor: 'pointer',
                                                                fontSize: '16px',
                                                                boxShadow: '0 4px 6px rgba(5, 150, 105, 0.3)',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.background = '#047857';
                                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                                e.currentTarget.style.boxShadow = '0 6px 12px rgba(5, 150, 105, 0.4)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.background = '#059669';
                                                                e.currentTarget.style.transform = 'translateY(0)';
                                                                e.currentTarget.style.boxShadow = '0 4px 6px rgba(5, 150, 105, 0.3)';
                                                            }}
                                                        >
                                                            Verificar
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Footer com botão de Verificar Todas */}
            {gruposChecagem.length > 0 && !gruposChecagem[activeGrupoTab]?.usuario_checagem && (
                <div style={{
                    position: 'sticky',
                    bottom: 0,
                    background: 'white',
                    borderTop: '3px solid #059669',
                    padding: '20px 24px',
                    boxShadow: '0 -4px 12px rgba(0,0,0,0.08)'
                }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
                        <button
                            onClick={handleSalvar}
                            disabled={status === 'loading'}
                            style={{
                                padding: '16px 48px',
                                background: status === 'loading' ? '#9ca3af' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: 700,
                                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                                fontSize: '18px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '12px',
                                boxShadow: '0 6px 16px rgba(5, 150, 105, 0.3)',
                                transition: 'all 0.3s'
                            }}
                            onMouseEnter={(e) => {
                                if (status !== 'loading') {
                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(5, 150, 105, 0.4)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (status !== 'loading') {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(5, 150, 105, 0.3)';
                                }
                            }}
                        >
                            {status === 'loading' ? (
                                <>
                                    <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    <Save size={24} />
                                    Verificar todas as amostras
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}


        </div>
    );
};

export default ColetaChecagem;