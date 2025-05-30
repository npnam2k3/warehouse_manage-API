import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from './interceptor/response.interceptor';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { AuthModule } from './modules/auth/auth.module';
import { MailModule } from './mail/mail.module';
import { CategoryModule } from './modules/category/category.module';
import { WarehouseModule } from './modules/warehouse/warehouse.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ProductsModule } from './modules/products/products.module';
import { UnitModule } from './modules/unit/unit.module';
import { SuppliesModule } from './modules/supplies/supplies.module';
import { ImportOrderModule } from './modules/import-order/import-order.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ExportOrderModule } from './modules/export-order/export-order.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { InventoryAdjustmentModule } from './modules/inventory-adjustment/inventory-adjustment.module';
import { StatisticReportModule } from './modules/statistic-report/statistic-report.module';
import { SocketModule } from './socket/socket.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        return {
          type: dbConfig?.type,
          host: dbConfig?.host,
          port: dbConfig?.port,
          username: dbConfig?.username,
          password: dbConfig?.password,
          database: dbConfig?.name,
          autoLoadEntities: true,
          synchronize: true,
          // logging: true,
        };
      },
    }),
    UsersModule,
    RolesModule,
    PermissionsModule,
    AuthModule,
    MailModule,
    CategoryModule,
    WarehouseModule,
    CustomersModule,
    ProductsModule,
    UnitModule,
    SuppliesModule,
    ImportOrderModule,
    PaymentsModule,
    ExportOrderModule,
    DashboardModule,
    InventoryAdjustmentModule,
    StatisticReportModule,

    // notification
    NotificationsModule,

    // socket
    SocketModule,

    // task scheduling
    ScheduleModule.forRoot(),

    // event driven
    EventEmitterModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
