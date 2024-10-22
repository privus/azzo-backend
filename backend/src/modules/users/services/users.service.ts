import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../../../infrastructure/database/entities';
import { IUserRepository } from 'src/domain/repositories/user.repository.interface';
import { ISharedRepository } from 'src/domain/repositories/shared.repository.interface';

@Injectable()
export class UsersService implements IUserRepository {
  @Inject('ISharedRepository') private readonly sharedService: ISharedRepository;
  @Inject('ISharedRepository') private readonly sharedService: ISharedRepository;
  constructor(@InjectRepository(Usuario) private readonly userRepository: Repository<Usuario>) {}

  async findByEmail(email: string): Promise<Usuario> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findAll(): Promise<Usuario[]> {
    return this.userRepository.find();
  }

  async findById(id: number): Promise<Partial<Usuario>> {
    return this.userRepository.findOne({ where: { usuario_id: id }, relations: ['cargo', 'cidade', 'cidade.estado', 'regiao'] });
  }

  async register(user: Partial<Usuario>): Promise<Usuario> {
    return this.userRepository.save(user);
  }

  async update(id: number, user: Partial<Usuario>): Promise<Usuario> {
    const { cargo_id, regiao_id, cidade_id, ...rest } = user;

    // Obtém as entidades relacionadas para cargo, cidade e regiao, se fornecidos
    const { cargo, cidade, regiao } = await this.sharedService.getRelatedEntities(false, cargo_id, cidade_id, regiao_id);

    // Atualiza o usuário com as entidades relacionadas e outros campos
    await this.userRepository.update(id, {
      ...rest,
      cargo, // Atribui o cargo relacionado, se encontrado
      cidade, // Atribui a cidade relacionada, se encontrada
      regiao, // Atribui a regiao relacionada, se encontrada
    });

    // Retorna o usuário atualizado
    return this.userRepository.findOne({ where: { usuario_id: id } });
  }
  async remove(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }
}
