import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  UseGuards,
  Query,
} from '@nestjs/common';
import { InventoryAdjustmentService } from './inventory-adjustment.service';
import { CreateInventoryAdjustmentDto } from './dto/create-inventory-adjustment.dto';
import { MyJwtGuard } from '../auth/guard/jwt-auth.guard';
import { ResponseMessage } from 'src/decorator/response.decorator';
import { RESPONSE_MESSAGE } from 'src/constants/response.message';
import { PAGINATION } from 'src/constants/pagination';

@Controller('inventory-adjustment')
@UseGuards(MyJwtGuard)
export class InventoryAdjustmentController {
  constructor(
    private readonly inventoryAdjustmentService: InventoryAdjustmentService,
  ) {}

  @Post()
  @ResponseMessage(RESPONSE_MESSAGE.CHANGE_INVENTORY)
  create(
    @Body() createInventoryAdjustmentDto: CreateInventoryAdjustmentDto,
    @Request() req,
  ) {
    const idUserLogin = req.user?.userId;
    return this.inventoryAdjustmentService.create(
      createInventoryAdjustmentDto,
      idUserLogin,
    );
  }

  @Get()
  findAll(@Query('page') page: number, @Query('limit') limit: number) {
    const pageNum = page ? page : PAGINATION.INVENTORY_LOG.PAGE_NUMBER;
    const limitNum = limit ? limit : PAGINATION.INVENTORY_LOG.LIMIT_NUMBER;
    return this.inventoryAdjustmentService.findAll({ pageNum, limitNum });
  }
}
