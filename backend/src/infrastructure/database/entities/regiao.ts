import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Cidade, Cliente, Venda, Vendedor } from './';

@Entity('regiao')
export class Regiao {
  @PrimaryGeneratedColumn('increment')
  regiao_id: number;

  @Column({ type: 'int' })
  codigo: number;

  @Column({ type: 'varchar', length: 90 })
  nome: string;

  @OneToMany(() => Cliente, (cliente) => cliente.regiao)
  clientes: Cliente[];

  @OneToMany(() => Cidade, (cidade) => cidade.regiao)
  cidades: Cidade[];

  @OneToMany(() => Vendedor, (vendedor) => vendedor.regiao)
  vendedores: Vendedor[];

  @OneToMany(() => Venda, (venda) => venda.regiao)
  vendas: Venda[];
}
