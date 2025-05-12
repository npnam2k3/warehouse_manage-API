import { Module } from '@nestjs/common';
import { ExportOrderService } from './export-order.service';
import { ExportOrderController } from './export-order.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportOrder } from './entities/export-order.entity';
import { ExportOrderDetail } from './entities/export-order-detail.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Warehouse } from '../warehouse/entities/warehouse.entity';
import { PaymentDetail } from '../payments/entities/payment-detail.entity';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExportOrder,
      ExportOrderDetail,
      Customer,
      Warehouse,
      PaymentDetail,
    ]),
    UsersModule,
    RolesModule,
  ],
  controllers: [ExportOrderController],
  providers: [ExportOrderService],
  exports: [TypeOrmModule],
})
export class ExportOrderModule {}
