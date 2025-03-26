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
    const warehouses = await this.warehouseRepository.find();

    return warehouses;
  }

  async findOne(id: number) {
    const warehouseExists = await this.warehouseRepository.findOne({
      where: { id },
      relations: ['warehouse_locations'],
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
      .where('LOWER(warehouse.name) = LOWER(:name)', {
        name: updateWarehouseDto.name,
      })
      .andWhere('warehouse.id != :id', { id })
      .getOne();
    if (existingWarehouse)
      throw new ConflictException(
        ERROR_MESSAGE.ALREADY_EXISTS(ENTITIES_MESSAGE.WAREHOUSE),
      );

    let isUpdated = false;

    Object.entries(updateWarehouseDto)?.forEach(([key, value]) => {
      if (value && warehouseExists[key] !== value) {
        warehouseExists[key] = value;
        isUpdated = true;
      }
    });
    if (!isUpdated) throw new BadRequestException(ERROR_MESSAGE.NO_DATA_CHANGE);

    await this.warehouseRepository.update(id, warehouseExists);
    return warehouseExists;
  }

  async remove(id: number) {
    const warehouseExists = await this.warehouseRepository.findOne({
      where: { id },
    });
    if (!warehouseExists)
      throw new NotFoundException(
        ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.WAREHOUSE),
      );
    await this.warehouseRepository.softRemove(warehouseExists);
  }
}
