// Ficheiro: src/model/analise.rs

use serde::{Deserialize, Serialize};

// Struct para desserializar a resposta da lista de cidades.
#[derive(Serialize, Deserialize, Debug)]
pub struct CidadeAnalise {
    pub cidade: String,
}

// Struct para desserializar cada item da resposta da API de atividades.
#[derive(Serialize, Deserialize, Debug)]
pub struct AtividadeAnalise {
    pub coletor_nome: String,
    pub cliente_fantasia: String,
    pub cidade: String,
    pub endereco: Option<String>,
    pub bairro: Option<String>,
    pub numero: Option<String>,
    pub status: String,
    #[serde(rename = "dataHora")]
    pub data_hora: String,
}

// --- ADICIONADO ---
// Struct para desserializar a resposta do dropdown de clientes vinda da API.
#[derive(Serialize, Deserialize, Debug)]
pub struct ClienteDropdown {
    pub id: u32,
    pub nome_fantasia: String,
}

// --- ADICIONADO ---
// Struct para desserializar a resposta do dropdown de usuários vinda da API.
#[derive(Serialize, Deserialize, Debug)]
pub struct UsuarioDropdown {
    pub id: u32,
    pub nome: String,
}