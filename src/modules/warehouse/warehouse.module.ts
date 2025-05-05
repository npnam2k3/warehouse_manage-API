import { Module } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Warehouse } from './entities/warehouse.entity';
import { Inventory } from '../products/entities/inventory.entity';
import { InventoryAdjustment } from '../inventory-adjustment/entities/inventory-adjustment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Warehouse, Inventory, InventoryAdjustment]),
  ],
  controllers: [WarehouseController],
  providers: [WarehouseService],
  exports: [WarehouseService, TypeOrmModule.forFeature([Warehouse])],
})
export class WarehouseModule {}
