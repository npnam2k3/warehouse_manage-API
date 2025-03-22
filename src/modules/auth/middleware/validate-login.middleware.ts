import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { NextFunction, Request, Response } from 'express';
import { AuthDto } from '../dto/auth.dto';
import { validate } from 'class-validator';
import { ERROR_MESSAGE } from 'src/constants/exception.message';

@Injectable()
export class AuthValidateMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    // console.log(`check body in middleware:: ${JSON.stringify(req.body)}`);
    if (!req.body) throw new BadRequestException(ERROR_MESSAGE.INVALID_INPUT);
    const authDto = plainToInstance(AuthDto, req.body);
    const errors = await validate(authDto);
    if (errors.length > 0) {
      console.log(`check errors middleware:: ${errors}`);
      const formattedError = errors.map((error) => {
        const constraints = error.constraints || {};
        return {
          field: error.property,
          message: Object.values(constraints),
        };
      });
      throw new BadRequestException({ errors: formattedError });
    }
    next();
  }
}
