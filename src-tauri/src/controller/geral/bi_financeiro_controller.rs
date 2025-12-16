use tauri::{command, AppHandle};
use reqwest::Client;
use std::process::Command;
use crate::model::api_response::ApiResponse;
// Importa o model que acabamos de criar. 
// OBS: Certifique-se que o nome do módulo no seu mod.rs bate com o nome do arquivo.
// Se o arquivo é financeiro_bi_model.rs, o import é financeiro_bi_model.
use crate::model::financeiro_bi::{
    PaginatedAuditoriaResponse, 
    FiltrosAuditoriaPayload, FiltrosAuditoriaApiPayload,
    ArquivoRedePayload, ArquivoRedeApiPayload
};
use crate::config::get_api_url;

// Estrutura auxiliar para ler apenas o campo "caminho" do JSON da API
#[derive(serde::Deserialize)]
struct CaminhoResponse {
    caminho: String,
}

// =====================================================================
// COMANDO 1: LISTAR DADOS (COM LOGS DE DEBUG / X-9)
// =====================================================================
#[command]
pub async fn listar_auditoria_financeira_tauri(
    app_handle: AppHandle,
    payload: FiltrosAuditoriaPayload
) -> Result<ApiResponse<PaginatedAuditoriaResponse>, ApiResponse<()>> {
    
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/financeiro/auditoria", api_url);

    println!("\n=== TAURI DEBUG INICIADO ===");
    println!("1. Buscando na API: {}", url);

    // Mapeia o payload do Frontend para o formato esperado pela API
    let api_payload = FiltrosAuditoriaApiPayload {
        data_inicio: payload.data_inicio,
        data_fim: payload.data_fim,
        termo_busca: payload.termo_busca,
        apenas_problemas: payload.apenas_problemas,
        pagina: payload.pagina,
        itens_por_pagina: payload.itens_por_pagina,
    };

    match client.get(&url).query(&api_payload).send().await {
        Ok(response) => {
            if response.status().is_success() {
                // Tenta ler o texto bruto primeiro para garantir que não é erro de parse
                // (Isso é um pouco mais custoso, mas infalível para debug)
                // Mas aqui vamos confiar no serde direto para manter o padrão, com logs no sucesso.
                
                match response.json::<PaginatedAuditoriaResponse>().await {
                    Ok(data) => {
                        println!("2. API respondeu com sucesso! Registros: {}", data.total_registros);
                        
                        // --- O GRANDE TESTE DO X-9 ---
                        // Pega o primeiro orçamento que tiver operação para ver o que veio
                        if let Some(primeiro_orc) = data.data.iter().find(|o| !o.ciclo_operacional.is_empty()) {
                            println!("3. Analisando Orçamento: {}", primeiro_orc.numero_completo);
                            
                            for (i, op) in primeiro_orc.ciclo_operacional.iter().enumerate() {
                                println!("   [Operação {}] Status: {}", i, op.status);
                                println!("   -> Nome Coletor (JSON): {:?}", op.nome_coletor);
                                println!("   -> Data Registro (JSON): {:?}", op.data_hora_registro);
                                
                                if op.nome_coletor.is_none() {
                                    println!("   ALERTA: O campo nome_coletor veio NULO (None) da API!");
                                }
                            }
                        } else {
                            println!("3. Nenhum orçamento com operacional encontrado na página 1 para auditar.");
                        }
                        println!("============================\n");

                        Ok(ApiResponse::success(
                            "Auditoria carregada com sucesso.".to_string(),
                            Some(data)
                        ))
                    },
                    Err(e) => {
                        println!("ERRO CRÍTICO AO LER JSON: {:?}", e);
                        Err(ApiResponse::error(format!("Erro ao processar JSON da API (Verifique se o Model do Tauri bate com a API): {}", e)))
                    },
                }
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                println!("ERRO DA API: {} - {}", status, err_body);
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        },
        Err(e) => {
            println!("ERRO DE CONEXÃO: {:?}", e);
            Err(ApiResponse::error(format!("Falha de conexão com a API: {}", e)))
        },
    }
}

// =====================================================================
// COMANDO 2: ABRIR ARQUIVO (Ponte + Sistema Operacional)
// =====================================================================
#[command]
pub async fn abrir_arquivo_rede_bioma_tauri(
    app_handle: AppHandle,
    payload: ArquivoRedePayload
) -> Result<ApiResponse<String>, ApiResponse<()>> {

    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    // Rota que contém a lógica de varredura de pastas (migrada do Python)
    let url = format!("{}/financeiro/arquivo-rede", api_url); 

    // Monta o payload para a API
    let api_payload = ArquivoRedeApiPayload {
        tipo: payload.tipo,
        numero: payload.numero,
        ano: payload.ano,
        nf: payload.nf,
        data_competencia: payload.data_competencia,
    };

    // 1. Pergunta para a API onde está o arquivo
    let caminho_rede = match client.get(&url).query(&api_payload).send().await {
        Ok(res) => {
            if res.status().is_success() {
                match res.json::<CaminhoResponse>().await {
                    Ok(json) => json.caminho,
                    Err(_) => return Err(ApiResponse::error("Erro ao ler resposta de caminho da API".to_string())),
                }
            } else {
                return Err(ApiResponse::error("API não conseguiu localizar o caminho do arquivo".to_string()));
            }
        },
        Err(e) => return Err(ApiResponse::error(format!("Erro de conexão ao buscar arquivo: {}", e))),
    };

    if caminho_rede.is_empty() {
        return Err(ApiResponse::error("Caminho retornado vazio. O arquivo pode não existir.".to_string()));
    }

    println!("Tauri: Abrindo no Explorer -> {}", caminho_rede);

    // 2. Executa o comando do Sistema Operacional para abrir o caminho
    #[cfg(target_os = "windows")]
    {
        match Command::new("explorer").arg(&caminho_rede).spawn() {
            Ok(_) => Ok(ApiResponse::success(format!("Abrindo: {}", caminho_rede), Some(caminho_rede))),
            Err(e) => Err(ApiResponse::error(format!("Falha ao iniciar Explorer: {}", e)))
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        match Command::new("xdg-open").arg(&caminho_rede).spawn() {
            Ok(_) => Ok(ApiResponse::success(format!("Abrindo (Linux): {}", caminho_rede), Some(caminho_rede))),
            Err(e) => Err(ApiResponse::error(format!("Falha ao iniciar xdg-open: {}", e)))
        }
    }
}