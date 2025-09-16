import React from "react";
import { ChevronRight, ChevronsRight, ChevronLeft, ChevronsLeft, FileText, CheckSquare } from "lucide-react";
import styles from "./styles/ParametrosSelector.module.css";

export interface Parametro {
  id: number;
  nome: string;
  id_parametro: number;
  grupo: string;
  tecnica_nome: string;
  unidade: string;
  parametro_pop: number;
  limite: string;
  certificado_pag?: number; // Option<u32>
  codigo: string;
  numero: string;
  revisao: string;
  objetivo: string;
  idtecnica: number;
  n1: number;
  n2: number;
  n3: number;
}

interface ParametrosSelectorProps {
  parametros: Parametro[];
  disponiveis: Parametro[];
  selecionados: Parametro[];
  checkedDisponiveis: number[];
  checkedSelecionados: number[];
  setDisponiveis: React.Dispatch<React.SetStateAction<Parametro[]>>;
  setSelecionados: React.Dispatch<React.SetStateAction<Parametro[]>>;
  setCheckedDisponiveis: React.Dispatch<React.SetStateAction<number[]>>;
  setCheckedSelecionados: React.Dispatch<React.SetStateAction<number[]>>;
}

export const ParametrosSelector: React.FC<ParametrosSelectorProps> = ({ 
  disponiveis,
  selecionados,
  checkedDisponiveis,
  checkedSelecionados,
  setDisponiveis,
  setSelecionados,
  setCheckedDisponiveis,
  setCheckedSelecionados
}) => {

  // Formata o parâmetro com apresentação minimalista
  const formatParametro = (p: Parametro) => (
    <div className={styles.parameterContent}>
      <div className={styles.parameterName}>
        {p.nome}
        <span className={styles.parameterGroup}>{p.grupo}</span>
      </div>
      <div className={styles.parameterDetails}>
        <span className={styles.parameterTechnique}>{p.tecnica_nome}</span>
        <span className={styles.parameterUnit}>Unidade: {p.unidade}</span>
        <span className={styles.parameterLimit}>Limite: {p.limite}</span>
      </div>
      <div className={styles.parameterCode}>
        {p.codigo} {p.numero}/{p.revisao} • {p.objetivo}
      </div>
    </div>
  );

  // Mover selecionados para a direita
  const moverParaDireita = () => {
    const itens = disponiveis.filter(p => checkedDisponiveis.includes(p.id));
    setSelecionados([...selecionados, ...itens]);
    setDisponiveis(disponiveis.filter(p => !checkedDisponiveis.includes(p.id)));
    setCheckedDisponiveis([]);
  };

  // Mover todos para a direita
  const moverTodosParaDireita = () => {
    setSelecionados([...selecionados, ...disponiveis]);
    setDisponiveis([]);
    setCheckedDisponiveis([]);
  };

  // Mover selecionados para a esquerda
  const moverParaEsquerda = () => {
    const itens = selecionados.filter(p => checkedSelecionados.includes(p.id));
    setDisponiveis([...disponiveis, ...itens]);
    setSelecionados(selecionados.filter(p => !checkedSelecionados.includes(p.id)));
    setCheckedSelecionados([]);
  };

  // Mover todos para a esquerda
  const moverTodosParaEsquerda = () => {
    setDisponiveis([...disponiveis, ...selecionados]);
    setSelecionados([]);
    setCheckedSelecionados([]);
  };

  const handleCheckboxChange = (id: number, isSelected: boolean) => {
    if (isSelected) {
      setCheckedSelecionados(prev =>
        prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
      );
    } else {
      setCheckedDisponiveis(prev =>
        prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
      );
    }
  };

  const EmptyState = ({ text, subtext, icon: Icon }: { text: string; subtext: string; icon: React.ComponentType<any> }) => (
    <div className={styles.emptyState}>
      <Icon size={32} className={styles.emptyIcon} />
      <div className={styles.emptyText}>{text}</div>
      <div className={styles.emptySubtext}>{subtext}</div>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Lista da esquerda - Parâmetros Disponíveis */}
      <div className={styles.listContainer}>
        <div className={styles.listHeader}>
          <FileText size={16} />
          Parâmetros Disponíveis ({disponiveis.length})
        </div>
        <div className={styles.listContent}>
          {disponiveis.length === 0 ? (
            <EmptyState 
              text="Nenhum parâmetro disponível" 
              subtext="Todos os parâmetros foram selecionados"
              icon={FileText}
            />
          ) : (
            disponiveis.map(p => (
              <label
                key={p.id}
                htmlFor={`disponivel-${p.id}`} // ALTERAÇÃO: Adicionado htmlFor
                className={styles.parameterItem}
                // ALTERAÇÃO: Removido onClick daqui
              >
                <input
                  id={`disponivel-${p.id}`} // ALTERAÇÃO: Adicionado id
                  type="checkbox"
                  className={styles.checkbox}
                  checked={checkedDisponiveis.includes(p.id)}
                  onChange={() => handleCheckboxChange(p.id, false)}
                  // ALTERAÇÃO: Removido onClick com stopPropagation
                />
                {formatParametro(p)}
              </label>
            ))
          )}
        </div>
      </div>

      {/* Botões de ação */}
      <div className={styles.actionsContainer}>
        <button 
          className={`${styles.actionButton} ${styles.moveRight}`}
          onClick={moverParaDireita}
          disabled={checkedDisponiveis.length === 0}
          title="Mover selecionados"
        >
          <ChevronRight size={16} />
        </button>
        <button 
          className={`${styles.actionButton} ${styles.moveRight}`}
          onClick={moverTodosParaDireita}
          disabled={disponiveis.length === 0}
          title="Mover todos"
        >
          <ChevronsRight size={16} />
        </button>
        <button 
          className={`${styles.actionButton} ${styles.moveLeft}`}
          onClick={moverParaEsquerda}
          disabled={checkedSelecionados.length === 0}
          title="Remover selecionados"
        >
          <ChevronLeft size={16} />
        </button>
        <button 
          className={`${styles.actionButton} ${styles.moveLeft}`}
          onClick={moverTodosParaEsquerda}
          disabled={selecionados.length === 0}
          title="Remover todos"
        >
          <ChevronsLeft size={16} />
        </button>
      </div>

      {/* Lista da direita - Parâmetros Selecionados */}
      <div className={styles.listContainer}>
        <div className={styles.listHeader}>
          <CheckSquare size={16} />
          Parâmetros Selecionados ({selecionados.length})
          {disponiveis.length > 0 && (
            <span style={{ opacity: 0.6, fontSize: '12px', marginLeft: '8px' }}>
              • {disponiveis.length} não inserido(s)
            </span>
          )}
        </div>
        <div className={styles.listContent}>
          {selecionados.length === 0 ? (
            <EmptyState 
              text="Nenhum parâmetro selecionado" 
              subtext="Selecione parâmetros da lista à esquerda"
              icon={CheckSquare}
            />
          ) : (
            selecionados.map(p => (
              <label
                key={p.id}
                htmlFor={`selecionado-${p.id}`} // ALTERAÇÃO: Adicionado htmlFor
                className={styles.parameterItem}
                // ALTERAÇÃO: Removido onClick daqui
              >
                <input
                  id={`selecionado-${p.id}`} // ALTERAÇÃO: Adicionado id
                  type="checkbox"
                  className={styles.checkbox}
                  checked={checkedSelecionados.includes(p.id)}
                  onChange={() => handleCheckboxChange(p.id, true)}
                  // ALTERAÇÃO: Removido onClick com stopPropagation
                />
                {formatParametro(p)}
              </label>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ParametrosSelector;