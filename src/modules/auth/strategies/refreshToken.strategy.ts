import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';

import { ENTITIES_MESSAGE } from 'src/constants/entity.message';
import { ERROR_MESSAGE } from 'src/constants/exception.message';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refreshToken',
) {
  constructor(configService: ConfigService) {
    const refreshTokenKey = configService.get(
      ENTITIES_MESSAGE.JWT_REFRESH_TOKEN_KEY,
    );
    const cookieName = ENTITIES_MESSAGE.REFRESH_TOKEN;
    const options: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const token = request?.cookies?.[cookieName];
          return token || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: refreshTokenKey,
      passReqToCallback: true, // Chỉ dùng nếu validate cần req
    };

    super(options);
  }
  validate(req: Request, payload: any) {
    const refreshToken = req.cookies[ENTITIES_MESSAGE.REFRESH_TOKEN] || null;
    if (!refreshToken)
      throw new UnauthorizedException(ERROR_MESSAGE.UNAUTHENTICATED);

    return { userId: payload.sub };
  }
}
