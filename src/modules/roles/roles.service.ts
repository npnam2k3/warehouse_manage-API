import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
  ) {}
  async findRoleByName(role_name) {
    const role = await this.roleRepository.findOne({
      where: {
        name: role_name,
      },
    });
    return role;
  }
}
