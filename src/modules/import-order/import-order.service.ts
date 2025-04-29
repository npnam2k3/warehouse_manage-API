import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateImportOrderDto } from './dto/create-import-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ImportOrder } from './entities/import-order.entity';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { ImportOrderDetail } from './entities/import-order-detail.entity';
import { Inventory } from '../products/entities/inventory.entity';
import * as crypto from 'crypto';
import { ERROR_MESSAGE } from 'src/constants/exception.message';
import { ImportProductDTO } from './dto/product-import.dto';
import { Supply } from '../supplies/entities/supply.entity';
import { ENTITIES_MESSAGE } from 'src/constants/entity.message';
import { Product } from '../products/entities/product.entity';
import { Warehouse } from '../warehouse/entities/warehouse.entity';
import { CancelImportOrderDto } from './dto/cancel-import-order.dto';
import { PaymentDetail } from '../payments/entities/payment-detail.entity';
import { OrderStatus } from './enum';

@Injectable()
export class ImportOrderService {
  constructor(
    @InjectRepository(ImportOrder)
    private readonly importOrderRepository: Repository<ImportOrder>,
    private dataSource: DataSource,
  ) {}
  async create(createImportOrderDto: CreateImportOrderDto) {
    const { supplierId, listProducts, note, payment_due_date, payment_status } =
      createImportOrderDto;
    if (listProducts.length === 0)
      throw new BadRequestException(ERROR_MESSAGE.LIST_PRODUCT_EMPTY);
    return await this.dataSource.transaction(async (manager) => {
      const supplier = await manager.findOne(Supply, {
        where: { id: supplierId },
        relations: ['products'],
      });
      if (!supplier) {
        throw new NotFoundException(
          ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.SUPPLIER),
        );
      }
      // Kiểm tra xem các sản phẩm trong listProducts có hợp lệ không
      const supplierProductIds = supplier.products.map((p) => p.id);
      const invalidProducts = listProducts.filter(
        (p) => !supplierProductIds.includes(p.productId),
      );
      if (invalidProducts.length > 0) {
        throw new BadRequestException(ERROR_MESSAGE.INVALID_LIST_PRODUCT);
      }

      const total_amount = this.calcTotalAmount(listProducts);
      const newOrder = manager.create(ImportOrder, {
        import_order_code: this.generateImportOrder(),
        total_amount,
        supplier,
        payment_status,
        payment_due_date,
        amount_due: total_amount,
        order_status: OrderStatus.PROCESSING,
      });
      if (note) newOrder.note = note;

      // console.log('new order:: ', newOrder);
      const savedOrder = await manager.save(newOrder);

      const productIds = listProducts.map((p) => p.productId);
      const warehouseIds = listProducts.map((p) => p.warehouseId);
      const products = await manager.findByIds(Product, productIds);
      const warehouses = await manager.findByIds(Warehouse, warehouseIds);

      // map product: [id: product]: truy xuất vào id product sẽ ánh xạ ra value là object product
      const productMap = new Map(products.map((p) => [p.id, p]));

      // map warehouse: [id: warehouse]: truy xuất vào id warehouse sẽ ánh xạ ra value là object warehouse
      const warehouseMap = new Map(warehouses.map((w) => [w.id, w]));

      let uniqueProducts: ImportProductDTO[] = [];
      for (const product of listProducts) {
        const existing = uniqueProducts.find(
          (p) =>
            p.productId === product.productId &&
            p.warehouseId === product.warehouseId,
        );
        if (existing) {
          existing.quantity += product.quantity;
        } else {
          uniqueProducts.push({
            productId: product.productId,
            warehouseId: product.warehouseId,
            purchase_price: product.purchase_price,
            quantity: product.quantity,
          });
        }
      }

      const importOrderDetails = uniqueProducts.map((product) =>
        manager.create(ImportOrderDetail, {
          import_order: savedOrder,
          product: productMap.get(product.productId),
          warehouse: warehouseMap.get(product.warehouseId),
          purchase_price: product.purchase_price,
          quantity: product.quantity,
        }),
      );
      await manager.insert(ImportOrderDetail, importOrderDetails);

      // cap nhat so luong trong bang Inventory
      // Lấy tất cả bản ghi Inventory với productIds
      const inventoryRecords = await manager.find(Inventory, {
        where: { product: { id: In(productIds) } },
        relations: ['product', 'warehouse'],
      });
      // console.log('check inventoryRecords:: ', inventoryRecords);

      // Xử lý Inventory
      const inventoriesToSave: Inventory[] = [];
      for (const product of uniqueProducts) {
        // Tìm bản ghi với warehouseId cụ thể
        let inventory = inventoryRecords.find(
          (inv) =>
            inv.product.id === product.productId &&
            inv.warehouse?.id === product.warehouseId,
        );

        if (inventory) {
          // console.log('Tồn tại warehouse id chỉ định này!!');
          // Nếu đã có bản ghi cho kho này, cộng dồn quantity
          inventory.quantity += product.quantity;
          inventoriesToSave.push(inventory);
        } else {
          // Tìm bản ghi với warehouseId = null
          inventory = inventoryRecords.find(
            (inv) =>
              inv.product.id === product.productId && inv.warehouse === null,
          );

          if (inventory) {
            // console.log('Tồn tại warehouse id null');
            // Nếu có bản ghi null, cập nhật warehouseId và quantity
            inventory.quantity = product.quantity;
            inventory.warehouse = warehouseMap.get(product.warehouseId) || null;
            inventoriesToSave.push(inventory);
          } else {
            // console.log('Tạo mới inventory');
            // Nếu không có bản ghi nào, tạo mới
            const newInventory = manager.create(Inventory, {
              productId: product.productId,
              warehouseId: product.warehouseId,
              quantity: product.quantity,
              product: productMap.get(product.productId),
              warehouse: warehouseMap.get(product.warehouseId),
            });
            inventoriesToSave.push(newInventory);
          }
        }
      }
      // console.log('check inventory to save:: ', inventoriesToSave);

      //Lưu tất cả thay đổi Inventory trong 1 lần
      if (inventoriesToSave.length > 0) {
        await manager.save(Inventory, inventoriesToSave);
      }

      return savedOrder;
    });
  }

  async findAll({ pageNum, limitNum, search, status, sortBy, orderBy }) {
    const queryBuilder = this.importOrderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.supplier', 'supplier');

    let hasCondition = false;
    let findByCode = false;
    if (search) {
      const isOrderCode = /^DN[A-Za-z0-9]+$/.test(search);
      if (isOrderCode) {
        queryBuilder.where('order.import_order_code = :code', { code: search });
        findByCode = true;
      } else {
        queryBuilder.where('supplier.name_company LIKE :name', {
          name: `%${search}%`,
        });
      }
      hasCondition = true;
    }

    if (status && !findByCode) {
      if (hasCondition) {
        queryBuilder.andWhere('order.payment_status = :status', { status });
      } else {
        queryBuilder.where('order.payment_status = :status', { status });
      }
    }

    const validSortFields = [
      'total_amount',
      'createdAt',
      'amount_paid',
      'amount_due',
      'payment_due_date',
    ];
    if (sortBy && validSortFields.includes(sortBy)) {
      const order = orderBy?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      queryBuilder.orderBy(`order.${sortBy}`, order);
    } else {
      queryBuilder.orderBy('order.total_amount', 'DESC'); // Mặc định
    }

    const [orders, totalRecords] = await queryBuilder
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .getManyAndCount();

    return {
      orders,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limitNum),
      conditions: {
        pageNum,
        limitNum,
        search,
        status,
        sortBy,
        orderBy,
      },
    };
  }

  async findOne(id: number) {
    const importOrderFound = await this.importOrderRepository.findOne({
      where: { id },
      relations: [
        'supplier',
        'import_order_details',
        'import_order_details.product',
        'paymentDetails',
        'paymentDetails.payment',
      ],
    });
    if (!importOrderFound)
      throw new NotFoundException(
        ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.IMPORT_ORDER),
      );

    return importOrderFound;
  }

  async cancel(cancelImportOrderDto: CancelImportOrderDto) {
    const { import_order_id, cancel_reason } = cancelImportOrderDto;
    return await this.dataSource.transaction(async (manage) => {
      const orderExists = await manage.findOne(ImportOrder, {
        where: { id: import_order_id },
        relations: {
          import_order_details: {
            product: true,
            warehouse: true,
          },
        },
      });

      if (!orderExists) {
        throw new NotFoundException(
          ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.IMPORT_ORDER),
        );
      }

      // kiểm tra hóa đơn này đã có lần thanh toán nào hay chưa
      const hasPayment = await manage.count(PaymentDetail, {
        where: {
          import_order: { id: orderExists.id },
        },
      });
      if (hasPayment) {
        throw new BadRequestException(
          ERROR_MESSAGE.CANNOT_CANCEL_ORDER(orderExists.import_order_code),
        );
      }

      // giảm số lượng trong kho
      await Promise.all(
        orderExists.import_order_details.map((detail) => {
          if (!detail.product?.id || !detail.warehouse?.id)
            throw new BadRequestException(ERROR_MESSAGE.INVALID_INPUT);
          return manage
            .getRepository(Inventory)
            .createQueryBuilder()
            .update()
            .set({ quantity: () => `quantity - :quantity` })
            .where('warehouseId = :warehouseId', {
              warehouseId: detail.warehouse?.id,
            })
            .andWhere('productId = :productId', {
              productId: detail.product?.id,
            })
            .setParameters({ quantity: detail.quantity })
            .execute();
        }),
      );

      // cập nhật trạng thái hóa đơn và lý do hủy nếu có
      const reason = cancel_reason ?? null;
      await manage.update(ImportOrder, orderExists.id, {
        order_status: OrderStatus.CANCELED,
        cancel_reason: reason,
      });
    });
  }

  generateImportOrder(): string {
    const prefix = 'DN';
    const timestamp = Date.now().toString(36).slice(-4).toUpperCase(); // Lấy 4 ký tự cuối của timestamp base36
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomStr = '';
    const bytes = crypto.randomBytes(4); // 4 ký tự ngẫu nhiên

    for (let i = 0; i < 4; i++) {
      randomStr += characters[bytes[i] % characters.length];
    }

    return `${prefix}${timestamp}${randomStr}`; // SP (2) + timestamp (4) + random (4) = 10 ký tự
  }

  calcTotalAmount(listProducts: ImportProductDTO[]): number {
    return listProducts.reduce((total_amount, curr) => {
      return total_amount + curr.quantity * curr.purchase_price;
    }, 0);
  }
}
