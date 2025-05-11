import { PartialType } from '@nestjs/mapped-types';
import { CreateStatisticReportDto } from './create-statistic-report.dto';

export class UpdateStatisticReportDto extends PartialType(CreateStatisticReportDto) {}
