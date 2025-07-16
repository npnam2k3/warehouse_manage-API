import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from './entities/warehouse.entity';
import { ERROR_MESSAGE } from 'src/constants/exception.message';
import { ENTITIES_MESSAGE } from 'src/constants/entity.message';
import { getInfoObject } from 'src/utils/compareObject';
import { isEmpty, isEqual, omitBy } from 'lodash';

@Injectable()
export class WarehouseService {
  constructor(
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
  ) {}
  async create(createWarehouseDto: CreateWarehouseDto) {
    const warehouseExists = await this.warehouseRepository.findOne({
      where: {
        name: createWarehouseDto.name,
      },
    });
    if (warehouseExists)
      throw new ConflictException(
        ERROR_MESSAGE.ALREADY_EXISTS(ENTITIES_MESSAGE.WAREHOUSE),
      );

    const newWarehouse = this.warehouseRepository.create({
      name: createWarehouseDto.name,
    });
    if (createWarehouseDto.address)
      newWarehouse.address = createWarehouseDto.address;

    return await this.warehouseRepository.save(newWarehouse);
  }

  async findAll() {
    const warehouses = await this.warehouseRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });

    return warehouses;
  }

  async findOne(id: number) {
    const warehouseExists = await this.warehouseRepository.findOne({
      where: { id },
    });
    if (!warehouseExists)
      throw new NotFoundException(
        ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.WAREHOUSE),
      );

    return warehouseExists;
  }

  async update(id: number, updateWarehouseDto: UpdateWarehouseDto) {
    if (!updateWarehouseDto || Object.keys(updateWarehouseDto).length === 0)
      throw new BadRequestException(ERROR_MESSAGE.INVALID_INPUT_UPDATE);

    const warehouseExists = await this.warehouseRepository.findOne({
      where: { id },
    });
    if (!warehouseExists)
      throw new NotFoundException(
        ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.WAREHOUSE),
      );

    const existingWarehouse = await this.warehouseRepository
      .createQueryBuilder('warehouse')
      .where('warehouse.name = :name', {
        name: updateWarehouseDto.name,
      })
      .andWhere('warehouse.id != :id', { id })
      .getOne();
    if (existingWarehouse)
      throw new ConflictException(
        ERROR_MESSAGE.ALREADY_EXISTS(ENTITIES_MESSAGE.WAREHOUSE),
      );

    const oldData = {
      name: warehouseExists.name,
      address: warehouseExists.address,
    };
    const newData: any = getInfoObject(['name', 'address'], updateWarehouseDto);
    const changeFields = omitBy(newData, (value, key) =>
      isEqual(oldData[key], value),
    );
    if (isEmpty(changeFields)) {
      throw new BadRequestException(ERROR_MESSAGE.NO_DATA_CHANGE);
    }
    if (!newData.address) {
      changeFields.address = oldData.address;
    }
    await this.warehouseRepository.update(id, changeFields);
  }

  async remove(id: number) {
    const warehouseExists = await this.warehouseRepository.findOne({
      where: { id },
      relations: ['inventories'],
    });
    if (!warehouseExists)
      throw new NotFoundException(
        ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.WAREHOUSE),
      );

    if (warehouseExists.inventories.length > 0)
      throw new BadRequestException(
        ERROR_MESSAGE.DELETE_FAILED(
          warehouseExists.name,
          ENTITIES_MESSAGE.PRODUCT.toLocaleLowerCase(),
        ),
      );
    await this.warehouseRepository.softRemove(warehouseExists);
  }
}
