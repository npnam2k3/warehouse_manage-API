import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsString({ message: 'Tên danh mục phải là 1 chuỗi' })
  @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
  @Transform(({ value }) =>
    value && typeof value === 'string' ? value?.trim() : value,
  )
  name: string;

  @IsString({ message: 'Mô tả phải là 1 chuỗi' })
  @IsOptional()
  @Transform(({ value }) =>
    value && typeof value === 'string' ? value?.trim() : value,
  )
  description: string;
}
