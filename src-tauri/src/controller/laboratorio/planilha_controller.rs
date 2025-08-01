use serde::{Deserialize, Serialize}; // <- Adicione aqui também
use reqwest::Client;
use tauri::command;
use crate::model::usuario::get_user_id;
#[derive(Deserialize, Debug)]
pub struct Amostra {
    pub numero: i32,
}

#[derive(Deserialize, Serialize, Debug)] // <- Aqui está o fix
pub struct NumberRange {
    pub id: u32,
    pub inicial: u32,
    #[serde(rename = "final")]
    pub final_: u32,
}

#[derive(Deserialize)]
pub struct RangesResponse {
    pub ranges: Vec<NumberRange>,
}

// Nova estrutura para números específicos
#[derive(Deserialize, Debug)]
pub struct NumeroEspecifico {
    pub numero: i32,
}

#[derive(Deserialize)]
pub struct NumerosEspecificosResponse {
    pub numeros: Vec<NumeroEspecifico>,
}

#[command]
pub async fn consultar_amostras_por_planilha(planilha_id: u32) -> Result<Vec<i32>, String> {
    let url = format!("http://192.168.15.26:8082/planilha/{}/amostras", planilha_id);

    let client = Client::new();
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Erro na requisição: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Erro HTTP: {}", response.status()));
    }

    let amostras: Vec<Amostra> = response
        .json()
        .await
        .map_err(|e| format!("Erro ao deserializar JSON: {}", e))?;

    Ok(amostras.into_iter().map(|a| a.numero).collect())
}

#[command]
pub async fn consultar_intervalos_planilhas() -> Result<Vec<NumberRange>, String> {
    let url = "http://192.168.15.26:8082/get_final_number";

    let client = Client::new();
    let response = client
        .post(url)
        .send()
        .await
        .map_err(|e| format!("Erro na requisição: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Erro HTTP: {}", response.status()));
    }

    let dados: RangesResponse = response
        .json()
        .await
        .map_err(|e| format!("Erro ao deserializar JSON: {}", e))?;

    Ok(dados.ranges)
}

// Nova estrutura para resposta da criação de planilha
#[derive(Deserialize, Serialize, Debug)]
pub struct NovaPlanilhaResponse {
    pub inicial: u32,
    #[serde(rename = "final")]
    pub final_: u32,
}

#[command]
pub async fn gerar_nova_planilha() -> Result<NovaPlanilhaResponse, String> {
    let url = "http://192.168.15.26:8082/gerar_planilha";

let user_id = get_user_id().ok_or("Usuário não autenticado")?;
    let client = Client::new();
    let response = client
        .post(url)
        .json(&serde_json::json!({ "user_id": user_id }))
        .send()
        .await
        .map_err(|e| format!("Erro na requisição: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Erro HTTP: {}", response.status()));
    }

    let dados: NovaPlanilhaResponse = response
        .json()
        .await
        .map_err(|e| format!("Erro ao deserializar JSON: {}", e))?;

    Ok(dados)
}