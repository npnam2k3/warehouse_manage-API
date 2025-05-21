import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { SocketModule } from 'src/socket/socket.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Notification } from './entities/notification.entity';
import { UserNotification } from './entities/user-notification.entity';

@Module({
  imports: [
    SocketModule,
    TypeOrmModule.forFeature([User, Notification, UserNotification]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
