// Ficheiro: src/view/administracao/RelatorioAnalise/components/TabelaDetalhada.tsx
import React from 'react';
import { AnaliseDetalhada } from '../types';
import styles from '../RelatorioAnalise.module.css';

interface Props {
  dados: AnaliseDetalhada[];
}

export const TabelaDetalhada: React.FC<Props> = ({ dados }) => {
  const formatarDataHora = (dataString: string) => {
    if (!dataString) return 'N/A';
    const data = new Date(dataString);
    if (isNaN(data.getTime())) return 'Data Inválida';
    return data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatarEndereco = (item: AnaliseDetalhada) => {
    return [item.endereco, item.numero, item.bairro, item.cidade].filter(Boolean).join(', ');
  };

  return (
    <table className={styles.dataTable}>
      <thead>
        <tr>
          <th>Cliente</th>
          <th>Coletor</th>
          <th>Endereço Completo</th>
          <th>Data & Hora</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {dados.map((item, index) => (
          <tr key={index}>
            <td title={item.cliente_fantasia}>{item.cliente_fantasia}</td>
            <td title={item.coletor_nome}>{item.coletor_nome}</td>
            <td title={formatarEndereco(item)}>{formatarEndereco(item)}</td>
            <td>{formatarDataHora(item.data_hora)}</td>
            <td><span className={`${styles.statusBadge} ${item.status === 'Coletado' ? styles.coletado : styles.agendado}`}>{item.status}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};