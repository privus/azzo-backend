import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ObjectIdColumn, ObjectId } from 'typeorm';
import { Debito } from './';

@Entity('categoria_debito')
export class CategoriaDebito {
  @ObjectIdColumn()
  id: ObjectId;

  @Column({ type: 'varchar', length: 45 })
  nome: string;

  @OneToMany(() => Debito, (debito) => debito.categoria)
  debitos: Debito[];
}
