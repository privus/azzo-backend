import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cargo, Permissao, CargoPermissao, Usuario } from '../../../infrastructure/database/entities';
import { IRolesRepository } from '../../../domain/repositories/roles.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { PermissaoDTO } from '../dto/pormission-role.dto';

@Injectable()
export class RolesService implements IRolesRepository {
  @Inject('IUserRepository') private readonly userRepository: IUserRepository;

  constructor(
    @InjectRepository(Cargo) private readonly cargoRepository: Repository<Cargo>,
    @InjectRepository(Permissao) private readonly permissaoRepository: Repository<Permissao>,
    @InjectRepository(CargoPermissao) private readonly cargoPermissaoRepository: Repository<CargoPermissao>,
  ) {}

  findRoles(): Promise<Cargo[]> {
    return this.cargoRepository.find({ relations: ['cargoPermissoes', 'cargoPermissoes.permissao'] });
  }

  async createRole(cargo: { nome: string }, permissoes?: PermissaoDTO[]): Promise<Cargo> {
    const roleName = cargo.nome;

    const existingRole = await this.cargoRepository.findOne({ where: { nome: roleName } });

    if (existingRole) {
      throw new ConflictException('Cargo já existe.');
    }

    // Cria o cargo
    const newCargo = this.cargoRepository.create({ nome: cargo.nome });
    const savedCargo = await this.cargoRepository.save(newCargo);

    // Associa as permissões ao cargo
    for (const perm of permissoes) {
      const permissao = await this.permissaoRepository.findOne({ where: { permissao_id: perm.permissao_id } });
      if (!permissao) {
        throw new NotFoundException(`Permissão com ID ${perm.permissao_id} não encontrada.`);
      }

      const cargoPermissao = this.cargoPermissaoRepository.create({
        cargo: savedCargo,
        permissao,
        ler: perm.ler,
        editar: perm.editar,
        criar: perm.criar,
      });

      await this.cargoPermissaoRepository.save(cargoPermissao);
    }

    return this.cargoRepository.findOne({
      where: { cargo_id: savedCargo.cargo_id },
      relations: ['cargoPermissoes', 'cargoPermissoes.permissao'],
    });
  }
  async updateRole(
    id: number,
    cargo: { nome: string },
    permissoes?: { permissao_id: number; ler: number; editar: number; criar: number }[],
  ): Promise<Cargo> {
    const existingRole = await this.cargoRepository.findOne({
      where: { cargo_id: id },
      relations: ['cargoPermissoes'],
    });

    if (!existingRole) {
      throw new NotFoundException('Cargo não encontrado.');
    }

    // Atualizar informações do cargo
    existingRole.nome = cargo.nome;
    await this.cargoRepository.save(existingRole);

    // Atualizar permissões, se fornecidas
    if (permissoes) {
      // Remove permissões existentes
      await this.cargoPermissaoRepository.delete({ cargo_id: id });

      // Adiciona novas permissões
      for (const perm of permissoes) {
        const cargoPermissao = this.cargoPermissaoRepository.create({
          cargo_id: id,
          permissao_id: perm.permissao_id,
          ler: perm.ler,
          editar: perm.editar,
          criar: perm.criar,
        });

        await this.cargoPermissaoRepository.save(cargoPermissao);
      }
    }

    return this.cargoRepository.findOne({
      where: { cargo_id: id },
      relations: ['cargoPermissoes', 'cargoPermissoes.permissao'],
    });
  }

  async findRoleById(id: number): Promise<Cargo> {
    const cargo = await this.cargoRepository.findOne({
      where: { cargo_id: id },
      relations: ['cargoPermissoes', 'cargoPermissoes.permissao'],
    });

    if (!cargo) {
      throw new NotFoundException('Cargo não encontrado.');
    }

    return cargo;
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

  findPermissions(): Promise<Permissao[]> {
    return this.permissaoRepository.find();
  }
}
