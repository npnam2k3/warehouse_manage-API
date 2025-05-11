import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { Brackets, Repository } from 'typeorm';
import { ERROR_MESSAGE } from 'src/constants/exception.message';
import { ENTITIES_MESSAGE } from 'src/constants/entity.message';
import { getInfoObject } from 'src/utils/compareObject';
import { isEmpty, isEqual, omitBy } from 'lodash';
import { ExportOrder } from '../export-order/entities/export-order.entity';
import { OrderStatus, PaymentStatus } from '../import-order/enum';
import { IsDebt } from '../supplies/enum';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}
  async create(createCustomerDto: CreateCustomerDto) {
    const { fullname, email, phone, address } = createCustomerDto;
    const customerExists = await this.customerRepository.findOne({
      where: [{ email }, { phone }],
    });
    if (customerExists) {
      throw new ConflictException(
        customerExists.email.toLowerCase() === email.toLowerCase()
          ? ERROR_MESSAGE.EMAIL_EXISTS
          : ERROR_MESSAGE.PHONE_EXISTS,
      );
    }

    const newCustomer = this.customerRepository.create({
      fullname,
      email,
      phone,
      address,
    });

    return await this.customerRepository.save(newCustomer);
  }

  async findAll({ pageNum, limitNum, isDebt, search, sortBy, orderBy }) {
    const queryBuilder = this.customerRepository
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.exportOrders', 'exportOrders');

    // tìm kiếm theo tên KH
    if (search) {
      queryBuilder.where('customer.fullname LIKE :name', {
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
            .from('export_order', 'eo')
            .where('eo.customerId = customer.id')
            .andWhere('eo.payment_status IN (:...statuses)')
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
            .from('export_order', 'eo')
            .where('eo.customerId = customer.id')
            .andWhere('eo.payment_status IN (:...statuses)')
            .getQuery();
          return `NOT EXISTS ${subQuery}`;
        })
        .setParameter('statuses', [
          PaymentStatus.UNPAID,
          PaymentStatus.PARTIALLY_PAID,
        ]);
    }

    // sắp xếp
    const validSortFields = ['fullname', 'email', 'phone', 'address'];
    if (sortBy && validSortFields.includes(sortBy)) {
      const order = orderBy?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      queryBuilder.orderBy(`customer.${sortBy}`, order);
    } else {
      queryBuilder.orderBy('customer.fullname', 'DESC'); // Mặc định
    }

    // phân trang
    const [customers, totalRecords] = await queryBuilder
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .getManyAndCount();

    // Thêm trường isDebt vào từng customer
    const customersWithDebt = customers.map((customer) => {
      const hasDebt = customer.exportOrders?.some(
        (order) =>
          order.order_status === OrderStatus.COMPLETED &&
          (order.payment_status === PaymentStatus.UNPAID ||
            order.payment_status === PaymentStatus.PARTIALLY_PAID),
      );
      return {
        ...customer,
        hasDebt,
      };
    });
    return {
      customers: customersWithDebt,
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

  async findOne(id: number) {
    const customerExists = await this.customerRepository.findOne({
      where: { id },
      relations: {
        exportOrders: {
          export_order_details: {
            product: true,
          },
          paymentDetails: {
            payment: {
              user: true,
            },
          },
        },
      },
    });
    if (!customerExists)
      throw new NotFoundException(
        ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.CUSTOMER),
      );

    const infoCustomer = {
      id: customerExists.id,
      fullname: customerExists.fullname,
      email: customerExists.email,
      phone: customerExists.phone,
      address: customerExists.address,
    };

    let listOrderFormatted: any = [];
    if (customerExists.exportOrders?.length > 0) {
      listOrderFormatted = customerExists.exportOrders.map((order) => {
        return {
          idOrder: order.id,
          import_order_code: order.export_order_code,
          total_amount: order.total_amount,
          payment_status: order.payment_status,
          payment_due_date: order.payment_due_date,
          amount_paid: order.amount_paid,
          amount_due: order.amount_due,
          note: order.note,
          order_status: order.order_status,
          createdAt: order.createdAt,
          list_product_in_order:
            order.export_order_details.length > 0
              ? order.export_order_details?.map((detail) => {
                  return {
                    idProduct: detail.product?.id,
                    product_code: detail.product?.product_code,
                    name: detail.product?.name,
                    purchase_price: detail.sell_price,
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

    // tính tổng nợ KH
    const total_debt = this.calcTotalDebtOfCustomer(
      customerExists.exportOrders,
    );

    return {
      ...infoCustomer,
      total_debt,
      listOrders: listOrderFormatted,
    };
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto) {
    if (!updateCustomerDto || Object.keys(updateCustomerDto).length === 0)
      throw new BadRequestException(ERROR_MESSAGE.INVALID_INPUT_UPDATE);
    const customerExists = await this.customerRepository.findOne({
      where: { id },
    });
    if (!customerExists)
      throw new NotFoundException(
        ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.CUSTOMER),
      );

    // check duplicate info (email, phone) with others customer
    const existingCustomer = await this.customerRepository
      .createQueryBuilder('customer')
      .where(
        new Brackets((qb) => {
          qb.where('customer.email = :email', {
            email: updateCustomerDto.email,
          }).orWhere('customer.phone = :phone', {
            phone: updateCustomerDto.phone,
          });
        }),
      )
      .andWhere('customer.id <> :id', { id })
      .getOne();

    if (existingCustomer) {
      if (
        existingCustomer.email.toLowerCase() ===
          updateCustomerDto.email?.toLowerCase() &&
        existingCustomer.phone === updateCustomerDto.phone
      ) {
        throw new ConflictException(ERROR_MESSAGE.EMAIL_PHONE_EXISTS);
      } else if (
        existingCustomer.email.toLowerCase() ===
        updateCustomerDto.email?.toLowerCase()
      ) {
        throw new ConflictException(ERROR_MESSAGE.EMAIL_EXISTS);
      } else if (existingCustomer.phone === updateCustomerDto.phone) {
        throw new ConflictException(ERROR_MESSAGE.PHONE_EXISTS);
      }
    }

    // check new data must be different from old data
    const oldData = {
      fullname: customerExists.fullname,
      email: customerExists.email,
      phone: customerExists.phone,
      address: customerExists.address,
    };

    const newData = getInfoObject(
      ['fullname', 'email', 'phone', 'address'],
      updateCustomerDto,
    );

    const changeFields = omitBy(newData, (value, key) =>
      isEqual(oldData[key], value),
    );
    if (isEmpty(changeFields)) {
      throw new BadRequestException(ERROR_MESSAGE.NO_DATA_CHANGE);
    }
    await this.customerRepository.update(id, changeFields);
  }

  async remove(id: number) {
    const customerExists = await this.customerRepository.findOne({
      where: { id },
      relations: {
        exportOrders: true,
      },
    });
    if (!customerExists)
      throw new NotFoundException(
        ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.CUSTOMER),
      );

    const hasDebt = customerExists?.exportOrders.some(
      (order) => order.payment_status !== PaymentStatus.PAID,
    );
    if (hasDebt) {
      throw new BadRequestException(
        ERROR_MESSAGE.CANNOT_DELETE_SUPPLIER_CUSTOMER(
          `${ENTITIES_MESSAGE.CUSTOMER.toLocaleLowerCase()} ${customerExists.fullname}`,
        ),
      );
    }
    await this.customerRepository.softRemove(customerExists);
  }

  async getAllCustomersNoPagination() {
    return await this.customerRepository.find();
  }

  async getCustomersHaveDebt({ search }) {
    const queryBuilder = this.customerRepository
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.exportOrders', 'exportOrders')
      .leftJoinAndSelect(
        'exportOrders.export_order_details',
        'export_order_details',
      )
      .leftJoinAndSelect('export_order_details.product', 'product')
      .leftJoinAndSelect('export_order_details.warehouse', 'warehouse')
      .where('exportOrders.order_status = :order_status', {
        order_status: OrderStatus.COMPLETED,
      })
      .andWhere('exportOrders.payment_status IN (:...paymentStatuses)', {
        paymentStatuses: [PaymentStatus.PARTIALLY_PAID, PaymentStatus.UNPAID],
      });

    if (search) {
      queryBuilder.andWhere('customer.fullname LIKE :name', {
        name: `%${search}%`,
      });
    }

    const customers = await queryBuilder.getMany();

    const formattedCustomers = customers.map((cus) => {
      let totalDebt = this.calcTotalDebtOfCustomer(cus.exportOrders);
      if (totalDebt > 0)
        return {
          ...cus,
          totalDebt,
        };
    });
    return formattedCustomers;
  }

  calcTotalDebtOfCustomer(list_orders: ExportOrder[]): number {
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
