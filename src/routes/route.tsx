import { Inicio } from '../view/Main';
import { Reports } from '../view/Reports';
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
import VisualizarSubMatrizes from '../view/geral/VisualizarSubMatrizes';
import VisualizarParametroPop from '../view/geral/VisualizarParametroPop';

// Define a new type for route configurations
interface RouteConfig {
  component: React.ReactNode;
  hasLayout: boolean; // Add this property
}

export const authenticatedRoutes: Record<string, RouteConfig> = {
  inicio: { component: <Inicio />, hasLayout: true },
  reports: { component: <Reports />, hasLayout: true },
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
  'rel-limite-quantificacao': { component: <Inicio />, hasLayout: true },
  'rel-legislacao-parametro': { component: <VisualizarLegislacaoParametro />, hasLayout: false },
  'rel-pacote-parametro': { component: <Inicio />, hasLayout: true },
  'rel-tecnica-etapa': { component: <Inicio />, hasLayout: true },

  // SUBROTAS DE CONTAS
  'cadastrar-calculo': { component: <Inicio />, hasLayout: true },
  'visualizar-calculo': { component: <Inicio />, hasLayout: true },
  

  'chat': { component: <ChatContainer />, hasLayout: false }, 
  'criar-planilha': { component: <CriarPlanilha />, hasLayout: false }, 
  'cadastrar-planilha': {component: <CadastrarPlanilha />, hasLayout: false},

  // LAB
  'planilha-laboratorio': {component: <Planilha />, hasLayout: false},
  'cadastrar-amostra': {component: <CadastrarAmostra />, hasLayout: false},
  'visualizar-amostras': {component: <VisualizarAmostra />, hasLayout: false}

};

export type AuthenticatedRoute = keyof typeof authenticatedRoutes;