import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ENTITIES_MESSAGE } from 'src/constants/entity.message';
import { UsersService } from 'src/modules/users/users.service';
import { ERROR_MESSAGE } from 'src/constants/exception.message';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly userService: UsersService,
  ) {
    const accessTokenKey = configService.get(
      ENTITIES_MESSAGE.JWT_ACCESS_TOKEN_KEY,
    );
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: accessTokenKey,
    });
  }

  async validate(payload: any) {
    const userExists = await this.userService.findOne(payload.sub);
    if (!userExists) {
      throw new NotFoundException(
        ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.USER),
      );
    }
    if (userExists.isBlock) {
      throw new UnauthorizedException(ERROR_MESSAGE.BLOCKED);
    }
    return { userId: payload.sub, username: payload.username };
  }
}
