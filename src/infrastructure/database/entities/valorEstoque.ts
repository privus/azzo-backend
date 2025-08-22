import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('valor_estoque')
export class ValorEstoque {
  @PrimaryGeneratedColumn()
  valor_estoque_id: number;

  @Column('decimal', { precision: 15, scale: 2 })
  valor_custo: number;

  @Column('decimal', { precision: 15, scale: 2 })
  valor_venda: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  percentual_faturamento: number;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  data_registro: Date;
}
