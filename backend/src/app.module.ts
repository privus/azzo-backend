// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Importação das entidades
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
  Estado,
} from './infrastructure/database/entities';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Regiao } from './infrastructure/database/entities/regiao';

@Module({
  imports: [
    // Configuração do ConfigModule
    ConfigModule.forRoot({
      isGlobal: true, // Torna o módulo de configuração global
      envFilePath: '.env', // Caminho para o arquivo .env
    }),
    // Configuração assíncrona do TypeOrmModule
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // Importa o ConfigModule
      inject: [ConfigService], // Injeta o ConfigService
      useFactory: async (
        configService: ConfigService,
      ): Promise<TypeOrmModuleOptions> => ({
        type: 'mysql',
        host: 'mysql-container', // Nome do serviço MySQL no Docker Compose
        port: 3306,
        username: 'usuario',
        password: 'senha',
        database: 'meu_banco',
        entities: [
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
          Estado,
          Regiao,
        ],
        migrations: [__dirname + '/infrastructure/database/migrations/*.{ts,js}'],
        synchronize: true, // Use sincronização apenas para desenvolvimento
        logging: configService.get<string>('DB_LOGGING') === 'true', // Controle de logging via variável de ambiente
      }),
    }),
    // Registrando os repositórios
    TypeOrmModule.forFeature([
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
      Estado,
    ]),
    // Outros módulos podem ser adicionados aqui
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
