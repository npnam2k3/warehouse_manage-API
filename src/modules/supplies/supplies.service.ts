import { Injectable } from '@nestjs/common';
import { CreateSupplyDto } from './dto/create-supply.dto';
import { UpdateSupplyDto } from './dto/update-supply.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Supply } from './entities/supply.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SuppliesService {
  constructor(
    @InjectRepository(Supply)
    private readonly supplyRepository: Repository<Supply>,
  ) {}
  create(createSupplyDto: CreateSupplyDto) {
    return 'This action adds a new supply';
  }

  findAll() {
    return `This action returns all supplies`;
  }

  findOne(id: number) {
    return `This action returns a #${id} supply`;
  }

  update(id: number, updateSupplyDto: UpdateSupplyDto) {
    return `This action updates a #${id} supply`;
  }

  remove(id: number) {
    return `This action removes a #${id} supply`;
  }
}
