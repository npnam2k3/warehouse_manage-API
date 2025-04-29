import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CancelImportOrderDto {
  @IsNumber({}, { message: 'Mã hóa đơn nhập phải là 1 số' })
  @IsPositive({ message: 'Mã hóa đơn nhập phải lớn hơn 0' })
  @Transform(({ value }) => parseInt(value, 10))
  import_order_id: number;

  @IsOptional()
  @IsString({ message: 'Lý do hủy phải là 1 chuỗi' })
  cancel_reason: string;
}
