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
import Login from '../view/Login';
import { CadastrarClientes } from '../view/geral/CadastrarCliente';

export const routes = {
  login: <Login />,
  inicio: <Inicio />,
  reports: <Reports />,
  settings: <Settings />,
  laboratorio: <Laboratorio />,
  geral: <Geral />,
  administracao: <Administracao />,
  agenda: <Agenda />,
  financeiro: <Financeiro />,
  qualidade: <Qualidade />,
  frota: <Frota />,

  // SUBROTAS DE CLIENTES - SUBSTITUA <Inicio /> PELOS COMPONENTES ESPECÍFICOS
  'cadastrar-clientes': <CadastrarClientes />,
  'visualizar-cliente': <Inicio />, // TODO: <VisualizarCliente />
  'cadastrar-categoria': <Inicio />, // TODO: <CadastrarCategoria />
  'cadastro-usuario-portal': <Inicio />, // TODO: <CadastroUsuarioPortal />
  'cadastrar-setor-usuario': <Inicio />, // TODO: <CadastrarSetorUsuario />
  'cadastrar-consultor': <Inicio />, // TODO: <CadastrarConsultor />
  'cadastrar-laboratorio-terceirizado': <Inicio />, // TODO: <CadastrarLaboratorioTerceirizado />
  
  // SUBROTAS DE ESTRUTURAS - SUBSTITUA <Inicio /> PELOS COMPONENTES ESPECÍFICOS
  'estrutura-tipo': <Inicio />, // TODO: <EstruturaTipo />
  'estrutura-grupo': <Inicio />, // TODO: <EstruturaGrupo />
  'estrutura-matriz': <Inicio />, // TODO: <EstruturaMatriz />
  'estrutura-unidade': <Inicio />, // TODO: <EstruturaUnidade />
  'estrutura-parametro': <Inicio />, // TODO: <EstruturaParametro />
  'estrutura-pg-coleta': <Inicio />, // TODO: <EstruturaPGColeta />
  'estrutura-pop': <Inicio />, // TODO: <EstruturaPOP />
  'estrutura-tecnica': <Inicio />, // TODO: <EstruturaTecnica />
  'estrutura-identificacao': <Inicio />, // TODO: <EstruturaIdentificacao />
  'estrutura-metodologia': <Inicio />, // TODO: <EstruturaMetodologia />
  'estrutura-legislacao': <Inicio />, // TODO: <EstruturaLegislacao />
  'estrutura-categoria': <Inicio />, // TODO: <EstruturaCategoria />
  'estrutura-forma-contato': <Inicio />, // TODO: <EstruturaFormaContato />
  'estrutura-observacao': <Inicio />, // TODO: <EstruturaObservacao />
  'estrutura-submatriz': <Inicio />, // TODO: <EstruturaSubmatriz />
  
  // SUBROTAS DE RELACIONAMENTOS - SUBSTITUA <Inicio /> PELOS COMPONENTES ESPECÍFICOS
  'rel-parametro-pop': <Inicio />, // TODO: <RelacionamentoParametroPOP />
  'rel-limite-quantificacao': <Inicio />, // TODO: <RelacionamentoLimiteQuantificacao />
  'rel-legislacao-parametro': <Inicio />, // TODO: <RelacionamentoLegislacaoParametro />
  'rel-pacote-parametro': <Inicio />, // TODO: <RelacionamentoPacoteParametro />
  'rel-tecnica-etapa': <Inicio />, // TODO: <RelacionamentoTecnicaEtapa />
  
  // SUBROTAS DE CONTAS - SUBSTITUA <Inicio /> PELOS COMPONENTES ESPECÍFICOS
  'cadastrar-calculo': <Inicio />, // TODO: <CadastrarCalculo />
  'visualizar-calculo': <Inicio />, // TODO: <VisualizarCalculo />
};