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

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Category, Unit, Inventory, Supply]),
    CloudinaryModule,
    CategoryModule,
    UnitModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
