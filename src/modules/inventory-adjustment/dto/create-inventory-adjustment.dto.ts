import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class CreateInventoryAdjustmentDto {
  @IsNumber({}, { message: 'Mã sản phẩm phải là 1 số' })
  @IsPositive({ message: 'Mã sản phẩm phải lớn hơn 0' })
  productId: number;

  @IsNumber({}, { message: 'Mã kho phải là 1 số' })
  @IsPositive({ message: 'Mã kho phải lớn hơn 0' })
  warehouseId: number;

  @IsNumber({}, { message: 'Số lượng cũ trong kho phải là 1 số' })
  @IsPositive({ message: 'Số lượng cũ trong kho phải lớn hơn 0' })
  oldQuantity: number;

  @IsNumber({}, { message: 'Số lượng mới phải là 1 số' })
  @IsPositive({ message: 'Số lượng mới phải lớn hơn 0' })
  newQuantity: number;

  @IsNotEmpty({
    message: 'Vui lòng nhập lý do điều chỉnh để phục vụ cho báo cáo sau này.',
  })
  reasonChange: string;
}
