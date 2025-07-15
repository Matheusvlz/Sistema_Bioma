import React, { useState, useEffect } from 'react';
import { FaUser, FaMoneyBill, FaTags, FaAddressBook, FaPlus, FaTrash, FaCopy } from 'react-icons/fa';
import './css/CadastrarCliente.css';
import { core } from "@tauri-apps/api";
import { listen } from '@tauri-apps/api/event';
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/Modal";
import { emit } from '@tauri-apps/api/event';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { UFSelect, ConsultorSelect } from './CustomSelect';

interface Categoria {
  id: number;
  nome: string;
}

interface Consultor {
  id: number;
  nome: string;
  documento: string;
  telefone: string;
  email: string;
  ativo: boolean;
}

interface SetorPortal {
  id: number;
  nome: string;
}

interface Contato {
  id: string;
  nome: string;
  cargo: string;
  email: string;
  telefone: string;
  dataNascimento: string;
  setoresContato: number[];
}

interface DadosGerais {
  tipoDocumento: 'CPF' | 'CNPJ' | 'nenhum';
  documento: string;
  fantasia: string;
  razao: string;
  tipoRegistro: 'IE' | 'RG';
  registro: string;
  cep: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  telefone: string;
  celular: string;
  email: string;
  site: string;
  observacao: string;
  consultorId: number | null;
  setoresPortal: number[];
  ativo: boolean;
}

interface DadosCobranca {
  tipoDocumento: 'CPF' | 'CNPJ' | 'nenhum';
  documento: string;
  fantasia: string;
  razao: string;
  tipoRegistro: 'IE' | 'RG';
  registro: string;
  cep: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  telefone: string;
  celular: string;
  email: string;
  site: string;
  observacao: string;
}

interface GeralResponse {
  success: boolean;
  data?: any;
  message?: string;
}

interface ClientePreenchimento {
  id: number;
  nome_cliente: string | null;
  documento: string | null;
  telefone: string | null;
  email: string | null;
  origem: string | null;
  dados_gerais?: DadosGerais;
  dados_cobranca?: DadosCobranca;
  categorias_selecionadas?: number[];
  contatos_existentes?: Contato[];
}

