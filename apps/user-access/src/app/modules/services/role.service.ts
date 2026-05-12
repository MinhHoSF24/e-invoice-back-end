import { Injectable } from '@nestjs/common';
import { RoleRepository } from '../repositories/role.repository';
import { ROLE } from '@common/constants/enum/role.enum';

@Injectable()
export class RoleService {
  constructor(private readonly roleRepository: RoleRepository) {}

  getAll() {
    return this.roleRepository.getAll();
  }

  getByName(name: ROLE) {
    return this.roleRepository.getByName(name);
  }

  getById(id: string) {
    return this.roleRepository.getById(id);
  }
}
