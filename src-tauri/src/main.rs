#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod controller;
mod model;
mod socket_listener;
mod config;
mod utils;

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
    buscar_clientes_usuario, buscar_setores_portal, alterar_permissao_setor, adicionar_cliente_usuario, remover_cliente_usuario, buscar_todos_setores_cliente, alterar_setor_cliente, buscar_usuarios_cliente, configurar_usuarios, remover_cadastro_usuario, excluir_usuario_cliente, reenviar_email_usuario, verificar_email, cadastrar_usuario, historico_usuario
};
use controller::geral::setor_controller::{
    buscar_setores_cadastro, criar_setor, editar_setor, excluir_setor
};
use controller::geral::consultor_controller::{ show_cadastrados, cadastrar_consultor, editar_consultor, deletar_consultor
}; 

use controller::login_controller::fazer_login;
use controller::login_controller::validate_user_credentials;

use model::usuario::usuario_logado;
use model::usuario::verificar_autenticacao;
use model::usuario::get_usuario_nome;


use controller::inicio_controller::{get_data_inicio, get_data_for_screen};
use controller::settings_controller::update_user_settings;
use controller::inicio_case::case_x9_controller::{salvar_ticket, update_kanban, update_kanban_card_urgency_and_index};
use socket_listener::send_ws_message;
use controller::notification_controller::{get_inicio_data_from_api, finalizar_notificacao, mark_kanban_card_as_completed};
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

use controller::qualidade::xlsx_controller::{import_xlsx_file, import_xlsx_from_bytes, get_xlsx_sheet_names, get_xlsx_sheet_names_from_bytes};

// Importar os comandos de fórmulas melhorados
use controller::qualidade::formula_controller::{
    evaluate_formula,
    update_spreadsheet_cell,
    validate_formula,
    get_formula_suggestions,
    get_all_formula_functions,
    parse_cell_range,
    calculate_range_sum,
    get_cell_dependencies,
    format_formula_result,
    get_formula_categories,
    get_functions_by_category,
};

use controller::qualidade::tauri_print_commands_controller::{
        generate_pdf_from_html,
            print_html,
            save_print_html,
            get_available_printers,
            validate_printer,
            get_default_print_settings
};
use controller::laboratorio::planilha_controller::{ consultar_amostras_por_planilha, consultar_intervalos_planilhas, gerar_nova_planilha};
use controller::qualidade::json_parser_controller::{save_template, list_templates, delete_template, decode_base64_to_json, update_template, get_template_by_id};
use controller::laboratorio::laboratorio_controller::{ buscar_checagem, buscar_nao_iniciada, buscar_em_analise, buscar_temperatura, buscar_amostras_finalizadas, buscar_amostras_bloqueadas, buscar_registro_insumo };
use controller::laboratorio::cadastrar_amostra_controller::{buscar_tercerizado, buscar_identificacao, buscar_legislacao, buscar_metodologias, buscar_acreditacao, buscar_categoria_amostra, consultar_consultores, buscar_dados_cliente, buscar_parametros, buscar_orcamentos, cadastrar_amostra_completa};

use std::env;
use crate::config::get_ws_url;

fn main() {
    if let Ok(exe_path) = env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            let _ = env::set_current_dir(exe_dir);
        }
    }

    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle();

            tauri::async_runtime::spawn({
                let app_handle_clone = app_handle.clone();
                async move {
                    let ws_url = get_ws_url(&app_handle_clone);
                    socket_listener::iniciar_socket(&ws_url, app_handle_clone).await;
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
            show_cadastrados,
            cadastrar_consultor,
            editar_consultor,
            deletar_consultor,
            buscar_clientes_usuario,
            buscar_setores_portal,
            alterar_permissao_setor,
            adicionar_cliente_usuario,
            remover_cliente_usuario,
            buscar_todos_setores_cliente,
            alterar_setor_cliente,
            buscar_setores_cadastro,
            criar_setor,
            editar_setor,
            excluir_setor,
            buscar_usuarios_cliente,
            configurar_usuarios,
            remover_cadastro_usuario,
            excluir_usuario_cliente,
            reenviar_email_usuario,
            verificar_email,
            cadastrar_usuario,
            historico_usuario,

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
            download_file_to_downloads,
            import_xlsx_file,
            import_xlsx_from_bytes,
            get_xlsx_sheet_names,
            get_xlsx_sheet_names_from_bytes,
            // Comandos de fórmulas melhorados
            evaluate_formula,
            update_spreadsheet_cell,
            validate_formula,
            get_formula_suggestions,
            get_all_formula_functions,
            parse_cell_range,
            calculate_range_sum,
            get_cell_dependencies,
            format_formula_result,
            get_formula_categories,
            get_functions_by_category,
            //PDF Printer    
            generate_pdf_from_html,
            print_html,
            save_print_html,
            get_available_printers,
            validate_printer,
            get_default_print_settings,
            save_template,
            list_templates,
            delete_template,
            decode_base64_to_json,
            update_template,
            get_template_by_id,
            get_usuario_nome,
            validate_user_credentials,
            buscar_checagem, 
            buscar_nao_iniciada, 
            buscar_em_analise, 
            buscar_temperatura,
            buscar_amostras_finalizadas, 
            buscar_amostras_bloqueadas, 
            buscar_registro_insumo,
            // planilha laboratorio
            consultar_amostras_por_planilha,
            consultar_intervalos_planilhas,
            gerar_nova_planilha,
            buscar_tercerizado, 
            buscar_identificacao, 
            buscar_legislacao,
            buscar_metodologias, 
            buscar_acreditacao, 
            buscar_categoria_amostra, 
            consultar_consultores,
            buscar_dados_cliente,
            buscar_parametros,
            buscar_orcamentos,
            cadastrar_amostra_completa
        ])
        .run(tauri::generate_context!())
        .expect("Erro ao iniciar o app Tauri");
}
