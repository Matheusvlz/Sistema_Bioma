use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub message: String,
    pub data: Option<T>,
}

impl<T> ApiResponse<T> {
    /// Cria uma resposta de sucesso
    pub fn success(message: String, data: Option<T>) -> Self {
        ApiResponse {
            success: true,
            message,
            data,
        }
    }

    /// Cria uma resposta de erro
    pub fn error(message: String) -> Self {
        ApiResponse {
            success: false,
            message,
            data: None,
        }
    }
}

/// Estrutura específica para respostas de erro da API externa
#[derive(Debug, Serialize, Deserialize)]
pub struct ApiError {
    pub status: String,
    pub message: String,
}

/// Estrutura para respostas de sucesso da API externa com dados
#[derive(Debug, Serialize, Deserialize)]
pub struct ApiSuccessResponse<T> {
    pub data: T,
    pub message: Option<String>,
}

/// Estrutura para respostas de lista da API externa
#[derive(Debug, Serialize, Deserialize)]
pub struct ApiListResponse<T> {
    pub data: Vec<T>,
    pub total: Option<usize>,
    pub page: Option<usize>,
    pub limit: Option<usize>,
}
