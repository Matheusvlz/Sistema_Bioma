import React, { useState } from 'react';
import styles from '../RelatorioAnalise.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: { tipo: 'detalhado' | 'agregado' }) => void;
}

export const PdfOptionsModal: React.FC<Props> = ({ isOpen, onClose, onConfirm }) => {
  const [tipo, setTipo] = useState<'detalhado' | 'agregado'>('detalhado');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm({ tipo });
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Opções do Relatório PDF</h2>
        <p>Selecione o formato do relatório que deseja gerar.</p>
        
        <div className={styles.radioGroup}>
          <label>
            <input type="radio" value="detalhado" checked={tipo === 'detalhado'} onChange={() => setTipo('detalhado')} />
            Relatório Detalhado
            <span>(Lista todas as coletas individualmente)</span>
          </label>
          <label>
            <input type="radio" value="agregado" checked={tipo === 'agregado'} onChange={() => setTipo('agregado')} />
            Relatório Agregado por Cliente
            <span>(Mostra o total de coletas por cliente)</span>
          </label>
        </div>
        
        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.modalButtonSecondary}>Cancelar</button>
          <button onClick={handleConfirm} className={styles.modalButtonPrimary}>Gerar PDF</button>
        </div>
      </div>
    </div>
  );
};

// ADICIONE ESTAS CLASSES AO SEU `RelatorioAnalise.module.css`
/*
.modalOverlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modalContent { background: white; padding: 2rem; border-radius: 12px; width: 500px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
.modalContent h2 { margin-top: 0; }
.radioGroup { display: flex; flex-direction: column; gap: 1rem; margin: 1.5rem 0; }
.radioGroup label { display: flex; flex-direction: column; }
.radioGroup span { font-size: 0.8rem; color: #6b7280; }
.modalActions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
.modalButtonPrimary, .modalButtonSecondary { padding: 0.6rem 1.2rem; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; }
.modalButtonPrimary { background-color: #111827; color: white; }
.modalButtonSecondary { background-color: #f3f4f6; color: #374151; }
*/