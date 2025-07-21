#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod controller;
mod model;
mod socket_listener;

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

use controller::chat::chat_controller::get_users;
use controller::inicio_case::case_x9_controller::{
    salvar_ticket, update_kanban, update_kanban_card_urgency_and_index,
};
use controller::inicio_controller::{get_data_for_screen, get_data_inicio};
use controller::notification_controller::{
    finalizar_notificacao, get_inicio_data_from_api, mark_kanban_card_as_completed,
}; // This import is correct and already there.
use controller::settings_controller::update_user_settings;
use socket_listener::send_ws_message; // Importar o novo comando

use controller::geral::categoria_controller::{buscar_categorias_cadastro, criar_categoria, editar_categoria, excluir_categoria};
fn main() {
    dotenvy::dotenv().ok();

    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle(); // Obtenha o AppHandle aqui

            tauri::async_runtime::spawn({
                let app_handle_clone = app_handle.clone(); // Clone o AppHandle para a nova thread
                async move {
                    // Inicia a conexão WebSocket no backend Rust
                    // O ID do usuário será enviado pelo frontend *após* o login.
                    socket_listener::iniciar_socket(
                        "ws://192.168.15.26:8082/ws/notificacoes",
                        app_handle_clone, // Passe o clone do AppHandle
                    )
                    .await;
                }
            });

            Ok(())
        })
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
            buscar_consultores,
            update_user_settings,
            salvar_ticket,
            send_ws_message,
            get_inicio_data_from_api,
            finalizar_notificacao,
            mark_kanban_card_as_completed,
            update_kanban,
            update_kanban_card_urgency_and_index,
            get_users,
            buscar_categorias_cadastro,
            criar_categoria,
            editar_categoria,
            excluir_categoria
        ])
        .run(tauri::generate_context!())
        .expect("Erro ao iniciar o app Tauri");
}
