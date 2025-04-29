import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateExportOrderDto } from './dto/create-export-order.dto';
import { UpdateExportOrderDto } from './dto/update-export-order.dto';
import { DataSource, In, IsNull, Not, Repository } from 'typeorm';
import { ERROR_MESSAGE } from 'src/constants/exception.message';
import { Customer } from '../customers/entities/customer.entity';
import { ENTITIES_MESSAGE } from 'src/constants/entity.message';
import { ExportProductDTO } from './dto/product-export.dto';
import { ExportOrder } from './entities/export-order.entity';
import * as crypto from 'crypto';
import { Product } from '../products/entities/product.entity';
import { Warehouse } from '../warehouse/entities/warehouse.entity';
import { Inventory } from '../products/entities/inventory.entity';
import { ExportOrderDetail } from './entities/export-order-detail.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CancelExportOrderDto } from './dto/cancel-export-order.dto';
import { PaymentDetail } from '../payments/entities/payment-detail.entity';
import { OrderStatus } from '../import-order/enum';

@Injectable()
export class ExportOrderService {
  constructor(
    @InjectRepository(ExportOrder)
    private readonly exportOrderRepository: Repository<ExportOrder>,
    private readonly dataSource: DataSource,
  ) {}
  async create(createExportOrderDto: CreateExportOrderDto) {
    const { customerId, listProducts, note, payment_due_date, payment_status } =
      createExportOrderDto;
    if (listProducts.length === 0) {
      throw new BadRequestException(ERROR_MESSAGE.LIST_PRODUCT_EMPTY);
    }
    return await this.dataSource.transaction(async (manager) => {
      const customerFound = await manager.findOne(Customer, {
        where: { id: customerId },
      });
      if (!customerFound)
        throw new NotFoundException(
          ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.CUSTOMER),
        );

      const total_amount = this.calcTotalAmount(listProducts);
      // mặc định khi tạo mới hóa đơn là chưa thanh toán
      const newOrder = manager.create(ExportOrder, {
        export_order_code: this.generateExportOrder(),
        total_amount,
        customer: customerFound,
        payment_status,
        payment_due_date,
        amount_due: total_amount,
      });
      if (note) newOrder.note = note;

      const savedOrder = await manager.save(ExportOrder, newOrder);

      const productIds = listProducts.map((p) => p.productId);
      const warehouseIds = listProducts.map((p) => p.warehouseId);
      const products = await manager.findByIds(Product, productIds);
      const warehouses = await manager.findByIds(Warehouse, warehouseIds);

      // map product: [id: product]: truy xuất vào id product sẽ ánh xạ ra value là object product
      const productMap = new Map(products.map((p) => [p.id, p]));

      // map warehouse: [id: warehouse]: truy xuất vào id warehouse sẽ ánh xạ ra value là object warehouse
      const warehouseMap = new Map(warehouses.map((w) => [w.id, w]));

      let uniqueProducts: ExportProductDTO[] = [];
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
            sell_price: product.sell_price,
            quantity: product.quantity,
          });
        }
      }

      const inventories = await manager.find(Inventory, {
        where: { product: { id: In(productIds) }, warehouse: Not(IsNull()) },
        relations: ['product', 'warehouse'],
      });

      // console.log('inventories:: ', inventories);

      const inventoryMapForUpdate: Map<string, Inventory> = new Map(
        inventories.map((inv) => [
          `${inv.product.id}-${inv.warehouse?.id}`,
          inv,
        ]),
      );
      // console.log('check inventory map:: ', inventoryMapForUpdate);

      const exportOrderDetail = uniqueProducts.map((product) => {
        const quantityInStock = inventoryMapForUpdate.get(
          `${product.productId}-${product.warehouseId}`,
        )?.quantity;
        if (quantityInStock === undefined) {
          throw new BadRequestException(ERROR_MESSAGE.SOMETHING_WRONG);
        }
        if (product.quantity > quantityInStock) {
          const productName = productMap.get(product.productId)?.name ?? '';
          throw new BadRequestException(
            ERROR_MESSAGE.INVALID_QUANTITY(
              productName,
              quantityInStock,
              product.quantity,
            ),
          );
        }
        return manager.create(ExportOrderDetail, {
          product: productMap.get(product.productId),
          warehouse: warehouseMap.get(product.warehouseId),
          quantity: product.quantity,
          sell_price: product.sell_price,
          export_order: savedOrder,
        });
      });
      // console.log('check detail:: ', exportOrderDetail);
      await manager.insert(ExportOrderDetail, exportOrderDetail);

      // console.log('check map for update:: ', inventoryMapForUpdate);

      // cập nhật inventory
      const inventoriesToSave: Inventory[] = [];
      for (const product of uniqueProducts) {
        const inventoryCurrent = inventoryMapForUpdate.get(
          `${product.productId}-${product.warehouseId}`,
        );
        if (inventoryCurrent) {
          inventoryCurrent.quantity -= product.quantity;
          inventoriesToSave.push(inventoryCurrent);
        }
      }
      // console.log('check inventories to save:: ', inventoriesToSave);
      if (inventoriesToSave.length > 0) {
        await manager.save(Inventory, inventoriesToSave);
      }
    });
  }

  async findAll({
    pageNum,
    limitNum,
    search,
    payment_status,
    order_status,
    sortBy,
    orderBy,
  }) {
    const queryBuilder = this.exportOrderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer');

    let hasCondition = false;
    let findByCode = false;
    if (search) {
      const isOrderCode = /^DX[A-Za-z0-9]+$/.test(search);
      if (isOrderCode) {
        queryBuilder.where('order.export_order_code = :code', { code: search });
        findByCode = true;
      } else {
        queryBuilder.where('customer.fullname LIKE :name', {
          name: `%${search}%`,
        });
      }
      hasCondition = true;
    }

    if (payment_status && !findByCode) {
      if (hasCondition) {
        queryBuilder.andWhere('order.payment_status = :payment_status', {
          payment_status,
        });
      } else {
        queryBuilder.where('order.payment_status = :payment_status', {
          payment_status,
        });
      }
      hasCondition = true;
    }

    if (order_status && !findByCode) {
      if (hasCondition) {
        queryBuilder.andWhere('order.order_status = :order_status', {
          order_status,
        });
      } else {
        queryBuilder.where('order.order_status = :order_status', {
          order_status,
        });
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
        payment_status,
        order_status,
        sortBy,
        orderBy,
      },
    };
  }

  async findOne(id: number) {
    const exportOrderFound = await this.exportOrderRepository.findOne({
      where: { id },
      relations: {
        export_order_details: {
          product: true,
        },
        customer: true,
        paymentDetails: {
          payment: true,
        },
      },
    });
    if (!exportOrderFound) {
      throw new NotFoundException(
        ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.EXPORT_ORDER),
      );
    }

    return exportOrderFound;
  }

  update(id: number, updateExportOrderDto: UpdateExportOrderDto) {
    return `This action updates a #${id} exportOrder`;
  }

  async cancel(cancelExportOrderDto: CancelExportOrderDto) {
    const { export_order_id, cancel_reason } = cancelExportOrderDto;
    return await this.dataSource.transaction(async (manage) => {
      const orderExists = await manage.findOne(ExportOrder, {
        where: { id: export_order_id },
        relations: {
          export_order_details: {
            product: true,
            warehouse: true,
          },
        },
      });

      if (!orderExists) {
        throw new NotFoundException(
          ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.EXPORT_ORDER),
        );
      }

      // kiểm tra hóa đơn này đã có lần thanh toán nào hay chưa
      const hasPayment = await manage.count(PaymentDetail, {
        where: {
          export_order: { id: orderExists.id },
        },
      });
      if (hasPayment) {
        throw new BadRequestException(
          ERROR_MESSAGE.CANNOT_CANCEL_ORDER(orderExists.export_order_code),
        );
      }

      // tăng số lượng trong kho
      await Promise.all(
        orderExists.export_order_details.map((detail) => {
          if (!detail.product?.id || !detail.warehouse?.id)
            throw new BadRequestException(ERROR_MESSAGE.INVALID_INPUT);
          return manage
            .getRepository(Inventory)
            .createQueryBuilder()
            .update()
            .set({ quantity: () => `quantity + :quantity` })
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
      await manage.update(ExportOrder, orderExists.id, {
        order_status: OrderStatus.CANCELED,
        cancel_reason: reason,
      });
    });
  }

  async confirm(id: number) {
    const orderExists = await this.exportOrderRepository.count({
      where: { id },
    });

    if (orderExists <= 0)
      throw new NotFoundException(
        ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.EXPORT_ORDER),
      );

    await this.exportOrderRepository.update(id, {
      order_status: OrderStatus.COMPLETED,
    });
  }

  calcTotalAmount(listProducts: ExportProductDTO[]) {
    return listProducts.reduce(
      (total_amount, curr) => total_amount + curr.sell_price * curr.quantity,
      0,
    );
  }

  generateExportOrder(): string {
    const prefix = 'DX';
    const timestamp = Date.now().toString(36).slice(-4).toUpperCase(); // Lấy 4 ký tự cuối của timestamp base36
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomStr = '';
    const bytes = crypto.randomBytes(4); // 4 ký tự ngẫu nhiên

    for (let i = 0; i < 4; i++) {
      randomStr += characters[bytes[i] % characters.length];
    }

    return `${prefix}${timestamp}${randomStr}`; // SP (2) + timestamp (4) + random (4) = 10 ký tự
  }
}
