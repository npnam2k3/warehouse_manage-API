import { Module } from '@nestjs/common';
import { WarehouseLocationService } from './warehouse_location.service';
import { WarehouseLocationController } from './warehouse_location.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarehouseLocation } from './entities/warehouse_location.entity';
import { Warehouse } from '../warehouse/entities/warehouse.entity';
import { WarehouseModule } from '../warehouse/warehouse.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WarehouseLocation, Warehouse]),
    WarehouseModule,
  ],
  controllers: [WarehouseLocationController],
  providers: [WarehouseLocationService],
})
export class WarehouseLocationModule {}
