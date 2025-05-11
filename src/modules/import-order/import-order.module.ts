import { Module } from '@nestjs/common';
import { ImportOrderService } from './import-order.service';
import { ImportOrderController } from './import-order.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImportOrder } from './entities/import-order.entity';
import { Supply } from '../supplies/entities/supply.entity';
import { ImportOrderDetail } from './entities/import-order-detail.entity';
import { Warehouse } from '../warehouse/entities/warehouse.entity';
import { ProductsModule } from '../products/products.module';
import { SuppliesModule } from '../supplies/supplies.module';
import { WarehouseModule } from '../warehouse/warehouse.module';
import { PaymentDetail } from '../payments/entities/payment-detail.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ImportOrder,
      Supply,
      ImportOrderDetail,
      Warehouse,
      PaymentDetail,
    ]),
    ProductsModule,
    SuppliesModule,
    WarehouseModule,
  ],
  controllers: [ImportOrderController],
  providers: [ImportOrderService],
  exports: [TypeOrmModule],
})
export class ImportOrderModule {}
