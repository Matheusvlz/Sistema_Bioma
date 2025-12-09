#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod controller;
mod model;
mod socket_listener;
mod config;
mod utils;

use controller::inicio_controller::{get_data_inicio, get_data_for_screen};
use controller::inicio_case::case_x9_controller::{salvar_ticket, update_kanban, update_kanban_card_urgency_and_index};
use controller::notification_controller::{get_inicio_data_from_api, finalizar_notificacao, mark_kanban_card_as_completed};

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
use controller::laboratorio::amostra_controller::{iniciar_amostra_analise, obter_detalhes_amostra, buscar_amostras_nao_iniciadas};
use controller::laboratorio::resultado_controller::{solicitar_revisao, publicar_resultado, buscar_resultados_amostra, salvar_resultado, vistar_resultado, remover_visto_resultado, buscar_parametro_mapa,  buscar_detalhes_resultado,
    salvar_resultado_completo, alterar_pop_resultado, buscar_pops_alternativos};

use controller::laboratorio::amostra_broqueada_controller::{buscar_historico_bloqueio, bloquear_amostras, desbloquear_amostras, listar_amostras_bloqueadas };


use controller::geral::consultor_controller::{ show_cadastrados, cadastrar_consultor, editar_consultor, deletar_consultor }; 
use controller::geral::lab_terceirizado_controller::{
    listar_labs_terceirizados,
    cadastrar_lab_terceirizado,
    editar_lab_terceirizado,
    deletar_lab_terceirizado
};
// ✅ CORREÇÃO: Usamos os nomes de importação que já existiam, sem o sufixo _tauri.
use controller::geral::tipo_controller::{
    listar_tipos,
    cadastrar_tipo,
    editar_tipo,
    deletar_tipo
};
use controller::geral::grupo_controller::{
    listar_grupos,
    cadastrar_grupo,
    editar_grupo,
    deletar_grupo
};
use controller::geral::matriz_controller::{
    listar_matrizes,
    cadastrar_matriz,
    editar_matriz,
    deletar_matriz
};
use controller::geral::unidade_controller::{
    listar_unidades,
    cadastrar_unidade,
    editar_unidade,
    deletar_unidade
};
use controller::geral::parametro_controller::{
    listar_parametros,
    cadastrar_parametro,
    editar_parametro,
    deletar_parametro
};
use controller::geral::pop_controller::{
    listar_pops,
    cadastrar_pop,
    editar_pop,
    deletar_pop
};
use controller::geral::tecnica_controller::{
    listar_tecnicas,
    cadastrar_tecnica,
    editar_tecnica,
    deletar_tecnica
};
use controller::geral::pg_controller::{
    buscar_pg_ativo,
    criar_nova_versao_pg
};

use controller::geral::identificacao_controller::{
    listar_identificacoes,
    cadastrar_identificacao,
    editar_identificacao,
    deletar_identificacao
};

use controller::geral::metodologia_controller::{
    listar_metodologias,
    cadastrar_metodologia,
    editar_metodologia,
    deletar_metodologia
};

use controller::geral::legislacao_controller::{
    listar_legislacoes,
    cadastrar_legislacao,
    editar_legislacao,
    deletar_legislacao
};

use controller::geral::forma_contato_controller::{
    listar_formas_contato,
    cadastrar_forma_contato,
    editar_forma_contato,
    deletar_forma_contato
};

use controller::geral::observacao_controller::{
    listar_observacoes,
    cadastrar_observacao,
    editar_observacao,
    deletar_observacao
};

use controller::geral::sub_matriz_controller::{
    listar_sub_matrizes,
    cadastrar_sub_matriz,
    editar_sub_matriz,
    deletar_sub_matriz
};

use controller::geral::parametro_pop_controller::{
    listar_parametros_pops,
    cadastrar_parametro_pop,
    editar_parametro_pop,
    deletar_parametro_pop,
    listar_parametros_pops_por_grupo,
    atualizar_lq_incerteza_tauri,
    listar_grupos_parametros_tauri
};

use controller::geral::bi_financeiro_controller::{listar_auditoria_financeira_tauri, obter_kpis_financeiros_tauri};

