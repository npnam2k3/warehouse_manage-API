import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUnitDto {
  @IsString({ message: 'Tên đơn vị tính phải là 1 chuỗi' })
  @IsNotEmpty({ message: 'Tên đơn vị tính không được để trống' })
  @Transform(({ value }) =>
    value && typeof value === 'string' ? value?.trim() : value,
  )
  name: string;
}