const ESTADOS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const aplicarMascaraCPF = (valor: string): string => {
  return valor
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const aplicarMascaraCNPJ = (valor: string): string => {
  return valor
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const aplicarMascaraTelefone = (valor: string): string => {
  const numeros = valor.replace(/\D/g, '');
  let formatado: string;
  if (numeros.length <= 10) {
    formatado = numeros
      .replace(/(\d{2})(\d)/, '($1)$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  } else {
    formatado = numeros
      .replace(/(\d{2})(\d)/, '($1)$2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }
  return formatado.slice(0, 14);
};

const aplicarMascaraCEP = (valor: string): string => {
  return valor
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1');
};

const detectarTipoDocumento = (documento: string): 'CPF' | 'CNPJ' | 'nenhum' => {
  const numeros = documento.replace(/\D/g, '');
  if (numeros.length <= 11) {
    return 'CPF';
  } else if (numeros.length > 11) {
    return 'CNPJ';
  }
  return 'nenhum';
};

const validarCPF = (cpf: string): boolean => {
  const numeros = cpf.replace(/\D/g, '');
  if (numeros.length !== 11) return false;

  if (/^(\d)\1{10}$/.test(numeros)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(numeros.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(numeros.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(numeros.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(numeros.charAt(10))) return false;

  return true;
};

const validarCNPJ = (cnpj: string): boolean => {
  const numeros = cnpj.replace(/\D/g, '');
  if (numeros.length !== 14) return false;

  if (/^(\d)\1{13}$/.test(numeros)) return false;

  let tamanho = numeros.length - 2;
  let numeros_validacao = numeros.substring(0, tamanho);
  let digitos = numeros.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros_validacao.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;

  tamanho = tamanho + 1;
  numeros_validacao = numeros.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros_validacao.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) return false;

  return true;
};

const validarEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const CadastrarClientes: React.FC = () => {
  const { modal, showError, showSuccess, showWarning, closeModal } = useModal();
  const [guiaAtiva, setGuiaAtiva] = useState<'geral' | 'cobranca' | 'categorias' | 'contatos'>('geral');

  const [origemCliente, setOrigemCliente] = useState<string | null>(null);
  const [id_pre_cad, setIdPreCad] = useState<number | null>(null);
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const [dadosGerais, setDadosGerais] = useState<DadosGerais>({
    tipoDocumento: 'CPF',
    documento: '',
    fantasia: '',
    razao: '',
    tipoRegistro: 'RG',
    registro: '',
    cep: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: '',
    telefone: '',
    celular: '',
    email: '',
    site: '',
    observacao: '',
    consultorId: null,
    setoresPortal: [],
    ativo: true
  });

  const [dadosCobranca, setDadosCobranca] = useState<DadosCobranca>({
    tipoDocumento: 'CPF',
    documento: '',
    fantasia: '',
    razao: '',
    tipoRegistro: 'RG',
    registro: '',
    cep: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: '',
    telefone: '',
    celular: '',
    email: '',
    site: '',
    observacao: ''
  });

  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<number[]>([]);
  const [contatos, setContatos] = useState<Contato[]>([]);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [consultores, setConsultores] = useState<Consultor[]>([]);
  const [setoresPortal, setSetoresPortal] = useState<SetorPortal[]>([]);

  const [erros, setErros] = useState<{ [key: string]: string }>({});

  const copiarDadosGeraisParaCobranca = () => {
    setDadosCobranca({
      tipoDocumento: dadosGerais.tipoDocumento,
      documento: dadosGerais.documento,
      fantasia: dadosGerais.fantasia,
      razao: dadosGerais.razao,
      tipoRegistro: dadosGerais.tipoRegistro,
      registro: dadosGerais.registro,
      cep: dadosGerais.cep,
      endereco: dadosGerais.endereco,
      numero: dadosGerais.numero,
      bairro: dadosGerais.bairro,
      cidade: dadosGerais.cidade,
      uf: dadosGerais.uf,
      telefone: dadosGerais.telefone,
      celular: dadosGerais.celular,
      email: dadosGerais.email,
      site: dadosGerais.site,
      observacao: dadosGerais.observacao
    });
  };

  const validarCampo = (campo: string, valor: string, tipo: 'geral' | 'cobranca' = 'geral'): string => {
    const prefixo = tipo === 'cobranca' ? 'cobranca_' : '';
    const chave = `${prefixo}${campo}`;

    let erro = '';

    switch (campo) {
      case 'documento':
        const tipoDoc = tipo === 'cobranca' ? dadosCobranca.tipoDocumento : dadosGerais.tipoDocumento;
        if (tipoDoc !== 'nenhum' && valor) {
          if (tipoDoc === 'CPF' && !validarCPF(valor)) {
            erro = 'CPF inválido';
          } else if (tipoDoc === 'CNPJ' && !validarCNPJ(valor)) {
            erro = 'CNPJ inválido';
          }
        }
        break;
      case 'email':
        if (valor && !validarEmail(valor)) {
          erro = 'Email inválido';
        }
        break;
      case 'cep':
        if (valor && valor.replace(/\D/g, '').length !== 8) {
          erro = 'CEP deve ter 8 dígitos';
        }
        break;
    }

    setErros(prev => ({
      ...prev,
      [chave]: erro
    }));

    return erro;
  };

  const handleDocumentoChange = (valor: string, tipo: 'geral' | 'cobranca' = 'geral') => {
    let valorFormatado = valor;

    const tipoDetectado = detectarTipoDocumento(valor);

    if (tipoDetectado === 'CPF') {
      valorFormatado = aplicarMascaraCPF(valor);
    } else if (tipoDetectado === 'CNPJ') {
      valorFormatado = aplicarMascaraCNPJ(valor);
    }

    if (tipo === 'cobranca') {
      setDadosCobranca({
        ...dadosCobranca,
        documento: valorFormatado,
        tipoDocumento: tipoDetectado
      });
    } else {
      setDadosGerais({
        ...dadosGerais,
        documento: valorFormatado,
        tipoDocumento: tipoDetectado
      });
    }

    validarCampo('documento', valorFormatado, tipo);
  };

  const handleTelefoneChange = (valor: string, campo: 'telefone' | 'celular', tipo: 'geral' | 'cobranca' = 'geral') => {
    const valorFormatado = aplicarMascaraTelefone(valor);

    if (tipo === 'cobranca') {
      setDadosCobranca({ ...dadosCobranca, [campo]: valorFormatado });
    } else {
      setDadosGerais({ ...dadosGerais, [campo]: valorFormatado });
    }
  };

  const handleCEPChange = (valor: string, tipo: 'geral' | 'cobranca' = 'geral') => {
    const valorFormatado = aplicarMascaraCEP(valor);

    if (tipo === 'cobranca') {
      setDadosCobranca({ ...dadosCobranca, cep: valorFormatado });
    } else {
      setDadosGerais({ ...dadosGerais, cep: valorFormatado });
    }

    validarCampo('cep', valorFormatado, tipo);
  };

  useEffect(() => {
    const carregarDadosIniciais = async () => {
      try {
        const categoriasResponse: GeralResponse = await core.invoke<{ success: boolean }>('cliente_categoria');
        if (categoriasResponse.success && categoriasResponse.data) {
          setCategorias(categoriasResponse.data);
        }

        const consultoresResponse: GeralResponse = await core.invoke<{ success: boolean }>('consultor');
        if (consultoresResponse.success && consultoresResponse.data) {
          setConsultores(consultoresResponse.data);
        }

        const setoresResponse: GeralResponse = await core.invoke<{ success: boolean }>('setor_portal');
        if (setoresResponse.success && setoresResponse.data) {
          setSetoresPortal(setoresResponse.data);
        }
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
      }
    };

    carregarDadosIniciais();
  }, []);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      try {
        unlisten = await listen('window-data', (event) => {
          console.log('Dados recebidos da janela pai:', event.payload);
          const dados = event.payload as ClientePreenchimento;

          if (dados) {
            processarDadosRecebidos(dados);
          }
        });

        await emit('window-ready');
      } catch (error) {
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


  const processarDadosRecebidos = (dados: ClientePreenchimento) => {
    try {
      if (dados.origem === 'cliente_precadastro' && dados.id) {
        setClienteId(dados.id);
        setIsEditing(true);
        const fetchClientData = async (id: number) => {
          try {
            const clientDataResponse: GeralResponse = await core.invoke('get_cliente_data', { clientId: id });
            if (clientDataResponse.success && clientDataResponse.data) {
              const clientData = clientDataResponse.data;
              console.log("Dados do cliente existentes:", clientData);
              setDadosGerais({
                tipoDocumento: clientData.dados_gerais.tipo_documento || 'CPF',
                documento: clientData.dados_gerais.documento || '',
                fantasia: clientData.dados_gerais.fantasia || '',
                razao: clientData.dados_gerais.razao || '',
                tipoRegistro: clientData.dados_gerais.tipo_registro || 'RG',
                registro: clientData.dados_gerais.registro || '',
                cep: clientData.dados_gerais.cep || '',
                endereco: clientData.dados_gerais.endereco || '',
                numero: clientData.dados_gerais.numero || '',
                bairro: clientData.dados_gerais.bairro || '',
                cidade: clientData.dados_gerais.cidade || '',
                uf: clientData.dados_gerais.uf || '',
                telefone: clientData.dados_gerais.telefone || '',
                celular: clientData.dados_gerais.celular || '',
                email: clientData.dados_gerais.email || '',
                site: clientData.dados_gerais.site || '',
                observacao: clientData.dados_gerais.observacao || '',
                consultorId: clientData.dados_gerais.consultor_id || null,
                setoresPortal: clientData.dados_gerais.setores_portal || [],
                ativo: clientData.dados_gerais.ativo !== undefined ? clientData.dados_gerais.ativo : true
              });

              setDadosCobranca({
                tipoDocumento: clientData.dados_cobranca.tipo_documento || 'CPF',
                documento: clientData.dados_cobranca.documento || '',
                fantasia: clientData.dados_cobranca.fantasia || '',
                razao: clientData.dados_cobranca.razao || '',
                tipoRegistro: clientData.dados_cobranca.tipo_registro || 'RG',
                registro: clientData.dados_cobranca.registro || '',
                cep: clientData.dados_cobranca.cep || '',
                endereco: clientData.dados_cobranca.endereco || '',
                numero: clientData.dados_cobranca.numero || '',
                bairro: clientData.dados_cobranca.bairro || '',
                cidade: clientData.dados_cobranca.cidade || '',
                uf: clientData.dados_cobranca.uf || '',
                telefone: clientData.dados_cobranca.telefone || '',
                celular: clientData.dados_cobranca.celular || '',
                email: clientData.dados_cobranca.email || '',
                site: clientData.dados_cobranca.site || '',
                observacao: clientData.dados_cobranca.observacao || ''
              });

              setCategoriasSelecionadas(clientData.categorias || []);
              setContatos(clientData.contatos_existentes.map((c: any) => ({
                id: c.id.toString(),
                nome: c.nome || '',
                cargo: c.cargo || '',
                email: c.email || '',
                telefone: c.telefone || '',
                dataNascimento: c.data_nascimento ? c.data_nascimento.split('T')[0] : '',
                setoresContato: c.setores_contato || []
              })));
            } else {
              console.error('Erro ao buscar dados do cliente existente:', clientDataResponse.message);
            }
          } catch (error) {
            console.error('Erro ao invocar get_cliente_data:', error);
          }
        };
        fetchClientData(dados.id);
      } else {
        const tipoDetectado = dados.documento ? detectarTipoDocumento(dados.documento) : 'CPF';

        setDadosGerais(prev => ({
          ...prev,
          fantasia: dados.nome_cliente || '',
          razao: dados.nome_cliente || '',
          documento: dados.documento || '',
          telefone: dados.telefone || '',
          email: dados.email || '',
          tipoDocumento: tipoDetectado
        }));
        setOrigemCliente(dados.origem);
        setIdPreCad(dados.id);
      }

      console.log('Dados processados automaticamente:', dados);
    } catch (error) {
      console.error('Erro ao processar dados recebidos:', error);
    }
  };

  const adicionarContato = () => {
    const novoContato: Contato = {
      id: `new_${Date.now()}`,
      nome: '',
      cargo: '',
      email: '',
      telefone: '',
      dataNascimento: '',
      setoresContato: []
    };
    setContatos([...contatos, novoContato]);
  };

  const removerContato = (id: string) => {
    setContatos(contatos.filter(contato => contato.id !== id));
  };

  const atualizarContato = (id: string, campo: keyof Contato, valor: string) => {
    let valorFinal = valor;

    if (campo === 'telefone') {
      valorFinal = aplicarMascaraTelefone(valor);
    }

    setContatos(contatos.map(contato =>
      contato.id === id ? { ...contato, [campo]: valorFinal } : contato
    ));

    if (campo === 'email' && valor) {
      const chave = `contato_${id}_email`;
      const erro = validarEmail(valor) ? '' : 'Email inválido';
      setErros(prev => ({
        ...prev,
        [chave]: erro
      }));
    }
  };

  const toggleCategoria = (categoriaId: number) => {
    setCategoriasSelecionadas(prev =>
      prev.includes(categoriaId)
        ? prev.filter(id => id !== categoriaId)
        : [...prev, categoriaId]
    );
  };

  const toggleSetorPortal = (setorId: number) => {
    setDadosGerais(prev => ({
      ...prev,
      setoresPortal: prev.setoresPortal.includes(setorId)
        ? prev.setoresPortal.filter(id => id !== setorId)
        : [...prev.setoresPortal, setorId]
    }));
  };

  const toggleSetorContato = (contatoId: string, setorId: number) => {
    setContatos(prev => prev.map(contato =>
      contato.id === contatoId
        ? {
          ...contato,
          setoresContato: contato.setoresContato.includes(setorId)
            ? contato.setoresContato.filter(id => id !== setorId)
            : [...contato.setoresContato, setorId]
        }
        : contato
    ));
  };

  const renderGuiaGeral = () => (
    <div className="formulario-conteudo">
      <div className="form-grid">
        {/* Checkbox de Ativo no canto superior */}
        <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontWeight: 600, color: '#374151', fontSize: '0.95rem' }}>
              <input
                type="checkbox"
                checked={dadosGerais.ativo}
                onChange={(e) => setDadosGerais({ ...dadosGerais, ativo: e.target.checked })}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#4F46E5',
                  marginRight: '0.5rem'
                }}
              />
              Ativo
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>Tipo de Documento</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="tipoDocumento"
                value="CPF"
                checked={dadosGerais.tipoDocumento === 'CPF'}
                onChange={(e) => setDadosGerais({ ...dadosGerais, tipoDocumento: e.target.value as 'CPF' })}
              />
              CPF
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="tipoDocumento"
                value="CNPJ"
                checked={dadosGerais.tipoDocumento === 'CNPJ'}
                onChange={(e) => setDadosGerais({ ...dadosGerais, tipoDocumento: e.target.value as 'CNPJ' })}
              />
              CNPJ
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="tipoDocumento"
                value="nenhum"
                checked={dadosGerais.tipoDocumento === 'nenhum'}
                onChange={(e) => setDadosGerais({ ...dadosGerais, tipoDocumento: e.target.value as 'nenhum' })}
              />
              Nenhum
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>Documento</label>
          <input
            type="text"
            value={dadosGerais.documento}
            onChange={(e) => handleDocumentoChange(e.target.value, 'geral')}
            disabled={dadosGerais.tipoDocumento === 'nenhum'}
            placeholder={dadosGerais.tipoDocumento === 'CPF' ? '000.000.000-00' : dadosGerais.tipoDocumento === 'CNPJ' ? '00.000.000/0000-00' : ''}
            className={erros.documento ? 'erro' : ''}
          />
          {erros.documento && <span className="erro-texto">{erros.documento}</span>}
        </div>

        <div className="form-group">
          <label>Fantasia</label>
          <input
            type="text"
            value={dadosGerais.fantasia}
            onChange={(e) => setDadosGerais({ ...dadosGerais, fantasia: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Razão Social</label>
          <input
            type="text"
            value={dadosGerais.razao}
            onChange={(e) => setDadosGerais({ ...dadosGerais, razao: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Tipo de Registro</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="tipoRegistro"
                value="IE"
                checked={dadosGerais.tipoRegistro === 'IE'}
                onChange={(e) => setDadosGerais({ ...dadosGerais, tipoRegistro: e.target.value as 'IE' })}
              />
              IE
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="tipoRegistro"
                value="RG"
                checked={dadosGerais.tipoRegistro === 'RG'}
                onChange={(e) => setDadosGerais({ ...dadosGerais, tipoRegistro: e.target.value as 'RG' })}
              />
              RG
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>Registro</label>
          <input
            type="text"
            value={dadosGerais.registro}
            onChange={(e) => setDadosGerais({ ...dadosGerais, registro: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>CEP</label>
          <input
            type="text"
            value={dadosGerais.cep}
            onChange={(e) => handleCEPChange(e.target.value, 'geral')}
            placeholder="00000-000"
            className={erros.cep ? 'erro' : ''}
          />
          {erros.cep && <span className="erro-texto">{erros.cep}</span>}
        </div>

        <div className="form-group">
          <label>Endereço</label>
          <input
            type="text"
            value={dadosGerais.endereco}
            onChange={(e) => setDadosGerais({ ...dadosGerais, endereco: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Número</label>
          <input
            type="text"
            value={dadosGerais.numero}
            onChange={(e) => setDadosGerais({ ...dadosGerais, numero: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Bairro</label>
          <input
            type="text"
            value={dadosGerais.bairro}
            onChange={(e) => setDadosGerais({ ...dadosGerais, bairro: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Cidade</label>
          <input
            type="text"
            value={dadosGerais.cidade}
            onChange={(e) => setDadosGerais({ ...dadosGerais, cidade: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>UF</label>
          <UFSelect
  id="uf-gerais"
  value={dadosGerais.uf}
  onChange={(value) => setDadosGerais({ ...dadosGerais, uf: value })}
/>
        </div>

        <div className="form-group">
          <label>Telefone</label>
          <input
            type="text"
            value={dadosGerais.telefone}
            onChange={(e) => handleTelefoneChange(e.target.value, 'telefone', 'geral')}
            placeholder="(00) 0000-0000"
          />
        </div>

        <div className="form-group">
          <label>Celular</label>
          <input
            type="text"
            value={dadosGerais.celular}
            onChange={(e) => handleTelefoneChange(e.target.value, 'celular', 'geral')}
            placeholder="(00) 00000-0000"
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={dadosGerais.email}
            onChange={(e) => {
              setDadosGerais({ ...dadosGerais, email: e.target.value });
              validarCampo('email', e.target.value, 'geral');
            }}
            className={erros.email ? 'erro' : ''}
          />
          {erros.email && <span className="erro-texto">{erros.email}</span>}
        </div>

        <div className="form-group">
          <label>Site</label>
          <input
            type="url"
            value={dadosGerais.site}
            onChange={(e) => setDadosGerais({ ...dadosGerais, site: e.target.value })}
          />
        </div>

        <div className="form-group full-width">
          <label>Observação</label>
          <textarea
            value={dadosGerais.observacao}
            onChange={(e) => setDadosGerais({ ...dadosGerais, observacao: e.target.value })}
            rows={4}
          />
        </div>

        <div className="form-group">
          <label>Consultor</label>
          <ConsultorSelect
  id="consultor-gerais"
  value={dadosGerais.consultorId}
  onChange={(value) => setDadosGerais({ ...dadosGerais, consultorId: value })}
  consultores={consultores}
/>
        </div>

        <div className="form-group full-width">
          <label>Setores Portal</label>
          <div className="checkbox-grid">
            {setoresPortal.map(setor => (
              <label key={setor.id} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={dadosGerais.setoresPortal.includes(setor.id)}
                  onChange={() => toggleSetorPortal(setor.id)}
                />
                {setor.nome}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderGuiaCobranca = () => (
    <div className="formulario-conteudo">
      <div className="cobranca-header">
        <h3>Dados de Cobrança</h3>
        <button
          type="button"
          className="btn-copiar"
          onClick={copiarDadosGeraisParaCobranca}
          title="Copiar dados gerais para cobrança"
        >
          <FaCopy /> Copiar Dados Gerais
        </button>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label>Tipo de Documento</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="tipoDocumentoCobranca"
                value="CPF"
                checked={dadosCobranca.tipoDocumento === 'CPF'}
                onChange={(e) => setDadosCobranca({ ...dadosCobranca, tipoDocumento: e.target.value as 'CPF' })}
              />
              CPF
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="tipoDocumentoCobranca"
                value="CNPJ"
                checked={dadosCobranca.tipoDocumento === 'CNPJ'}
                onChange={(e) => setDadosCobranca({ ...dadosCobranca, tipoDocumento: e.target.value as 'CNPJ' })}
              />
              CNPJ
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="tipoDocumentoCobranca"
                value="nenhum"
                checked={dadosCobranca.tipoDocumento === 'nenhum'}
                onChange={(e) => setDadosCobranca({ ...dadosCobranca, tipoDocumento: e.target.value as 'nenhum' })}
              />
              Nenhum
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>Documento</label>
          <input
            type="text"
            value={dadosCobranca.documento}
            onChange={(e) => handleDocumentoChange(e.target.value, 'cobranca')}
            disabled={dadosCobranca.tipoDocumento === 'nenhum'}
            placeholder={dadosCobranca.tipoDocumento === 'CPF' ? '000.000.000-00' : dadosCobranca.tipoDocumento === 'CNPJ' ? '00.000.000/0000-00' : ''}
            className={erros.cobranca_documento ? 'erro' : ''}
          />
          {erros.cobranca_documento && <span className="erro-texto">{erros.cobranca_documento}</span>}
        </div>

        <div className="form-group">
          <label>Fantasia</label>
          <input
            type="text"
            value={dadosCobranca.fantasia}
            onChange={(e) => setDadosCobranca({ ...dadosCobranca, fantasia: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Razão Social</label>
          <input
            type="text"
            value={dadosCobranca.razao}
            onChange={(e) => setDadosCobranca({ ...dadosCobranca, razao: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Tipo de Registro</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="tipoRegistroCobranca"
                value="IE"
                checked={dadosCobranca.tipoRegistro === 'IE'}
                onChange={(e) => setDadosCobranca({ ...dadosCobranca, tipoRegistro: e.target.value as 'IE' })}
              />
              IE
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="tipoRegistroCobranca"
                value="RG"
                checked={dadosCobranca.tipoRegistro === 'RG'}
                onChange={(e) => setDadosCobranca({ ...dadosCobranca, tipoRegistro: e.target.value as 'RG' })}
              />
              RG
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>Registro</label>
          <input
            type="text"
            value={dadosCobranca.registro}
            onChange={(e) => setDadosCobranca({ ...dadosCobranca, registro: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>CEP</label>
          <input
            type="text"
            value={dadosCobranca.cep}
            onChange={(e) => handleCEPChange(e.target.value, 'cobranca')}
            placeholder="00000-000"
            className={erros.cobranca_cep ? 'erro' : ''}
          />
          {erros.cobranca_cep && <span className="erro-texto">{erros.cobranca_cep}</span>}
        </div>

        <div className="form-group">
          <label>Endereço</label>
          <input
            type="text"
            value={dadosCobranca.endereco}
            onChange={(e) => setDadosCobranca({ ...dadosCobranca, endereco: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Número</label>
          <input
            type="text"
            value={dadosCobranca.numero}
            onChange={(e) => setDadosCobranca({ ...dadosCobranca, numero: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Bairro</label>
          <input
            type="text"
            value={dadosCobranca.bairro}
            onChange={(e) => setDadosCobranca({ ...dadosCobranca, bairro: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Cidade</label>
          <input
            type="text"
            value={dadosCobranca.cidade}
            onChange={(e) => setDadosCobranca({ ...dadosCobranca, cidade: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>UF</label>
          <UFSelect
  id="uf-cobranca"
  value={dadosCobranca.uf}
  onChange={(value) => setDadosCobranca({ ...dadosCobranca, uf: value })}
/>
        </div>

        <div className="form-group">
          <label>Telefone</label>
          <input
            type="text"
            value={dadosCobranca.telefone}
            onChange={(e) => handleTelefoneChange(e.target.value, 'telefone', 'cobranca')}
            placeholder="(00) 0000-0000"
          />
        </div>

        <div className="form-group">
          <label>Celular</label>
          <input
            type="text"
            value={dadosCobranca.celular}
            onChange={(e) => handleTelefoneChange(e.target.value, 'celular', 'cobranca')}
            placeholder="(00) 0000-0000"
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={dadosCobranca.email}
            onChange={(e) => {
              setDadosCobranca({ ...dadosCobranca, email: e.target.value });
              validarCampo('email', e.target.value, 'cobranca');
            }}
            className={erros.cobranca_email ? 'erro' : ''}
          />
          {erros.cobranca_email && <span className="erro-texto">{erros.cobranca_email}</span>}
        </div>

        <div className="form-group">
          <label>Site</label>
          <input
            type="url"
            value={dadosCobranca.site}
            onChange={(e) => setDadosCobranca({ ...dadosCobranca, site: e.target.value })}
          />
        </div>

        <div className="form-group full-width">
          <label>Observação</label>
          <textarea
            value={dadosCobranca.observacao}
            onChange={(e) => setDadosCobranca({ ...dadosCobranca, observacao: e.target.value })}
            rows={4}
          />
        </div>
      </div>
    </div>
  );

  const renderGuiaCategorias = () => (
    <div className="formulario-conteudo">
      <h3>Selecione as Categorias</h3>
      <div className="checkbox-grid">
        {categorias.map(categoria => (
          <label key={categoria.id} className="checkbox-label categoria-item">
            <input
              type="checkbox"
              checked={categoriasSelecionadas.includes(categoria.id)}
              onChange={() => toggleCategoria(categoria.id)}
            />
            {categoria.nome}
          </label>
        ))}
      </div>
    </div>
  );

  const renderGuiaContatos = () => (
    <div className="formulario-conteudo">
      <div className="contatos-header">
        <h3>Contatos</h3>
        <button type="button" className="btn-adicionar" onClick={adicionarContato}>
          <FaPlus /> Adicionar Contato
        </button>
      </div>

      <div className="contatos-lista">
        {contatos.map((contato, index) => (
          <div key={contato.id} className="contato-item">
            <div className="contato-header">
              <h4>Contato {index + 1}</h4>
              <button
                type="button"
                className="btn-remover"
                onClick={() => removerContato(contato.id)}
              >
                <FaTrash />
              </button>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Nome</label>
                <input
                  type="text"
                  value={contato.nome}
                  onChange={(e) => atualizarContato(contato.id, 'nome', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Cargo</label>
                <input
                  type="text"
                  value={contato.cargo}
                  onChange={(e) => atualizarContato(contato.id, 'cargo', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={contato.email}
                  onChange={(e) => atualizarContato(contato.id, 'email', e.target.value)}
                  className={erros[`contato_${contato.id}_email`] ? 'erro' : ''}
                />
                {erros[`contato_${contato.id}_email`] && <span className="erro-texto">{erros[`contato_${contato.id}_email`]}</span>}
              </div>

              <div className="form-group">
                <label>Telefone</label>
                <input
                  type="text"
                  value={contato.telefone}
                  onChange={(e) => atualizarContato(contato.id, 'telefone', e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="form-group">
                <label>Data de Nascimento</label>
                <input
                  type="date"
                  value={contato.dataNascimento}
                  onChange={(e) => atualizarContato(contato.id, 'dataNascimento', e.target.value)}
                />
              </div>
              {/* Mini Painel de Setores para o Contato */}
              {dadosGerais.setoresPortal.length > 0 && (
                <div className="form-group full-width">
                  <label>Setores Portal para este Contato</label>
                  <div className="mini-painel-setores-contato">
                    <div className="mini-painel-header-contato">
                      <span className="mini-painel-titulo">Setores Disponíveis</span>
                      <span className="contador-setores-contato">
                        {contato.setoresContato.length}/{dadosGerais.setoresPortal.length}
                      </span>
                    </div>
                    <div className="mini-painel-conteudo-contato">
                      {setoresPortal
                        .filter(setor => dadosGerais.setoresPortal.includes(setor.id))
                        .map(setor => (
                          <label key={setor.id} className="mini-setor-item-contato">
                            <input
                              type="checkbox"
                              checked={contato.setoresContato.includes(setor.id)}
                              onChange={() => toggleSetorContato(contato.id, setor.id)}
                            />
                            <span className="mini-setor-nome-contato">{setor.nome}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {contatos.length === 0 && (
          <div className="sem-contatos">
            <p>Nenhum contato adicionado. Clique em "Adicionar Contato" para começar.</p>
          </div>
        )}
      </div>
    </div>
  );

  const validarCamposObrigatorios = (): boolean => {
    const novosErros: { [key: string]: string } = {};

    if (!dadosGerais.documento.trim()) {
      novosErros.documento = 'Documento é obrigatório';
    }
    if (!dadosGerais.fantasia.trim()) {
      novosErros.fantasia = 'Fantasia é obrigatória';
    }
    if (!dadosGerais.razao.trim()) {
      novosErros.razao = 'Razão Social é obrigatória';
    }

    if (!dadosCobranca.documento.trim()) {
      novosErros.cobranca_documento = 'Documento de cobrança é obrigatório';
    }
    if (!dadosCobranca.fantasia.trim()) {
      novosErros.cobranca_fantasia = 'Fantasia de cobrança é obrigatória';
    }
    if (!dadosCobranca.razao.trim()) {
      novosErros.cobranca_razao = 'Razão Social de cobrança é obrigatória';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const salvarCliente = async () => {
    try {
      if (!validarCamposObrigatorios()) {
        showWarning(`Erro ${isEditing ? `na Edição` : `no Cadastro`}`, 'Por favor, preencha todos os campos obrigatórios.');
        return;
      }

      const dadosParaSalvar = {
        dados: {
          cliente_id: clienteId,
          dados_gerais: {
            tipo_documento: dadosGerais.tipoDocumento,
            documento: dadosGerais.documento,
            fantasia: dadosGerais.fantasia,
            razao: dadosGerais.razao,
            tipo_registro: dadosGerais.tipoRegistro,
            registro: dadosGerais.registro || null,
            cep: dadosGerais.cep || null,
            endereco: dadosGerais.endereco || null,
            numero: dadosGerais.numero || null,
            bairro: dadosGerais.bairro || null,
            cidade: dadosGerais.cidade || null,
            uf: dadosGerais.uf || null,
            telefone: dadosGerais.telefone || null,
            celular: dadosGerais.celular || null,
            email: dadosGerais.email || null,
            site: dadosGerais.site || null,
            observacao: dadosGerais.observacao || null,
            consultor_id: dadosGerais.consultorId || null,
            setores_portal: dadosGerais.setoresPortal || null,
            origem: origemCliente || null,
            id_pre_cad: id_pre_cad || 0,
            ativo: dadosGerais.ativo
          },

          dados_cobranca: {
            tipo_documento: dadosCobranca.tipoDocumento,
            documento: dadosCobranca.documento,
            fantasia: dadosCobranca.fantasia,
            razao: dadosCobranca.razao,
            tipo_registro: dadosCobranca.tipoRegistro,
            registro: dadosCobranca.registro || null,
            cep: dadosCobranca.cep || null,
            endereco: dadosCobranca.endereco || null,
            numero: dadosCobranca.numero || null,
            bairro: dadosCobranca.bairro || null,
            cidade: dadosCobranca.cidade || null,
            uf: dadosCobranca.uf || null,
            telefone: dadosCobranca.telefone || null,
            celular: dadosCobranca.celular || null,
            email: dadosCobranca.email || null,
            site: dadosCobranca.site || null,
            observacao: dadosCobranca.observacao || null
          },

          categorias: categoriasSelecionadas,

          contatos: contatos.map(contato => ({
            id: contato.id.startsWith('new_') ? null : parseInt(contato.id),
            nome: contato.nome,
            cargo: contato.cargo || null,
            email: contato.email || null,
            telefone: contato.telefone || null,
            data_nascimento: contato.dataNascimento || null,
            setores_contato: contato.setoresContato || []
          }))
        }
      };

      console.log('Dados a serem salvos:', dadosParaSalvar);

      const response = await core.invoke<{ success: boolean }>(isEditing ? "editar_cliente" : "salvar_cliente", dadosParaSalvar);

      if (response.success) {
        showSuccess(`Sucesso ${isEditing ? `na Edição` : `no Cadastro`}`, `Cliente ${isEditing ? 'editado' : 'salvo'} com sucesso!`);
        setOrigemCliente(null);
        setIdPreCad(null);
        setClienteId(null);
        setIsEditing(false);
        setDadosGerais({
          tipoDocumento: 'CPF', documento: '', fantasia: '', razao: '', tipoRegistro: 'RG', registro: '',
          cep: '', endereco: '', numero: '', bairro: '', cidade: '', uf: '', telefone: '', celular: '',
          email: '', site: '', observacao: '', consultorId: null, setoresPortal: [], ativo: true
        });
        setDadosCobranca({
          tipoDocumento: 'CPF', documento: '', fantasia: '', razao: '', tipoRegistro: 'RG', registro: '',
          cep: '', endereco: '', numero: '', bairro: '', cidade: '', uf: '', telefone: '', celular: '',
          email: '', site: '', observacao: ''
        });
        setCategoriasSelecionadas([]);
        setContatos([]);
      } else {
        showError(`Erro ${isEditing ? `na Edição` : `no Cadastro`}`, `Erro ao ${isEditing ? 'editar' : 'salvar'} cliente`);
      }

    } catch (error) {
      console.error(`Erro ao ${isEditing ? 'editar' : 'salvar'} cliente:`, error);
      showError(`Erro ${isEditing ? `na Edição` : `no Cadastro`}`, `Erro ao ${isEditing ? 'editar' : 'salvar'} cliente\n` + String(error));
    }
  };

  const fecharJanela = async () => {
    const webview = getCurrentWebviewWindow();
    await webview.close();
  }

  return (
    <div className="formulario-cliente-container">
      <h1 className="formulario-titulo">Cadastro de Cliente</h1>

      <div className="guias-container">
        <div className="guias-header">
          <button
            className={`guia-btn ${guiaAtiva === 'geral' ? 'ativa' : ''}`}
            onClick={() => setGuiaAtiva('geral')}
          >
            <FaUser /> Dados Gerais
          </button>
          <button
            className={`guia-btn ${guiaAtiva === 'cobranca' ? 'ativa' : ''}`}
            onClick={() => setGuiaAtiva('cobranca')}
          >
            <FaMoneyBill /> Cobrança
          </button>
          <button
            className={`guia-btn ${guiaAtiva === 'categorias' ? 'ativa' : ''}`}
            onClick={() => setGuiaAtiva('categorias')}
          >
            <FaTags /> Categorias
          </button>
          <button
            className={`guia-btn ${guiaAtiva === 'contatos' ? 'ativa' : ''}`}
            onClick={() => setGuiaAtiva('contatos')}
          >
            <FaAddressBook /> Contatos
          </button>
        </div>

        <div className="guia-conteudo">
          {guiaAtiva === 'geral' && renderGuiaGeral()}
          {guiaAtiva === 'cobranca' && renderGuiaCobranca()}
          {guiaAtiva === 'categorias' && renderGuiaCategorias()}
          {guiaAtiva === 'contatos' && renderGuiaContatos()}
        </div>
      </div>

      <div className="formulario-acoes">
        <button type="button" className="btn-cancelar" onClick={fecharJanela}>
          Cancelar
        </button>
        <button type="button" className="btn-salvar" onClick={salvarCliente}>
          {isEditing ? 'Editar Cliente' : 'Salvar Cliente'}
        </button>
      </div>
      <Modal {...modal} onClose={closeModal} />
    </div>
  );
};