import { Controller, Get, Param, Query } from '@nestjs/common';
import { StatisticReportService } from './statistic-report.service';

@Controller('statistic-report')
export class StatisticReportController {
  constructor(
    private readonly statisticReportService: StatisticReportService,
  ) {}

  @Get('base-info')
  getBaseInfo(
    @Query('fromDate')
    fromDate: string,
    @Query('toDate')
    toDate: string,
  ) {
    return this.statisticReportService.getBaseInfo(fromDate, toDate);
  }

  @Get('info-for-chart-excel')
  getInfoForChartAndExcelReport(
    @Query('year')
    year: string,
  ) {
    return this.statisticReportService.getInfoForChartAndExcelReport(+year);
  }

  @Get('orders-monthly')
  getNumOrdersMonthly(
    @Query('year')
    year: string,
  ) {
    return this.statisticReportService.getNumOrdersMonthly(+year);
  }

  @Get('orders-upcoming-payment')
  getOrdersUpcomingPayment(
    @Query('num_date')
    num_date: string,
  ) {
    return this.statisticReportService.getOrdersUpcomingPayment(+num_date);
  }

  @Get('orders-in-month')
  getOrdersInMonth(
    @Query('month')
    month: string,
    @Query('year')
    year: string,
  ) {
    return this.statisticReportService.getOrdersInMonth(+month, +year);
  }

  @Get('products-sales')
  getProductsSales(
    @Query('fromDate')
    fromDate: string,
    @Query('toDate')
    toDate: string,
  ) {
    return this.statisticReportService.getProductsSales(fromDate, toDate);
  }

  @Get('products-sales-for-excel')
  getProductsSalesForExcel(
    @Query('month')
    month: string,
    @Query('year')
    year: string,
  ) {
    return this.statisticReportService.getProductsSalesForExcel(+month, +year);
  }
}
