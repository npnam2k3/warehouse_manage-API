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
  async findPermissionByRole(roleId: number) {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'], // tên của property trong role entity
      select: ['id', 'permissions'],
    });
    return role?.permissions;
  }
}
