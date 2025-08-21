import { useState } from 'react';

interface ModalState {
  isOpen: boolean;
  type: 'success' | 'error' | 'warning' | 'confirm';
  title: string;
  message: string;
  onConfirm?: () => void;
}

export const useModal = () => {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const showSuccess = (title: string, message: string) => {
    setModal({ isOpen: true, type: 'success', title, message });
  };

  const showError = (title: string, message: string) => {
    setModal({ isOpen: true, type: 'error', title, message });
  };

  const showWarning = (title: string, message: string) => {
    setModal({ isOpen: true, type: 'warning', title, message });
  };

  const showConfirm = (title: string, message: string, onConfirm?: () => void) => {
    setModal({ isOpen: true, type: 'confirm', title, message, onConfirm })
  };

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  return {
    modal,
    showSuccess,
    showError,
    showWarning,
    showConfirm,
    closeModal
  };
};