use controller::geral::legislacao_parametro_controller::{
    listar_legislacao_parametro_tauri,
    cadastrar_legislacao_parametro_tauri,
    editar_legislacao_parametro_tauri,
    deletar_legislacao_parametro_tauri,
    listar_legislacoes_ativas_tauri,
    listar_parametros_simples_tauri,
    listar_pops_por_parametro_tauri
};

use controller::geral::pacote_controller::{
    listar_pacotes_tauri,
    buscar_pacote_por_id_tauri,
    criar_pacote_tauri,
    editar_pacote_tauri,
    deletar_pacote_tauri
};

use crate::controller::geral::etapa_controller::{
    listar_etapas,
    cadastrar_etapa,
    editar_etapa,
    deletar_etapa,
};
use crate::controller::geral::tecnica_etapa_controller::{
    listar_etapas_por_tecnica,
    relacionar_etapas_a_tecnica,
    remover_tecnica_etapa,
    reordenar_etapas_da_tecnica,
};

use crate::controller::geral::calculo_controller::{
    self, 
    validar_formula, 
    testar_formula, 
    salvar_calculo, 
    listar_calculos, 
    buscar_calculo_por_id, 
    editar_calculo, 
    deletar_calculo
}; 


use crate::controller::geral::analise_controller::{
    get_cidades_analise_command,
    get_clientes_analise_command,
    get_coletores_analise_command,
    get_analises_detalhadas_command,  // <-- ADICIONADO
    get_analise_agregada_command,      // <-- ADICIONADO
};


// Módulo: Laboratório
use controller::laboratorio::laboratorio_controller::{ salvar_temperatura_analise, buscar_checagem, buscar_nao_iniciada, buscar_em_analise, buscar_temperatura, buscar_amostras_finalizadas, buscar_amostras_bloqueadas, buscar_registro_insumo };
use controller::laboratorio::cadastrar_amostra_controller::{
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
    cadastrar_amostra_completa,
    buscar_pg,
    buscar_certificado,
    buscar_parametros_by_id
};



use controller::laboratorio::reagente_limpeza_registro_controller::{
    listar_reagentes_itens_tauri, criar_reagente_item_tauri, deletar_reagente_item_tauri,
    listar_registros_reagente_tauri, criar_registro_reagente_tauri, 
    editar_registro_reagente_tauri, registrar_uso_reagente_tauri
};

use controller::laboratorio::coleta_checagem_controller::{salvar_checagens_client,
            buscar_checagens_client};
use controller::laboratorio::visualizar_amostra::{
    buscar_amostras, gerar_relatorio_final
};
use controller::laboratorio::visualizar_relatorio_controller::{
    proxy_listar_clientes_revisao,
            proxy_listar_analises_revisadas,
            proxy_assinar_relatorios,
            gerar_relatorio_final2,
            gerar_relatorio_amostragem,
            gerar_relatorio_cq,
            gerar_relatorio_preview

};


use controller::laboratorio::amostra_personalizavel_controller::{
    listar_amostras_por_faixa_tauri,
    atualizar_amostras_em_lote_tauri
};

use controller::laboratorio::materia_prima_controller::{
    listar_materia_prima_tauri,
    cadastrar_materia_prima_tauri,
    editar_materia_prima_tauri,
    deletar_materia_prima_tauri,
    listar_tipos_materia_prima_tauri,
    listar_unidades_tauri, // <-- A função que estava causando o erro
};

use controller::laboratorio::insumo_controller::{
    listar_insumos_tauri,
    criar_insumo_tauri,
    editar_insumo_tauri,
    deletar_insumo_tauri,
    carregar_suporte_formulario_insumo_tauri,
    buscar_insumo_tauri
};

use controller::laboratorio::insumo_registro_controller::{
    listar_insumos_registros_tauri,
    criar_insumo_registro_tauri,
    editar_insumo_registro_tauri,
    deletar_insumo_registro_tauri,
    listar_fornecedores_dropdown_tauri,
    listar_insumos_por_tipo_tauri,
    buscar_receita_e_estoque_mp_tauri,
    listar_insumo_tipos_tauri,
};

use controller::laboratorio::insumo_registro_2_controller::{
    listar_insumo_registro_2_tauri,
    criar_insumo_registro_2_tauri,
    editar_insumo_registro_2_tauri,
    deletar_insumo_registro_2_tauri,
    atualizar_amostra_registro_2_tauri
};
use controller::laboratorio::materia_prima_registro_controller::{
    listar_materia_prima_registro_tauri,
    cadastrar_materia_prima_registro_tauri,
    editar_materia_prima_registro_tauri,
    deletar_materia_prima_registro_tauri,
    atualizar_obsoleto_materia_prima_registro_tauri
};
use controller::laboratorio::fila_trabalho_controller::{
    listar_fila_trabalho_tauri,
    iniciar_analises_tauri,
};

