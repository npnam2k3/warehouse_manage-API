import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { WarehouseLocationService } from './warehouse_location.service';
import { CreateWarehouseLocationDto } from './dto/create-warehouse_location.dto';
import { UpdateWarehouseLocationDto } from './dto/update-warehouse_location.dto';
import { ResponseMessage } from 'src/decorator/response.decorator';
import { RESPONSE_MESSAGE } from 'src/constants/response.message';

@Controller('warehouse-location')
export class WarehouseLocationController {
  constructor(
    private readonly warehouseLocationService: WarehouseLocationService,
  ) {}

  @Post()
  @ResponseMessage(RESPONSE_MESSAGE.CREATE)
  create(@Body() createWarehouseLocationDto: CreateWarehouseLocationDto) {
    return this.warehouseLocationService.create(createWarehouseLocationDto);
  }

  @Get()
  @ResponseMessage(RESPONSE_MESSAGE.GET)
  findAll() {
    return this.warehouseLocationService.findAll();
  }

  @Get(':id')
  @ResponseMessage(RESPONSE_MESSAGE.GET)
  findOne(@Param('id') id: string) {
    return this.warehouseLocationService.findOne(+id);
  }

  @Patch(':id')
  @ResponseMessage(RESPONSE_MESSAGE.UPDATE)
  update(
    @Param('id') id: string,
    @Body() updateWarehouseLocationDto: UpdateWarehouseLocationDto,
  ) {
    return this.warehouseLocationService.update(
      +id,
      updateWarehouseLocationDto,
    );
  }

  @Delete(':id')
  @ResponseMessage(RESPONSE_MESSAGE.DELETE)
  remove(@Param('id') id: string) {
    return this.warehouseLocationService.remove(+id);
  }
}
