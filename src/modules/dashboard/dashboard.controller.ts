import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}
  @Get('/base-info')
  getBaseInfo() {
    return this.dashboardService.getBaseInfo();
  }

  @Get('/products-have-low-inventory')
  getListProductsHaveLowInventory() {
    return this.dashboardService.getListProductsHaveLowInventory();
  }

  @Get('/orders-recent')
  getOrdersRecent() {
    return this.dashboardService.getOrdersRecent();
  }
}
