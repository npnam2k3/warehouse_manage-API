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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseMessage } from 'src/decorator/response.decorator';
import { RESPONSE_MESSAGE } from 'src/constants/response.message';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ResponseMessage(RESPONSE_MESSAGE.CREATE)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ResponseMessage(RESPONSE_MESSAGE.GET)
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 5,
    @Query('search') search?: string,
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('orderBy') orderBy: 'ASC' | 'DESC' = 'DESC',
  ) {
    return this.usersService.findAll({ page, limit, search, sortBy, orderBy });
  }

  @Get(':id')
  @ResponseMessage(RESPONSE_MESSAGE.GET)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @ResponseMessage(RESPONSE_MESSAGE.UPDATE)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @ResponseMessage(RESPONSE_MESSAGE.DELETE)
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
