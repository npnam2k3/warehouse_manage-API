import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { RolesModule } from '../roles/roles.module';
import { Payment } from '../payments/entities/payment.entity';
import { InventoryAdjustment } from '../inventory-adjustment/entities/inventory-adjustment.entity';
import { UserNotification } from '../notifications/entities/user-notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      Payment,
      InventoryAdjustment,
      UserNotification,
    ]),
    RolesModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
