import { DataSource, DeepPartial } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { Cargo, Cidade, Usuario } from '../entities';

export class UsuarioSeed implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(Usuario);
    const cidadeRepository = dataSource.getRepository(Cidade);
    const cargoRepository = dataSource.getRepository(Cargo);

    const users = [
      {
        nome: 'André Juan',
        email: 'andre.jvb@example.com',
        celular: '(35) 99999-9999',
        endereco: 'Rua Exemplo, 123',
        senha: 'senha123',
        data_nascimento: '2001-08-20',
        username: 'andrejvb',
        cidade_id: 1, // ID da cidade
        cargo_id: 1, // ID do cargo
      },
      {
        nome: 'Maria Oliveira',
        email: 'maria.oliveira@example.com',
        celular: '(21) 88888-8888',
        endereco: 'Av. Exemplo, 456',
        senha: 'senha456',
        data_nascimento: '1990-05-15',
        username: 'mariaoliveira',
        cidade_id: 3, // ID da cidade
        cargo_id: 3, // ID do cargo
      },
    ];

    for (const user of users) {
      const userExists = await userRepository.findOneBy({ email: user.email });

      if (!userExists) {
        // Busque a cidade e o cargo pelos IDs antes de criar o usuário
        const cidade = await cidadeRepository.findOneBy({ cidade_id: user.cidade_id});
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
          console.log(
            `Erro ao encontrar a cidade ou o cargo para o usuário ${user.nome}.`,
          );
        }
      } else {
        console.log(
          `Usuário ${user.email} já existe. Nenhuma alteração foi feita.`,
        );
      }
    }
  }
}
