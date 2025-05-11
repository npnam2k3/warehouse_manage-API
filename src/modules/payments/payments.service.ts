import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { ERROR_MESSAGE } from 'src/constants/exception.message';
import { DataSource, In } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { User } from '../users/entities/user.entity';
import { ENTITIES_MESSAGE } from 'src/constants/entity.message';
import { OrderPaymentDto } from './dto/order-payment.dto';
import { TypeOrderPayment } from './enum';
import { ImportOrder } from '../import-order/entities/import-order.entity';
import { PaymentDetail } from './entities/payment-detail.entity';
import { PaymentStatus } from '../import-order/enum';
import { isDateValidString } from 'src/utils/handleDatetime';
import { ExportOrder } from '../export-order/entities/export-order.entity';

@Injectable()
export class PaymentsService {
  constructor(private dataSource: DataSource) {}
  async create(createPaymentDto: CreatePaymentDto, idUserLogin: number) {
    const { type, list_orders, payment_method } = createPaymentDto;

    return await this.dataSource.transaction(async (manager) => {
      const userFound = await manager.findOne(User, {
        where: { id: idUserLogin },
      });
      if (!userFound)
        throw new NotFoundException(
          ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.USER),
        );

      const total_amount = this.calcTotalAmount(list_orders);

      // tao thanh toan moi va luu vao DB
      const newPayment = manager.create(Payment, {
        user: userFound,
        payment_date: new Date(),
        total_amount,
        payment_method,
      });

      const savedPayment = await manager.save(Payment, newPayment);

      // loc ra danh sach hoa don can thanh toan
      const listIdOrder = list_orders.map((order) => order.order_id);

      // lay ra cac hoa don can thanh toan
      let orderMap: Map<number, ImportOrder | ExportOrder> = new Map();
      let listImportOrders: ImportOrder[] = [];
      let listExportOrders: ExportOrder[] = [];
      if (type === TypeOrderPayment.IMPORT) {
        // truong hop thanh toan cho hoa don nhap
        listImportOrders = await manager.find(ImportOrder, {
          where: { id: In(listIdOrder) },
        });
        orderMap = new Map(listImportOrders.map((p) => [p.id, p]));
      } else {
        // truong hop thanh toan cho don xuat
        listExportOrders = await manager.find(ExportOrder, {
          where: { id: In(listIdOrder) },
        });
        orderMap = new Map(listExportOrders.map((p) => [p.id, p]));
      }

      // luu thong tin cua cac hoa don can thanh toan vao bang PaymentDetail
      // console.log('check map order:: ', orderMap);
      const paymentDetailToSave: PaymentDetail[] = [];
      const orderToUpdate: {
        id: number;
        payment_status: PaymentStatus;
        amount_paid: number;
        amount_due: number;
        payment_due_date?: string;
      }[] = [];

      if (type === TypeOrderPayment.IMPORT) {
        for (const order of list_orders) {
          // lấy ra hóa đơn hiện tại
          const orderCurrent = orderMap.get(order.order_id);
          if (!orderCurrent)
            throw new NotFoundException(
              ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.IMPORT_ORDER),
            );

          // tạo bản ghi mới trong bảng PaymentDetail tương ứng với số hóa đơn cần thanh toán
          const paymentDetail = manager.create(PaymentDetail, {
            import_order: orderCurrent,
            amount: order.amount,
            payment: savedPayment,
          });

          // cập nhật lại hóa đơn cần thanh toán
          if (order.payment_status === PaymentStatus.PARTIALLY_PAID) {
            // nếu thanh toán 1 phần => cần gia hạn thêm thời gian thanh toán phần còn lại
            const payment_due_date = order.payment_due_date;
            if (!payment_due_date) {
              throw new BadRequestException(
                ERROR_MESSAGE.REQUIRED_PAYMENT_DUE_DATE,
              );
            }
            if (!isDateValidString(payment_due_date)) {
              throw new BadRequestException(
                ERROR_MESSAGE.INVALID_PAYMENT_DUE_DATE,
              );
            }

            const orderUpdate = {
              id: order.order_id,
              payment_status: order.payment_status,
              amount_paid: order.amount + orderCurrent.amount_paid,
              amount_due: orderCurrent.amount_due - order.amount,
              payment_due_date,
            };
            orderToUpdate.push(orderUpdate);
          } else if (order.payment_status === PaymentStatus.PAID) {
            if (order.amount !== orderCurrent?.amount_due) {
              throw new BadRequestException(
                ERROR_MESSAGE.INVALID_PAYMENT_AMOUNT,
              );
            }
            // nếu thanh toán full => chỉ cần cập nhật lại: payment_status, amount_paid, amount_due
            const orderUpdate = {
              id: order.order_id,
              payment_status: order.payment_status,
              amount_paid: order.amount + orderCurrent.amount_paid,
              amount_due: 0,
            };
            orderToUpdate.push(orderUpdate);
          }
          paymentDetailToSave.push(paymentDetail);
        }
      } else {
        // truong hop thanh toan cho don xuat
        for (const order of list_orders) {
          // lấy ra hóa đơn hiện tại
          const orderCurrent = orderMap.get(order.order_id);
          if (!orderCurrent)
            throw new NotFoundException(
              ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.EXPORT_ORDER),
            );

          // tạo bản ghi mới trong bảng PaymentDetail tương ứng với số hóa đơn cần thanh toán
          const paymentDetail = manager.create(PaymentDetail, {
            export_order: orderCurrent,
            amount: order.amount,
            payment: savedPayment,
          });

          // cập nhật lại hóa đơn cần thanh toán
          if (order.payment_status === PaymentStatus.PARTIALLY_PAID) {
            // nếu thanh toán 1 phần => cần gia hạn thêm thời gian thanh toán phần còn lại
            const payment_due_date = order.payment_due_date;
            if (!payment_due_date) {
              throw new BadRequestException(
                ERROR_MESSAGE.REQUIRED_PAYMENT_DUE_DATE,
              );
            }
            if (!isDateValidString(payment_due_date)) {
              throw new BadRequestException(
                ERROR_MESSAGE.INVALID_PAYMENT_DUE_DATE,
              );
            }

            const orderUpdate = {
              id: order.order_id,
              payment_status: order.payment_status,
              amount_paid: order.amount + orderCurrent.amount_paid,
              amount_due: orderCurrent.amount_due - order.amount,
              payment_due_date,
            };
            orderToUpdate.push(orderUpdate);
          } else if (order.payment_status === PaymentStatus.PAID) {
            if (order.amount !== orderCurrent?.amount_due) {
              throw new BadRequestException(
                ERROR_MESSAGE.INVALID_PAYMENT_AMOUNT,
              );
            }
            // nếu thanh toán full => chỉ cần cập nhật lại: payment_status, amount_paid, amount_due
            const orderUpdate = {
              id: order.order_id,
              payment_status: order.payment_status,
              amount_paid: order.amount + orderCurrent.amount_paid,
              amount_due: 0,
            };
            orderToUpdate.push(orderUpdate);
          }
          paymentDetailToSave.push(paymentDetail);
        }
      }
      // console.log('check payment detail to save:: ', paymentDetailToSave);
      // console.log('check order to update:: ', orderToUpdate);

