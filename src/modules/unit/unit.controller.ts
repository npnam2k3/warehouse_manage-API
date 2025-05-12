import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UnitService } from './unit.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { ResponseMessage } from 'src/decorator/response.decorator';
import { RESPONSE_MESSAGE } from 'src/constants/response.message';
import { MyJwtGuard } from '../auth/guard/jwt-auth.guard';
import { AuthorizationGuard } from '../auth/guard/authorization.guard';
import { Permissions } from 'src/decorator/permissions.decorator';
import { Subject } from '../auth/enums/subject.enum';
import { Action } from '../auth/enums/action.enum';

@Controller('unit')
@UseGuards(MyJwtGuard, AuthorizationGuard)
export class UnitController {
  constructor(private readonly unitService: UnitService) {}

  @Post()
  @Permissions({
    subject: Subject.unit,
    actions: [Action.create],
  })
  @ResponseMessage(RESPONSE_MESSAGE.CREATE)
  create(@Body() createUnitDto: CreateUnitDto) {
    return this.unitService.create(createUnitDto);
  }

  @Get()
  @Permissions({
    subject: Subject.unit,
    actions: [Action.view],
  })
  findAll() {
    return this.unitService.findAll();
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.unitService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateUnitDto: UpdateUnitDto) {
  //   return this.unitService.update(+id, updateUnitDto);
  // }

  @Delete(':id')
  @Permissions({
    subject: Subject.unit,
    actions: [Action.delete],
  })
  @ResponseMessage(RESPONSE_MESSAGE.DELETE)
  remove(@Param('id') id: string) {
    return this.unitService.remove(+id);
  }
}
