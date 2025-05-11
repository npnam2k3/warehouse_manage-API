import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  EMAIL_REGEX,
  FULLNAME_REGEX,
  PASSWORD_REGEX,
  USERNAME_REGEX,
} from '../regex';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsString({ message: 'Tên đăng nhập phải là 1 chuỗi' })
  @IsNotEmpty({ message: 'Tên đăng nhập không được để trống' })
  @Matches(USERNAME_REGEX, {
    message:
      'Tên đăng nhập cho phép số và chữ cái viết liền không dấu, không chứa khoảng trắng, không chứa ký tự đặc biệt',
  })
  @MinLength(5, { message: 'Tên đăng nhập phải có ít nhất 5 ký tự' })
  @MaxLength(20, { message: 'Tên đăng nhập không được quá 20 ký tự' })
  username: string;

  @IsString({ message: 'Họ tên phải là 1 chuỗi' })
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @Matches(FULLNAME_REGEX, {
    message:
      'Họ tên chỉ được chứa chữ cái và khoảng trắng, không có số hoặc ký tự đặc biệt, không có khoảng trắng đầu hoặc cuối và không có khoảng trắng liên tiếp',
  })
  @MinLength(2, { message: 'Họ tên phải có ít nhất 2 ký tự' })
  @MaxLength(50, { message: 'Họ tên không được quá 50 ký tự' })
  fullname: string;

  @Transform(({ value }) =>
    value && typeof value === 'string' ? value?.trim() : value,
  )
  @IsString({ message: 'Email phải là 1 chuỗi' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @Matches(EMAIL_REGEX, {
    message: 'Email không hợp lệ',
  })
  email: string;

  @IsString({ message: 'Mật khẩu phải là 1 chuỗi' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @MaxLength(30, { message: 'Mật khẩu không được quá 30 ký tự' })
  @Matches(PASSWORD_REGEX, {
    message:
      'Mật khẩu phải có ít nhất 1 chữ hoa, 3 chữ thường, 1 số, 1 ký tự đặc biệt và không chứa khoảng trắng và không dấu',
  })
  password: string;

  @IsString({ message: 'Role phải là 1 chuỗi' })
  @IsNotEmpty({ message: 'Role không được để trống' })
  @IsIn(['admin', 'warehouse_manager', 'accountant'], {
    message: 'Role không hợp lệ',
  })
  role: string;
}
