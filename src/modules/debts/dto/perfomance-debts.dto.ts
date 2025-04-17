export interface DebtsComparisonReport {
    totalPeriodo1: number;
    totalPeriodo2: number;
    variacaoPercentual: number;
    direcao: 'aumento' | 'queda' | 'neutro'; 
    DepesasMesAtual: number;
    despesasDepartamento: {
      [departamento: string]: number;
    };
}
  