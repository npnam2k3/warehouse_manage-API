import { IsNotEmpty, IsString } from 'class-validator';

export class AuthDto {
  @IsString({ message: 'Tên đăng nhập phải là 1 chuỗi' })
  @IsNotEmpty({ message: 'Tên đăng nhập không được để trống' })
  username: string;
  @IsString({ message: 'Mật khẩu phải là 1 chuỗi' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password: string;
}
