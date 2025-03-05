import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { Cargo, Cidade, Regiao, Usuario } from '../entities';
import * as bcrypt from 'bcryptjs';

export class UsuarioSeed implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(Usuario);
    const cidadeRepository = dataSource.getRepository(Cidade);
    const cargoRepository = dataSource.getRepository(Cargo);

    const users = [
      {
        nome: 'André Juan',
        email: 'andre.jvb@azzo.com',
        celular: '(35) 99134-0446',
        endereco: 'Rua Goiania, 363',
        senha: await bcrypt.hash('senha123', 10),
        nascimento: '05/04/1993',
        username: 'andrejvb',
        cidade_id: 1, // ID da cidade
        cargo_id: 1, // ID do cargo
      },
      {
        nome: 'Talita',
        email: 'talita@azzo.com',
        celular: '(21) 88888-8888',
        endereco: 'Av. Exemplo, 456',
        senha: await bcrypt.hash('senha45', 10),
        nascimento: '15/05/1990',
        username: 'talita',
        cidade_id: 1, // ID da cidade
        cargo_id: 3, // ID do cargo
      },
      {
        nome: 'Paloma',
        email: 'paloma@azzo.com',
        celular: '(21) 88888-8888',
        endereco: 'Av. Exemplo, 99',
        senha: await bcrypt.hash('senha45', 10),
        nascimento: '15/05/1990',
        username: 'paloma',
        cargo_id: 2,
      },
    ];

    for (const user of users) {
      const userExists = await userRepository.findOneBy({ email: user.email });

      if (!userExists) {
        // Busque a cidade e o cargo pelos IDs antes de criar o usuário
        const cidade = await cidadeRepository.findOneBy({ cidade_id: user.cidade_id });
        const cargo = await cargoRepository.findOneBy({ cargo_id: user.cargo_id });
        
        if (cidade && cargo) {
          const newUser = userRepository.create({
            ...user,
            cidade,
            cargo,
          });
          await userRepository.save(newUser);
          console.log(`Usuário ${user.nome} foi adicionado.`);
        } else {
          console.log(`Erro ao encontrar a cidade ou o cargo para o usuário ${user.nome}.`);
        }
      } else {
        console.log(`Usuário ${user.email} já existe. Nenhuma alteração foi feita.`);
      }
    }
  }
}