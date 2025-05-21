import {
  Controller,
  Get,
  Param,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { MyJwtGuard } from '../auth/guard/jwt-auth.guard';

@Controller('notifications')
@UseGuards(MyJwtGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getNotificationsForUser(@Request() req) {
    const userId = req.user?.userId;
    return this.notificationsService.getNotificationsForUser(+userId);
  }

  @Get('/unseen')
  getNotificationsUnseenForUser(@Request() req) {
    const userId = req.user?.userId;
    return this.notificationsService.getNotificationsUnseenForUser(+userId);
  }

  @Patch('/seen/:id')
  markSeenNotification(@Request() req, @Param('id') id: string) {
    const userId = req.user?.userId;
    return this.notificationsService.markSeenNotification(+userId, +id);
  }

  @Get(':id')
  getOne(@Request() req, @Param('id') id: string) {
    const userId = req.user?.userId;
    return this.notificationsService.getOne(+userId, +id);
  }
}
