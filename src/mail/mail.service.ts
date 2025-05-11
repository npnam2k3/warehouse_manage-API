import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ENTITIES_MESSAGE } from 'src/constants/entity.message';
import { User } from 'src/modules/users/entities/user.entity';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendEmail(user: User, token: string) {
    const client_url = this.configService.get(ENTITIES_MESSAGE.CLIENT_URL);
    const url = `${client_url}/resetPassword/${token}`;

    await this.mailerService.sendMail({
      to: user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'Hãy xác nhận email!',
      template: './forgotPassword', // `.hbs` extension is appended automatically
      context: {
        name: user.fullname,
        url,
      },
    });
  }
}
