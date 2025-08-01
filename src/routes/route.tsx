// route.tsx
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

  // SUBROTAS DE CLIENTES - Mark hasLayout as false for CadastrarClientes
// No layout for this route
  
  'cadastrar-clientes': { component: <CadastrarClientes />, hasLayout: false },
  'visualizar-clientes': { component: <VisualizarClientes />, hasLayout: false },
  'gerenciar-categoria': { component: <GerenciarCategoria />, hasLayout: false },
  'cadastro-usuario-portal': { component: <UsuarioPortal />, hasLayout: false },
  'gerenciar-setor': { component: <GerenciarSetores />, hasLayout: false },
  'historico-usuario': { component: <HistoricoUsuario />, hasLayout: false },
  'cadastrar-consultor': { component: <Inicio />, hasLayout: false },
  'cadastrar-laboratorio-terceirizado': { component: <Inicio />, hasLayout: false },

  // SUBROTAS DE ESTRUTURAS
  'estrutura-tipo': { component: <Inicio />, hasLayout: true },
  'estrutura-grupo': { component: <Inicio />, hasLayout: true },
  'estrutura-matriz': { component: <Inicio />, hasLayout: true },
  'estrutura-unidade': { component: <Inicio />, hasLayout: true },
  'estrutura-parametro': { component: <Inicio />, hasLayout: true },
  'estrutura-pg-coleta': { component: <Inicio />, hasLayout: true },
  'estrutura-pop': { component: <Inicio />, hasLayout: true },
  'estrutura-tecnica': { component: <Inicio />, hasLayout: true },
  'estrutura-identificacao': { component: <Inicio />, hasLayout: true },
  'estrutura-metodologia': { component: <Inicio />, hasLayout: true },
  'estrutura-legislacao': { component: <Inicio />, hasLayout: true },
  'estrutura-categoria': { component: <Inicio />, hasLayout: true },
  'estrutura-forma-contato': { component: <Inicio />, hasLayout: true },
  'estrutura-observacao': { component: <Inicio />, hasLayout: true },
  'estrutura-submatriz': { component: <Inicio />, hasLayout: true },

  // SUBROTAS DE RELACIONAMENTOS
  'rel-parametro-pop': { component: <Inicio />, hasLayout: true },
  'rel-limite-quantificacao': { component: <Inicio />, hasLayout: true },
  'rel-legislacao-parametro': { component: <Inicio />, hasLayout: true },
  'rel-pacote-parametro': { component: <Inicio />, hasLayout: true },
  'rel-tecnica-etapa': { component: <Inicio />, hasLayout: true },

  // SUBROTAS DE CONTAS
  'cadastrar-calculo': { component: <Inicio />, hasLayout: true },
  'visualizar-calculo': { component: <Inicio />, hasLayout: true },

  'chat': { component: <ChatContainer />, hasLayout: false }, 
  'criar-planilha': { component: <CriarPlanilha />, hasLayout: false }, 
  'cadastrar-planilha': {component: <CadastrarPlanilha />, hasLayout: false},

  // Planilha
  'planilha-laboratorio': {component: <Planilha />, hasLayout: false},
  
  'cadastrar-amostra': {component: <CadastrarAmostra />, hasLayout: false}
};

export type AuthenticatedRoute = keyof typeof authenticatedRoutes;