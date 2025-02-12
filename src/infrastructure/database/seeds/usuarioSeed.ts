import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { Cargo, Cidade, Regiao, Usuario } from '../entities';
import * as bcrypt from 'bcryptjs';

export class UsuarioSeed implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(Usuario);
    const cidadeRepository = dataSource.getRepository(Cidade);
    const cargoRepository = dataSource.getRepository(Cargo);
    const regiaoRepository = dataSource.getRepository(Regiao);

    const users = [
      {
        nome: 'André Juan',
        email: 'andre.jvb@example.com',
        celular: '(35) 99999-9999',
        endereco: 'Rua Exemplo, 123',
        senha: await bcrypt.hash('senha123', 10),
        nascimento: '20/04/1993',
        username: 'andrejvb',
        cidade_id: 1, // ID da cidade
        cargo_id: 1, // ID do cargo
      },
      {
        nome: 'Maria Oliveira',
        email: 'maria.oliveira@example.com',
        celular: '(21) 88888-8888',
        endereco: 'Av. Exemplo, 456',
        senha: await bcrypt.hash('senha45', 10),
        nascimento: '15/05/1990',
        username: 'mariaoliveira',
        cidade_id: 3, // ID da cidade
        cargo_id: 3, // ID do cargo
      },
      {
        nome: 'Luan Alves',
        email: 'luan.oliveira@example.com',
        celular: '(21) 88888-8888',
        endereco: 'Av. Exemplo, 99',
        senha: await bcrypt.hash('senha45', 10),
        nascimento: '15/05/1990',
        username: 'luanalves',
        cidade_id: 3, // ID da cidade
        cargo_id: 2,
        regiao_id: 2, // ID do cargo
      },
    ];

    for (const user of users) {
      const userExists = await userRepository.findOneBy({ email: user.email });

      if (!userExists) {
        // Busque a cidade e o cargo pelos IDs antes de criar o usuário
        const cidade = await cidadeRepository.findOneBy({ cidade_id: user.cidade_id });
        const cargo = await cargoRepository.findOneBy({ cargo_id: user.cargo_id });
        const regiao = user.regiao_id ? await regiaoRepository.findOneBy({ regiao_id: user.regiao_id }) : null;

        if (cidade && cargo) {
          const newUser = userRepository.create({
            ...user,
            cidade,
            cargo,
            regiao,
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
