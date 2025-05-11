import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guard/local-auth.guard';
import { RefreshTokenJwtGuard } from './guard/refreshToken.guard';
import { ENTITIES_MESSAGE } from 'src/constants/entity.message';
import { MyJwtGuard } from './guard/jwt-auth.guard';
import { ResponseMessage } from 'src/decorator/response.decorator';
import { RESPONSE_MESSAGE } from 'src/constants/response.message';
import { ChangePasswordDTO } from './dto/change-password.dto';
import { ForgotPasswordDTO } from './dto/forgot-password.dto';
import { ResetPasswordDTO } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(200)
  login(@Request() req, @Res({ passthrough: true }) res: any) {
    return this.authService.login(req.user, res);
  }

  @UseGuards(RefreshTokenJwtGuard)
  @Post('refreshToken')
  refreshToken(@Request() req, @Res({ passthrough: true }) res: any) {
    // console.log(`check user:: `, req.user);
    // console.log(`check refreshToken::`, req.cookies);
    return this.authService.refreshToken(
      req.user,
      req.cookies?.[ENTITIES_MESSAGE.REFRESH_TOKEN],
      res,
    );
  }
  @UseGuards(MyJwtGuard)
  @Get('profile')
  getProfile(@Request() req) {
    const { userId } = req.user;
    return this.authService.getProfile(+userId);
  }

  @UseGuards(MyJwtGuard)
  @Post('logout')
  @ResponseMessage(RESPONSE_MESSAGE.LOGOUT)
  logout(@Request() req, @Res({ passthrough: true }) res: any) {
    const { userId } = req.user;
    return this.authService.logout(res, +userId);
  }

  @Post('changePassword')
  @UseGuards(MyJwtGuard)
  @ResponseMessage(RESPONSE_MESSAGE.CHANGE_PASSWORD)
  changePassword(
    @Body() changePasswordDTO: ChangePasswordDTO,
    @Request() req,
    @Res({ passthrough: true }) res: any,
  ) {
    const { userId } = req.user;
    return this.authService.changePassword(changePasswordDTO, +userId, res);
  }

  @Post('forgotPassword')
  @ResponseMessage(RESPONSE_MESSAGE.SEND_EMAIL)
  forgotPassword(@Body() forgotPasswordDTO: ForgotPasswordDTO) {
    const { email } = forgotPasswordDTO;
    return this.authService.forgotPassword(email);
  }

  @Put('resetPassword/:token')
  @ResponseMessage(RESPONSE_MESSAGE.CHANGE_PASSWORD)
  resetPassword(
    @Param('token') token: string,
    @Body() resetPasswordDTO: ResetPasswordDTO,
  ) {
    return this.authService.resetPassword(token, resetPasswordDTO);
  }
}
