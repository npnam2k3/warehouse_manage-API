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
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/config/multer.config';
import { ResponseMessage } from 'src/decorator/response.decorator';
import { RESPONSE_MESSAGE } from 'src/constants/response.message';
import { PAGINATION } from 'src/constants/pagination';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @ResponseMessage(RESPONSE_MESSAGE.CREATE)
  create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.productsService.create(createProductDto, file);
  }

  @Get()
  @ResponseMessage(RESPONSE_MESSAGE.GET)
  findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('sortBy') sortBy: string = 'sell_price',
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
  getAll() {
    return this.productsService.getAll();
  }
  @Get('/getAllProductsHaveQuantityInWarehouse')
  getAllProductsHaveQuantityInWarehouse() {
    return this.productsService.getAllProductsHaveQuantityInWarehouse();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @Patch(':id')
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
  @ResponseMessage(RESPONSE_MESSAGE.DELETE)
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}
