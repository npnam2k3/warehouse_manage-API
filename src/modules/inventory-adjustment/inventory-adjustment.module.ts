import { Module } from '@nestjs/common';
import { InventoryAdjustmentService } from './inventory-adjustment.service';
import { InventoryAdjustmentController } from './inventory-adjustment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryAdjustment } from './entities/inventory-adjustment.entity';
import { Product } from '../products/entities/product.entity';
import { Warehouse } from '../warehouse/entities/warehouse.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InventoryAdjustment, Product, Warehouse, User]),
    UsersModule,
    RolesModule,
  ],
  controllers: [InventoryAdjustmentController],
  providers: [InventoryAdjustmentService],
})
export class InventoryAdjustmentModule {}
