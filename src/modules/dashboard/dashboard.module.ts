import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { ExportOrderModule } from '../export-order/export-order.module';
import { ProductsModule } from '../products/products.module';
import { ImportOrderModule } from '../import-order/import-order.module';
import { CategoryModule } from '../category/category.module';

@Module({
  imports: [
    ExportOrderModule,
    ProductsModule,
    ImportOrderModule,
    CategoryModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
