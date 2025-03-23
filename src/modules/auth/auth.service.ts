import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { comparePassword } from 'src/utils/handlePassword';
import { ConfigService } from '@nestjs/config';
import { ENTITIES_MESSAGE } from 'src/constants/entity.message';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import {
  compareRefreshToken,
  hashRefreshToken,
} from 'src/utils/handleRefreshToken';
import { ERROR_MESSAGE } from 'src/constants/exception.message';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}
  private TIME_EXPIRES_ACCESS_TOKEN: string = '5m';
  private TIME_EXPIRES_REFRESH_TOKEN: string = '7d';
  private MAX_AGE_COOKIE: number = 7 * 24 * 60 * 60 * 1000; // 7 days
  private PATH: string = '/auth';

  async login(user: any, res: Response) {
    const { refreshToken, accessToken } = await this.signJwtToken(
      user.id,
      user.username,
    );

    // save RT into cookie
    this.saveRefreshTokenIntoCookie(res, refreshToken);

    // hash RT before save into db
    const hashedRefreshToken = await hashRefreshToken(refreshToken);

    // save RT into db
    await this.userRepository.update(user.id, {
      refreshToken: hashedRefreshToken,
    });
    return { accessToken };
  }
  async refreshToken(user: any, refreshTokenOld: string, res: Response) {
    const userExists = await this.userRepository.findOne({
      where: {
        id: user.userId,
      },
    });
    if (!userExists) {
      throw new UnauthorizedException(ERROR_MESSAGE.UNAUTHENTICATED);
    }
    if (!userExists.refreshToken) {
      throw new UnauthorizedException(ERROR_MESSAGE.UNAUTHENTICATED);
    }
    const compareRT = await compareRefreshToken(
      refreshTokenOld,
      userExists.refreshToken,
    );
    if (!compareRT) {
      throw new UnauthorizedException(ERROR_MESSAGE.UNAUTHENTICATED);
    }

    // create new accessToken and new refreshToken
    const { accessToken, refreshToken } = await this.signJwtToken(
      userExists.id,
      userExists.username,
    );

    // delete old refreshToken in cookie
    this.removeRefreshTokenInCookie(res);

    // save new refreshToken into cookie
    this.saveRefreshTokenIntoCookie(res, refreshToken);

    // hash new refreshToken
    const hashedNewRefreshToken = await hashRefreshToken(refreshToken);

    // save hashedNewRefreshToken into database
    await this.userRepository.update(userExists.id, {
      refreshToken: hashedNewRefreshToken,
    });

    return { accessToken };
  }
  async validateUser(username: string, password: string): Promise<any> {
    const userExists = await this.userRepository.findOne({
      where: { username },
    });
    if (
      userExists &&
      (await comparePassword(password, userExists.hashedPassword))
    ) {
      const { hashedPassword, ...result } = userExists;
      return result;
    }
    return null;
  }
  async signJwtToken(
    id: number,
    username: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessTokenKey = this.configService.get(
      ENTITIES_MESSAGE.JWT_ACCESS_TOKEN_KEY,
    );
    const refreshTokenKey = this.configService.get(
      ENTITIES_MESSAGE.JWT_REFRESH_TOKEN_KEY,
    );

    const payloadAccessToken = { sub: id, username };
    const payloadRefreshToken = { sub: id };
    const jwtAccessTokenString = await this.jwtService.signAsync(
      payloadAccessToken,
      {
        expiresIn: this.TIME_EXPIRES_ACCESS_TOKEN,
        secret: accessTokenKey,
      },
    );
    const jwtRefreshTokenString = await this.jwtService.signAsync(
      payloadRefreshToken,
      {
        expiresIn: this.TIME_EXPIRES_REFRESH_TOKEN,
        secret: refreshTokenKey,
      },
    );
    return {
      accessToken: jwtAccessTokenString,
      refreshToken: jwtRefreshTokenString,
    };
  }

  saveRefreshTokenIntoCookie(res: Response, refreshToken: string) {
    res.cookie(ENTITIES_MESSAGE.REFRESH_TOKEN, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: this.MAX_AGE_COOKIE,
      path: this.PATH,
    });
  }

  removeRefreshTokenInCookie(res: Response) {
    res.cookie(ENTITIES_MESSAGE.REFRESH_TOKEN, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: this.PATH,
    });
  }

  async getProfile(userId: number) {
    const userExists = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });
    if (!userExists)
      throw new NotFoundException(
        ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.USER),
      );

    return this.userService.convertToDTO(userExists);
  }
}
