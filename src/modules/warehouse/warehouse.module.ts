import { Module } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Warehouse } from './entities/warehouse.entity';
import { Inventory } from '../products/entities/inventory.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Warehouse, Inventory])],
  controllers: [WarehouseController],
  providers: [WarehouseService],
  exports: [WarehouseService, TypeOrmModule.forFeature([Warehouse])],
})
export class WarehouseModule {}
