import { Inicio } from '../view/Main';

import { CadastrarClientes } from '../view/geral/CadastrarCliente';


export const partialsRoutes = {

  'cadastrar-clientes': <CadastrarClientes />,
  'cadastrar-categoria': <Inicio />, // TODO: <CadastrarCategoria />
  'cadastro-usuario-portal': <Inicio />, // TODO: <CadastroUsuarioPortal />
  'cadastrar-setor-usuario': <Inicio />, // TODO: <CadastrarSetorUsuario />
  'cadastrar-consultor': <Inicio />, // TODO: <CadastrarConsultor />
  'cadastrar-laboratorio-terceirizado': <Inicio />, // TODO: <CadastrarLaboratorioTerceirizado />

};

export type PartialsRoutes = keyof typeof partialsRoutes;