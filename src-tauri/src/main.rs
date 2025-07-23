#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod controller;
mod model;
mod socket_listener;

//COMPONENTES
use controller::components::search_controller::{
    buscar_clientes_dropdown, buscar_clientes_filtros, buscar_usuarios_dropdown
};

//GERAL
use controller::geral_controller::{
    buscar_amostras_pre_cadastradas, buscar_clientes_sem_cadastro, buscar_coletas, buscar_coletas_portal, buscar_solicitacoes_usuarios
};
use controller::geral::cadastrarcliente_controller::{
    cliente_categoria, consultor, editar_cliente, get_cliente_data, salvar_cliente, setor_portal
};
use controller::geral::visualizarcliente_controller::{
    buscar_categorias, buscar_consultores
};
use controller::geral::categoria_controller::{
    buscar_categorias_cadastro, criar_categoria, editar_categoria, excluir_categoria
};
use controller::geral::usuarioportal_controller::{
    buscar_clientes_usuario, buscar_setores_portal, alterar_permissao_setor, adicionar_cliente_usuario, remover_cliente_usuario, buscar_todos_setores_cliente, alterar_setor_cliente
};

use controller::login_controller::fazer_login;
use model::usuario::usuario_logado;
use model::usuario::verificar_autenticacao;
use controller::inicio_controller::{get_data_inicio, get_data_for_screen};
use controller::settings_controller::update_user_settings;
use controller::inicio_case::case_x9_controller::{salvar_ticket, update_kanban, update_kanban_card_urgency_and_index};
use socket_listener::send_ws_message; // Importar o novo comando
use controller::notification_controller::{get_inicio_data_from_api, finalizar_notificacao, mark_kanban_card_as_completed}; // This import is correct and already there.
use controller::chat::chat_controller::{
    get_users, 
    create_chat, 
    get_user_chats, 
    send_message, 
    get_chat_messages, 
    create_direct_chat,
    send_file_message
};
use controller::download_controller::{download_file_to_downloads, download_file_bytes};


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
            //SearchLayout
            buscar_clientes_filtros,
            buscar_clientes_dropdown,
            buscar_usuarios_dropdown, 

            //GERAL
            buscar_clientes_sem_cadastro,//Geral
            buscar_amostras_pre_cadastradas,//Geral
            buscar_coletas,//Geral
            buscar_solicitacoes_usuarios,//Geral
            buscar_coletas_portal,//Geral
            cliente_categoria,//Cadastrar Clientes
            consultor,//Cadastrar Clientes
            setor_portal,//Cadastrar Clientes
            salvar_cliente,//Cadastrar Clientes
            editar_cliente,//Cadastrar Clientes
            get_cliente_data,//Cadastrar Clientes
            buscar_categorias,//Visualizar Clientes
            buscar_consultores,//Visualizar Clientes
            buscar_categorias_cadastro,//Gerenciar Categorias
            criar_categoria,//Gerenciar Categorias
            editar_categoria,//Gerenciar Categorias
            excluir_categoria,//Gerenciar Categorias
            buscar_clientes_usuario,
            buscar_setores_portal,
            alterar_permissao_setor,
            adicionar_cliente_usuario,
            remover_cliente_usuario,
            buscar_todos_setores_cliente,
            alterar_setor_cliente,

            fazer_login,
            usuario_logado,
            verificar_autenticacao,
            get_data_inicio,
            get_data_for_screen,
            update_user_settings,
            salvar_ticket,
            send_ws_message,
            get_inicio_data_from_api,
            finalizar_notificacao,
            mark_kanban_card_as_completed,
            update_kanban,
            update_kanban_card_urgency_and_index,
            get_users,
            create_chat,
            get_user_chats,
            send_message,
            get_chat_messages,
            create_direct_chat,
            send_file_message,
            download_file_to_downloads
        ])
        .run(tauri::generate_context!())
        .expect("Erro ao iniciar o app Tauri");
}
