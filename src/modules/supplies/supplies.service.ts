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

  findAll() {
    return `This action returns all supplies`;
  }

  findOne(id: number) {
    return `This action returns a #${id} supply`;
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

  remove(id: number) {
    return `This action removes a #${id} supply`;
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
}
