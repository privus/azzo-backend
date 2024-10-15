import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CanalVenda,
  Cargo,
  CategoriaCliente,
  CategoriaProduto,
  CategoriaTransacao,
  Cidade,
  Financeiro,
  Cliente,
  FormaPagamento,
  Fornecedor,
  KitProdutosVinculados,
  Produto,
  ProdutosVinculados,
  StatusCliente,
  StatusEnvio,
  StatusPagamento,
  TipoEnvio,
  Usuario,
  Venda,
  ItensVenda,
} from './entity';

import { User } from './users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT, 10) || 3306,
      username: process.env.DATABASE_USER || 'usuario',
      password: process.env.DATABASE_PASSWORD || 'senha',
      database: process.env.DATABASE_NAME || 'meu_banco',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Somente para desenvolvimento
    }),
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
