import { Type } from 'class-transformer';
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
import { PaymentStatus } from 'src/modules/import-order/enum';
import { ExportProductDTO } from './product-export.dto';
import { IsRequiredDueDate, IsValidProductArray } from './custom-validator';

export class CreateExportOrderDto {
  @IsNotEmpty({ message: 'Vui lòng chọn trạng thái thanh toán' })
  @IsEnum(PaymentStatus, { message: 'Trạng thái thanh toán không hợp lệ' })
  payment_status: PaymentStatus;

  @Type(() => Date)
  @IsRequiredDueDate()
  payment_due_date: Date;

  @IsOptional()
  @IsString({ message: 'Chú thích phải là 1 chuỗi' })
  note: string;

  @IsNumber({}, { message: 'Mã khách hàng phải là 1 số' })
  @IsPositive({ message: 'Mã khách hàng phải lớn hơn 0' })
  customerId: number;

  @IsArray({ message: 'Danh sách sản phẩm phải là một mảng' })
  @ValidateNested({ each: true })
  @Type(() => ExportProductDTO)
  @IsValidProductArray({ message: 'Danh sách sản phẩm không hợp lệ' })
  listProducts: ExportProductDTO[];
}
