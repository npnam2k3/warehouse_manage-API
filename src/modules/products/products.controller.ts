import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Query,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/config/multer.config';
import { ResponseMessage } from 'src/decorator/response.decorator';
import { RESPONSE_MESSAGE } from 'src/constants/response.message';
import { PAGINATION } from 'src/constants/pagination';
import { MyJwtGuard } from '../auth/guard/jwt-auth.guard';
import { AuthorizationGuard } from '../auth/guard/authorization.guard';
import { Permissions } from 'src/decorator/permissions.decorator';
import { Subject } from '../auth/enums/subject.enum';
import { Action } from '../auth/enums/action.enum';

@Controller('products')
@UseGuards(MyJwtGuard, AuthorizationGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Permissions({
    subject: Subject.products,
    actions: [Action.create],
  })
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @ResponseMessage(RESPONSE_MESSAGE.CREATE)
  create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.productsService.create(createProductDto, file);
  }

  @Get()
  @Permissions({
    subject: Subject.products,
    actions: [Action.view],
  })
  @ResponseMessage(RESPONSE_MESSAGE.GET)
  findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('orderBy') orderBy: 'ASC' | 'DESC' = 'DESC',
  ) {
    const pageNum = page ? page : PAGINATION.PRODUCT.PAGE_NUMBER;
    const limitNum = limit ? limit : PAGINATION.PRODUCT.LIMIT_NUMBER;
    return this.productsService.findAll({
      pageNum,
      limitNum,
      search,
      category,
      sortBy,
      orderBy,
    });
  }

  @Get('/getAll')
  @Permissions({
    subject: Subject.products,
    actions: [Action.view],
  })
  getAll() {
    return this.productsService.getAll();
  }

  @Get('/getAllProductsHaveQuantityInWarehouse')
  @Permissions({
    subject: Subject.products,
    actions: [Action.view],
  })
  getAllProductsHaveQuantityInWarehouse() {
    return this.productsService.getAllProductsHaveQuantityInWarehouse();
  }

  @Get(':id')
  @Permissions({
    subject: Subject.products,
    actions: [Action.view],
  })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @Patch(':id')
  @Permissions({
    subject: Subject.products,
    actions: [Action.update],
  })
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @ResponseMessage(RESPONSE_MESSAGE.UPDATE)
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.productsService.update(+id, updateProductDto, file);
  }

  @Delete(':id')
  @Permissions({
    subject: Subject.products,
    actions: [Action.delete],
  })
  @ResponseMessage(RESPONSE_MESSAGE.DELETE)
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}
