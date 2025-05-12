import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SuppliesService } from './supplies.service';
import { CreateSupplyDto } from './dto/create-supply.dto';
import { UpdateSupplyDto } from './dto/update-supply.dto';
import { ResponseMessage } from 'src/decorator/response.decorator';
import { RESPONSE_MESSAGE } from 'src/constants/response.message';
import { SupplierProductDto } from './dto/create-supplier-product.dto';
import { DeleteProductSupplierDto } from './dto/delete-supplier-product.dto';
import { PAGINATION } from 'src/constants/pagination';
import { MyJwtGuard } from '../auth/guard/jwt-auth.guard';
import { AuthorizationGuard } from '../auth/guard/authorization.guard';
import { Permissions } from 'src/decorator/permissions.decorator';
import { Subject } from '../auth/enums/subject.enum';
import { Action } from '../auth/enums/action.enum';

@Controller('supplies')
@UseGuards(MyJwtGuard, AuthorizationGuard)
export class SuppliesController {
  constructor(private readonly suppliesService: SuppliesService) {}

  @Post()
  @Permissions({
    subject: Subject.supplier,
    actions: [Action.create],
  })
  @ResponseMessage(RESPONSE_MESSAGE.CREATE)
  create(@Body() createSupplyDto: CreateSupplyDto) {
    return this.suppliesService.create(createSupplyDto);
  }

  @Get()
  @Permissions({
    subject: Subject.supplier,
    actions: [Action.view],
  })
  @ResponseMessage(RESPONSE_MESSAGE.GET)
  findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search?: string,
    @Query('isDebt') isDebt?: string,
    @Query('sortBy') sortBy: string = 'name_company',
    @Query('orderBy') orderBy: 'ASC' | 'DESC' = 'DESC',
  ) {
    const pageNum = page ? page : PAGINATION.SUPPLIER.PAGE_NUMBER;
    const limitNum = limit ? limit : PAGINATION.SUPPLIER.LIMIT_NUMBER;
    return this.suppliesService.findAll({
      pageNum,
      limitNum,
      search,
      isDebt,
      sortBy,
      orderBy,
    });
  }

  @Get('/getAll')
  @Permissions({
    subject: Subject.supplier,
    actions: [Action.view],
  })
  @ResponseMessage(RESPONSE_MESSAGE.GET)
  getAllSuppliersNoPagination() {
    return this.suppliesService.getAllSuppliersNoPagination();
  }

  @Get('/getSuppliersHaveDebt')
  @Permissions({
    subject: Subject.supplier,
    actions: [Action.view],
  })
  @ResponseMessage(RESPONSE_MESSAGE.GET)
  getSuppliersHaveDebt(@Query('search') search?: string) {
    return this.suppliesService.getSuppliersHaveDebt({ search });
  }

  @Get('/get-products-of-supplier/:id')
  @Permissions({
    subject: Subject.supplier,
    actions: [Action.view],
  })
  @ResponseMessage(RESPONSE_MESSAGE.GET)
  getProductsOfSupplier(@Param('id') id: string) {
    return this.suppliesService.getProductsOfSupplier(+id);
  }

  @Get(':id')
  @Permissions({
    subject: Subject.supplier,
    actions: [Action.view],
  })
  @ResponseMessage(RESPONSE_MESSAGE.GET)
  findOne(@Param('id') id: string) {
    return this.suppliesService.findOne(+id);
  }

  @Patch(':id')
  @Permissions({
    subject: Subject.supplier,
    actions: [Action.update],
  })
  @ResponseMessage(RESPONSE_MESSAGE.UPDATE)
  update(@Param('id') id: string, @Body() updateSupplyDto: UpdateSupplyDto) {
    return this.suppliesService.update(+id, updateSupplyDto);
  }

  @Delete(':id')
  @Permissions({
    subject: Subject.supplier,
    actions: [Action.delete],
  })
  @ResponseMessage(RESPONSE_MESSAGE.DELETE)
  remove(@Param('id') id: string) {
    return this.suppliesService.remove(+id);
  }

  @Post('add-product-to-supplier')
  @Permissions({
    subject: Subject.supplier,
    actions: [Action.update],
  })
  @ResponseMessage(RESPONSE_MESSAGE.CREATE)
  addProductToSupplier(@Body() createSupplierProductDto: SupplierProductDto) {
    return this.suppliesService.addProductsToSupplier(createSupplierProductDto);
  }

  @Post('delete-product-from-supplier')
  @Permissions({
    subject: Subject.supplier,
    actions: [Action.update],
  })
  @ResponseMessage(RESPONSE_MESSAGE.DELETE)
  deleteProductFromSupplier(
    @Body() deleteSupplierProductDto: DeleteProductSupplierDto,
  ) {
    return this.suppliesService.deleteProductFromSupplier(
      deleteSupplierProductDto,
    );
  }
}
