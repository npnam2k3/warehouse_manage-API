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
import { AuthorizationGuard } from '../auth/guard/authorization.guard';
import { Permissions } from 'src/decorator/permissions.decorator';
import { Subject } from '../auth/enums/subject.enum';
import { Action } from '../auth/enums/action.enum';

@Controller('inventory-adjustment')
@UseGuards(MyJwtGuard, AuthorizationGuard)
export class InventoryAdjustmentController {
  constructor(
    private readonly inventoryAdjustmentService: InventoryAdjustmentService,
  ) {}

  @Post()
  @Permissions({
    subject: Subject.inventory,
    actions: [Action.create],
  })
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
  @Permissions({
    subject: Subject.inventory,
    actions: [Action.view],
  })
  findAll(@Query('page') page: number, @Query('limit') limit: number) {
    const pageNum = page ? page : PAGINATION.INVENTORY_LOG.PAGE_NUMBER;
    const limitNum = limit ? limit : PAGINATION.INVENTORY_LOG.LIMIT_NUMBER;
    return this.inventoryAdjustmentService.findAll({ pageNum, limitNum });
  }
}
