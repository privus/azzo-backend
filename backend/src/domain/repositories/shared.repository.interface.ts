import { Cargo, Cidade, Regiao } from 'src/infrastructure/database/entities';

export interface ISharedRepository {
  getRelatedEntities(
    cargo_id?: number,
    cidade_id?: number,
    regiao_id?: number,
    isCreate?: boolean,
  ): Promise<{ cargo: Cargo | null; cidade: Cidade | null; regiao: Regiao | null }>;
}
