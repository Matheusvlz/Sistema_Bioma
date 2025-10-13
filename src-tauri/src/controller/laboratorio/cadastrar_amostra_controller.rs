use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::command;
use chrono::{DateTime, Utc, NaiveDateTime};

use crate::config::get_api_url;
use tauri::AppHandle;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Categoria {
    pub id: u32,
    pub nome: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CategoriaResponse {
    pub success: bool,
    pub data: Option<Vec<Categoria>>,
    pub message: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Identificacao {
    pub id: u32,
    pub id1: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct IdentificacaoResponse {
    pub success: bool,
    pub data: Option<Vec<Identificacao>>,
    pub message: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ParametroResponse {
    pub success: serde_json::Value,
    pub data: Option<Vec<Parametro>>,
    pub message: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Parametro {
    pub id: u32,
    pub nome: String,
    pub id_parametro: u32,
    pub grupo: String,
    pub tecnica_nome: String,
    pub unidade: String,
    pub parametro_pop: u32,
    pub limite: String,
    pub certificado_pag: Option<u32>,
    pub codigo: String,
    pub numero: String,
    pub revisao: String,
    pub objetivo: String,
    pub idtecnica: u32,
    pub n1: i32,
    pub n2: i32,
    pub n3: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ParametroRequest {
    pub parametros: Vec<u32>,
}
// Structs para a resposta da API de dados do cliente
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OrcamentoItem {
    pub id_item: u32,
    pub descricao: String,
    pub sequencia: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OrcamentoComItens {
    pub id: u32,
    pub nome: String,
    pub ano: u32,
    pub itens: Vec<OrcamentoItem>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Solicitante {
    pub id: u32,
    pub usuario: String,
    pub nome: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DadosClienteResponse {
    pub orcamentos: Vec<OrcamentoComItens>,
    pub solicitantes: Vec<Solicitante>,
    pub setor_portal: Vec<Categoria>
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: Option<String>,
}

// === NOVAS ESTRUTURAS PARA CADASTRO COMPLETO ===

#[derive(Debug, Serialize, Deserialize)]
pub struct AmostraCompleta {
    pub id: Option<u32>,
    pub numero: String,
    pub hora_coleta: String,
    pub identificacao: String,
    pub temperatura: String,
    pub complemento: String,
    pub condicoes_ambientais: String,
    pub item_orcamento: Option<u32>,
    pub parametros_selecionados: Vec<ParametroSelecionado>,

}

#[derive(Debug, Serialize, Deserialize)]
pub struct ParametroSelecionado {
    pub id: u32,
    pub nome: String,
    pub id_parametro: u32,
    pub grupo: String,
    pub tecnica_nome: String,
    pub unidade: String,
    pub parametro_pop: u32,
    pub limite: String,
    pub certificado_pag: Option<u32>,
    pub codigo: String,
    pub numero: String,
    pub revisao: String,
    pub objetivo: String,
    pub idtecnica: u32,
    pub n1: i32,
    pub n2: i32,
    pub n3: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DadosGeraisCadastro {
    // Dados do cliente
    pub cliente_id: Option<u32>,
    pub cliente_nome: Option<String>,
    pub consultor_id: Option<u32>,
    
    // Datas e horários
    pub data_inicio: Option<String>,
    pub hora_inicio: Option<String>,
    pub data_coleta: Option<String>,
    pub hora_coleta: Option<String>,
    pub data_entrada_lab: Option<String>,
    pub hora_entrada_lab: Option<String>,
    
    // Dados da coleta
    pub coletor: Option<u32>, // "Cliente" ou "Biomade"
    pub nome_coletor: Option<String>,
    pub procedimento_amostragem: Option<String>,
    pub categoria_id: Option<u32>,
    pub acompanhante: Option<String>,
    
    // Configurações
    pub orcamento: bool,
    pub dados_amostragem: bool,
    pub controle_qualidade: bool,
    pub vazao: Option<String>,
    pub unidade_vazao: Option<String>,
    pub vazao_cliente: bool,
    
    // Contatos
    pub email_solicitante: String,
    pub solicitante_id: Option<u32>,
    
    // Metodologias e configurações técnicas
    pub metodologias_selecionadas: Vec<u32>,
    pub acreditacao_id: Option<u32>,
    pub legislacao_id: Option<u32>,
    pub terceirizado_id: Option<u32>,
    pub orcamento_id: Option<u32>,
    pub setores_selecionados: Vec<u32>,
    
    // Configurações específicas
    pub amostra_terceirizada: bool,
    pub tipo_analise: String, // "total" ou outro
    pub laboratorio: String,
    
    // Unidades e forma de coleta
    pub unidade_amostra: Option<String>,
    pub forma_coleta: Option<String>,
    pub unidade_area_amostrada: Option<String>,
    pub area_amostrada: Option<String>,
    
    // Campos condicionais para eficácia de limpeza
    pub tipo_relatorio: u32,
    pub principio_ativo: Option<String>,
    pub produto_anterior: Option<String>,
    pub lote: Option<String>,
    pub agente_limpeza: Option<String>,
    pub data_limpeza: Option<String>,
    pub momento_limpeza: Option<String>,
    pub tempo_decorrido: Option<String>,
    pub unidade_tempo_decorrido: Option<String>,
    
    // Campos condicionais IN 60
    pub protocolo_cliente: Option<String>,
    pub remessa_cliente: Option<String>,
    
    // Configurações de tempo
    pub mesmo_horario_todas_amostras: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CadastroAmostraCompletaRequest {
    pub dados_gerais: DadosGeraisCadastro,
    pub amostras: Vec<AmostraCompleta>,
    pub coleta: Option<Vec<AmostraColeta>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CadastroResponse {
    pub id_solicitacao: u64,
    pub protocolo: String,
}


#[derive(Debug, Serialize, Deserialize)]
pub struct AmostraColeta {
  pub id: Option<u32>,
  pub coletaid: Option<u32>,
  pub hora: Option<String>,
  pub identificacao: Option<String>, // Note: The original code had a syntax error here
  pub complemento: Option<String>,
  pub ponto: Option<String>,
  pub coletadopor: Option<String>,
  pub condicoesambientais: Option<String>,
  pub vazao: Option<String>,
  pub ph: Option<String>,
  pub cloro: Option<String>,
  pub temperatura: Option<String>,
  pub cor: Option<String>,
  pub turbidez: Option<String>,
  pub sdt: Option<String>,
  pub condutividade: Option<String>,
}


// === FUNÇÕES AUXILIARES ===

async fn fazer_requisicao_api<T: for<'de> Deserialize<'de> + std::fmt::Debug>(
    app_handle: &AppHandle,
    endpoint: &str,
    method: reqwest::Method,
) -> Result<T, String> {
    let client = Client::new();
    let url = get_api_url(app_handle);
    let full_url = format!("{}/{}", url, endpoint);

    let request_builder = match method {
        reqwest::Method::POST => client.post(&full_url),
        reqwest::Method::GET => client.get(&full_url),
        _ => return Err("Método HTTP não suportado".to_string()),
    };
    
    let res = request_builder
        .send()
        .await
        .map_err(|e| {
            println!("Erro de conexão ao chamar '{}': {:?}", full_url, e);
            "Erro de conexão com o servidor".to_string()
        })?;

    let status = res.status();
    let body_text = res.text().await.map_err(|e| {
        println!("Erro ao ler o corpo da resposta de '{}': {:?}", full_url, e);
            "Erro ao ler resposta do servidor".to_string()
        })?;

    if body_text.is_empty() {
        return Err(format!(
            "O servidor retornou uma resposta vazia (Status: {}). Verifique o endpoint '{}' e os logs do servidor.",
            status,
            full_url
        ));
    }
    
    let api_response: ApiResponse<T> = serde_json::from_str(&body_text)
        .map_err(|e| {
            println!("Erro ao parsear o JSON de '{}': {:?}", full_url, e);
            format!("Erro ao processar a resposta do servidor: {}", e)
        })?;

    if api_response.success {
        api_response.data.ok_or_else(|| "A resposta da API foi bem-sucedida, mas não retornou dados.".to_string())
    } else {
        Err(api_response.message.unwrap_or("Erro desconhecido na API".to_string()))
    }
}

// Função auxiliar para validar dados obrigatórios
fn validar_dados_cadastro(dados: &CadastroAmostraCompletaRequest) -> Result<(), String> {
    // Validar dados gerais - usando as_ref() para acessar Option<String> e then trim()
    if let Some(ref cliente_nome) = dados.dados_gerais.cliente_nome {
        if cliente_nome.trim().is_empty() {
            return Err("Nome do cliente é obrigatório".to_string());
        }
    } else {
        return Err("Nome do cliente é obrigatório".to_string());
    }

    

    
    // Validar se há pelo menos uma amostra
    if dados.amostras.is_empty() {
        return Err("É necessário cadastrar pelo menos uma amostra".to_string());
    }
    
    // Validar cada amostra
    for (index, amostra) in dados.amostras.iter().enumerate() {
        if amostra.numero.trim().is_empty() {
            return Err(format!("Número da amostra {} é obrigatório", index + 1));
        }
        
 
    }
    
    // Validar campos condicionais - comparar com Some(valor)
    if dados.dados_gerais.tipo_relatorio == 3 {
        if dados.dados_gerais.principio_ativo.as_ref().map_or(true, |s| s.trim().is_empty()) {
            return Err("Princípio ativo é obrigatório para relatórios de eficácia de limpeza".to_string());
        }
        
        if dados.dados_gerais.agente_limpeza.as_ref().map_or(true, |s| s.trim().is_empty()) {
            return Err("Agente de limpeza é obrigatório para relatórios de eficácia de limpeza".to_string());
        }
    }
    
    Ok(())
}

// Função auxiliar para formatar dados para envio à API
fn preparar_dados_para_api(dados: &CadastroAmostraCompletaRequest) -> serde_json::Value {
    let mut payload = serde_json::json!({
        "dados_gerais": {
            "cliente_id": dados.dados_gerais.cliente_id,
            "cliente_nome": dados.dados_gerais.cliente_nome,
            "consultor_id": dados.dados_gerais.consultor_id,
            "data_inicio": dados.dados_gerais.data_inicio,
            "hora_inicio": dados.dados_gerais.hora_inicio,
            "data_coleta": dados.dados_gerais.data_coleta,
            "hora_coleta": dados.dados_gerais.hora_coleta,
            "data_entrada_lab": dados.dados_gerais.data_entrada_lab,
            "hora_entrada_lab": dados.dados_gerais.hora_entrada_lab,
            "coletor": dados.dados_gerais.coletor,
            "nome_coletor": dados.dados_gerais.nome_coletor,
            "procedimento_amostragem": dados.dados_gerais.procedimento_amostragem,
            "categoria_id": dados.dados_gerais.categoria_id,
            "acompanhante": dados.dados_gerais.acompanhante,
            "orcamento": dados.dados_gerais.orcamento,
            "dados_amostragem": dados.dados_gerais.dados_amostragem,
            "controle_qualidade": dados.dados_gerais.controle_qualidade,
            "vazao": dados.dados_gerais.vazao,
            "unidade_vazao": dados.dados_gerais.unidade_vazao,
            "vazao_cliente": dados.dados_gerais.vazao_cliente,
            "email_solicitante": dados.dados_gerais.email_solicitante,
            "solicitante_id": dados.dados_gerais.solicitante_id,
            "metodologias_selecionadas": dados.dados_gerais.metodologias_selecionadas,
            "acreditacao_id": dados.dados_gerais.acreditacao_id,
            "legislacao_id": dados.dados_gerais.legislacao_id,
            "terceirizado_id": dados.dados_gerais.terceirizado_id,
            "orcamento_id": dados.dados_gerais.orcamento_id,
            "setores_selecionados": dados.dados_gerais.setores_selecionados,
            "amostra_terceirizada": dados.dados_gerais.amostra_terceirizada,
            "tipo_analise": dados.dados_gerais.tipo_analise,
            "laboratorio": dados.dados_gerais.laboratorio,
            "unidade_amostra": dados.dados_gerais.unidade_amostra,
            "forma_coleta": dados.dados_gerais.forma_coleta,
            "unidade_area_amostrada": dados.dados_gerais.unidade_area_amostrada,
            "area_amostrada": dados.dados_gerais.area_amostrada,
            "tipo_relatorio": dados.dados_gerais.tipo_relatorio,
            "mesmo_horario_todas_amostras": dados.dados_gerais.mesmo_horario_todas_amostras
        },
        "amostras": dados.amostras.iter().map(|amostra| {
            serde_json::json!({
                "numero": amostra.numero,
                "hora_coleta": amostra.hora_coleta,
                "identificacao": amostra.identificacao,
                "temperatura": amostra.temperatura,
                "complemento": amostra.complemento,
                "condicoes_ambientais": amostra.condicoes_ambientais,
                "item_orcamento": amostra.item_orcamento,
                "parametros_selecionados": amostra.parametros_selecionados.iter().map(|param| {
                    serde_json::json!({
                        "id": param.id,
                        "nome": param.nome,
                        "id_parametro": param.id_parametro,
                        "grupo": param.grupo,
                        "tecnica_nome": param.tecnica_nome,
                        "unidade": param.unidade,
                        "parametro_pop": param.parametro_pop,
                        "limite": param.limite,
                        "certificado_pag": param.certificado_pag,
                        "codigo": param.codigo,
                        "numero": param.numero,
                        "revisao": param.revisao,
                        "objetivo": param.objetivo,
                        "idtecnica": param.idtecnica,
                        "n1": param.n1,
                        "n2": param.n2,
                        "n3": param.n3
                    })
                }).collect::<Vec<_>>()
            })
        }).collect::<Vec<_>>()
    });
    
     if let Some(ref coleta) = dados.coleta {
        // Mapeia a estrutura de AmostraColeta para um array de objetos JSON
        payload["coleta"] = serde_json::Value::Array(
            coleta.iter().map(|item_coleta| {
                serde_json::json!({
                    "id": item_coleta.id,
              
                })
            }).collect()
        );
    }
    // Adicionar campos condicionais se necessário
    if dados.dados_gerais.tipo_relatorio == 3 {
        if let Some(ref principio_ativo) = dados.dados_gerais.principio_ativo {
            payload["dados_gerais"]["principio_ativo"] = serde_json::Value::String(principio_ativo.clone());
        }
        if let Some(ref produto_anterior) = dados.dados_gerais.produto_anterior {
            payload["dados_gerais"]["produto_anterior"] = serde_json::Value::String(produto_anterior.clone());
        }
        if let Some(ref lote) = dados.dados_gerais.lote {
            payload["dados_gerais"]["lote"] = serde_json::Value::String(lote.clone());
        }
        if let Some(ref agente_limpeza) = dados.dados_gerais.agente_limpeza {
            payload["dados_gerais"]["agente_limpeza"] = serde_json::Value::String(agente_limpeza.clone());
        }
        if let Some(ref data_limpeza) = dados.dados_gerais.data_limpeza {
            payload["dados_gerais"]["data_limpeza"] = serde_json::Value::String(data_limpeza.clone());
        }
        if let Some(ref momento_limpeza) = dados.dados_gerais.momento_limpeza {
            payload["dados_gerais"]["momento_limpeza"] = serde_json::Value::String(momento_limpeza.clone());
        }
        if let Some(ref tempo_decorrido) = dados.dados_gerais.tempo_decorrido {
            payload["dados_gerais"]["tempo_decorrido"] = serde_json::Value::String(tempo_decorrido.clone());
        }
        if let Some(ref unidade_tempo_decorrido) = dados.dados_gerais.unidade_tempo_decorrido {
            payload["dados_gerais"]["unidade_tempo_decorrido"] = serde_json::Value::String(unidade_tempo_decorrido.clone());
        }
    }
    
    // Adicionar campos IN 60 se necessário
    if let Some(ref protocolo_cliente) = dados.dados_gerais.protocolo_cliente {
        payload["dados_gerais"]["protocolo_cliente"] = serde_json::Value::String(protocolo_cliente.clone());
    }
    if let Some(ref remessa_cliente) = dados.dados_gerais.remessa_cliente {
        payload["dados_gerais"]["remessa_cliente"] = serde_json::Value::String(remessa_cliente.clone());
    }
    
    payload
}

// === COMANDOS TAURI EXISTENTES ===

#[command]
pub async fn buscar_dados_cliente(app_handle: AppHandle, cliente_id: u32) -> Result<DadosClienteResponse, String> {
    let endpoint = format!("cliente/{}/dados", cliente_id);
    fazer_requisicao_api(&app_handle, &endpoint, reqwest::Method::GET).await
}

#[command]
pub async fn buscar_parametros(
    app_handle: AppHandle,
    legislacao_id: u32,
) -> Result<ParametroResponse, String> {
    let endpoint = format!("parametros/{}", legislacao_id);
    let client = reqwest::Client::new();
    let url = format!("{}/{}", get_api_url(&app_handle), endpoint);

    let res = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Erro de conexão com o servidor: {:?}", e))?;

    let status = res.status();
    let body_text = res
        .text()
        .await
        .map_err(|e| format!("Erro ao ler resposta do servidor: {:?}", e))?;

    if body_text.is_empty() {
        return Err(format!(
            "Resposta vazia do servidor (Status: {}) - URL: {}",
            status, url
        ));
    }

    serde_json::from_str::<ParametroResponse>(&body_text)
        .map_err(|e| format!("Erro ao parsear JSON: {}", e))
}

#[command]
pub async fn buscar_parametros_by_id(
    app_handle: AppHandle,
    parametro_id: u32,
) -> Result<ParametroResponse, String> {
    
    // 1. Defina a URL FINAL correta: APENAS o endpoint base.
    // O ID será enviado no corpo, não na URL.
    let endpoint = "parametros/byid"; 
    let client = reqwest::Client::new();
    let url = format!("{}/{}", get_api_url(&app_handle), endpoint);

    // 2. Crie o corpo JSON (Payload) para o método POST.
    // Assume que você tem a struct ParametroRequest definida no Rust:
    // #[derive(Debug, Serialize)] pub struct ParametroRequest { pub parametros: Vec<u32>, }
    let payload = ParametroRequest {
        parametros: vec![parametro_id], 
    };

    // 3. Mude a requisição para POST e anexe o corpo JSON.
    let res = client
        .post(&url) // 👈 MUDANÇA CRÍTICA: Agora é POST
        .json(&payload) // 👈 MUDANÇA CRÍTICA: Envia o payload JSON
        .send()
        .await
        .map_err(|e| format!("Erro de conexão com o servidor: {:?}", e))?;

    let status = res.status();
    
    // ... (O restante do tratamento de status e parsing JSON permanece o mesmo)
    if !status.is_success() {
        let error_body = res
            .text()
            .await
            .unwrap_or_else(|_| "Corpo de erro não pôde ser lido.".to_string());
            
        return Err(format!(
            "Falha na requisição. Status: {}. Resposta do servidor: {}",
            status, error_body
        ));
    }

    let body_text = res
        .text()
        .await
        .map_err(|e| format!("Erro ao ler resposta do servidor: {:?}", e))?;

    if body_text.is_empty() {
        return Err(format!(
            "Resposta vazia do servidor (Status: {}) - URL: {}",
            status, url
        ));
    }

    serde_json::from_str::<ParametroResponse>(&body_text)
        .map_err(|e| format!("Erro ao parsear JSON: {} (URL: {})", e, url))
}


#[command]
pub async fn buscar_categoria_amostra(app_handle: AppHandle) -> Result<Vec<Categoria>, String> {
    fazer_requisicao_api(&app_handle, "buscar_categorias", reqwest::Method::POST).await
}

#[command]
pub async fn buscar_acreditacao(app_handle: AppHandle) -> Result<Vec<Categoria>, String> {
    fazer_requisicao_api(&app_handle, "buscar_acreditacao", reqwest::Method::POST).await
}

#[command]
pub async fn buscar_pg(app_handle: AppHandle) -> Result<Vec<Categoria>, String> {
    fazer_requisicao_api(&app_handle, "buscar_pg", reqwest::Method::POST).await
}

#[command]
pub async fn buscar_certificado(app_handle: AppHandle) -> Result<Vec<Categoria>, String> {
    fazer_requisicao_api(&app_handle, "buscar_certificado", reqwest::Method::POST).await
}


#[command]
pub async fn buscar_metodologias(app_handle: AppHandle) -> Result<Vec<Categoria>, String> {
    fazer_requisicao_api(&app_handle, "buscar_metodologias", reqwest::Method::POST).await
}

#[command]
pub async fn buscar_legislacao(app_handle: AppHandle) -> Result<Vec<Categoria>, String> {
    fazer_requisicao_api(&app_handle, "buscar_legislacao", reqwest::Method::POST).await
}

#[command]
pub async fn buscar_identificacao(app_handle: AppHandle) -> Result<Vec<Identificacao>, String> {
    fazer_requisicao_api(&app_handle, "buscar_identificacao", reqwest::Method::POST).await
}

#[command]
pub async fn buscar_tercerizado(app_handle: AppHandle) -> Result<Vec<Categoria>, String> {
    fazer_requisicao_api(&app_handle, "buscar_tercerizado", reqwest::Method::POST).await
}

#[command]
pub async fn consultar_consultores(app_handle: AppHandle) -> Result<Vec<Categoria>, String> {
    fazer_requisicao_api(&app_handle, "consultar_consultores", reqwest::Method::POST).await
}

#[command]
pub async fn buscar_orcamentos(
    app_handle: AppHandle,
    orcamento_id: u32,
) -> Result<Vec<OrcamentoItem>, String> {
    println!("estou aqui");
    let endpoint = format!("orcamentos/{}", orcamento_id);
    let client = reqwest::Client::new();
    let url = format!("{}/{}", get_api_url(&app_handle), endpoint);
    
    let res = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Erro de conexão com o servidor: {:?}", e))?;
    
    let status = res.status();
    let body_text = res
        .text()
        .await
        .map_err(|e| format!("Erro ao ler resposta do servidor: {:?}", e))?;
    
    if body_text.is_empty() {
        return Err(format!(
            "Resposta vazia do servidor (Status: {}) - URL: {}",
            status, url
        ));
    }
    
    serde_json::from_str::<Vec<OrcamentoItem>>(&body_text)
        .map_err(|e| format!("Erro ao parsear JSON: {}", e))
}

// === NOVA FUNÇÃO PRINCIPAL ===
#[command]
pub async fn cadastrar_amostra_completa(
    app_handle: AppHandle,
    dados_cadastro: CadastroAmostraCompletaRequest,
) -> Result<CadastroResponse, String> {
    println!("Iniciando cadastro de amostra completa...");
    
    // --- 1. Validar dados de entrada ---
    if let Err(erro_validacao) = validar_dados_cadastro(&dados_cadastro) {
        println!("Erro de validação: {}", erro_validacao);
        return Err(erro_validacao);
    }
    
    // --- 2. Preparar e enviar a requisição ---
    let payload = preparar_dados_para_api(&dados_cadastro);
    let client = Client::new();
    let url = get_api_url(&app_handle);
    let endpoint = format!("{}/cadastrar_amostra_completa", url);
    
    println!("Enviando dados para: {}", endpoint);
    println!("Payload: {}", serde_json::to_string_pretty(&payload).unwrap_or_default());
    
    let response = client
        .post(&endpoint)
        .json(&payload)
        .send()
        .await
        .map_err(|e| {
            println!("Erro de conexão: {:?}", e);
            format!("Erro de conexão com o servidor: {}", e)
        })?;
    
    // --- 3. Tratar a resposta da API ---
    let status = response.status();
    println!("Status da resposta: {}", status);

    if let Some(amostras_coleta) = &dados_cadastro.coleta {
    if !amostras_coleta.is_empty() {
        println!("tem conteudo");
      
    } else {
        println!("a coleta esta vazia");
    }
} else {
    println!("payload.coleta é None");
}
    
    // Apenas tenta parsear o JSON se o status for de sucesso (2xx)
    if status.is_success() {
        let api_response: ApiResponse<CadastroResponse> = response
            .json()
            .await
            .map_err(|e| {
                println!("Erro ao parsear JSON: {:?}", e);
                format!("Erro ao processar resposta do servidor: {}", e)
            })?;
    
        if api_response.success {
            if let Some(dados_resposta) = api_response.data {
                println!("Cadastro realizado com sucesso!");
                Ok(dados_resposta)
            } else {
                Err("Resposta da API foi bem-sucedida, mas não retornou dados.".to_string())
            }
        } else {
            let erro_msg = api_response.message.unwrap_or("Erro desconhecido na API".to_string());
            println!("Erro da API: {}", erro_msg);
            Err(erro_msg)
        }
    } else {
        // Se a resposta for um erro (4xx, 5xx), lemos o corpo como texto
        // para dar mais detalhes ao usuário.
        let body_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Não foi possível ler o corpo da resposta".to_string());

        println!("Corpo da resposta de erro: {}", body_text);

        Err(format!("Erro do servidor (Status: {}): {}", status, body_text))
    }
}

// === FUNÇÕES AUXILIARES ===

pub fn gerar_numero_protocolo() -> String {
    use chrono::Utc;
    let agora = Utc::now();
    format!("PROT-{}", agora.format("%Y%m%d%H%M%S"))
}

pub fn validar_email(email: &str) -> bool {
    email.contains('@') && email.contains('.')
}

pub fn converter_data_para_timestamp(data_str: &str, hora_str: &str) -> Result<i64, String> {
    let datetime_str = format!("{} {}", data_str, hora_str);
    
    // Tentar diferentes formatos de data
    let formatos = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%d/%m/%Y %H:%M:%S",
        "%d/%m/%Y %H:%M",
    ];
    
    for formato in &formatos {
        if let Ok(naive_dt) = NaiveDateTime::parse_from_str(&datetime_str, formato) {
            let dt: DateTime<Utc> = DateTime::from_naive_utc_and_offset(naive_dt, Utc);
            return Ok(dt.timestamp());
        }
    }
    
    Err(format!("Formato de data/hora inválido: {}", datetime_str))
}