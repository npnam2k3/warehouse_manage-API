import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Put,
} from '@nestjs/common';
import { ImportOrderService } from './import-order.service';
import { CreateImportOrderDto } from './dto/create-import-order.dto';
import { ResponseMessage } from 'src/decorator/response.decorator';
import { RESPONSE_MESSAGE } from 'src/constants/response.message';
import { PAGINATION } from 'src/constants/pagination';
import { CancelImportOrderDto } from './dto/cancel-import-order.dto';

@Controller('import-order')
export class ImportOrderController {
  constructor(private readonly importOrderService: ImportOrderService) {}

  @Post()
  @ResponseMessage(RESPONSE_MESSAGE.CREATE)
  create(@Body() createImportOrderDto: CreateImportOrderDto) {
    return this.importOrderService.create(createImportOrderDto);
  }

  @Get()
  @ResponseMessage(RESPONSE_MESSAGE.GET)
  findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search?: string,
    @Query('payment_status') payment_status?: string,
    @Query('order_status') order_status?: string,
    @Query('sortBy') sortBy: string = 'total_amount',
    @Query('orderBy') orderBy: 'ASC' | 'DESC' = 'DESC',
  ) {
    const pageNum = page ? page : PAGINATION.IMPORT_ORDER.PAGE_NUMBER;
    const limitNum = limit ? limit : PAGINATION.IMPORT_ORDER.LIMIT_NUMBER;
    return this.importOrderService.findAll({
      pageNum,
      limitNum,
      search,
      payment_status,
      order_status,
      sortBy,
      orderBy,
    });
  }

  @Get(':id')
  @ResponseMessage(RESPONSE_MESSAGE.GET)
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

  @Post('/cancel-import-order')
  @ResponseMessage(RESPONSE_MESSAGE.CANCEL_ORDER)
  cancel(@Body() cancelImportOrderDto: CancelImportOrderDto) {
    return this.importOrderService.cancel(cancelImportOrderDto);
  }

  @Put('/confirm-import-order/:id')
  @ResponseMessage(RESPONSE_MESSAGE.CONFIRM_ORDER)
  confirm(@Param('id') id: string) {
    return this.importOrderService.confirm(+id);
  }
}
