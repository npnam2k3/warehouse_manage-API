import { IsArray, IsNumber, IsPositive } from 'class-validator';

export class SupplierProductDto {
  @IsNumber({}, { message: 'Mã nhà cung cấp phải là 1 số' })
  @IsPositive({ message: 'Mã nhà cung cấp phải lớn hơn 0' })
  supplierId: number;

  @IsArray({ message: 'Danh sách mã sản phẩm phải là một mảng' })
  listIdProducts: string[];
}
