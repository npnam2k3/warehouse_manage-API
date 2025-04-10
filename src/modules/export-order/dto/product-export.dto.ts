import { Transform } from 'class-transformer';
import { IsNumber, IsPositive } from 'class-validator';

export class ExportProductDTO {
  @IsNumber({}, { message: 'Mã sản phẩm phải là 1 số' })
  @IsPositive({ message: 'Mã sản phẩm phải lớn hơn 0' })
  @Transform(({ value }) => parseInt(value, 10))
  productId: number;

  @IsNumber({}, { message: 'Số lượng phải là 1 số' })
  @IsPositive({ message: 'Số lượng phải lớn hơn 0' })
  @Transform(({ value }) => parseInt(value, 10))
  quantity: number;

  @IsNumber({}, { message: 'Giá bán phải là 1 số' })
  @IsPositive({ message: 'Giá bán phải lớn hơn 0' })
  @Transform(({ value }) => parseInt(value, 10))
  sell_price: number;

  @IsNumber({}, { message: 'Mã kho phải là 1 số' })
  @IsPositive({ message: 'Mã kho phải lớn hơn 0' })
  @Transform(({ value }) => parseInt(value, 10))
  warehouseId: number;
}
