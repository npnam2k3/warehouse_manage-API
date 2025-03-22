import {
  Controller,
  HttpCode,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guard/local-auth.guard';
import { RefreshTokenJwtGuard } from './guard/refreshToken.guard';
import { ENTITIES_MESSAGE } from 'src/constants/entity.message';

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
}
