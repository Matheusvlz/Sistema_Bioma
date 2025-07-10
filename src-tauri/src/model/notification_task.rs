use once_cell::sync::OnceCell;
use serde::{Serialize, Deserialize};
use std::sync::RwLock;
use tauri::command; // Keep this if `notificacao_atual` is a tauri command.

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationTask {
    pub id: u64,
    pub nome: String,
    pub descricao: Option<String>,
    pub icon: Option<String>,
    #[serde(rename = "type")]
    pub tipo: Option<String>,
    pub finalizado: bool,
    pub created_at: String,
    pub updated_at: String,
    pub user_id: u64,
}

static NOTIFICACAO_ATUAL: OnceCell<RwLock<NotificationTask>> = OnceCell::new();


pub fn salvar_notificacao(notificacao: NotificationTask)
{
    if let Some(lock) = NOTIFICACAO_ATUAL.get()
     {
        let mut writable = lock.write().unwrap();
        *writable = notificacao;
    }
     else
     {
        NOTIFICACAO_ATUAL
            .set(RwLock::new(notificacao))
            .expect("Falha ao setar a notificação global");
    }
}

pub fn obter_notificacao() -> Option<NotificationTask> {
    NOTIFICACAO_ATUAL.get().map(|lock| lock.read().unwrap().clone())
}

#[command]
pub fn notificacao_atual() -> Option<NotificationTask> {
    obter_notificacao()
}