import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateWarehouseLocationDto {
  @IsNotEmpty({ message: 'Mã vị trí không được để trống' })
  @IsString({ message: 'Mã vị trí phải là 1 chuỗi' })
  @Transform(({ value }) =>
    value && typeof value === 'string' ? value?.trim() : value,
  )
  location_code: string;

  @IsString({ message: 'Mô tả phải là 1 chuỗi' })
  @IsOptional()
  @Transform(({ value }) =>
    value && typeof value === 'string' ? value?.trim() : value,
  )
  description: string;

  @IsNumber({}, { message: 'ID phải là 1 số' })
  @IsPositive({ message: 'ID không được âm' })
  @IsNotEmpty({ message: 'ID không được để trống' })
  warehouse_id: number;
}
