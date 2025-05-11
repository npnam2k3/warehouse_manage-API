import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @IsString({ message: 'Tên sản phẩm phải là 1 chuỗi' })
  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  @Transform(({ value }) =>
    value && typeof value === 'string' ? value?.trim() : value,
  )
  name: string;

  @IsInt({ message: 'Giá nhập phải là 1 số nguyên' })
  @IsNotEmpty({ message: 'Giá nhập không được để trống' })
  @Min(0, { message: 'Giá nhập phải lớn hơn 0' })
  @Transform(({ value }) => parseInt(value, 10))
  purchase_price: number;

  @IsInt({ message: 'Giá bán phải là 1 số nguyên' })
  @IsNotEmpty({ message: 'Giá bán không được để trống' })
  @Min(0, { message: 'Giá bán phải lớn hơn 0' })
  @Transform(({ value }) => parseInt(value, 10))
  sell_price: number;

  @IsString({ message: 'Mô tả phải là 1 chuỗi' })
  @IsOptional()
  @Transform(({ value }) =>
    value && typeof value === 'string' ? value?.trim() : value,
  )
  description: string;

  @IsInt({ message: 'Id danh mục phải là 1 số nguyên' })
  @IsNotEmpty({ message: 'Id danh mục không được để trống' })
  @Min(1, { message: 'Id danh mục phải lớn hơn 1' })
  @Transform(({ value }) => parseInt(value, 10))
  categoryId: number;

  @IsInt({ message: 'Id đơn vị tính phải là 1 số nguyên' })
  @IsNotEmpty({ message: 'Id đơn vị tính không được để trống' })
  @Min(1, { message: 'Id đơn vị tính phải lớn hơn 1' })
  @Transform(({ value }) => parseInt(value, 10))
  unitId: number;
}
