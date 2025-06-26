import { useState } from 'react';

interface ModalState {
  isOpen: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
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

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  return {
    modal,
    showSuccess,
    showError,
    closeModal
  };
};