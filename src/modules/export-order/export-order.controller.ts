import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ExportOrderService } from './export-order.service';
import { CreateExportOrderDto } from './dto/create-export-order.dto';
import { UpdateExportOrderDto } from './dto/update-export-order.dto';
import { ResponseMessage } from 'src/decorator/response.decorator';
import { RESPONSE_MESSAGE } from 'src/constants/response.message';
import { PAGINATION } from 'src/constants/pagination';

@Controller('export-order')
export class ExportOrderController {
  constructor(private readonly exportOrderService: ExportOrderService) {}

  @Post()
  @ResponseMessage(RESPONSE_MESSAGE.CREATE)
  create(@Body() createExportOrderDto: CreateExportOrderDto) {
    return this.exportOrderService.create(createExportOrderDto);
  }

  @Get()
  @ResponseMessage(RESPONSE_MESSAGE.GET)
  findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy: string = 'total_amount',
    @Query('orderBy') orderBy: 'ASC' | 'DESC' = 'DESC',
  ) {
    const pageNum = page ? page : PAGINATION.EXPORT_ORDER.PAGE_NUMBER;
    const limitNum = limit ? limit : PAGINATION.EXPORT_ORDER.LIMIT_NUMBER;
    return this.exportOrderService.findAll({
      pageNum,
      limitNum,
      search,
      status,
      sortBy,
      orderBy,
    });
  }

  @Get(':id')
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

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.exportOrderService.remove(+id);
  }
}
