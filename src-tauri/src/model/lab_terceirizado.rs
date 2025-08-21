

use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct LaboratorioTerceirizado {
    pub ID: u32,
    pub NOME: Option<String>,
    pub DOCUMENTO: Option<String>,
    pub TELEFONE: Option<String>,
    pub EMAIL: Option<String>,
    pub ATIVO: Option<i8>,
}

//  CORREÇÃO: Adicionado `Serialize` aqui
#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct LaboratorioTerceirizadoPayload {
    pub ID: Option<u32>,
    pub NOME: Option<String>,
    pub DOCUMENTO: Option<String>,
    pub TELEFONE: Option<String>,
    pub EMAIL: Option<String>,
    pub ATIVO: Option<i8>,
}