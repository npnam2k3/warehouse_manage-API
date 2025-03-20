import { BadRequestException, Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ResponseMessage } from './decorator/response.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ResponseMessage('get successfully')
  getHello(): string {
    throw new BadRequestException('Something went wrong');
    return this.appService.getHello();
  }
}
