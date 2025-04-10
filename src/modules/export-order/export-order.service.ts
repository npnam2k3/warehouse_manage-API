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

  async findAll({ pageNum, limitNum, search, status, sortBy, orderBy }) {
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

  remove(id: number) {
    return `This action removes a #${id} exportOrder`;
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
