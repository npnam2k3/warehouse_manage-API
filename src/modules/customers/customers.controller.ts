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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ResponseMessage } from 'src/decorator/response.decorator';
import { RESPONSE_MESSAGE } from 'src/constants/response.message';
import { PAGINATION } from 'src/constants/pagination';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ResponseMessage(RESPONSE_MESSAGE.CREATE)
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  @ResponseMessage(RESPONSE_MESSAGE.GET)
  findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search?: string,
    @Query('isDebt') isDebt?: string,
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('orderBy') orderBy: 'ASC' | 'DESC' = 'DESC',
  ) {
    const pageNum = page ? page : PAGINATION.CUSTOMER.PAGE_NUMBER;
    const limitNum = limit ? limit : PAGINATION.CUSTOMER.LIMIT_NUMBER;
    return this.customersService.findAll({
      pageNum,
      limitNum,
      search,
      isDebt,
      sortBy,
      orderBy,
    });
  }

  @Get('/getAll')
  @ResponseMessage(RESPONSE_MESSAGE.GET)
  getAllCustomersNoPagination() {
    return this.customersService.getAllCustomersNoPagination();
  }

  @Get(':id')
  @ResponseMessage(RESPONSE_MESSAGE.GET)
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(+id);
  }

  @Patch(':id')
  @ResponseMessage(RESPONSE_MESSAGE.UPDATE)
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(+id, updateCustomerDto);
  }

  @Delete(':id')
  @ResponseMessage(RESPONSE_MESSAGE.DELETE)
  remove(@Param('id') id: string) {
    return this.customersService.remove(+id);
  }
}
