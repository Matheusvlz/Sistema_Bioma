import { Inicio } from '../view/Main';
import { Relatorio } from '../view/Relatorio';
import { Settings } from '../view/Settings';
import { Laboratorio } from '../view/Laboratorio';
import { Administracao } from '../view/Administracao';
import { Geral } from '../view/Geral';
import { Agenda } from '../view/Agenda';
import { Financeiro } from '../view/Financeiro';
import { Frota } from '../view/Frota';
import { Qualidade } from '../view/Qualidade';
import { CadastrarClientes } from '../view/geral/CadastrarCliente';
import { VisualizarClientes } from '../view/geral/VisualizarCliente';
import { ChatContainer } from '../components/chat/ChatContainer';
import { GerenciarCategoria } from '../view/geral/GerenciarCategoria';
import { UsuarioPortal } from '../view/geral/UsuarioPortal';
import { CriarPlanilha } from '../view/qualidade/CriarPlanilha';
import { CadastrarPlanilha } from  '../view/qualidade/CadastrarPlanilha';
import { GerenciarSetores } from '../view/geral/GerenciarSetores';
import { Planilha } from '../view/laboratorio/Planilha';
import { CadastrarAmostra } from '../view/laboratorio/CadastrarAmostra';
import { HistoricoUsuario } from '../view/geral/HistoricoUsuario';
import { VisualizarAmostra } from '../view/laboratorio/VisualizarAmostra';
import VisualizarLabsTerceirizados from '../view/geral/VisualizarLabsTerceirizados';
import VisualizarLegislacaoParametro from '../view/geral/VisualizarLegislacaoParametro';
import CadastrarColeta from '../view/geral/CadastrarColeta';
import CalculoIDE from '../view/geral/CalculoIDE';

import AnaliseAtividadesPage from '../view/administracao/AnaliseAtividadesPage';
import { CadastrarUsuario }   from '../view/administracao/CadastrarUsuarios';
import { ListarUsuarios } from '../view/administracao/ListarUsuarios';
import { GerenciarPermissoesSetor } from '../view/administracao/GerenciarPermissoesSetor';
import { VisualizarHistorico } from '../view/administracao/VisualizarHistorico';

import VisualizarConsultor from '../view/geral/VisualizarConsultor';
import VisualizarTipos from '../view/geral/VisualizarTipos';
import VisualizarGrupos from '../view/geral/VisualizarGrupos';
import VisualizarMatrizes from '../view/geral/VisualizarMatrizes';
import VisualizarUnidades from '../view/geral/VisualizarUnidades';
import VisualizarParametros from '../view/geral/VisualizarParametros';
import VisualizarPGColeta from '../view/geral/VisualizarPGColeta';
import VisualizarPops from '../view/geral/VisualizarPops';
import VisualizarTecnicas from '../view/geral/VisualizarTecnicas';
import VisualizarIdentificacoes from '../view/geral/VisualizarIdentificacoes';
import VisualizarMetodologias from '../view/geral/VisualizarMetodologias';
import VisualizarLegislacoes from '../view/geral/VisualizarLegislacoes';
import VisualizarCategorias from '../view/geral/VisualizarCategorias';
import VisualizarFormasContato from '../view/geral/VisualizarFormasContato';
import VisualizarObservacoes from '../view/geral/VisualizarObservacoes';
import Cadastrar_Motorista from '../view/frota/Cadastrar_Motorista';
import Cadastrar_Veiculo from '../view/frota/Cadastrar_Veiculo';
import Cadastrar_Posto from '../view/frota/Cadastrar_Posto';
import Cadastrar_Viagem from '../view/frota/Cadastrar_Viagem';
import Visualizar_Viagem from '../view/frota/Visualizar_Viagem';
import Cadatrar_Abastecimento from '../view/frota/Cadastrar_Abastecimento';
import VisualizarAbastecimentos from '../view/frota/VisualizarAbastecimentos';
import VisualizarSubMatrizes from '../view/geral/VisualizarSubMatrizes';
import VisualizarParametroPop from '../view/geral/VisualizarParametroPop';
import { VisualizarLqIncerteza } from '../view/geral/VisualizarLqIncerteza';
import GerenciarTecnicaEtapa from '../view/geral/GerenciarTecnicaEtapa';
import { VisualizarPacotes } from '../view/geral/VisualizarPacotes';
import { CadastrarPacote } from '../view/geral/CadastrarPacote';
import PersonalizarAmostra from '../view/laboratorio/PersonalizarAmostra';
import FormularioFornecedor from '../view/qualidade/FormularioFornecedor';
import VisualizarFornecedores from '../view/qualidade/VisualizarFornecedores';
import VisualizarQualificacoes from '../view/qualidade/VisualizarQualificacoes';
import VisualizarPesquisas from '../view/qualidade/VisualizarPesquisas';
import FormularioPesquisa from '../view/qualidade/FormularioPesquisa';

