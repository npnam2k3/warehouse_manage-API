import { Controller, Get, Post, Body, Delete, Param } from '@nestjs/common';
import { UnitService } from './unit.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { ResponseMessage } from 'src/decorator/response.decorator';
import { RESPONSE_MESSAGE } from 'src/constants/response.message';

@Controller('unit')
export class UnitController {
  constructor(private readonly unitService: UnitService) {}

  @Post()
  @ResponseMessage(RESPONSE_MESSAGE.CREATE)
  create(@Body() createUnitDto: CreateUnitDto) {
    return this.unitService.create(createUnitDto);
  }

  @Get()
  findAll() {
    return this.unitService.findAll();
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.unitService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateUnitDto: UpdateUnitDto) {
  //   return this.unitService.update(+id, updateUnitDto);
  // }

  @Delete(':id')
  @ResponseMessage(RESPONSE_MESSAGE.DELETE)
  remove(@Param('id') id: string) {
    return this.unitService.remove(+id);
  }
}
