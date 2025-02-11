import { Entity, Column, OneToMany, JoinColumn, ManyToOne, Unique, ObjectId, ObjectIdColumn } from 'typeorm';
import { Cliente, Usuario, Estado, Regiao } from './';

@Entity('cidade')
@Unique(['nome', 'estado'])
export class Cidade {
  @ObjectIdColumn()
  id: ObjectId;

  @Column({ type: 'varchar', length: 45 })
  nome: string;

  @OneToMany(() => Cliente, (cliente) => cliente.cidade)
  clientes: Cliente[];

  @OneToMany(() => Usuario, (usuario) => usuario.cidade)
  usuarios: Usuario[];

  @ManyToOne(() => Estado, (estado) => estado.cidades)
  @JoinColumn({ name: 'estado_id' })
  estado: Estado;

  @ManyToOne(() => Regiao, (regiao) => regiao.cidades, { nullable: true })
  @JoinColumn({ name: 'regiao_id' })
  regiao: Regiao;
}
