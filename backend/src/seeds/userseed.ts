import { Usuario } from '../entities';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';

export class UserSeed implements Seeder {
  async run(dataSource, factoryManager: SeederFactoryManager): Promise<void> {
    const userRepository = dataSource.getRepository(Usuario);

    const userData = {
      nome: 'Simone Alcantara Coelho',
      email: 'simone.alcc@gmail.com',
      endereco: 'Rua Antonio Eduardo Miguel, 221',
      celular: '(35) 99953-4547',
      username: 'simoneac',
      data_registro: '2021-01-04',
      data_nascimento: '1980-05-05',
    };

    const userExists = await userRepository.findOneBy({
      email: userData.email,
    });

    if (!userExists) {
      const newUser = userRepository.create(userData);
      await userRepository.save(newUser);
      console.log(`Usuário ${userData.nome} foi adicionado.`);
    } else {
      console.log(
        `Usuário ${userData.email} já existe. Nenhuma alteração foi feita.`,
      );
    }
  }
}
