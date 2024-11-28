import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../../../infrastructure/database/entities';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { ISharedRepository } from '../../../domain/repositories/shared.repository.interface';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UsersService implements IUserRepository {
  @Inject('ISharedRepository') private readonly sharedService: ISharedRepository;
  constructor(@InjectRepository(Usuario) private readonly userRepository: Repository<Usuario>) {}

  async findBy(param: Partial<Usuario>): Promise<Usuario | null> {
    return this.userRepository.findOne({ where: param, relations: ['cargo', 'cidade', 'cidade.estado', 'regiao'] });
  }

  async findAll(): Promise<Usuario[]> {
    return this.userRepository.find({ relations: ['cargo', 'cidade', 'cidade.estado', 'regiao'] });
  }

  async findById(id: number): Promise<Usuario> {
    return this.userRepository.findOne({ where: { usuario_id: id }, relations: ['cargo', 'cidade', 'cidade.estado', 'regiao'] });
  }

  async register(user: Partial<Usuario>): Promise<Usuario> {
    return this.userRepository.save(user);
  }

  async update(id: number, user: UpdateUserDto): Promise<Usuario> {
    const { cargo_id, regiao_id, cidade_id, ...rest } = user;

    // Obtém as entidades relacionadas para cargo, cidade e regiao, se fornecidos
    const { cargo, cidade, regiao } = await this.sharedService.getRelatedEntities(cargo_id, cidade_id, regiao_id, false);

    const updateData: Partial<Usuario> = {
      ...rest,
      cargo: cargo_id === null ? null : cargo, // Atualiza cargo apenas se fornecido
      ...(cidade && { cidade }), // Atualiza cidade apenas se fornecido
      ...(regiao && { regiao }), // Atualiza regiao apenas se fornecido
    };
    // Atualiza o usuário com os campos que foram fornecidos
    await this.userRepository.update(id, updateData);

    // Retorna o usuário atualizado
    return this.findById(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    const result = await this.userRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return { message: 'Usuário deletado com sucesso.' };
  }

  findUsersByRole(cargo_id: number): Promise<Usuario[]> {
    return this.userRepository.find({ where: { cargo: { cargo_id } }, relations: ['cargo', 'cidade', 'cidade.estado', 'regiao'] });
  }

  async updateUserPhotoUrl(id: number, fotoUrl: string): Promise<void> {
    const usuario = await this.findById(id);
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }
    usuario.fotoUrl = fotoUrl;
    await this.userRepository.save(usuario);
  }
}
