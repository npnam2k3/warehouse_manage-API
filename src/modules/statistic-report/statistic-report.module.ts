import { Module } from '@nestjs/common';
import { StatisticReportService } from './statistic-report.service';
import { StatisticReportController } from './statistic-report.controller';
import { ExportOrderModule } from '../export-order/export-order.module';
import { ImportOrderModule } from '../import-order/import-order.module';

@Module({
  imports: [ExportOrderModule, ImportOrderModule],
  controllers: [StatisticReportController],
  providers: [StatisticReportService],
})
export class StatisticReportModule {}
