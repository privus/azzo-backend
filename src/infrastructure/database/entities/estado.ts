import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ObjectIdColumn, ObjectId } from 'typeorm';
import { Cidade } from './';

@Entity('estado')
export class Estado {
  @ObjectIdColumn()
  id: ObjectId;

  @Column({ type: 'varchar', length: 45 })
  nome: string;

  @Column({ type: 'varchar', length: 2 })
  sigla: string;

  @OneToMany(() => Cidade, (cidade) => cidade.estado)
  cidades: Cidade[];
}
