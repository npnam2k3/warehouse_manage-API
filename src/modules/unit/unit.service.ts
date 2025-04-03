import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUnitDto } from './dto/create-unit.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Unit } from './entities/unit.entity';
import { Repository } from 'typeorm';
import { ERROR_MESSAGE } from 'src/constants/exception.message';
import { ENTITIES_MESSAGE } from 'src/constants/entity.message';

@Injectable()
export class UnitService {
  constructor(
    @InjectRepository(Unit) private readonly unitRepository: Repository<Unit>,
  ) {}
  async create(createUnitDto: CreateUnitDto) {
    const unitExists = await this.unitRepository
      .createQueryBuilder('unit')
      .where('unit.name = :name', {
        name: createUnitDto.name,
      })
      .getCount();
    if (unitExists > 0) {
      throw new ConflictException(
        ERROR_MESSAGE.ALREADY_EXISTS(ENTITIES_MESSAGE.UNIT),
      );
    }
    const newUnit = this.unitRepository.create({
      name: createUnitDto.name,
    });
    return await this.unitRepository.save(newUnit);
  }

  async findAll() {
    return await this.unitRepository.find();
  }

  async findOne(id: number) {
    const unitExists = await this.unitRepository.findOne({
      where: { id },
    });
    if (!unitExists)
      throw new NotFoundException(
        ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.UNIT),
      );
    return unitExists;
  }

  // update(id: number, updateUnitDto: UpdateUnitDto) {
  //   return `This action updates a #${id} unit`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} unit`;
  // }
}
