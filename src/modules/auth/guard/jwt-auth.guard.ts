import { UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ERROR_MESSAGE } from 'src/constants/exception.message';

export class MyJwtGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info) {
    if (err || !user) {
      throw new UnauthorizedException(ERROR_MESSAGE.UNAUTHENTICATED);
    }
    return user;
  }
}
