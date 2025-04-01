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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseMessage } from 'src/decorator/response.decorator';
import { RESPONSE_MESSAGE } from 'src/constants/response.message';
import { MyJwtGuard } from '../auth/guard/jwt-auth.guard';
import { AuthorizationGuard } from '../auth/guard/authorization.guard';
import { Permissions } from 'src/decorator/permissions.decorator';
import { Subject } from '../auth/enums/subject.enum';
import { Action } from '../auth/enums/action.enum';
import { PAGINATION } from 'src/constants/pagination';

@Controller('users')
// @UseGuards(MyJwtGuard, AuthorizationGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Permissions({
    subject: Subject.users,
    actions: [Action.create],
  })
  @ResponseMessage(RESPONSE_MESSAGE.CREATE)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Permissions({
    subject: Subject.users,
    actions: [Action.view],
  })
  @ResponseMessage(RESPONSE_MESSAGE.GET)
  findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search?: string,
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('orderBy') orderBy: 'ASC' | 'DESC' = 'DESC',
  ) {
    const pageNum = page ? page : PAGINATION.USER.PAGE_NUMBER;
    const limitNum = limit ? limit : PAGINATION.USER.LIMIT_NUMBER;
    return this.usersService.findAll({
      pageNum,
      limitNum,
      search,
      sortBy,
      orderBy,
    });
  }

  @Get(':id')
  @Permissions({
    subject: Subject.users,
    actions: [Action.view],
  })
  @ResponseMessage(RESPONSE_MESSAGE.GET)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @Permissions({
    subject: Subject.users,
    actions: [Action.update],
  })
  @ResponseMessage(RESPONSE_MESSAGE.UPDATE)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @Permissions({
    subject: Subject.users,
    actions: [Action.delete],
  })
  @ResponseMessage(RESPONSE_MESSAGE.DELETE)
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @Patch('block/:id')
  @Permissions({
    subject: Subject.users,
    actions: [Action.update],
  })
  @ResponseMessage(RESPONSE_MESSAGE.BLOCK)
  block(@Param('id') id: string) {
    return this.usersService.block(+id);
  }
  @Patch('unBlock/:id')
  @Permissions({
    subject: Subject.users,
    actions: [Action.update],
  })
  @ResponseMessage(RESPONSE_MESSAGE.UNBLOCK)
  unBlock(@Param('id') id: string) {
    return this.usersService.unblock(+id);
  }
}
