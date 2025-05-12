import { Module } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Warehouse } from './entities/warehouse.entity';
import { Inventory } from '../products/entities/inventory.entity';
import { InventoryAdjustment } from '../inventory-adjustment/entities/inventory-adjustment.entity';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Warehouse, Inventory, InventoryAdjustment]),
    UsersModule,
    RolesModule,
  ],
  controllers: [WarehouseController],
  providers: [WarehouseService],
  exports: [WarehouseService, TypeOrmModule.forFeature([Warehouse])],
})
export class WarehouseModule {}
