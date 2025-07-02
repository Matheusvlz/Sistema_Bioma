#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod controller;
mod model;

use controller::login_controller::fazer_login;
use controller::geral_controller::{
    buscar_clientes_sem_cadastro,
    buscar_amostras_pre_cadastradas,
    buscar_coletas,
    buscar_solicitacoes_usuarios,
    buscar_coletas_portal
};
use model::usuario::usuario_logado;
use model::usuario::verificar_autenticacao;
use controller::geral::cadastrarcliente_controller::{
    cliente_categoria,
    consultor,
    setor_portal
};


use controller::inicio_controller::get_data_inicio;
use controller::inicio_controller::get_data_for_screen;
fn main() 
{
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
            get_data_inicio,
            get_data_for_screen
        ])
        .run(tauri::generate_context!())
        .expect("Erro ao iniciar o app Tauri");
}