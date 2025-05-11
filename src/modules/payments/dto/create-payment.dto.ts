import { IsArray, IsEnum, IsNotEmpty, ValidateNested } from 'class-validator';
import { PaymentMethod, TypeOrderPayment } from '../enum';
import { Type } from 'class-transformer';
import { OrderPaymentDto } from './order-payment.dto';
import { IsValidOrderArray } from './custom-validator';

export class CreatePaymentDto {
  @IsNotEmpty({ message: 'Vui lòng chọn loại hóa đơn thanh toán' })
  @IsEnum(TypeOrderPayment, { message: 'Hóa đơn thanh toán không hợp lệ' })
  type: TypeOrderPayment;

  @IsArray({ message: 'Danh sách hóa đơn phải là một mảng' })
  @ValidateNested({ each: true })
  @Type(() => OrderPaymentDto)
  @IsValidOrderArray({ message: 'Danh sách hóa đơn không hợp lệ' })
  list_orders: OrderPaymentDto[];

  @IsNotEmpty({ message: 'Vui lòng chọn hình thức thanh toán' })
  @IsEnum(PaymentMethod, { message: 'Hình thức thanh toán không hợp lệ' })
  payment_method: PaymentMethod;
}
