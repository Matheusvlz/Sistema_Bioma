// SalvarTemperaturaModal.tsx - NOVO ARQUIVO
import React, { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { X, Save, Loader, AlertTriangle, Thermometer } from "lucide-react";
import styles from "./styles/SalvarTemperaturaModal.module.css"; // Estilos para este modal

// Interface para o usuário logado (copiada de Laboratorio.tsx)
interface Usuario {
  success: boolean;
  id: number;
  nome: string;
  privilegio: string;
  empresa?: string;
  ativo: boolean;
  nome_completo: string;
  cargo: string;
  numero_doc: string;
  profile_photo?: string;
  dark_mode: boolean;
}

// Interface para a resposta do novo comando Tauri
interface SalvarResponse {
  success: boolean;
  message?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  id: number | null;
}

const SalvarTemperaturaModal: React.FC<Props> = ({ isOpen, onClose, id }) => {
  const [temperatura, setTemperatura] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Limpa o estado quando o modal é fechado ou o ID muda
  useEffect(() => {
    if (isOpen) {
      setTemperatura("");
      setError(null);
      setLoading(false);
    }
  }, [isOpen, id]);

  const handleSave = async () => {
    if (!id) {
      setError("ID do item não encontrado.");
      return;
    }
    if (!temperatura.trim()) {
      setError("Por favor, digite o valor da temperatura.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Obter o usuário logado
      const userResponse = await invoke<Usuario>("usuario_logado");
      if (!userResponse || !userResponse.id) {
        throw new Error("Não foi possível identificar o usuário logado.");
      }
      const idUsuario = userResponse.id;

      // 2. Chamar o novo comando Tauri
      const response = await invoke<SalvarResponse>("salvar_temperatura_analise", {
        id: id,
        valor: temperatura,
        idUsuario: idUsuario,
      });

      if (response.success) {
        alert(response.message || "Temperatura salva com sucesso!");
        onClose(); // Fecha o modal
      } else {
        throw new Error(response.message || "Erro ao salvar a temperatura.");
      }
    } catch (err: any) {
      console.error("Erro ao salvar temperatura:", err);
      setError(err.message || "Ocorreu um erro desconhecido.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <Thermometer size={20} />
            Registrar Temperatura
          </h2>
          <button
            className={styles.modalClose}
            onClick={onClose}
            aria-label="Fechar modal"
          >
            <X />
          </button>
        </div>
        
        <div className={styles.modalBody}>
          <p className={styles.modalSubtitle}>
            Registrando temperatura para o item ID: <strong>{id}</strong>
          </p>

          <div className={styles.formGroup}>
            <label htmlFor="temperatura" className={styles.formLabel}>
              Valor da Temperatura
            </label>
            <input
              id="temperatura"
              type="text"
              value={temperatura}
              onChange={(e) => setTemperatura(e.target.value)}
              className={styles.formInput}
              placeholder="Ex: 25.5"
              autoFocus
              disabled={loading}
            />
            <span className={styles.formHint}>Digite o valor medido.</span>
          </div>

          {error && (
            <div className={styles.errorAlert}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.btnCancel}
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            className={styles.btnSave}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader className={styles.spinningIcon} size={18} />
                Salvando...
              </>
            ) : (
              <>
                <Save size={18} />
                Salvar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalvarTemperaturaModal;