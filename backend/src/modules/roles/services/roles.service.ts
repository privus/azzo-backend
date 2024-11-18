import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cargo, Usuario } from '../../../infrastructure/database/entities';
import { IRolesRepository } from '../../../domain/repositories/roles.repository.interface';
import { IUserRepository } from 'src/domain/repositories/user.repository.interface';

@Injectable()
export class RolesService implements IRolesRepository {
  @Inject('IUserRepository') private readonly userRepository: IUserRepository;
  constructor(@InjectRepository(Cargo) private readonly cargoRepository: Repository<Cargo>) {}

  findRoles(): Promise<Cargo[]> {
    return this.cargoRepository.find();
  }

  async createRole(cargo: Cargo): Promise<Cargo> {
    const roleName = cargo.nome;

    const existingRole = await this.cargoRepository.findOne({ where: { nome: roleName } });

    if (existingRole) {
      throw new ConflictException('Cargo já existe.');
    }

    return await this.cargoRepository.save(cargo);
  }

  async updateRole(id: number, cargo: Cargo): Promise<Cargo> {
    await this.cargoRepository.update(id, cargo);
    return await this.cargoRepository.findOne({ where: { cargo_id: id } });
  }

  async findRoleById(id: number): Promise<Cargo> {
    return await this.cargoRepository.findOne({ where: { cargo_id: id } });
  }

  async deleteRole(id: number): Promise<{ message: string }> {
    const result = await this.cargoRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Cargo não encontrado.');
    }

    return { message: 'Cargo deletado com sucesso.' };
  }

  findUsersByRole(cargo_id: number): Promise<Usuario[]> {
    return this.userRepository.findUsersByRole(cargo_id);
  }
}
