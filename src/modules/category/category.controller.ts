import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { MyJwtGuard } from '../auth/guard/jwt-auth.guard';
import { ResponseMessage } from 'src/decorator/response.decorator';
import { RESPONSE_MESSAGE } from 'src/constants/response.message';
import { AuthorizationGuard } from '../auth/guard/authorization.guard';
import { Permissions } from 'src/decorator/permissions.decorator';
import { Subject } from '../auth/enums/subject.enum';
import { Action } from '../auth/enums/action.enum';

@Controller('category')
@UseGuards(MyJwtGuard, AuthorizationGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @Permissions({
    subject: Subject.category,
    actions: [Action.create],
  })
  @ResponseMessage(RESPONSE_MESSAGE.CREATE)
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  @Permissions({
    subject: Subject.category,
    actions: [Action.view],
  })
  @ResponseMessage(RESPONSE_MESSAGE.GET)
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  @Permissions({
    subject: Subject.category,
    actions: [Action.view],
  })
  @ResponseMessage(RESPONSE_MESSAGE.GET)
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(+id);
  }

  @Patch(':id')
  @Permissions({
    subject: Subject.category,
    actions: [Action.update],
  })
  @ResponseMessage(RESPONSE_MESSAGE.UPDATE)
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(+id, updateCategoryDto);
  }

  @Delete(':id')
  @Permissions({
    subject: Subject.category,
    actions: [Action.delete],
  })
  @ResponseMessage(RESPONSE_MESSAGE.DELETE)
  remove(@Param('id') id: string) {
    return this.categoryService.remove(+id);
  }
}
