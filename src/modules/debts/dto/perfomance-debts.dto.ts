export interface DebtsComparisonReport {
    totalPeriodo1: number;
    totalPeriodo2: number;
    variacaoPercentual: number;
    direcao: 'aumento' | 'queda' | 'neutro'; 
    DespesasMesAtual: number;
    despesasDepartamento: {
      [departamento: string]: number;
    };
    despesasCategoria: {
        [categoria: string]: number;
      };
}
  