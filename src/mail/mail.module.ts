import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { ENTITIES_MESSAGE } from 'src/constants/entity.message';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get(ENTITIES_MESSAGE.MAIL_HOST),
          secure: false,
          auth: {
            user: config.get(ENTITIES_MESSAGE.MAIL_NAME),
            pass: config.get(ENTITIES_MESSAGE.MAIL_PASS),
          },
        },
        defaults: {
          from: `"CNTT-VNUA" <${config.get(ENTITIES_MESSAGE.MAIL_FROM)}>`,
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
