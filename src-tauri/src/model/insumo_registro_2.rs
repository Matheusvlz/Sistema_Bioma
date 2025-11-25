use serde::{Deserialize, Serialize};

// 1. Struct Detalhada (Recebe da API)
// Mapeia exatamente o JSON que a API devolve.
// Datas vêm como String "YYYY-MM-DD" no JSON, então usamos String aqui para simplificar o transporte.
#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct InsumoRegistro2Detalhado {
    pub id: u32,
    pub insumo_id: u32,
    pub nome_insumo: Option<String>,
    pub registro: Option<String>,
    pub fabricante: Option<String>,
    pub data_preparo: Option<String>, 
    pub validade: Option<String>,
    
    pub amostra_inicial: Option<i32>,
    pub amostra_inicial_letra: Option<String>,
    pub amostra_final: Option<i32>,
    pub amostra_final_letra: Option<String>,
    
    pub usuario_iniciado_id: Option<u32>,
    pub usuario_iniciado_nome: Option<String>,
    pub usuario_finalizado_id: Option<u32>,
    pub usuario_finalizado_nome: Option<String>,
}

// 2. Struct de Paginação (Wrapper da API)
#[derive(Debug, Serialize, Deserialize)]
pub struct PaginatedInsumoRegistro2Response {
    pub items: Vec<InsumoRegistro2Detalhado>,
    pub total: i64,
    pub page: u32,
    pub per_page: u32,
}

// 3. Payload do Frontend (Create/Edit Lote)
// Dados brutos que vêm do React.
#[derive(Debug, Deserialize)]
#[allow(non_snake_case)]
pub struct InsumoRegistro2Payload {
    pub insumo_id: u32,
    pub registro: String,
    pub fabricante: String,
    pub data_preparo: String, // Esperamos YYYY-MM-DD
    pub validade: String,     // Esperamos YYYY-MM-DD
    // usuario_id não vem no edit, e no create pegaremos do contexto ou do payload se enviado explicitamente
    pub usuario_id: Option<u32>, 
}

// 4. Payload para a API (Create)
#[derive(Debug, Serialize)]
#[allow(non_snake_case)]
pub struct NovoInsumoRegistro2ApiPayload {
    pub insumo_id: u32,
    pub registro: String,
    pub fabricante: String,
    pub data_preparo: String,
    pub validade: String,
    pub usuario_id: u32,
}

// 5. Payload para a API (Update Lote)
#[derive(Debug, Serialize)]
#[allow(non_snake_case)]
pub struct AtualizacaoInsumoRegistro2ApiPayload {
    pub registro: String,
    pub fabricante: String,
    pub data_preparo: String,
    pub validade: String,
}

// 6. Payload para Atualizar Amostra (Inicial/Final)
// Usado tanto para receber do Frontend quanto para enviar para a API, pois a estrutura é idêntica.
#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct AtualizacaoAmostraInsumo2Payload {
    pub amostra: i32,
    pub letra: Option<String>,
    pub usuario_id: u32, // ID do usuário autenticado (passado via modal de auth no front)
    pub tipo: String,    // "INICIAL" ou "FINAL"
}