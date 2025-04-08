import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ImportOrderService } from './import-order.service';
import { CreateImportOrderDto } from './dto/create-import-order.dto';
import { ResponseMessage } from 'src/decorator/response.decorator';
import { RESPONSE_MESSAGE } from 'src/constants/response.message';

@Controller('import-order')
export class ImportOrderController {
  constructor(private readonly importOrderService: ImportOrderService) {}

  @Post()
  @ResponseMessage(RESPONSE_MESSAGE.CREATE)
  create(@Body() createImportOrderDto: CreateImportOrderDto) {
    return this.importOrderService.create(createImportOrderDto);
  }

  @Get()
  findAll() {
    return this.importOrderService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.importOrderService.findOne(+id);
  }

  // @Patch(':id')
  // @ResponseMessage(RESPONSE_MESSAGE.UPDATE)
  // update(
  //   @Param('id') id: string,
  //   @Body() updateImportOrderDto: UpdateImportOrderDto,
  // ) {
  //   console.log('check dto:: ', updateImportOrderDto);
  //   return this.importOrderService.update(+id, updateImportOrderDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.importOrderService.remove(+id);
  }
}
