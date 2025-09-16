import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import styles from './css/CalculoIDE.module.css';
import FormulaFormModal from './FormulaFormModal';

// --- Interfaces ---
interface Formula { id: number; name: string; description?: string; expression: string; }
interface ApiResponse<T> { success: boolean; data: T; message: string; }
interface ValidationResponse { variables: string[]; }
interface TestResponse { result: number; }
interface ModalState { mode: 'closed' | 'create' | 'edit'; formula?: Formula; }

const CalculoIDE: React.FC = () => {
  // --- Estados ---
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null);
  const [detectedVariables, setDetectedVariables] = useState<string[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalState, setModalState] = useState<ModalState>({ mode: 'closed' });

  // --- Funções de Dados ---
  const carregarFormulas = useCallback(async () => {
    setStatus('loading');
    try {
      const response: ApiResponse<Formula[]> = await invoke('listar_calculos');
      if (response.success) {
        setFormulas(response.data);
        setStatus('idle');
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao carregar fórmulas.');
      setStatus('error');
    }
  }, []);

  useEffect(() => { carregarFormulas(); }, [carregarFormulas]);

  // --- Handlers de Interação ---
  const handleSelectFormula = useCallback(async (formula: Formula) => {
    setSelectedFormula(formula);
    setVariableValues({});
    setTestResult(null);
    setDetectedVariables([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const res: ApiResponse<ValidationResponse> = await invoke('validar_formula', { payload: { expression: formula.expression } });
      if (res.success) {
        setDetectedVariables(res.data.variables);
      } else {
        setTestResult(`Erro na fórmula selecionada: ${res.message}`);
      }
    } catch (e: any) {
      setTestResult(`Erro ao comunicar com o backend: ${e.message}`);
    }
  }, []);

  const handleTestFormula = useCallback(async () => {
    if (!selectedFormula) return;
    const variablesAsNumbers: Record<string, number> = {};
    let hasError = false;
    for (const key of detectedVariables) {
      const value = parseFloat(variableValues[key]);
      if (isNaN(value)) {
        setTestResult(`Erro: O valor para '${key}' é inválido ou não foi preenchido.`);
        hasError = true;
        break;
      }
      variablesAsNumbers[key] = value;
    }
    if (hasError) return;

    try {
      const response: ApiResponse<TestResponse> = await invoke('testar_formula', { payload: { expression: selectedFormula.expression, variables: variablesAsNumbers }});
      if (response.success) {
        setTestResult(`Resultado: ${response.data.result}`);
      } else {
        setTestResult(`Erro no cálculo: ${response.message}`);
      }
    } catch (err: any) {
      setTestResult(`Erro de comunicação: ${err.message}`);
    }
  }, [selectedFormula, detectedVariables, variableValues]);
  
  const handleDeleteFormula = useCallback(async (id: number) => {
    if (window.confirm('Tem certeza que deseja deletar esta fórmula? A ação não pode ser desfeita.')) {
      try {
        await invoke('deletar_calculo', { id });
        if (selectedFormula?.id === id) {
          setSelectedFormula(null);
          setTestResult(null);
        }
        await carregarFormulas(); // Recarrega a lista para refletir a exclusão
      } catch (e: any) {
        alert(`Erro ao deletar: ${e.message}`);
      }
    }
  }, [selectedFormula, carregarFormulas]);

  const handleSaveFormula = useCallback(async (data: { name: string; description: string; expression: string }, id?: number) => {
    try {
      if (modalState.mode === 'edit' && id) {
        await invoke('editar_calculo', { id, payload: data });
      } else {
        await invoke('salvar_calculo', { payload: data });
      }
      setModalState({ mode: 'closed' });
      await carregarFormulas(); // Recarrega a lista para refletir a alteração
    } catch (e: any) {
      alert(`Erro ao salvar: ${e.message}`);
    }
  }, [modalState.mode, carregarFormulas]);

  const filteredFormulas = useMemo(() => formulas.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.expression.toLowerCase().includes(searchTerm.toLowerCase())
  ), [formulas, searchTerm]);

  return (
    <div className={styles.container}>
      {modalState.mode !== 'closed' && (
        <FormulaFormModal
          mode={modalState.mode}
          initialData={modalState.formula}
          onSave={handleSaveFormula}
          onClose={() => setModalState({ mode: 'closed' })}
        />
      )}

      <header className={styles.header}><h1>Motor de Cálculos</h1></header>
      
      {selectedFormula && (
        <section className={styles.workbench}>
          <h2>Calculadora: {selectedFormula.name}</h2>
          <div className={styles.expressionDisplay}><code>{selectedFormula.expression}</code></div>
          {detectedVariables.length > 0 && (
            <div className={styles.variablesArea}>
              <h3>Preencha os Valores:</h3>
              <div className={styles.variableInputs}>
                {detectedVariables.map(variable => (
                  <div key={variable} className={styles.variableInput}>
                    <label htmlFor={variable}>{variable}:</label>
                    <input type="number" id={variable} value={variableValues[variable] || ''} onChange={e => setVariableValues(prev => ({ ...prev, [variable]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <button onClick={handleTestFormula} className={styles.testButton}>Calcular</button>
            </div>
          )}
          {testResult && (
            <div className={styles.resultArea}><pre><code>{testResult}</code></pre></div>
          )}
        </section>
      )}

      <section className={styles.library}>
        <div className={styles.toolbar}>
            <input type="text" placeholder="Digite para filtrar a biblioteca de fórmulas..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <button onClick={() => setModalState({ mode: 'create' })}>+ Cadastrar Nova Fórmula</button>
        </div>
        <div className={styles.tableContainer}>
            {status === 'loading' && <p>Carregando biblioteca...</p>}
            {status === 'error' && <p className={styles.error}>{errorMsg}</p>}
            {status === 'idle' && (
            <table>
                <thead><tr><th>Nome</th><th>Expressão</th><th>Ações</th></tr></thead>
                <tbody>
                    {filteredFormulas.length > 0 ? filteredFormulas.map(formula => (
                        <tr key={formula.id} onClick={() => handleSelectFormula(formula)} className={selectedFormula?.id === formula.id ? styles.selectedRow : ''}>
                            <td>{formula.name}</td>
                            <td><code>{formula.expression}</code></td>
                            <td>
                                <div className={styles.actions}>
                                    {/* --- BOTÃO EDITAR ATUALIZADO --- */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setModalState({ mode: 'edit', formula }); }} 
                                        className={styles.buttonEdit} 
                                        title="Editar Fórmula"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    </button>
                                    {/* --- BOTÃO DELETAR ATUALIZADO --- */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteFormula(formula.id); }} 
                                        className={styles.buttonDelete} 
                                        title="Deletar Fórmula"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan={3}>Nenhuma fórmula encontrada.</td></tr>
                    )}
                </tbody>
            </table>
            )}
        </div>
      </section>
    </div>
  );
};

export default CalculoIDE;