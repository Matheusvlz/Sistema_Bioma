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

// Agora exportamos apenas os componentes de conteúdo, sem o Layout
// O Layout será gerenciado pelo App.tsx de forma persistente
export const authenticatedRoutes = {
  inicio: <Inicio />,
  reports: <Reports />,
  settings: <Settings />,
  laboratorio: <Laboratorio />,
  geral: <Geral />,
  administracao: <Administracao />,
  agenda: <Agenda />,
  financeiro: <Financeiro />,
  qualidade: <Qualidade />,
  frota: <Frota />
};

// Tipo para as rotas autenticadas
export type AuthenticatedRoute = keyof typeof authenticatedRoutes;

