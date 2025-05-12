import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, Product]),
    UsersModule,
    RolesModule,
  ],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService, TypeOrmModule],
})
export class CategoryModule {}
