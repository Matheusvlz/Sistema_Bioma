#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod controller;
mod model;

use controller::geral::cadastrarcliente_controller::{
    cliente_categoria, consultor, editar_cliente, get_cliente_data, salvar_cliente, setor_portal,
};
use controller::geral_controller::{
    buscar_amostras_pre_cadastradas, buscar_clientes_sem_cadastro, buscar_coletas,
    buscar_coletas_portal, buscar_solicitacoes_usuarios,
};
use controller::login_controller::fazer_login;
use model::usuario::usuario_logado;
use model::usuario::verificar_autenticacao;

use controller::geral::visualizarcliente_controller::{buscar_categorias, buscar_consultores};

use controller::components::search_controller::{
    buscar_clientes_dropdown, buscar_clientes_filtros,
};

use controller::inicio_controller::get_data_for_screen;
use controller::inicio_controller::get_data_inicio;

fn main() {
    dotenvy::dotenv().ok();
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            fazer_login,
            buscar_clientes_sem_cadastro,
            buscar_amostras_pre_cadastradas,
            buscar_coletas,
            buscar_solicitacoes_usuarios,
            buscar_coletas_portal,
            usuario_logado,
            verificar_autenticacao,
            cliente_categoria,
            consultor,
            setor_portal,
            salvar_cliente,
            get_data_inicio,
            get_data_for_screen,
            editar_cliente,
            get_cliente_data,
            buscar_clientes_filtros,  //SearchLayout
            buscar_clientes_dropdown, //SearchLayout
            buscar_categorias,
            buscar_consultores
        ])
        .run(tauri::generate_context!())
        .expect("Erro ao iniciar o app Tauri");
}
