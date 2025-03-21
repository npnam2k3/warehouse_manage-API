import { Expose, Type } from 'class-transformer';
import { RoleResponseDTO } from 'src/modules/roles/dto/response-role';

export class UserResponseDTO {
  @Expose()
  id: number;

  @Expose()
  username: string;

  @Expose()
  fullname: string;

  @Expose()
  email: string;

  @Expose()
  @Type(() => RoleResponseDTO)
  role: RoleResponseDTO;
}