use controller::laboratorio::mapa_resultado_controller::{
    carregar_mapa_tauri,
    salvar_mapa_tauri,
};
use controller::admin::setor_controller::{
    listar_setores_command,
    criar_setor_command,
    listar_usuarios_por_setor_command,
    atualizar_usuarios_do_setor_command,
};
use controller::laboratorio::parametro_insumo_controller::{
    listar_parametros_pop_dropdown_tauri,
    listar_insumos_relacionados_tauri,
    listar_insumos_disponiveis_tauri,
    relacionar_insumos_parametro_tauri,
    remover_insumo_relacionado_tauri
};

use controller::admin::historico_controller::{
    listar_historico_command,
    listar_acoes_historico_command,
};

use controller::laboratorio::planilha_controller::{ consultar_amostras_por_planilha, consultar_intervalos_planilhas, gerar_nova_planilha};

// Módulo: Qualidade e Utilitários
use controller::qualidade::xlsx_controller::{import_xlsx_file, import_xlsx_from_bytes, get_xlsx_sheet_names, get_xlsx_sheet_names_from_bytes};
use controller::qualidade::formula_controller::{
    evaluate_formula, update_spreadsheet_cell, validate_formula, get_formula_suggestions,
    get_all_formula_functions, parse_cell_range, calculate_range_sum, get_cell_dependencies,
    format_formula_result, get_formula_categories, get_functions_by_category,
};
use controller::qualidade::tauri_print_commands_controller::{
    generate_pdf_from_html, print_html, save_print_html, get_available_printers,
    validate_printer, get_default_print_settings
};
use controller::qualidade::json_parser_controller::{save_template, list_templates, delete_template, decode_base64_to_json, update_template, get_template_by_id};


use controller::qualidade::fornecedor_controller::{
    buscar_fornecedor_detalhado_tauri,
    cadastrar_fornecedor_tauri,
    editar_fornecedor_tauri,
    deletar_fornecedor_tauri,
    listar_categorias_fornecedor_tauri,
    listar_fornecedores_tauri,
    listar_qualificacoes_tauri,
};

use controller::qualidade::pesquisa_controller::{
    listar_modelos_pesquisa_tauri,
    listar_itens_por_modelo_tauri,
    cadastrar_pesquisa_tauri,
    editar_pesquisa_tauri,
    // ADIÇÕES ABAIXO:
    buscar_pesquisa_por_id_tauri,
    listar_pesquisas_tauri,
    atualizar_status_pesquisa_tauri,
    listar_destinatarios_tauri,
    obter_resultados_por_item_tauri,
    salvar_analise_critica_tauri,
};

use controller::qualidade::estoque_controller::{
    listar_estoque_items_tauri,
    criar_estoque_item_tauri,
    editar_estoque_item_tauri,
    buscar_estoque_item_detalhado_tauri,
    criar_estoque_registro_tauri,
    listar_unidades_compra_tauri,
};







// Admin

use controller::admin::usuario_controller::{
    listar_usuarios_admin_command,
    buscar_usuario_admin_command,
    criar_usuario_admin_command,
    atualizar_usuario_admin_command,
    atualizar_status_usuario_admin_command
};

