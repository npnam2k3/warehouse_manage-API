import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { ExportOrder } from '../export-order/entities/export-order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, ExportOrder])],
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule {}
