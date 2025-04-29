import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSupplyDto } from './dto/create-supply.dto';
import { UpdateSupplyDto } from './dto/update-supply.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Supply } from './entities/supply.entity';
import { Brackets, In, Repository } from 'typeorm';
import { ERROR_MESSAGE } from 'src/constants/exception.message';
import { ENTITIES_MESSAGE } from 'src/constants/entity.message';
import { getInfoObject } from 'src/utils/compareObject';
import { isEmpty, isEqual, omitBy } from 'lodash';
import { SupplierProductDto } from './dto/create-supplier-product.dto';
import { Product } from '../products/entities/product.entity';
import { DeleteProductSupplierDto } from './dto/delete-supplier-product.dto';
import { ImportOrder } from '../import-order/entities/import-order.entity';
import { OrderStatus, PaymentStatus } from '../import-order/enum';
import { IsDebt } from './enum';

@Injectable()
export class SuppliesService {
  constructor(
    @InjectRepository(Supply)
    private readonly supplierRepository: Repository<Supply>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}
  async create(createSupplyDto: CreateSupplyDto) {
    const { name_company, address, email, phone } = createSupplyDto;
    const customerExists = await this.supplierRepository.findOne({
      where: [{ email }, { phone }],
    });
    if (customerExists) {
      throw new ConflictException(
        customerExists.email.toLowerCase() === email.toLowerCase()
          ? ERROR_MESSAGE.EMAIL_EXISTS
          : ERROR_MESSAGE.PHONE_EXISTS,
      );
    }

    const newSupplier = this.supplierRepository.create({
      name_company,
      email,
      phone,
      address,
    });

    return await this.supplierRepository.save(newSupplier);
  }

