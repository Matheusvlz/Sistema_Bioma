import React, { useState, useEffect } from 'react';
import styles from '../styles/VisualizarInsumoRegistro2.module.css';

interface Payload {
    insumo_id: number;
    registro: string;
    fabricante: string;
    data_preparo: string;
    validade: string;
    usuario_id?: number;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (payload: Payload) => void;
    insumoId: number;
    itemParaEditar?: any; // Se vier preenchido, é edição
    usuarioLogadoId: number;
}

const ModalInsumoRegistro2: React.FC<Props> = ({ 
    isOpen, onClose, onSave, insumoId, itemParaEditar, usuarioLogadoId 
}) => {
    const [lote, setLote] = useState('');
    const [fabricante, setFabricante] = useState('');
    const [preparo, setPreparo] = useState('');
    const [validade, setValidade] = useState('');

    // Popula os campos ao abrir
    useEffect(() => {
        if (isOpen) {
            if (itemParaEditar) {
                setLote(itemParaEditar.registro || '');
                setFabricante(itemParaEditar.fabricante || '');
                setPreparo(itemParaEditar.data_preparo || '');
                setValidade(itemParaEditar.validade || '');
            } else {
                setLote('');
                setFabricante('');
                setPreparo('');
                setValidade('');
            }
        }
    }, [isOpen, itemParaEditar]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            insumo_id: insumoId,
            registro: lote,
            fabricante: manufacturer,
            data_preparo: preparo,
            validade: validade,
            usuario_id: usuarioLogadoId
        });
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h3>{itemParaEditar ? 'Editar Lote' : 'Novo Lote'}</h3>
                    <button onClick={onClose} className={styles.btnDelete} style={{fontSize:'1.5rem'}}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label>Número do Lote / Registro</label>
                        <input 
                            className={styles.formInput} 
                            value={lote} 
                            onChange={e => setLote(e.target.value)} 
                            required 
                            autoFocus
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Fabricante</label>
                        <input 
                            className={styles.formInput} 
                            value={fabricante} 
                            onChange={e => setFabricante(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Data de Preparo</label>
                        <input 
                            type="date" 
                            className={styles.formInput} 
                            value={preparo} 
                            onChange={e => setPreparo(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Data de Validade</label>
                        <input 
                            type="date" 
                            className={styles.formInput} 
                            value={validade} 
                            onChange={e => setValidade(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className={styles.modalActions}>
                        <button type="button" onClick={onClose} className={styles.btnCancel}>Cancelar</button>
                        <button type="submit" className={styles.btnPrimary}>Salvar Dados</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalInsumoRegistro2;