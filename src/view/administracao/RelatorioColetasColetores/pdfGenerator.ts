// Ficheiro: src/view/administracao/RelatorioAnalise/pdfGenerator.ts

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AnaliseDetalhada,
  AnaliseAgregada,
  Filtros,
  DropdownOption,
} from './types';
import logoBioma from '/logo-bioma.png';

interface DropdownData {
  clientes: DropdownOption[];
  coletores: DropdownOption[];
}

const COR_PRINCIPAL_VERDE = '#006A4E';
const COR_TEXTO_TITULO = '#2F4F4F';
const COR_TEXTO_NORMAL = '#333333';
const COR_LINHA_DIVISORIA = '#E0E0E0';

const formatarFiltros = (filtros: Filtros, dropdownData: DropdownData): string[] => {
  const dataInicialFmt = new Date(filtros.dataInicial + 'T12:00:00').toLocaleDateString('pt-BR');
  const dataFinalFmt = new Date(filtros.dataFinal + 'T12:00:00').toLocaleDateString('pt-BR');
  
  const descricao: string[] = [];
  descricao.push(`Período de Análise: ${dataInicialFmt} a ${dataFinalFmt}`);

  if (filtros.clienteId) {
    const cliente = dropdownData.clientes.find(c => c.value === filtros.clienteId);
    descricao.push(`Cliente: ${cliente ? cliente.label : 'ID ' + filtros.clienteId}`);
  } else {
    descricao.push('Clientes: Todos');
  }

  if (filtros.coletorId) {
    const coletor = dropdownData.coletores.find(c => c.value === filtros.coletorId);
    descricao.push(`Coletor: ${coletor ? coletor.label : 'ID ' + filtros.coletorId}`);
  } else {
    descricao.push('Coletores: Todos');
  }

  if (filtros.cidade) {
    descricao.push(`Cidade: ${filtros.cidade}`);
  } else {
    descricao.push('Cidades: Todas');
  }

  return descricao;
};

export const generatePdf = async (
  options: { tipo: 'detalhado' | 'agregado' },
  dados: any[],
  filtros: Filtros,
  dropdownData: DropdownData,
  chartImageBase64: string | null
) => {
  if (!dados || dados.length === 0) {
    alert("Não há dados para gerar o relatório com os filtros atuais.");
    return;
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const dataGeracao = new Date().toLocaleString('pt-BR');
  const linhasFiltros = formatarFiltros(filtros, dropdownData);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // --- 1. CRIAÇÃO DA PÁGINA DE ROSTO (CAPA) ---
  const imgProps = doc.getImageProperties(logoBioma);
  const logoWidth = 60;
  const logoHeight = (imgProps.height * logoWidth) / imgProps.width; // Mantém a proporção correta
  doc.addImage(logoBioma, 'PNG', pageWidth / 2 - logoWidth / 2, 40, logoWidth, logoHeight);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(COR_TEXTO_TITULO);
  doc.text('Relatório de Análise Operacional', pageWidth / 2, 85, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(COR_TEXTO_NORMAL);
  doc.text(`Gerado em: ${dataGeracao}`, pageWidth / 2, 95, { align: 'center' });
  
  // Adiciona a nova página onde o conteúdo real começará
  doc.addPage();
  
  // --- 2. CONTEÚDO A PARTIR DA SEGUNDA PÁGINA ---
  let startY = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(COR_TEXTO_TITULO);
  doc.text('Filtros Aplicados', margin, startY);
  startY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(COR_TEXTO_NORMAL);
  linhasFiltros.forEach((linha, index) => {
    doc.text(linha, margin, startY + (index * 5));
  });
  startY += (linhasFiltros.length * 5) + 5;

  if (options.tipo === 'agregado' && chartImageBase64) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Gráfico: Total de Coletas por Cliente (Top 5)', margin, startY);
    startY += 5;
    
    const chartWidth = pageWidth - (margin * 2);
    const chartHeight = 80;
    doc.addImage(chartImageBase64, 'PNG', margin, startY, chartWidth, chartHeight);
    startY += chartHeight + 5;

    doc.setFont('helvetica', 'bold');
    doc.text('Análise Rápida', margin, startY);
    startY += 6;

    const topCliente = dados[0] as AnaliseAgregada;
    const totalClientes = dados.length;
    const analiseText = `O relatório agrega as coletas de ${totalClientes} clientes distintos no período filtrado. O cliente de maior destaque é "${topCliente.cliente_fantasia}", com um total de ${topCliente.total_coletas} coletas, representando a maior atividade individual.`;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(analiseText, margin, startY, { maxWidth: pageWidth - (margin * 2) });
    
    startY += 20;
  }

  const headStyles = {
    fillColor: COR_PRINCIPAL_VERDE,
    textColor: '#FFFFFF',
    fontStyle: 'bold' as const, // <-- Adicione 'as const' aqui
  };

  autoTable(doc, {
    startY: startY,
    head: options.tipo === 'detalhado'
      ? [['Cliente', 'Coletor', 'Endereço Completo', 'Data & Hora']]
      : [['Nome Fantasia', 'Total de Coletas']],
    body: options.tipo === 'detalhado'
      ? (dados as AnaliseDetalhada[]).map(d => [d.cliente_fantasia, d.coletor_nome, `${d.endereco || ''}, ${d.numero || ''} - ${d.bairro || ''}, ${d.cidade || ''}`, new Date(d.data_hora).toLocaleString('pt-BR')])
      : (dados as AnaliseAgregada[]).map(d => [d.cliente_fantasia, d.total_coletas]),
    headStyles: headStyles,
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      if (pageCount > 1 && data.pageNumber > 1) { 
        doc.setFontSize(8);

       doc.text(`Página ${data.pageNumber - 1} de ${pageCount - 1}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
    },
    margin: { top: 15, bottom: 25 },
  });
  
  // --- 3. RODAPÉ FINAL (APENAS NA ÚLTIMA PÁGINA) ---
  const finalPageCount = (doc as any).internal.getNumberOfPages();
  doc.setPage(finalPageCount);
  
  const finalFooterY = pageHeight - 20;
  doc.setDrawColor(COR_LINHA_DIVISORIA);
  doc.line(margin, finalFooterY, pageWidth - margin, finalFooterY);

  doc.setFontSize(8);
  doc.setTextColor(COR_TEXTO_NORMAL);
  doc.setFont('helvetica', 'bold');
  doc.text('Bioma Ambiental', margin, finalFooterY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text('CNPJ: 08.455.978/0001-50', margin, finalFooterY + 9);
  doc.text('Rua Cel. José de Castro, 375 - Centro - Cruzeiro/SP', margin, finalFooterY + 12);

  const textoDireita = `(12) 3144-4203 - bioma@biomaambiental.com.br\nLic. Func Mapa: 008-SP/2009`;
  doc.text(textoDireita, pageWidth - margin, finalFooterY + 7.5, { align: 'right' });
  
  // CORREÇÃO CRÍTICA: Remove a primeira página (a capa original)
  // Isso faz com que o conteúdo comece na página 1 e a numeração fique correta
  //doc.deletePage(1); <-- REMOVA OU COMENTE ESTA LINHA

  // Atualiza a numeração de todas as páginas no final, agora que a capa foi removida
  const totalPagesFinal = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPagesFinal; i++) {
    doc.setPage(i);
    // Reescreve a numeração em cada página com o total correto
    doc.text(`Página ${i} de ${totalPagesFinal}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  doc.save(`Relatorio_Bioma_${options.tipo}_${new Date().toISOString().split('T')[0]}.pdf`);
};