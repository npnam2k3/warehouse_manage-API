import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWarehouseDto {
  @IsString({ message: 'Tên kho phải là 1 chuỗi' })
  @IsNotEmpty({ message: 'Tên kho không được để trống' })
  @Transform(({ value }) =>
    value && typeof value === 'string' ? value?.trim() : value,
  )
  name: string;

  @IsString({ message: 'Địa chỉ phải là 1 chuỗi' })
  @IsOptional()
  @Transform(({ value }) =>
    value && typeof value === 'string' ? value?.trim() : value,
  )
  address: string;
}