  async findAll({ pageNum, limitNum, search, isDebt, sortBy, orderBy }) {
    const queryBuilder = this.supplierRepository
      .createQueryBuilder('supplier')
      .leftJoinAndSelect('supplier.importOrders', 'importOrders');

    // tìm kiếm theo tên NCC
    if (search) {
      queryBuilder.where('supplier.name_company LIKE :name', {
        name: `%${search}%`,
      });
    }

    // lọc theo công nợ
    if (isDebt === IsDebt.YES) {
      queryBuilder
        .andWhere((qb) => {
          const subQuery = qb
            .subQuery()
            .select('1')
            .from('import_order', 'io')
            .where('io.supplierId = supplier.id')
            .andWhere('io.payment_status IN (:...statuses)')
            .getQuery();
          return `EXISTS ${subQuery}`;
        })
        .setParameter('statuses', [
          PaymentStatus.UNPAID,
          PaymentStatus.PARTIALLY_PAID,
        ]);
    } else if (isDebt === IsDebt.NO) {
      queryBuilder
        .andWhere((qb) => {
          const subQuery = qb
            .subQuery()
            .select('1')
            .from('import_order', 'io')
            .where('io.supplierId = supplier.id')
            .andWhere('io.payment_status IN (:...statuses)')
            .getQuery();
          return `NOT EXISTS ${subQuery}`;
        })
        .setParameter('statuses', [
          PaymentStatus.UNPAID,
          PaymentStatus.PARTIALLY_PAID,
        ]);
    }

    // sắp xếp
    const validSortFields = ['name_company', 'email', 'phone', 'address'];
    if (sortBy && validSortFields.includes(sortBy)) {
      const order = orderBy?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      queryBuilder.orderBy(`supplier.${sortBy}`, order);
    } else {
      queryBuilder.orderBy('supplier.name_company', 'DESC'); // Mặc định
    }

    // phân trang
    const [suppliers, totalRecords] = await queryBuilder
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .getManyAndCount();

    // Thêm trường isDebt vào từng supplier
    const suppliersWithDebt = suppliers.map((supplier) => {
      const hasDebt = supplier.importOrders?.some(
        (order) =>
          order.order_status === OrderStatus.COMPLETED &&
          (order.payment_status === PaymentStatus.PARTIALLY_PAID ||
            order.payment_status === PaymentStatus.UNPAID),
      );
      return {
        ...supplier,
        hasDebt,
      };
    });
    return {
      suppliers: suppliersWithDebt,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limitNum),
      conditions: {
        pageNum,
        limitNum,
        search,
        isDebt,
        sortBy,
        orderBy,
      },
    };
  }

  async findOne(idOrder: number) {
    const supplierExists = await this.supplierRepository.findOne({
      where: { id: idOrder },
      relations: {
        importOrders: {
          import_order_details: {
            product: true,
          },
          paymentDetails: {
            payment: {
              user: true,
            },
          },
        },
        products: true,
      },
    });
    if (!supplierExists)
      throw new NotFoundException(
        ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.SUPPLIER),
      );
    const infoSupplier = {
      id: supplierExists.id,
      name_company: supplierExists.name_company,
      email: supplierExists.email,
      phone: supplierExists.phone,
      address: supplierExists.address,
    };

    let listOrderFormatted: any = [];
    if (supplierExists.importOrders?.length > 0) {
      listOrderFormatted = supplierExists.importOrders.map((order) => {
        return {
          idOrder: order.id,
          import_order_code: order.import_order_code,
          total_amount: order.total_amount,
          payment_status: order.payment_status,
          payment_due_date: order.payment_due_date,
          amount_paid: order.amount_paid,
          amount_due: order.amount_due,
          order_status: order.order_status,
          note: order.note,
          createdAt: order.createdAt,
          list_product_in_order:
            order.import_order_details.length > 0
              ? order.import_order_details?.map((detail) => {
                  return {
                    idProduct: detail.product?.id,
                    product_code: detail.product?.product_code,
                    name: detail.product?.name,
                    purchase_price: detail.purchase_price,
                    imageUrl: detail.product?.imageUrl,
                    quantity: detail.quantity,
                  };
                })
              : [],
          list_payments:
            order.paymentDetails.length > 0
              ? order.paymentDetails?.map((detail) => {
                  return {
                    idPayment: detail.payment?.id,
                    payment_date: detail.payment?.payment_date,
                    payment_method: detail.payment?.payment_method,
                    userCreated: {
                      username: detail.payment?.user?.username,
                      fullname: detail.payment?.user?.fullname,
                      email: detail.payment?.user?.email,
                    },
                    amount: detail.amount,
                  };
                })
              : [],
        };
      });
    }

    // tính tổng nợ NCC
    const total_debt = this.calcTotalDebtOfSupplier(
      supplierExists.importOrders,
    );

    return {
      ...infoSupplier,
      total_debt,
      listOrders: listOrderFormatted,
      listProducts:
        supplierExists.products.length > 0 ? supplierExists.products : [],
    };
  }

  async update(id: number, updateSupplyDto: UpdateSupplyDto) {
    if (!updateSupplyDto || Object.keys(updateSupplyDto).length === 0)
      throw new BadRequestException(ERROR_MESSAGE.INVALID_INPUT_UPDATE);
    const supplierExists = await this.supplierRepository.findOne({
      where: { id },
    });
    if (!supplierExists)
      throw new NotFoundException(
        ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.SUPPLIER),
      );

    // check duplicate info (email, phone) with others customer
    const existingSupplier = await this.supplierRepository
      .createQueryBuilder('supplier')
      .where(
        new Brackets((qb) => {
          qb.where('supplier.email = :email', {
            email: updateSupplyDto.email,
          }).orWhere('supplier.phone = :phone', {
            phone: updateSupplyDto.phone,
          });
        }),
      )
      .andWhere('supplier.id <> :id', { id })
      .getOne();

    if (existingSupplier) {
      if (
        existingSupplier.email.toLowerCase() ===
          updateSupplyDto.email?.toLowerCase() &&
        existingSupplier.phone === updateSupplyDto.phone
      ) {
        throw new ConflictException(ERROR_MESSAGE.EMAIL_PHONE_EXISTS);
      } else if (
        existingSupplier.email.toLowerCase() ===
        updateSupplyDto.email?.toLowerCase()
      ) {
        throw new ConflictException(ERROR_MESSAGE.EMAIL_EXISTS);
      } else if (existingSupplier.phone === updateSupplyDto.phone) {
        throw new ConflictException(ERROR_MESSAGE.PHONE_EXISTS);
      }
    }

    // check new data must be different from old data
    const oldData = {
      name_company: supplierExists.name_company,
      email: supplierExists.email,
      phone: supplierExists.phone,
      address: supplierExists.address,
    };

    const newData = getInfoObject(
      ['name_company', 'email', 'phone', 'address'],
      updateSupplyDto,
    );

    const changeFields = omitBy(newData, (value, key) =>
      isEqual(oldData[key], value),
    );
    if (isEmpty(changeFields)) {
      throw new BadRequestException(ERROR_MESSAGE.NO_DATA_CHANGE);
    }
    await this.supplierRepository.update(id, changeFields);
  }

  async remove(id: number) {
    const supplierExists = await this.supplierRepository.findOne({
      where: { id },
      relations: {
        importOrders: true,
      },
    });
    if (!supplierExists)
      throw new NotFoundException(
        ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.SUPPLIER),
      );
    const hasDebt = supplierExists?.importOrders.some(
      (order) => order.payment_status !== PaymentStatus.PAID,
    );
    if (hasDebt) {
      throw new BadRequestException(
        ERROR_MESSAGE.CANNOT_DELETE_SUPPLIER_CUSTOMER(
          ENTITIES_MESSAGE.SUPPLIER,
        ),
      );
    }
    await this.supplierRepository.softRemove(supplierExists);
  }

  async addProductsToSupplier(createSupplierProductDto: SupplierProductDto) {
    const { supplierId, listIdProducts } = createSupplierProductDto;
    const supplier = await this.supplierRepository.findOne({
      where: { id: supplierId },
      relations: ['products'],
    });
    if (!supplier) {
      throw new NotFoundException(
        ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.SUPPLIER),
      );
    }

    const idProductsNotExists = listIdProducts.filter(
      (id) => !supplier?.products.some((p) => p.id === +id),
    );

    const productsToAdd = await this.productRepository.find({
      where: { id: In(idProductsNotExists) },
    });

    if (productsToAdd.length !== idProductsNotExists.length) {
      throw new NotFoundException(ERROR_MESSAGE.LIST_PRODUCT_NOT_FOUND);
    }
    supplier.products = [...supplier.products, ...productsToAdd];
    return await this.supplierRepository.save(supplier);
  }

  async deleteProductFromSupplier(
    deleteSupplierProductDto: DeleteProductSupplierDto,
  ) {
    const { productId, supplierId } = deleteSupplierProductDto;
    const supplier = await this.supplierRepository.findOne({
      where: { id: supplierId },
      relations: ['products'],
    });
    if (!supplier) {
      throw new NotFoundException(
        ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.SUPPLIER),
      );
    }

    const listIdProducts = supplier.products.map((p) => p.id);
    const checkExists = listIdProducts.some((id) => id === productId);
    if (!checkExists)
      throw new NotFoundException(
        ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.PRODUCT),
      );

    supplier.products = supplier.products.filter((p) => p.id !== productId);
    await this.supplierRepository.save(supplier);
  }

  calcTotalDebtOfSupplier(list_orders: ImportOrder[]): number {
    let total_debt = 0;
    if (list_orders.length === 0) return 0;
    for (const order of list_orders) {
      if (
        order.order_status === OrderStatus.COMPLETED &&
        (order.payment_status === PaymentStatus.PARTIALLY_PAID ||
          order.payment_status === PaymentStatus.UNPAID)
      ) {
        total_debt += order.amount_due;
      }
    }
    return total_debt;
  }
}
