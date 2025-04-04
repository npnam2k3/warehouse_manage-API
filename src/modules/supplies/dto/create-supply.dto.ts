import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PHONE_REGEX } from 'src/modules/customers/regex';
import { EMAIL_REGEX } from 'src/modules/users/regex';
import { NAME_COMPANY_REGEX } from '../regex';

export class CreateSupplyDto {
  @IsString({ message: 'Tên công ty phải là 1 chuỗi' })
  @IsNotEmpty({ message: 'Tên công ty không được để trống' })
  @Matches(NAME_COMPANY_REGEX, {
    message:
      'Tên công ty chỉ được chứa chữ cái và khoảng trắng, không có số hoặc ký tự đặc biệt, không có khoảng trắng đầu hoặc cuối và không có khoảng trắng liên tiếp',
  })
  @MinLength(2, { message: 'Tên công ty phải có ít nhất 2 ký tự' })
  @MaxLength(50, { message: 'Tên công ty không được quá 50 ký tự' })
  name_company: string;

  @Transform(({ value }) =>
    value && typeof value === 'string' ? value?.trim() : value,
  )
  @IsString({ message: 'Email phải là 1 chuỗi' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @Matches(EMAIL_REGEX, {
    message: 'Email không hợp lệ',
  })
  email: string;

  @Transform(({ value }) =>
    value && typeof value === 'string' ? value?.trim() : value,
  )
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(PHONE_REGEX, {
    message: 'Số điện thoại không hợp lệ',
  })
  phone: string;

  @Transform(({ value }) =>
    value && typeof value === 'string' ? value?.trim() : value,
  )
  @IsNotEmpty({ message: 'Địa chỉ không được để trống' })
  @IsString({ message: 'Địa chỉ phải là 1 chuỗi' })
  address: string;
}
