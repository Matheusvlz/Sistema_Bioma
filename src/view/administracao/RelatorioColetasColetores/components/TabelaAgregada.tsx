// Ficheiro: src/view/administracao/RelatorioAnalise/components/TabelaAgregada.tsx
import React from 'react';
import { AnaliseAgregada } from '../types';
import styles from '../RelatorioAnalise.module.css';

interface Props {
  dados: AnaliseAgregada[];
}

export const TabelaAgregada: React.FC<Props> = ({ dados }) => {
  return (
    <table className={styles.dataTable}>
      <thead>
        <tr>
          <th>Cliente</th>
          <th>Total de Coletas</th>
        </tr>
      </thead>
      <tbody>
        {dados.map((item) => (
          <tr key={item.cliente_id}>
            <td>{item.cliente_fantasia}</td>
            <td>{item.total_coletas}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};