import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { PaymentStatus } from 'src/modules/import-order/enum';

export class OrderPaymentDto {
  @IsNumber({}, { message: 'Mã hóa đơn phải là 1 số' })
  @IsPositive({ message: 'Mã hóa đơn phải lớn hơn 0' })
  @Transform(({ value }) => parseInt(value, 10))
  order_id: number;

  @IsNumber({}, { message: 'Số tiền thanh toán phải là 1 số' })
  @IsPositive({ message: 'Số tiền thanh toán phải lớn hơn 0' })
  @Transform(({ value }) => parseInt(value, 10))
  amount: number;

  @IsNotEmpty({ message: 'Vui lòng chọn trạng thái thanh toán' })
  @IsEnum(PaymentStatus, { message: 'Trạng thái thanh toán không hợp lệ' })
  payment_status: PaymentStatus;

  @IsOptional()
  payment_due_date: string;
}
