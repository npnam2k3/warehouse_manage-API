import { IsNumber, IsPositive } from 'class-validator';

export class DeleteProductSupplierDto {
  @IsNumber({}, { message: 'Mã nhà cung cấp phải là 1 số' })
  @IsPositive({ message: 'Mã nhà cung cấp phải lớn hơn 0' })
  supplierId: number;

  @IsNumber({}, { message: 'Mã sản phẩm phải là 1 số' })
  @IsPositive({ message: 'Mã sản phẩm phải lớn hơn 0' })
  productId: number;
}
