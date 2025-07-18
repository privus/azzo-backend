import { ItensVenda } from "src/infrastructure/database/entities";

export interface OrderAssemblyDto {
  responsavel: string;
  itens: ItensVenda[];
}
  