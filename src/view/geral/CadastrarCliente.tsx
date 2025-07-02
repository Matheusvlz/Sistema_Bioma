import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { FaUser, FaMoneyBill, FaTags, FaAddressBook, FaPlus, FaTrash, FaCopy } from 'react-icons/fa';
import './css/CadastrarCliente.css';
import { core } from "@tauri-apps/api";

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
}

interface DadosGerais {
  tipoDocumento: 'cpf' | 'cnpj' | 'nenhum';
  documento: string;
  fantasia: string;
  razao: string;
  tipoRegistro: 'ie' | 'rg';
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
}

interface DadosCobranca {
  tipoDocumento: 'cpf' | 'cnpj' | 'nenhum';
  documento: string;
  fantasia: string;
  razao: string;
  tipoRegistro: 'ie' | 'rg';
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
  if (numeros.length <= 10) {
    return numeros
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  } else {
    return numeros
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }
};

const aplicarMascaraCEP = (valor: string): string => {
  return valor
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1');
};

const validarCPF = (cpf: string): boolean => {
  const numeros = cpf.replace(/\D/g, '');
  if (numeros.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(numeros)) return false;
  
  // Validação do primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(numeros.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(numeros.charAt(9))) return false;
  
  // Validação do segundo dígito verificador
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
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(numeros)) return false;
  
  // Validação do primeiro dígito verificador
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
  
  // Validação do segundo dígito verificador
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
  const [guiaAtiva, setGuiaAtiva] = useState<'geral' | 'cobranca' | 'categorias' | 'contatos'>('geral');
  
  // Estados para dados
  const [dadosGerais, setDadosGerais] = useState<DadosGerais>({
    tipoDocumento: 'cpf',
    documento: '',
    fantasia: '',
    razao: '',
    tipoRegistro: 'rg',
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
    setoresPortal: []
  });

  const [dadosCobranca, setDadosCobranca] = useState<DadosCobranca>({
    tipoDocumento: 'cpf',
    documento: '',
    fantasia: '',
    razao: '',
    tipoRegistro: 'rg',
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

  // Estados para listas
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [consultores, setConsultores] = useState<Consultor[]>([]);
  const [setoresPortal, setSetoresPortal] = useState<SetorPortal[]>([]);

  // Estados para erros
  const [erros, setErros] = useState<{[key: string]: string}>({});

  // Funções auxiliares
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
          if (tipoDoc === 'cpf' && !validarCPF(valor)) {
            erro = 'CPF inválido';
          } else if (tipoDoc === 'cnpj' && !validarCNPJ(valor)) {
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
    const tipoDoc = tipo === 'cobranca' ? dadosCobranca.tipoDocumento : dadosGerais.tipoDocumento;
    let valorFormatado = valor;
    
    if (tipoDoc === 'cpf') {
      valorFormatado = aplicarMascaraCPF(valor);
    } else if (tipoDoc === 'cnpj') {
      valorFormatado = aplicarMascaraCNPJ(valor);
    }
    
    if (tipo === 'cobranca') {
      setDadosCobranca({...dadosCobranca, documento: valorFormatado});
    } else {
      setDadosGerais({...dadosGerais, documento: valorFormatado});
    }
    
    validarCampo('documento', valorFormatado, tipo);
  };

  const handleTelefoneChange = (valor: string, campo: 'telefone' | 'celular', tipo: 'geral' | 'cobranca' = 'geral') => {
    const valorFormatado = aplicarMascaraTelefone(valor);
    
    if (tipo === 'cobranca') {
      setDadosCobranca({...dadosCobranca, [campo]: valorFormatado});
    } else {
      setDadosGerais({...dadosGerais, [campo]: valorFormatado});
    }
  };

  const handleCEPChange = (valor: string, tipo: 'geral' | 'cobranca' = 'geral') => {
    const valorFormatado = aplicarMascaraCEP(valor);
    
    if (tipo === 'cobranca') {
      setDadosCobranca({...dadosCobranca, cep: valorFormatado});
    } else {
      setDadosGerais({...dadosGerais, cep: valorFormatado});
    }
    
    validarCampo('cep', valorFormatado, tipo);
  };


  // Simulando dados das consultas
  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Carregar categorias
        const categoriasResponse: GeralResponse = await core.invoke<{ success: boolean }>('cliente_categoria');
        if (categoriasResponse.success && categoriasResponse.data) {
          setCategorias(categoriasResponse.data);
        }

        // Carregar consultores
        const consultoresResponse: GeralResponse = await core.invoke<{ success: boolean }>('consultor');
        if (consultoresResponse.success && consultoresResponse.data) {
          setConsultores(consultoresResponse.data);
        }

        // Carregar setores portal
        const setoresResponse: GeralResponse = await core.invoke<{ success: boolean }>('setor_portal');
        if (setoresResponse.success && setoresResponse.data) {
          setSetoresPortal(setoresResponse.data);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        // Manter dados simulados em caso de erro
        setCategorias([
          { id: 1, nome: 'Categoria A' },
          { id: 2, nome: 'Categoria B' }
        ]);
        setConsultores([
          { id: 1, nome: 'João Silva', documento: '123.456.789-00', telefone: '(11) 99999-9999', email: 'joao@empresa.com', ativo: true }
        ]);
        setSetoresPortal([
          { id: 1, nome: 'Setor Administrativo' }
        ]);
      }
    };

    carregarDados();
  }, []);

  const adicionarContato = () => {
    const novoContato: Contato = {
      id: Date.now().toString(),
      nome: '',
      cargo: '',
      email: '',
      telefone: '',
      dataNascimento: ''
    };
    setContatos([...contatos, novoContato]);
  };

  const removerContato = (id: string) => {
    setContatos(contatos.filter(contato => contato.id !== id));
  };

  const atualizarContato = (id: string, campo: keyof Contato, valor: string) => {
    setContatos(contatos.map(contato => 
      contato.id === id ? { ...contato, [campo]: valor } : contato
    ));
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

  const renderGuiaGeral = () => (
    <div className="formulario-conteudo">
      <div className="form-grid">
        <div className="form-group">
          <label>Tipo de Documento</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="tipoDocumento"
                value="cpf"
                checked={dadosGerais.tipoDocumento === 'cpf'}
                onChange={(e) => setDadosGerais({...dadosGerais, tipoDocumento: e.target.value as 'cpf'})}
              />
              CPF
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="tipoDocumento"
                value="cnpj"
                checked={dadosGerais.tipoDocumento === 'cnpj'}
                onChange={(e) => setDadosGerais({...dadosGerais, tipoDocumento: e.target.value as 'cnpj'})}
              />
              CNPJ
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="tipoDocumento"
                value="nenhum"
                checked={dadosGerais.tipoDocumento === 'nenhum'}
                onChange={(e) => setDadosGerais({...dadosGerais, tipoDocumento: e.target.value as 'nenhum'})}
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
            placeholder={dadosGerais.tipoDocumento === 'cpf' ? '000.000.000-00' : dadosGerais.tipoDocumento === 'cnpj' ? '00.000.000/0000-00' : ''}
            className={erros.documento ? 'erro' : ''}
          />
          {erros.documento && <span className="erro-texto">{erros.documento}</span>}
        </div>

        <div className="form-group">
          <label>Fantasia</label>
          <input
            type="text"
            value={dadosGerais.fantasia}
            onChange={(e) => setDadosGerais({...dadosGerais, fantasia: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Razão Social</label>
          <input
            type="text"
            value={dadosGerais.razao}
            onChange={(e) => setDadosGerais({...dadosGerais, razao: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Tipo de Registro</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="tipoRegistro"
                value="ie"
                checked={dadosGerais.tipoRegistro === 'ie'}
                onChange={(e) => setDadosGerais({...dadosGerais, tipoRegistro: e.target.value as 'ie'})}
              />
              IE
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="tipoRegistro"
                value="rg"
                checked={dadosGerais.tipoRegistro === 'rg'}
                onChange={(e) => setDadosGerais({...dadosGerais, tipoRegistro: e.target.value as 'rg'})}
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
            onChange={(e) => setDadosGerais({...dadosGerais, registro: e.target.value})}
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
            onChange={(e) => setDadosGerais({...dadosGerais, endereco: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Número</label>
          <input
            type="text"
            value={dadosGerais.numero}
            onChange={(e) => setDadosGerais({...dadosGerais, numero: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Bairro</label>
          <input
            type="text"
            value={dadosGerais.bairro}
            onChange={(e) => setDadosGerais({...dadosGerais, bairro: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Cidade</label>
          <input
            type="text"
            value={dadosGerais.cidade}
            onChange={(e) => setDadosGerais({...dadosGerais, cidade: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>UF</label>
          <select
            value={dadosGerais.uf}
            onChange={(e) => setDadosGerais({...dadosGerais, uf: e.target.value})}
          >
            <option value="">Selecione...</option>
            {ESTADOS_BRASIL.map(estado => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>
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
              setDadosGerais({...dadosGerais, email: e.target.value});
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
            onChange={(e) => setDadosGerais({...dadosGerais, site: e.target.value})}
          />
        </div>

        <div className="form-group full-width">
          <label>Observação</label>
          <textarea
            value={dadosGerais.observacao}
            onChange={(e) => setDadosGerais({...dadosGerais, observacao: e.target.value})}
            rows={4}
          />
        </div>

        <div className="form-group">
          <label>Consultor</label>
          <select
            value={dadosGerais.consultorId || ''}
            onChange={(e) => setDadosGerais({...dadosGerais, consultorId: e.target.value ? Number(e.target.value) : null})}
          >
            <option value="">Selecione um consultor...</option>
            {consultores.filter(c => c.ativo).map(consultor => (
              <option key={consultor.id} value={consultor.id}>
                {consultor.nome} - {consultor.documento}
              </option>
            ))}
          </select>
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
                value="cpf"
                checked={dadosCobranca.tipoDocumento === 'cpf'}
                onChange={(e) => setDadosCobranca({...dadosCobranca, tipoDocumento: e.target.value as 'cpf'})}
              />
              CPF
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="tipoDocumentoCobranca"
                value="cnpj"
                checked={dadosCobranca.tipoDocumento === 'cnpj'}
                onChange={(e) => setDadosCobranca({...dadosCobranca, tipoDocumento: e.target.value as 'cnpj'})}
              />
              CNPJ
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="tipoDocumentoCobranca"
                value="nenhum"
                checked={dadosCobranca.tipoDocumento === 'nenhum'}
                onChange={(e) => setDadosCobranca({...dadosCobranca, tipoDocumento: e.target.value as 'nenhum'})}
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
            placeholder={dadosCobranca.tipoDocumento === 'cpf' ? '000.000.000-00' : dadosCobranca.tipoDocumento === 'cnpj' ? '00.000.000/0000-00' : ''}
            className={erros.cobranca_documento ? 'erro' : ''}
          />
          {erros.cobranca_documento && <span className="erro-texto">{erros.cobranca_documento}</span>}
        </div>

        <div className="form-group">
          <label>Fantasia</label>
          <input
            type="text"
            value={dadosCobranca.fantasia}
            onChange={(e) => setDadosCobranca({...dadosCobranca, fantasia: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Razão Social</label>
          <input
            type="text"
            value={dadosCobranca.razao}
            onChange={(e) => setDadosCobranca({...dadosCobranca, razao: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Tipo de Registro</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="tipoRegistroCobranca"
                value="ie"
                checked={dadosCobranca.tipoRegistro === 'ie'}
                onChange={(e) => setDadosCobranca({...dadosCobranca, tipoRegistro: e.target.value as 'ie'})}
              />
              IE
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="tipoRegistroCobranca"
                value="rg"
                checked={dadosCobranca.tipoRegistro === 'rg'}
                onChange={(e) => setDadosCobranca({...dadosCobranca, tipoRegistro: e.target.value as 'rg'})}
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
            onChange={(e) => setDadosCobranca({...dadosCobranca, registro: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>CEP</label>
          <input
            type="text"
            value={dadosCobranca.cep}
            onChange={(e) => setDadosCobranca({...dadosCobranca, cep: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Endereço</label>
          <input
            type="text"
            value={dadosCobranca.endereco}
            onChange={(e) => setDadosCobranca({...dadosCobranca, endereco: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Número</label>
          <input
            type="text"
            value={dadosCobranca.numero}
            onChange={(e) => setDadosCobranca({...dadosCobranca, numero: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Bairro</label>
          <input
            type="text"
            value={dadosCobranca.bairro}
            onChange={(e) => setDadosCobranca({...dadosCobranca, bairro: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Cidade</label>
          <input
            type="text"
            value={dadosCobranca.cidade}
            onChange={(e) => setDadosCobranca({...dadosCobranca, cidade: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>UF</label>
          <select
            value={dadosCobranca.uf}
            onChange={(e) => setDadosCobranca({...dadosCobranca, uf: e.target.value})}
          >
            <option value="">Selecione...</option>
            {ESTADOS_BRASIL.map(estado => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Telefone</label>
          <input
            type="text"
            value={dadosCobranca.telefone}
            onChange={(e) => setDadosCobranca({...dadosCobranca, telefone: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Celular</label>
          <input
            type="text"
            value={dadosCobranca.celular}
            onChange={(e) => setDadosCobranca({...dadosCobranca, celular: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={dadosCobranca.email}
            onChange={(e) => setDadosCobranca({...dadosCobranca, email: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Site</label>
          <input
            type="url"
            value={dadosCobranca.site}
            onChange={(e) => setDadosCobranca({...dadosCobranca, site: e.target.value})}
          />
        </div>

        <div className="form-group full-width">
          <label>Observação</label>
          <textarea
            value={dadosCobranca.observacao}
            onChange={(e) => setDadosCobranca({...dadosCobranca, observacao: e.target.value})}
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
                />
              </div>

              <div className="form-group">
                <label>Telefone</label>
                <input
                  type="text"
                  value={contato.telefone}
                  onChange={(e) => atualizarContato(contato.id, 'telefone', e.target.value)}
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

  return (
    <Layout>
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
          <button type="button" className="btn-cancelar">
            Cancelar
          </button>
          <button type="button" className="btn-salvar">
            Salvar Cliente
          </button>
        </div>
      </div>
    </Layout>
  );
};