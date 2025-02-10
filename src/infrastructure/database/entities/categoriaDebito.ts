import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Debito } from './';

@Entity('categoria_debito')
export class CategoriaDebito {
  @PrimaryGeneratedColumn('increment')
  categoria_id: number;

  @Column({ type: 'varchar', length: 45 })
  nome: string;

  @OneToMany(() => Debito, (debito) => debito.categoria)
  debitos: Debito[];
}
