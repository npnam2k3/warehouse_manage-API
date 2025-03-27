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
import { compareObject, getInfoObject } from 'src/utils/compareObject';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}
  async create(createCustomerDto: CreateCustomerDto) {
    const { fullname, email, phone, address } = createCustomerDto;
    const customerExists = await this.customerRepository.count({
      where: [{ email }, { phone }],
    });
    if (customerExists > 0) {
      throw new ConflictException(
        ERROR_MESSAGE.ALREADY_EXISTS(ENTITIES_MESSAGE.CUSTOMER),
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

  async findAll({ pageNum, limitNum, search, sortBy, orderBy }) {
    const queryBuilder = this.customerRepository.createQueryBuilder('customer');

    // 1. search
    if (search) {
      queryBuilder.where('customer.fullname LIKE :search', {
        search: `%${search}%`,
      });
    }

    // 2. sort
    if (sortBy) {
      const order = orderBy.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      queryBuilder.orderBy(`customer.${sortBy}`, order);
    }

    //3. pagination
    const totalRecords = await queryBuilder.getCount();
    const customers = await queryBuilder
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .getMany();

    return {
      customers,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limitNum),
      conditions: {
        pageNum,
        limitNum,
        search,
        sortBy,
        orderBy,
      },
    };
  }

  async findOne(id: number) {
    const customerExists = await this.customerRepository.findOne({
      where: { id },
    });
    if (!customerExists)
      throw new NotFoundException(
        ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.CUSTOMER),
      );

    return customerExists;
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
          qb.where('LOWER(customer.email) = LOWER(:email)', {
            email: updateCustomerDto.email,
          }).orWhere('customer.phone = :phone', {
            phone: updateCustomerDto.phone,
          });
        }),
      )
      .andWhere('customer.id <> :id', { id })
      .getCount();

    if (existingCustomer > 0)
      throw new ConflictException(
        ERROR_MESSAGE.ALREADY_EXISTS(ENTITIES_MESSAGE.CUSTOMER),
      );

    // check new data must be different from old data
    const updatedCustomer = { ...customerExists, ...updateCustomerDto };
    const keysToCompare = ['fullname', 'email', 'phone', 'address'];
    const existingData = getInfoObject(keysToCompare, customerExists);
    const newData = getInfoObject(keysToCompare, updatedCustomer);

    if (compareObject(existingData, newData))
      throw new BadRequestException(ERROR_MESSAGE.NO_DATA_CHANGE);

    return await this.customerRepository.save(updatedCustomer);
  }

  async remove(id: number) {
    const customerExists = await this.customerRepository.findOne({
      where: { id },
    });
    if (!customerExists)
      throw new NotFoundException(
        ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.CUSTOMER),
      );

    await this.customerRepository.softRemove(customerExists);
  }
}
