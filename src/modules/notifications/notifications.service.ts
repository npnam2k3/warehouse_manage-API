import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import { EventName } from 'src/constants/event';
import { EventsGateway } from 'src/socket/EventGateway';
import { DataSource } from 'typeorm';
import { ExportOrder } from '../export-order/entities/export-order.entity';
import { Inventory } from '../products/entities/inventory.entity';
import { User } from '../users/entities/user.entity';
import { Notification } from './entities/notification.entity';
import { UserNotification } from './entities/user-notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly gateway: EventsGateway,
    private readonly dataSource: DataSource,
  ) {}

  private THRESHOLD = 10;
  @OnEvent(EventName.QUANTITY_CHANGE)
  async handleChangeQuantity(payload: { orderId: number }) {
    const repositoryOrder = this.dataSource.getRepository(ExportOrder);
    const repositoryInventory = this.dataSource.getRepository(Inventory);

    const { orderId } = payload;

    const order = await repositoryOrder.findOne({
      where: { id: orderId },
      select: {
        id: true,
        export_order_details: {
          id: true,
          product: { id: true },
          warehouse: { id: true },
        },
      },
      relations: {
        export_order_details: {
          product: true,
          warehouse: true,
        },
      },
    });

    const listProducts = order?.export_order_details.map((item) => {
      return {
        productId: item.product?.id,
        warehouseId: item.warehouse?.id,
      };
    });

    // Tạo HashMap với key là `${productId}-${warehouseId}`
    const productWarehouseMap = new Map<string, any>();
    listProducts?.forEach((item) => {
      productWarehouseMap.set(`${item.productId}-${item.warehouseId}`, item);
    });

    // Lấy danh sách productIds
    const productIds = listProducts?.map((item) => item.productId);

    // Kiểm tra tồn kho với productId trong danh sách và warehouseId không null
    const inventories = await repositoryInventory
      .createQueryBuilder('inventory')
      .innerJoinAndSelect('inventory.product', 'product')
      .innerJoinAndSelect('inventory.warehouse', 'warehouse')
      .where('inventory.productId IN (:...productIds)', { productIds })
      .andWhere('inventory.warehouseId IS NOT NULL')
      .andWhere('inventory.quantity < :quantity', { quantity: this.THRESHOLD })
      .select([
        'inventory.id',
        'inventory.quantity',
        'product.id',
        'product.name',
        'warehouse.id',
        'warehouse.name',
      ])
      .getMany();

    // Lọc các bản ghi có cặp (productId, warehouseId) khớp với listProducts
    const matchedInventories = inventories.filter((inventory) =>
      productWarehouseMap.has(
        `${inventory?.product?.id}-${inventory?.warehouse?.id}`,
      ),
    );

    if (matchedInventories.length > 0) {
      const newNotification =
        await this.saveNotificationIntoDB(matchedInventories);
      this.gateway.notifyToAllClients(newNotification);
    }
    return;
  }

  @OnEvent(EventName.ADJUSTMENT_QUANTITY)
  async handleAdjustQuantity(payload: {
    productId: number;
    warehouseId: number;
    newQuantity: number;
  }) {
    const { newQuantity, productId, warehouseId } = payload;
    if (newQuantity < this.THRESHOLD) {
      const repositoryInventory = this.dataSource.getRepository(Inventory);
      const product = await repositoryInventory.findOne({
        where: {
          product: { id: productId },
          warehouse: { id: warehouseId },
        },
        select: {
          product: {
            id: true,
            name: true,
          },
          warehouse: {
            id: true,
            name: true,
          },
        },
        relations: {
          product: true,
          warehouse: true,
        },
      });
      const newNotification = await this.saveNotificationIntoDB([product]);
      this.gateway.notifyToAllClients(newNotification);
    }
    return;
  }

  generateMessage(listProducts: any[]) {
    const lengthProducts = listProducts.length;
    const shortMessage = `${lengthProducts} sản phẩm có số lượng tồn kho thấp`;
    const fullMessage = listProducts.map((pro) => {
      return {
        productName: pro?.product?.name,
        warehouse: pro?.warehouse?.name,
        quantity: +pro?.quantity,
      };
    });
    return { shortMessage, fullMessage };
  }

  async saveNotificationIntoDB(listProducts: any[]) {
    return await this.dataSource.transaction(async (manage) => {
      const { fullMessage, shortMessage } = this.generateMessage(listProducts);

      const users = await manage.find(User, {
        where: { isBlock: false },
        select: {
          id: true,
        },
      });

      // save new notification into notification table
      const newNotification = manage.create(Notification, {
        short_message: shortMessage,
        full_message: fullMessage,
      });
      const savedNotification = await manage.save(
        Notification,
        newNotification,
      );

      // insert new notification and userid into user_notification table
      const userNotification = users.map((user) => ({
        user: { id: user.id },
        notification: savedNotification,
        seenAt: '',
      }));

      await manage.save(UserNotification, userNotification);
      return newNotification;
    });
  }

  async getNotificationsForUser(userId: number) {
    const userNotificationRepo =
      this.dataSource.getRepository(UserNotification);
    const notificationsBelongToUser = await userNotificationRepo.find({
      where: { user: { id: userId } },
      relations: { notification: true },
      order: {
        notification: {
          createdAt: 'DESC',
        },
      },
    });

    return notificationsBelongToUser;
  }

  async getNotificationsUnseenForUser(userId: number) {
    const userNotificationRepo =
      this.dataSource.getRepository(UserNotification);
    const notificationsUnseenBelongToUser = await userNotificationRepo.find({
      where: { user: { id: userId }, seen: false },
      relations: { notification: true },
      order: {
        notification: {
          createdAt: 'DESC',
        },
      },
    });
    return notificationsUnseenBelongToUser;
  }

  async markSeenNotification(userId: number, notificationId: number) {
    const userNotificationRepo =
      this.dataSource.getRepository(UserNotification);
    await userNotificationRepo.update(
      { user: { id: userId }, notification: { id: notificationId } },
      {
        seen: true,
      },
    );
  }

  async getOne(userId: number, notificationId: number) {
    const userNotificationRepo =
      this.dataSource.getRepository(UserNotification);
    const notification = await userNotificationRepo.findOne({
      where: {
        user: { id: userId },
        notification: { id: notificationId },
      },
      relations: { notification: true },
    });
    return notification;
  }
}