      // thêm dữ liệu vào bảng PaymentDetail
      await manager.insert(PaymentDetail, paymentDetailToSave);

      // cập nhật các hóa đơn
      if (type === TypeOrderPayment.IMPORT) {
        await Promise.all(
          orderToUpdate.map((order) =>
            manager.update(ImportOrder, order.id, {
              payment_status: order.payment_status,
              amount_paid: order.amount_paid,
              amount_due: order.amount_due,
              payment_due_date: order.payment_due_date || null,
            }),
          ),
        );
      } else {
        await Promise.all(
          orderToUpdate.map((order) =>
            manager.update(ExportOrder, order.id, {
              payment_status: order.payment_status,
              amount_paid: order.amount_paid,
              amount_due: order.amount_due,
              payment_due_date: order.payment_due_date || null,
            }),
          ),
        );
      }
    });
  }

  findAll() {
    return `This action returns all payments`;
  }

  findOne(id: number) {
    return `This action returns a #${id} payment`;
  }

  update(id: number, updatePaymentDto: UpdatePaymentDto) {
    return `This action updates a #${id} payment`;
  }

  remove(id: number) {
    return `This action removes a #${id} payment`;
  }

  calcTotalAmount(listOrder: OrderPaymentDto[]): number {
    return listOrder.reduce(
      (total_amount, curr) => total_amount + curr.amount,
      0,
    );
  }
}