// Módulos de Componentes e Outros
use controller::components::search_controller::{
    buscar_clientes_dropdown, buscar_clientes_filtros, buscar_usuarios_dropdown
};
use controller::login_controller::{fazer_login, validate_user_credentials};
use model::usuario::{usuario_logado, verificar_autenticacao, get_usuario_nome};
use controller::settings_controller::update_user_settings;
use socket_listener::send_ws_message;
use controller::chat::chat_controller::{
    get_users, create_chat, get_user_chats, send_message, 
    get_chat_messages, create_direct_chat, send_file_message
};
use controller::download_controller::{download_file_to_downloads, download_file_bytes};
use controller::frota::frota_controller::{buscar_agendamentos_hoje};
use controller::frota::motoristas_controller::{buscar_motoristas, criar_motorista, atualizar_motorista, deletar_motorista};
use controller::frota::veiculo_controller::{buscar_marcas, deletar_veiculo, atualizar_veiculo, criar_veiculo, buscar_veiculos_e_marcas};
use controller::frota::posto_controller::{buscar_postos, criar_posto, atualizar_posto, deletar_posto};
use controller::frota::viagem_controller::{criar_frota_viagem, buscar_viagens, deletar_frota_viagem, atualizar_frota_viagem};
// --- Importações do Sistema ---
use controller::frota::manutencao_controller::{deletar_tipo_manutencao, buscar_tipos_manutencao, atualizar_frota_manutencao, buscar_manutencoes, criar_frota_manutencao, criar_tipo_manutencao, deletar_frota_manutencao};
use controller::frota::abastecimento_controller::{deletar_frota_abastecimento, criar_frota_abastecimento, atualizar_frota_abastecimento, buscar_abastecimento, buscar_abastecimento_filtrado};
use controller::geral::cadastrar_coleta_controller::{buscar_coleta_referente, atualizar_numero_amostra, buscar_cliente_referente};
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
     //   .plugin(tauri_plugin_dialog::init()) // Inicializa o plugin de diálogo
        .plugin(tauri_plugin_opener::init()) // Inicializa o plugin de abrir pastas/links
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            // Comandos de Início e Notificações
            get_data_inicio,
            get_data_for_screen,
            salvar_ticket,
            update_kanban,
            update_kanban_card_urgency_and_index,
            get_inicio_data_from_api,
            finalizar_notificacao,
            mark_kanban_card_as_completed,

            // Comandos Gerais (Clientes, Estruturas, etc.)
            buscar_amostras_pre_cadastradas,
            buscar_clientes_sem_cadastro,
            buscar_coletas,
            buscar_coletas_portal,
            buscar_solicitacoes_usuarios,
            cliente_categoria,
            consultor,
            editar_cliente,
            get_cliente_data,
            salvar_cliente,
            setor_portal,
            buscar_categorias,
            buscar_consultores,
            buscar_categorias_cadastro,
            criar_categoria,
            editar_categoria,
            excluir_categoria,
            buscar_clientes_usuario,
            buscar_setores_portal,
            alterar_permissao_setor,
            adicionar_cliente_usuario,
            remover_cliente_usuario,
            buscar_todos_setores_cliente,
            alterar_setor_cliente,
            buscar_usuarios_cliente,
            configurar_usuarios,
            remover_cadastro_usuario,
            excluir_usuario_cliente,
            reenviar_email_usuario,
            verificar_email,
            cadastrar_usuario,
            historico_usuario,
            buscar_setores_cadastro,
            criar_setor,
            editar_setor,
            excluir_setor,
            show_cadastrados,
            cadastrar_consultor,
            editar_consultor,
            deletar_consultor,
            listar_labs_terceirizados,
            cadastrar_lab_terceirizado,
            editar_lab_terceirizado,
            deletar_lab_terceirizado,
            listar_reagentes_itens_tauri,
            criar_reagente_item_tauri,
            deletar_reagente_item_tauri,
            listar_registros_reagente_tauri,
            criar_registro_reagente_tauri,
            editar_registro_reagente_tauri,
            registrar_uso_reagente_tauri,
            listar_auditoria_financeira_tauri,
            obter_kpis_financeiros_tauri,
            // ✅ CORREÇÃO: Usamos os comandos que já existiam, sem o sufixo.
            listar_tipos,
            cadastrar_tipo,
            editar_tipo,
            deletar_tipo,
            listar_grupos,
            cadastrar_grupo,
            editar_grupo,
            deletar_grupo,
            listar_matrizes,
            cadastrar_matriz,
            editar_matriz,
            deletar_matriz,
            listar_unidades,
            cadastrar_unidade,
            editar_unidade,
            deletar_unidade,
            listar_parametros,
            cadastrar_parametro,
            editar_parametro,
            deletar_parametro,
            listar_pops,
            cadastrar_pop,
            editar_pop,
            deletar_pop,
            listar_tecnicas,
            cadastrar_tecnica,
            editar_tecnica,
            deletar_tecnica,
            buscar_pg_ativo,
            criar_nova_versao_pg,
            listar_identificacoes,
            cadastrar_identificacao,
            editar_identificacao,
            deletar_identificacao,
            listar_metodologias,
            cadastrar_metodologia,
            editar_metodologia,
            deletar_metodologia,
            listar_legislacoes,
            cadastrar_legislacao,
            editar_legislacao,
            deletar_legislacao,
            listar_formas_contato,
            cadastrar_forma_contato,
            editar_forma_contato,
            deletar_forma_contato,
            listar_observacoes,
            cadastrar_observacao,
            editar_observacao,
            deletar_observacao,
            listar_sub_matrizes,
            cadastrar_sub_matriz,
            editar_sub_matriz,
            deletar_sub_matriz,
            listar_parametros_pops,
            cadastrar_parametro_pop,
            editar_parametro_pop,
            deletar_parametro_pop,
            listar_parametros_pops_por_grupo,
            listar_grupos_parametros_tauri,
            atualizar_lq_incerteza_tauri,
            listar_etapas,
            cadastrar_etapa,
            editar_etapa,
            deletar_etapa,
            listar_etapas_por_tecnica,
            relacionar_etapas_a_tecnica,
            remover_tecnica_etapa,
            reordenar_etapas_da_tecnica,
            listar_materia_prima_registro_tauri,
            cadastrar_materia_prima_registro_tauri,
            editar_materia_prima_registro_tauri,
            deletar_materia_prima_registro_tauri,
            atualizar_obsoleto_materia_prima_registro_tauri,
            
            listar_legislacao_parametro_tauri,
            cadastrar_legislacao_parametro_tauri,
            editar_legislacao_parametro_tauri,
            deletar_legislacao_parametro_tauri,
            listar_legislacoes_ativas_tauri,
            listar_fila_trabalho_tauri,
            iniciar_analises_tauri,
            carregar_mapa_tauri,
            salvar_mapa_tauri,

            listar_pacotes_tauri,
            buscar_pacote_por_id_tauri,
            criar_pacote_tauri,
            editar_pacote_tauri,
            deletar_pacote_tauri, 

            validar_formula,
            testar_formula,
            salvar_calculo,
            listar_calculos,
            buscar_calculo_por_id,
            editar_calculo,
            deletar_calculo,

            get_cidades_analise_command,
            get_clientes_analise_command,
            get_coletores_analise_command,
            get_analises_detalhadas_command,  
            get_analise_agregada_command, 
            
            // Comandos de Laboratório
            buscar_checagem, 
            buscar_nao_iniciada, 
            buscar_em_analise, 
            buscar_temperatura,
            buscar_amostras_finalizadas, 
            buscar_amostras_bloqueadas, 
            buscar_registro_insumo,
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
            cadastrar_amostra_completa,
            buscar_amostras,
            consultar_amostras_por_planilha,
            consultar_intervalos_planilhas,
            gerar_nova_planilha,
            buscar_pg,
            buscar_certificado,
            listar_amostras_por_faixa_tauri,
            atualizar_amostras_em_lote_tauri,
            listar_materia_prima_tauri,
            cadastrar_materia_prima_tauri,
            editar_materia_prima_tauri,
            deletar_materia_prima_tauri,
            listar_tipos_materia_prima_tauri,
            listar_unidades_tauri,
            listar_insumos_tauri,
            criar_insumo_tauri,
            editar_insumo_tauri,
            deletar_insumo_tauri,
            carregar_suporte_formulario_insumo_tauri,
            buscar_insumo_tauri,

            listar_parametros_pop_dropdown_tauri,
            listar_insumos_relacionados_tauri,
            listar_insumos_disponiveis_tauri,
            relacionar_insumos_parametro_tauri,
            remover_insumo_relacionado_tauri,


            listar_insumos_registros_tauri,
            criar_insumo_registro_tauri,
            editar_insumo_registro_tauri,
            deletar_insumo_registro_tauri,
            listar_fornecedores_dropdown_tauri,
            listar_insumos_por_tipo_tauri,
            buscar_receita_e_estoque_mp_tauri,
            listar_insumo_tipos_tauri,
            listar_insumo_registro_2_tauri,
            criar_insumo_registro_2_tauri,
            editar_insumo_registro_2_tauri,
            deletar_insumo_registro_2_tauri,
            atualizar_amostra_registro_2_tauri,
            // Comandos de Qualidade e Utilitários
            import_xlsx_file,
            import_xlsx_from_bytes,
            get_xlsx_sheet_names,
            get_xlsx_sheet_names_from_bytes,
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
            buscar_fornecedor_detalhado_tauri,
            cadastrar_fornecedor_tauri,
            editar_fornecedor_tauri,
            deletar_fornecedor_tauri,
            listar_categorias_fornecedor_tauri,
            listar_fornecedores_tauri, 
            listar_qualificacoes_tauri,
            listar_modelos_pesquisa_tauri,
            listar_itens_por_modelo_tauri,
            cadastrar_pesquisa_tauri,
            editar_pesquisa_tauri,
            buscar_pesquisa_por_id_tauri,
            listar_pesquisas_tauri,
            atualizar_status_pesquisa_tauri,
            listar_destinatarios_tauri,
            obter_resultados_por_item_tauri,
            salvar_analise_critica_tauri,
            listar_estoque_items_tauri,
            criar_estoque_item_tauri,
            editar_estoque_item_tauri,
            buscar_estoque_item_detalhado_tauri,
            criar_estoque_registro_tauri,
            listar_unidades_compra_tauri,

            // Comandos do Módulo de Administração de Usuários
            listar_usuarios_admin_command,
            buscar_usuario_admin_command,
            criar_usuario_admin_command,
            atualizar_usuario_admin_command,
            atualizar_status_usuario_admin_command,

            listar_setores_command,
            criar_setor_command,
            listar_usuarios_por_setor_command,
            atualizar_usuarios_do_setor_command,

            listar_historico_command,
            listar_acoes_historico_command,
            
            // Comandos de Componentes e Outros
            buscar_clientes_dropdown,
            buscar_clientes_filtros,
            buscar_usuarios_dropdown,
            fazer_login,
            validate_user_credentials,
            usuario_logado,
            verificar_autenticacao,
            get_usuario_nome,
            update_user_settings,
            send_ws_message,
            get_users, 
            create_chat, 
            get_user_chats, 
            send_message, 
            get_chat_messages, 
            create_direct_chat,
            send_file_message,
            download_file_to_downloads,
            download_file_bytes,
            buscar_agendamentos_hoje,
            buscar_motoristas,
            criar_motorista,
            atualizar_motorista,
            deletar_motorista,
            buscar_marcas,
            deletar_veiculo,
            atualizar_veiculo,
            criar_veiculo,
            buscar_veiculos_e_marcas,
            deletar_posto,
            atualizar_posto,
            criar_posto,
            buscar_postos,
            criar_frota_viagem,
            buscar_viagens,
            atualizar_frota_viagem,
            deletar_frota_viagem,
            deletar_frota_abastecimento,
            atualizar_frota_abastecimento,
            criar_frota_abastecimento,
            buscar_abastecimento,
            buscar_abastecimento_filtrado,
            deletar_tipo_manutencao, 
            buscar_tipos_manutencao, 
            atualizar_frota_manutencao, 
            buscar_manutencoes,
            criar_frota_manutencao,
            criar_tipo_manutencao,
            deletar_frota_manutencao,
            buscar_coleta_referente,
            atualizar_numero_amostra,
            buscar_cliente_referente,
            buscar_parametros_by_id,
            salvar_checagens_client,
            buscar_checagens_client,
            iniciar_amostra_analise, 
            obter_detalhes_amostra,
            buscar_amostras_nao_iniciadas,
            buscar_resultados_amostra, 
            salvar_resultado, 
            vistar_resultado, 
            remover_visto_resultado,
            buscar_detalhes_resultado,
            salvar_resultado_completo,
            alterar_pop_resultado, 
            buscar_pops_alternativos,
            salvar_temperatura_analise,
            buscar_historico_bloqueio,
            bloquear_amostras,
            desbloquear_amostras,
            listar_amostras_bloqueadas,
            buscar_parametro_mapa,
            solicitar_revisao, 
            publicar_resultado,
            gerar_relatorio_final,
            proxy_listar_clientes_revisao,
            proxy_listar_analises_revisadas,
            proxy_assinar_relatorios,
            gerar_relatorio_final2,
            gerar_relatorio_amostragem,
            gerar_relatorio_cq,
            gerar_relatorio_preview
            

        ])
        .run(tauri::generate_context!())
        .expect("Erro ao iniciar o app Tauri");
}

