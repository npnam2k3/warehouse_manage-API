import { PartialType } from '@nestjs/mapped-types';
import { CreateWarehouseLocationDto } from './create-warehouse_location.dto';

export class UpdateWarehouseLocationDto extends PartialType(CreateWarehouseLocationDto) {}
