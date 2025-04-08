import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { PaymentStatus } from '../enum';
import { ImportProductDTO } from './product-import.dto';
import { Type } from 'class-transformer';
import { IsRequiredDueDate, IsValidProductArray } from './custom-validator';

export class CreateImportOrderDto {
  @IsNotEmpty({ message: 'Vui lòng chọn trạng thái thanh toán' })
  @IsEnum(PaymentStatus, { message: 'Trạng thái thanh toán không hợp lệ' })
  payment_status: PaymentStatus;

  @Type(() => Date)
  @IsRequiredDueDate()
  payment_due_date: Date;

  @IsNumber({}, { message: 'Số tiền đã thanh toán phải là số' })
  @IsPositive({ message: 'Số tiền đã thanh toán phải lớn hơn 0' })
  @IsNotEmpty({ message: 'Số tiền đã thanh toán bắt buộc nhập' })
  @ValidateIf(
    (o: CreateImportOrderDto) =>
      o.payment_status === PaymentStatus.PARTIALLY_PAID,
  )
  amount_paid: number;

  @IsNumber({}, { message: 'Số tiền còn lại phải là số' })
  @IsPositive({ message: 'Số tiền còn lại phải lớn hơn 0' })
  @IsNotEmpty({ message: 'Số tiền còn lại bắt buộc nhập' })
  @ValidateIf(
    (o: CreateImportOrderDto) =>
      o.payment_status === PaymentStatus.PARTIALLY_PAID,
  )
  amount_due: number;

  @IsOptional()
  @IsString({ message: 'Chú thích phải là 1 chuỗi' })
  note: string;

  @IsNumber({}, { message: 'Mã nhà cung cấp phải là 1 số' })
  @IsPositive({ message: 'Mã nhà cung cấp phải lớn hơn 0' })
  supplierId: number;

  @IsArray({ message: 'Danh sách sản phẩm phải là một mảng' })
  @ValidateNested({ each: true })
  @Type(() => ImportProductDTO)
  @IsValidProductArray({ message: 'Danh sách sản phẩm không hợp lệ' })
  listProducts: ImportProductDTO[];
}
