import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Category } from '../category/entities/category.entity';
import { Unit } from '../unit/entities/unit.entity';
import { Inventory } from './entities/inventory.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { CategoryModule } from '../category/category.module';
import { UnitModule } from '../unit/unit.module';
import { Supply } from '../supplies/entities/supply.entity';
import { ImportOrderDetail } from '../import-order/entities/import-order-detail.entity';
import { ExportOrderDetail } from '../export-order/entities/export-order-detail.entity';
import { InventoryAdjustment } from '../inventory-adjustment/entities/inventory-adjustment.entity';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Category,
      Unit,
      Inventory,
      Supply,
      ImportOrderDetail,
      ExportOrderDetail,
      InventoryAdjustment,
    ]),
    CloudinaryModule,
    CategoryModule,
    UnitModule,
    UsersModule,
    RolesModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [TypeOrmModule.forFeature([Inventory, Product])], // export to use inject repository in other module
})
export class ProductsModule {}
