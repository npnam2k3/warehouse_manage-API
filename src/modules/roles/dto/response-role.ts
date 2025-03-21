import { Expose } from 'class-transformer';

export class RoleResponseDTO {
  @Expose()
  id: number;
  @Expose()
  name: string;
}
