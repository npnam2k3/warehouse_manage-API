import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateWarehouseLocationDto } from './dto/create-warehouse_location.dto';
import { UpdateWarehouseLocationDto } from './dto/update-warehouse_location.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { WarehouseLocation } from './entities/warehouse_location.entity';
import { Repository } from 'typeorm';
import { ERROR_MESSAGE } from 'src/constants/exception.message';
import { ENTITIES_MESSAGE } from 'src/constants/entity.message';
import { WarehouseService } from '../warehouse/warehouse.service';

@Injectable()
export class WarehouseLocationService {
  constructor(
    @InjectRepository(WarehouseLocation)
    private readonly locationRepository: Repository<WarehouseLocation>,
    private readonly warehouseService: WarehouseService,
  ) {}
  async create(createWarehouseLocationDto: CreateWarehouseLocationDto) {
    const locationExists = await this.locationRepository.exists({
      where: {
        location_code: createWarehouseLocationDto.location_code,
        warehouse: { id: createWarehouseLocationDto.warehouse_id },
      },
    });
    if (locationExists)
      throw new ConflictException(
        ERROR_MESSAGE.ALREADY_EXISTS(ENTITIES_MESSAGE.LOCATION),
      );

    const warehouse = await this.warehouseService.findOne(
      createWarehouseLocationDto.warehouse_id,
    );
    const newLocation = this.locationRepository.create({
      location_code: createWarehouseLocationDto.location_code,
      warehouse,
    });
    if (createWarehouseLocationDto.description)
      newLocation.description = createWarehouseLocationDto.description;

    return await this.locationRepository.save(newLocation);
  }

  async findAll() {
    return await this.locationRepository.find({ relations: ['warehouse'] });
  }

  async findOne(id: number) {
    const locationExists = await this.locationRepository.findOne({
      where: { id },
      relations: ['warehouse'],
    });
    if (!locationExists)
      throw new NotFoundException(
        ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.LOCATION),
      );

    return locationExists;
  }

  async update(
    id: number,
    updateWarehouseLocationDto: UpdateWarehouseLocationDto,
  ) {
    if (
      !updateWarehouseLocationDto ||
      Object.keys(updateWarehouseLocationDto).length === 0
    ) {
      throw new BadRequestException(ERROR_MESSAGE.INVALID_INPUT_UPDATE);
    }
    const locationExists = await this.findOne(id);

    const existingLocation = await this.locationRepository
      .createQueryBuilder('location')
      .where('LOWER(location.location_code) = LOWER(:location_code)', {
        location_code: updateWarehouseLocationDto.location_code,
      })
      .andWhere('location.warehouseId = :warehouseId', {
        warehouseId: updateWarehouseLocationDto.warehouse_id,
      })
      .andWhere('location.id <> :id', { id })
      .getCount();
    if (existingLocation > 0)
      throw new ConflictException(
        ERROR_MESSAGE.ALREADY_EXISTS(ENTITIES_MESSAGE.LOCATION),
      );

    let isUpdated = false;
    Object.entries(updateWarehouseLocationDto).forEach(([key, value]) => {
      if (value && key !== 'warehouse_id' && locationExists[key] !== value) {
        locationExists[key] = value;
        isUpdated = true;
      }
    });

    // if new data have warehouse_id that different from old warehouse_id => want to update warehouse_id
    if (
      updateWarehouseLocationDto.warehouse_id &&
      locationExists.warehouse.id !== updateWarehouseLocationDto.warehouse_id
    ) {
      const foundWarehouse = await this.warehouseService.findOne(
        updateWarehouseLocationDto.warehouse_id,
      );

      if (foundWarehouse) {
        locationExists.warehouse = foundWarehouse;
        isUpdated = true;
      }
    }

    if (!isUpdated) throw new BadRequestException(ERROR_MESSAGE.NO_DATA_CHANGE);
    return await this.locationRepository.save(locationExists);
  }

  async remove(id: number) {
    const locationExists = await this.locationRepository.findOne({
      where: { id },
    });
    if (!locationExists)
      throw new NotFoundException(
        ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.LOCATION),
      );
    await this.locationRepository.softRemove(locationExists);
  }
}
