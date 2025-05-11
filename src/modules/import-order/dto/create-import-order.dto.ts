import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
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
