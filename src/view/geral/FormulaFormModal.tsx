import React, { useState, useEffect } from 'react';
import styles from './css/FormulaFormModal.module.css';

// Interface para os dados de uma fórmula, usada internamente
interface Formula {
  id: number;
  name: string;
  description?: string;
  expression: string;
}

// Interface para os dados que o formulário envia ao salvar
interface FormulaFormData {
  name: string;
  description: string;
  expression: string;
}

// Props que o componente modal recebe do seu "pai" (CalculoIDE)
interface FormulaFormModalProps {
  mode: 'create' | 'edit';
  initialData?: Formula | null;
  onSave: (data: FormulaFormData, id?: number) => void;
  onClose: () => void;
}

const FormulaFormModal: React.FC<FormulaFormModalProps> = ({ mode, initialData, onSave, onClose }) => {
  const [formData, setFormData] = useState<FormulaFormData>({
    name: '',
    description: '',
    expression: '',
  });

  // Este efeito preenche o formulário com os dados existentes quando estamos no modo de edição
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description || '',
        expression: initialData.expression,
      });
    } else {
      // Limpa o formulário para o modo de criação
      setFormData({ name: '', description: '', expression: '' });
    }
  }, [mode, initialData]);

  // Atualiza o estado do formulário a cada alteração nos inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Lida com o envio do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.expression.trim()) {
        alert("Nome e Expressão são campos obrigatórios.");
        return;
    }
    onSave(formData, initialData?.id);
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <header className={styles.modalHeader}>
            <h2>{mode === 'create' ? 'Cadastrar Nova Fórmula' : 'Editar Fórmula'}</h2>
            <button type="button" onClick={onClose} className={styles.closeButton}>&times;</button>
          </header>
          <div className={styles.formBody}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Nome da Fórmula</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="description">Descrição</label>
              <input type="text" id="description" name="description" value={formData.description} onChange={handleChange} />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="expression">Expressão Matemática</label>
              <textarea id="expression" name="expression" value={formData.expression} onChange={handleChange} rows={5} required placeholder="(var1 + var2) / sqrt(var3)" />
            </div>
          </div>
          <footer className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>Cancelar</button>
            <button type="submit" className={styles.saveButton}>Salvar</button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default FormulaFormModal;