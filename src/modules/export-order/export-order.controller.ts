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
  UseGuards,
} from '@nestjs/common';
import { ExportOrderService } from './export-order.service';
import { CreateExportOrderDto } from './dto/create-export-order.dto';
import { UpdateExportOrderDto } from './dto/update-export-order.dto';
import { ResponseMessage } from 'src/decorator/response.decorator';
import { RESPONSE_MESSAGE } from 'src/constants/response.message';
import { PAGINATION } from 'src/constants/pagination';
import { CancelExportOrderDto } from './dto/cancel-export-order.dto';
import { MyJwtGuard } from '../auth/guard/jwt-auth.guard';
import { AuthorizationGuard } from '../auth/guard/authorization.guard';
import { Permissions } from 'src/decorator/permissions.decorator';
import { Subject } from '../auth/enums/subject.enum';
import { Action } from '../auth/enums/action.enum';

@Controller('export-order')
@UseGuards(MyJwtGuard, AuthorizationGuard)
export class ExportOrderController {
  constructor(private readonly exportOrderService: ExportOrderService) {}

  @Post()
  @Permissions({
    subject: Subject.export_order,
    actions: [Action.create],
  })
  @ResponseMessage(RESPONSE_MESSAGE.CREATE)
  create(@Body() createExportOrderDto: CreateExportOrderDto) {
    return this.exportOrderService.create(createExportOrderDto);
  }

  @Get()
  @Permissions({
    subject: Subject.export_order,
    actions: [Action.view],
  })
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
    const pageNum = page ? page : PAGINATION.EXPORT_ORDER.PAGE_NUMBER;
    const limitNum = limit ? limit : PAGINATION.EXPORT_ORDER.LIMIT_NUMBER;
    return this.exportOrderService.findAll({
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
  @Permissions({
    subject: Subject.export_order,
    actions: [Action.view],
  })
  @ResponseMessage(RESPONSE_MESSAGE.GET)
  findOne(@Param('id') id: string) {
    return this.exportOrderService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateExportOrderDto: UpdateExportOrderDto,
  ) {
    return this.exportOrderService.update(+id, updateExportOrderDto);
  }

  @Post('/cancel-export-order')
  @Permissions({
    subject: Subject.export_order,
    actions: [Action.update],
  })
  @ResponseMessage(RESPONSE_MESSAGE.CANCEL_ORDER)
  cancel(@Body() cancelExportOrderDto: CancelExportOrderDto) {
    return this.exportOrderService.cancel(cancelExportOrderDto);
  }

  @Put('/confirm-export-order/:id')
  @Permissions({
    subject: Subject.export_order,
    actions: [Action.update],
  })
  @ResponseMessage(RESPONSE_MESSAGE.CONFIRM_ORDER)
  confirm(@Param('id') id: string) {
    return this.exportOrderService.confirm(+id);
  }

  @Get('/historySellOfProduct/:id')
  getHistorySellOfProduct(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Param('id') id: string,
  ) {
    const pageNum = page
      ? page
      : PAGINATION.HISTORY_SELL_OF_PRODUCT.PAGE_NUMBER;
    const limitNum = limit
      ? limit
      : PAGINATION.HISTORY_SELL_OF_PRODUCT.LIMIT_NUMBER;

    return this.exportOrderService.getHistorySellOfProduct({
      limitNum,
      pageNum,
      productId: +id,
    });
  }
}
