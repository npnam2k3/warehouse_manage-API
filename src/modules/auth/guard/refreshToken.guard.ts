import { UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ERROR_MESSAGE } from 'src/constants/exception.message';

export class RefreshTokenJwtGuard extends AuthGuard('jwt-refreshToken') {
  handleRequest(err, user, info) {
    // console.log(`check info:: ${JSON.stringify(info)}`);
    // console.log(`check user:: ${JSON.stringify(user)}`);
    if (err || !user) {
      //   console.error(`check error from handleRequest:: ${err}`);
      throw new UnauthorizedException(ERROR_MESSAGE.UNAUTHENTICATED);
    }
    return user;
  }
}
