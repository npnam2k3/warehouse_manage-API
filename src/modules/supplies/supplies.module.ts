import { Module } from '@nestjs/common';
import { SuppliesService } from './supplies.service';
import { SuppliesController } from './supplies.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Supply } from './entities/supply.entity';
import { Product } from '../products/entities/product.entity';
import { ImportOrder } from '../import-order/entities/import-order.entity';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Supply, Product, ImportOrder]),
    ProductsModule,
    UsersModule,
    RolesModule,
  ],
  controllers: [SuppliesController],
  providers: [SuppliesService],
  exports: [TypeOrmModule.forFeature([Supply])],
})
export class SuppliesModule {}