// Imports que seu amigo adicionou
import Cadastrar_Manutencao from '../view/frota/Cadastrar_Manuntencao';
import Visualizar_Manutencao from '../view/frota/Visualizar_Manutencao';
import LocalizacaoTempoReal from '../view/frota/Localizacao_Tempo_Real';
// Define a new type for route configurations
interface RouteConfig {
  component: React.ReactNode;
  hasLayout: boolean; // Add this property
}

export const authenticatedRoutes: Record<string, RouteConfig> = {
  inicio: { component: <Inicio />, hasLayout: true },
  relatorio: { component: <Relatorio />, hasLayout: true },
  settings: { component: <Settings />, hasLayout: true },
  laboratorio: { component: <Laboratorio />, hasLayout: true },
  geral: { component: <Geral />, hasLayout: true },
  administracao: { component: <Administracao />, hasLayout: true },
  agenda: { component: <Agenda />, hasLayout: true },
  financeiro: { component: <Financeiro />, hasLayout: true },
  qualidade: { component: <Qualidade />, hasLayout: true },
  frota: { component: <Frota />, hasLayout: true },
  

  'cadastrar-clientes': { component: <CadastrarClientes />, hasLayout: false },
  'visualizar-clientes': { component: <VisualizarClientes />, hasLayout: false },
  'gerenciar-categoria': { component: <GerenciarCategoria />, hasLayout: false },
  'cadastro-usuario-portal': { component: <UsuarioPortal />, hasLayout: false },
  'gerenciar-setor': { component: <GerenciarSetores />, hasLayout: false },
  'historico-usuario': { component: <HistoricoUsuario />, hasLayout: false },
  'cadastrar-consultor': { component: <VisualizarConsultor />, hasLayout: false },
  'cadastrar-laboratorio-terceirizado': { component: <VisualizarLabsTerceirizados />, hasLayout: false },

  // SUBROTAS DE ESTRUTURAS
  'estrutura-tipo': { component: <VisualizarTipos />, hasLayout: false },
  'estrutura-grupo': { component: <VisualizarGrupos />, hasLayout: false },
  'estrutura-unidade': { component: <VisualizarUnidades />, hasLayout: false },
  'estrutura-parametro': { component: <VisualizarParametros />, hasLayout: false },
  'estrutura-pg-coleta': { component: <VisualizarPGColeta />, hasLayout: false },
  'estrutura-pop': { component: <VisualizarPops />, hasLayout: false },
  'estrutura-tecnica': { component: <VisualizarTecnicas />, hasLayout: false },
  'estrutura-identificacao': { component: <VisualizarIdentificacoes />, hasLayout: false },
  'estrutura-metodologia': { component: <VisualizarMetodologias />, hasLayout: false },
  'estrutura-legislacao': { component: <VisualizarLegislacoes />, hasLayout: false },
  'estrutura-categoria': { component: <VisualizarCategorias />, hasLayout: false },
  'estrutura-forma-contato': { component: <VisualizarFormasContato />, hasLayout: false },
  'estrutura-observacao': { component: <VisualizarObservacoes />, hasLayout: false },
  'estrutura-matriz': { component: <VisualizarMatrizes />, hasLayout: false },
  'estrutura-submatriz': { component: <VisualizarSubMatrizes />, hasLayout: false },


  // SUBROTAS DE RELACIONAMENTOS
  'rel-parametro-pop': { component: <VisualizarParametroPop />, hasLayout: false },
  'rel-limite-quantificacao': { component: <VisualizarLqIncerteza />, hasLayout: false },
  'rel-legislacao-parametro': { component: <VisualizarLegislacaoParametro />, hasLayout: false },
  'rel-pacote-parametro': { component: <VisualizarPacotes />, hasLayout: false },
  'cadastrar-pacote': { component: <CadastrarPacote onSalvar={() => {}} onCancelar={() => {}} />, hasLayout: false },
  'rel-tecnica-etapa': { component: <GerenciarTecnicaEtapa />, hasLayout: false },

  // SUBROTAS DE CONTAS
  'cadastrar-calculo': { component: <CalculoIDE />, hasLayout: true },
  'visualizar-calculo': { component: <Inicio />, hasLayout: true },
  

  'chat': { component: <ChatContainer />, hasLayout: false }, 
  'criar-planilha': { component: <CriarPlanilha />, hasLayout: false }, 
  'cadastrar-planilha': {component: <CadastrarPlanilha />, hasLayout: false},

  // LAB
  'planilha-laboratorio': {component: <Planilha />, hasLayout: false},
  'cadastrar-amostra': {component: <CadastrarAmostra />, hasLayout: false},
  'visualizar-amostras': {component: <VisualizarAmostra />, hasLayout: false},

  'cadastrar-motorista': {component: <Cadastrar_Motorista />, hasLayout: false},

  'cadastrar-veiculo': {component: <Cadastrar_Veiculo />, hasLayout: false},

  'cadastrar-posto': {component: <Cadastrar_Posto />, hasLayout: false},

  'cadastrar-viagem': {component: <Cadastrar_Viagem />, hasLayout: false},

  'visualizar-viagem': {component: <Visualizar_Viagem />, hasLayout: false},

  'cadastrar_abastecimento': {component: <Cadatrar_Abastecimento />, hasLayout: false},

  'visualizar-abastecimento': {component: <VisualizarAbastecimentos />, hasLayout: false},
  
  'cadastrar-manutencao': {component: <Cadastrar_Manutencao />, hasLayout: false},

  'visualizar-manutencao': {component: <Visualizar_Manutencao />, hasLayout: false},
  
  'localizacao-temporeal': {component: <LocalizacaoTempoReal />, hasLayout: false},

  'cadastrar-coleta': {component: <CadastrarColeta />, hasLayout: false},

  'lab-personalizar-amostra': { component: <PersonalizarAmostra />, hasLayout: false },








  // Administração
  'analisar-coletores': { component: <AnaliseAtividadesPage />, hasLayout: false },
  'cadastrar-usuarios-admin': { component: <CadastrarUsuario itemParaEdicao={null} onSalvar={function (): void {throw new Error('Function not implemented.'); } } onCancelar={function (): void { throw new Error('Function not implemented.'); } } />, hasLayout: false },
  'admin-usuarios': { component: <ListarUsuarios />, hasLayout: false },
  'admin-permissoes-setor': { component: <GerenciarPermissoesSetor />, hasLayout: false },
  'admin-historico': { component: <VisualizarHistorico />, hasLayout: false },













  // Qualidade
  'qualidade-fornecedor-form': { component: <FormularioFornecedor />, hasLayout: false },
  'visualizar-fornecedores': { component: <VisualizarFornecedores />, hasLayout: false },
  'visualizar-qualificacoes': { component: <VisualizarQualificacoes />, hasLayout: false },
  'qualidade-pesquisas': { component: <VisualizarPesquisas />, hasLayout: false },
  'qualidade-pesquisa-formulario': { component: <FormularioPesquisa />, hasLayout: false },
};

export type AuthenticatedRoute = keyof typeof authenticatedRoutes;