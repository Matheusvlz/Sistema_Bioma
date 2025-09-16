import _React, { createContext, useState, useContext, ReactNode } from 'react';

// Crie uma interface para o estado do contexto
interface ReportContextType {
  selectedReportType: string;
  setSelectedReportType: (type: string) => void;
}

// Crie o contexto com valores iniciais
const ReportContext = createContext<ReportContextType | undefined>(undefined);

// Crie o provedor do contexto
export const ReportProvider = ({ children }: { children: ReactNode }) => {
  const [selectedReportType, setSelectedReportType] = useState('');

  return (
    <ReportContext.Provider value={{ selectedReportType, setSelectedReportType }}>
      {children}
    </ReportContext.Provider>
  );
};

// Crie um hook customizado para usar o contexto facilmente
export const useReportContext = () => {
  const context = useContext(ReportContext);
  if (context === undefined) {
    throw new Error('useReportContext deve ser usado dentro de um ReportProvider');
  }
  return context;
};