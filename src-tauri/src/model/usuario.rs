use once_cell::sync::OnceCell;
use serde::{Serialize, Deserialize};
use std::sync::RwLock;
use tauri::command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Usuario {
    pub success: bool,
    pub id: u32,
    pub nome: String,
    pub privilegio: String,
    pub empresa: Option<String>,
    pub ativo: bool,
    pub nome_completo: String,
    pub cargo: String,
    pub numero_doc: String,
}

static USUARIO_LOGADO: OnceCell<RwLock<Usuario>> = OnceCell::new();

pub fn salvar_usuario(usuario: Usuario) {
    if let Some(lock) = USUARIO_LOGADO.get() {
        let mut writable = lock.write().unwrap();
        *writable = usuario;
    } else {
        USUARIO_LOGADO
            .set(RwLock::new(usuario))
            .expect("Falha ao setar o usuário global");
    }
}

pub fn obter_usuario() -> Option<Usuario> {
    USUARIO_LOGADO.get().map(|lock| lock.read().unwrap().clone())
}

#[command]
pub fn usuario_logado() -> Option<Usuario> {
    obter_usuario()
}
