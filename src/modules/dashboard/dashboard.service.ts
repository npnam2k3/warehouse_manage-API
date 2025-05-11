import { Injectable } from '@nestjs/common';
import { ExportOrder } from '../export-order/entities/export-order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImportOrder } from '../import-order/entities/import-order.entity';
import { Product } from '../products/entities/product.entity';
import { getDateNDaysAgo, normalizeDate } from 'src/utils/handleDatetime';
import { OrderStatus } from '../import-order/enum';
import { Category } from '../category/entities/category.entity';
import { Inventory } from '../products/entities/inventory.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(ExportOrder)
    private readonly exportOrderRepository: Repository<ExportOrder>,

    @InjectRepository(ImportOrder)
    private readonly importOrderRepository: Repository<ImportOrder>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async getBaseInfo() {
    // số lượng tất cả sản phẩm trong kho hiện tại (các mặt hàng hiện có: nước lavie, nước aqua,...)
    const quantityProducts = await this.productRepository.count();

    // số lượng hóa đơn nhập ngày hiện tại
    const today = normalizeDate(new Date());
    const countImportOrderToday = await this.importOrderRepository
      .createQueryBuilder('importOrder')
      .where('DATE(importOrder.createdAt) = :date', {
        date: today,
      })
      .andWhere('importOrder.order_status <> :order_status', {
        order_status: OrderStatus.CANCELED,
      })
      .getCount();

    // số lượng hóa đơn xuất ngày hiện tại
    const countExportOrderToday = await this.exportOrderRepository
      .createQueryBuilder('exportOrder')
      .where('DATE(exportOrder.createdAt) = :date', {
        date: today,
      })
      .andWhere('exportOrder.order_status <> :order_status', {
        order_status: OrderStatus.CANCELED,
      })
      .getCount();

    // Số lượng danh mục sản phẩm
    const countCategory = await this.categoryRepository.count();

    // tổng doanh thu ngày hiện tại với điều kiện đơn đã được xác nhận
    const totalRevenue = await this.exportOrderRepository
      .createQueryBuilder('exportOrder')
      .select('SUM(exportOrder.total_amount)', 'total')
      .where('exportOrder.order_status = :order_status', {
        order_status: OrderStatus.COMPLETED,
      })
      .andWhere('DATE(exportOrder.createdAt) = :date', {
        date: today,
      })
      .getRawOne();

    // tổng chi ngày hiện tại với điều kiện đơn đã được xác nhận
    const totalCost = await this.importOrderRepository
      .createQueryBuilder('importOrder')
      .select('SUM(importOrder.total_amount)', 'total')
      .where('importOrder.order_status = :status', {
        status: OrderStatus.COMPLETED,
      })
      .andWhere('DATE(importOrder.createdAt) = :date', {
        date: today,
      })
      .getRawOne();

    return {
      quantityProducts,
      countImportOrderToday,
      countExportOrderToday,
      countCategory,
      totalRevenue: totalRevenue.total || 0,
      totalCost: totalCost.total || 0,
    };
  }

  // lấy các sản phẩm có số lượng tồn kho thấp
  async getListProductsHaveLowInventory() {
    const inventoryThreshold = 20;
    const listProducts = await this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.product', 'product')
      .leftJoinAndSelect('inventory.warehouse', 'warehouse')
      .where('inventory.warehouseId IS NOT NULL')
      .andWhere('inventory.quantity < :inventoryThreshold', {
        inventoryThreshold,
      })
      .getMany();

    return { listProducts, inventoryThreshold };
  }

  // lấy danh sách các hóa đơn gần đây (3 ngày)
  async getOrdersRecent() {
    const today = normalizeDate(new Date());
    // const today = '2025-04-15';
    const threeDaysAgo = getDateNDaysAgo(3, today);

    const importOrdersRecent = await this.importOrderRepository
      .createQueryBuilder('importOrder')
      .where('DATE(importOrder.createdAt) >= :startDate', {
        startDate: threeDaysAgo,
      })
      .andWhere('DATE(importOrder.createdAt) <= :today', {
        today,
      })
      .andWhere('importOrder.order_status = :order_status', {
        order_status: OrderStatus.COMPLETED,
      })
      .orderBy('importOrder.createdAt', 'DESC')
      .getMany();

    const exportOrdersRecent = await this.exportOrderRepository
      .createQueryBuilder('exportOrder')
      .where('DATE(exportOrder.createdAt) >= :startDate', {
        startDate: threeDaysAgo,
      })
      .andWhere('DATE(exportOrder.createdAt) <= :today', {
        today,
      })
      .andWhere('exportOrder.order_status = :order_status', {
        order_status: OrderStatus.COMPLETED,
      })
      .orderBy('exportOrder.createdAt', 'DESC')
      .getMany();

    return {
      importOrdersRecent,
      exportOrdersRecent,
    };
  }
}
