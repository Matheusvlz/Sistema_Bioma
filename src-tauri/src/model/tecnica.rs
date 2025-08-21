use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct Tecnica {
    pub ID: u8,
    pub nome: String,
}
