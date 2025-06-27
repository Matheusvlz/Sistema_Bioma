#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod controller;
mod model;

use controller::login_controller::fazer_login;
use model::usuario::usuario_logado;
use model::usuario::verificar_autenticacao;
use controller::inicio_controller::get_data_inicio;

fn main() {
    dotenvy::dotenv().ok(); 
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            fazer_login,
            usuario_logado, // 👈 importante
            verificar_autenticacao,
            get_data_inicio
        ])
        .run(tauri::generate_context!())
        .expect("Erro ao iniciar o app Tauri");
}