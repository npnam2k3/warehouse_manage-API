import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './exceptions/handleException';
import { CustomValidationPipe } from './pipe/custom.validate';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT');
  app.use(cookieParser());
  app.useGlobalPipes(CustomValidationPipe);
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.listen(port ?? 3000);
  console.log(`🚀 Server running on port ${port}`);
}
bootstrap();
