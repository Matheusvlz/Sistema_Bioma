// Ficheiro: src/view/administracao/RelatorioAnalise/components/KpiDashboard.tsx

import React from 'react';
import { KpiData } from '../types';
import styles from '../RelatorioAnalise.module.css';

interface Props {
  data: KpiData;
}

export const KpiDashboard: React.FC<Props> = ({ data }) => (
  <section className={styles.kpiGrid}>
    <div className={styles.kpiCard}>
      <span className={styles.kpiValue}>{data.total}</span>
      <span className={styles.kpiTitle}>Atividades no Período</span>
    </div>
    <div className={styles.kpiCard}>
      <span className={styles.kpiValue}>{data.coletado}</span>
      <span className={styles.kpiTitle}>Coletas Realizadas</span>
    </div>
    <div className={styles.kpiCard}>
      <span className={styles.kpiValue}>{data.agendado}</span>
      <span className={styles.kpiTitle}>Agendamentos Pendentes</span>
    </div>
    <div className={styles.kpiCard}>
      <span className={styles.kpiValue}>{data.aproveitamento}%</span>
      <span className={styles.kpiTitle}>Taxa de Sucesso</span>
    </div>
  </section>
);