import { Injectable } from '@nestjs/common';
import { CreateInventoryAdjustmentDto } from './dto/create-inventory-adjustment.dto';
import { DataSource } from 'typeorm';
import { InventoryAdjustment } from './entities/inventory-adjustment.entity';
import { Inventory } from '../products/entities/inventory.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventName } from 'src/constants/event';

@Injectable()
export class InventoryAdjustmentService {
  constructor(
    private dataSource: DataSource,
    private eventEmitter: EventEmitter2,
  ) {}
  async create(
    createInventoryAdjustmentDto: CreateInventoryAdjustmentDto,
    idUserLogin: number,
  ) {
    const { productId, warehouseId, newQuantity, oldQuantity, reasonChange } =
      createInventoryAdjustmentDto;

    return await this.dataSource.transaction(async (manager) => {
      const newInventoryLog = manager.create(InventoryAdjustment, {
        product: { id: productId },
        warehouse: { id: warehouseId },
        oldQuantity,
        newQuantity,
        discrepancy: newQuantity - oldQuantity,
        reason_change: reasonChange,
        user: { id: idUserLogin },
      });

      const saveInventoryLog = await manager.save(
        InventoryAdjustment,
        newInventoryLog,
      );

      // update quantity in inventory table
      await manager
        .getRepository(Inventory)
        .createQueryBuilder()
        .update(Inventory)
        .set({ quantity: newQuantity })
        .where('productId = :productId', { productId })
        .andWhere('warehouseId = :warehouseId', { warehouseId })
        .execute();

      this.eventEmitter.emit(EventName.ADJUSTMENT_QUANTITY, {
        productId,
        warehouseId,
        newQuantity,
      });
    });
  }

  async findAll({ limitNum, pageNum }) {
    const queryBuilder = this.dataSource
      .getRepository(InventoryAdjustment)
      .createQueryBuilder('inventoryAdjustment') // đặt alias chính
      .leftJoinAndSelect('inventoryAdjustment.product', 'product')
      .leftJoinAndSelect('inventoryAdjustment.warehouse', 'warehouse')
      .leftJoin('inventoryAdjustment.user', 'user')
      .addSelect(['user.id', 'user.fullname', 'user.email'])
      .orderBy('inventoryAdjustment.createdAt', 'DESC'); // Sắp xếp theo ngày tạo giảm dần
    const [inventoryLogs, totalRecords] = await queryBuilder
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .getManyAndCount();
    return {
      inventoryLogs,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limitNum),
      conditions: {
        pageNum,
        limitNum,
      },
    };
  }
}
