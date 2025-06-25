#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod controller;
mod model;

use controller::login_controller::fazer_login;
use model::usuario::usuario_logado;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            fazer_login,
            usuario_logado, // 👈 importante
        ])
        .run(tauri::generate_context!())
        .expect("Erro ao iniciar o app Tauri");
}