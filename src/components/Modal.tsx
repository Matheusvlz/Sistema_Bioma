import React from 'react';
import './css/Modal.css'

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, type, title, message }) => {
    if (!isOpen) return null;

    const icon = type === 'success' ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#22c55e" />
            <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" fill="none" />
        </svg>
    ) : type === 'error' ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#ef4444" />
            <path d="M15 9l-6 6M9 9l6 6" stroke="white" strokeWidth="2" />
        </svg>
    ) : type === 'warning' ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#facc15" />
            <path d="M12 7v5" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1" fill="white" />
        </svg>
    ) : null;


    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal-content modal-${type}`} onClick={e => e.stopPropagation()}>
                <div className="modal-icon">{icon}</div>
                <h3>{title}</h3>
                <p>{message}</p>
                <button onClick={onClose} className="modal-button">OK</button>
            </div>
        </div>
    );
};