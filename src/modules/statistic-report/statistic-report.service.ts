import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ExportOrder } from '../export-order/entities/export-order.entity';
import { Repository } from 'typeorm';
import { ImportOrder } from '../import-order/entities/import-order.entity';
import { OrderStatus, PaymentStatus, TypeOrder } from '../import-order/enum';

@Injectable()
export class StatisticReportService {
  constructor(
    @InjectRepository(ExportOrder)
    private readonly exportOrderRepository: Repository<ExportOrder>,

    @InjectRepository(ImportOrder)
    private readonly importOrderRepository: Repository<ImportOrder>,
  ) {}

  //api tab 1
  async getBaseInfo(fromDate: string, toDate: string) {
    const resultImportOrder = await this.importOrderRepository
      .createQueryBuilder('io')
      .select(
        'COUNT(CASE WHEN io.order_status = :completed THEN 1 END)',
        'num_import_order',
      )
      .addSelect(
        'SUM(CASE WHEN io.order_status = :completed THEN io.total_amount ELSE 0 END)',
        'total_cost',
      )
      .addSelect(
        'COUNT(CASE WHEN io.order_status = :canceled THEN 1 END)',
        'num_import_order_canceled',
      )
      .where(
        'DATE(io.createdAt) >= :fromDate AND DATE(io.createdAt) <= :toDate',
        {
          fromDate,
          toDate,
        },
      )
      .setParameters({ completed: 'COMPLETED', canceled: 'CANCELED' })
      .getRawOne();

    const resultExportOrder = await this.exportOrderRepository
      .createQueryBuilder('eo')
      .select(
        'COUNT(CASE WHEN eo.order_status = :completed THEN 1 END)',
        'num_export_order',
      )
      .addSelect(
        'SUM(CASE WHEN eo.order_status = :completed THEN eo.total_amount ELSE 0 END)',
        'total_revenue',
      )
      .addSelect(
        'COUNT(CASE WHEN eo.order_status = :canceled THEN 1 END)',
        'num_export_order_canceled',
      )
      .where(
        'DATE(eo.createdAt) >= :fromDate AND DATE(eo.createdAt) <= :toDate',
        {
          fromDate,
          toDate,
        },
      )
      .setParameters({ completed: 'COMPLETED', canceled: 'CANCELED' })
      .getRawOne();

    const {
      num_export_order,
      num_import_order,
      total_cost,
      total_revenue,
      num_export_order_canceled,
      num_import_order_canceled,
    } = { ...resultExportOrder, ...resultImportOrder };
    return {
      num_export_order,
      num_import_order,
      total_cost: total_cost || 0,
      total_revenue: total_revenue || 0,
      num_export_order_canceled,
      num_import_order_canceled,
      profit: total_revenue - total_cost || 0,
    };
  }

  async getInfoForChartAndExcelReport(year: number) {
    const result = await this.importOrderRepository.query(
      `
      WITH months AS (
        SELECT 1 AS month UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
        UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8
        UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12
      ),
      export_summary AS (
        SELECT 
          MONTH(createdAt) AS month,
          COUNT(CASE WHEN order_status = 'COMPLETED' THEN id END) AS num_export_orders,
          COUNT(CASE WHEN order_status = 'CANCELED' THEN id END) AS num_export_orders_canceled,
          SUM(CASE WHEN order_status = 'COMPLETED' THEN total_amount ELSE 0 END) AS total_revenue
        FROM export_order
        WHERE YEAR(createdAt) = ?
        GROUP BY MONTH(createdAt)
      ),
      import_summary AS (
        SELECT 
          MONTH(createdAt) AS month,
          COUNT(CASE WHEN order_status = 'COMPLETED' THEN id END) AS num_import_orders,
          COUNT(CASE WHEN order_status = 'CANCELED' THEN id END) AS num_import_orders_canceled,
          SUM(CASE WHEN order_status = 'COMPLETED' THEN total_amount ELSE 0 END) AS total_cost
        FROM import_order
        WHERE YEAR(createdAt) = ?
        GROUP BY MONTH(createdAt)
      )
      SELECT 
        m.month,
        COALESCE(es.num_export_orders, 0) AS num_export_orders,
        COALESCE(es.num_export_orders_canceled, 0) AS num_export_orders_canceled,
        COALESCE(es.total_revenue, 0) AS total_revenue,
        COALESCE(ipsum.num_import_orders, 0) AS num_import_orders,
        COALESCE(ipsum.num_import_orders_canceled, 0) AS num_import_orders_canceled,
        COALESCE(ipsum.total_cost, 0) AS total_cost,
        COALESCE(es.total_revenue, 0) - COALESCE(ipsum.total_cost, 0) AS profit
      FROM months m
      LEFT JOIN export_summary es ON es.month = m.month
      LEFT JOIN import_summary ipsum ON ipsum.month = m.month
      ORDER BY m.month;
    `,
      [year, year],
    ); // truyền 2 lần cho 2 WHERE
    return result;
  }

  // api tab 2
  async getNumOrdersMonthly(year: number) {
    const result = await this.importOrderRepository.query(
      `
      WITH months AS (
        SELECT 1 AS month UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
        UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8
        UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12
      ),
      export_summary AS (
        SELECT 
          MONTH(createdAt) AS month,
          COUNT(CASE WHEN order_status = 'COMPLETED' THEN id END) AS num_export_orders,
          COUNT(CASE WHEN order_status = 'CANCELED' THEN id END) AS num_export_orders_canceled
        FROM export_order
        WHERE YEAR(createdAt) = ?
        GROUP BY MONTH(createdAt)
      ),
      import_summary AS (
        SELECT 
          MONTH(createdAt) AS month,
          COUNT(CASE WHEN order_status = 'COMPLETED' THEN id END) AS num_import_orders,
          COUNT(CASE WHEN order_status = 'CANCELED' THEN id END) AS num_import_orders_canceled
        FROM import_order
        WHERE YEAR(createdAt) = ?
        GROUP BY MONTH(createdAt)
      )
      SELECT 
        m.month,
        COALESCE(es.num_export_orders, 0) AS num_export_orders,
        COALESCE(es.num_export_orders_canceled, 0) AS num_export_orders_canceled,
        COALESCE(ipsum.num_import_orders, 0) AS num_import_orders,
        COALESCE(ipsum.num_import_orders_canceled, 0) AS num_import_orders_canceled
      FROM months m
      LEFT JOIN export_summary es ON es.month = m.month
      LEFT JOIN import_summary ipsum ON ipsum.month = m.month
      ORDER BY m.month;
    `,
      [year, year],
    ); // truyền 2 lần cho 2 WHERE
    return result;
  }

  async getOrdersUpcomingPayment(numDate: number) {
    const resultImportOrder = await this.importOrderRepository
      .createQueryBuilder('io')
      .leftJoinAndSelect('io.supplier', 'supplier')
      .where(
        `DATE(io.payment_due_date) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL :days DAY)`,
        { days: numDate },
      )
      .andWhere('io.order_status = :status', { status: OrderStatus.COMPLETED })
      .andWhere('io.payment_status IN (:...statuses)', {
        statuses: [PaymentStatus.PARTIALLY_PAID, PaymentStatus.UNPAID],
      })
      .getMany();

    const resultExportOrder = await this.exportOrderRepository
      .createQueryBuilder('eo')
      .leftJoinAndSelect('eo.customer', 'customer')
      .where(
        `DATE(eo.payment_due_date) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL :days DAY)`,
        { days: numDate },
      )
      .andWhere('eo.order_status = :status', { status: OrderStatus.COMPLETED })
      .andWhere('eo.payment_status IN (:...statuses)', {
        statuses: [PaymentStatus.PARTIALLY_PAID, PaymentStatus.UNPAID],
      })
      .getMany();

    const formattedImportOrders = resultImportOrder.map((order) => {
      return {
        ...order,
        type_order: TypeOrder.IMPORT,
        supplier: { name_company: order.supplier.name_company },
      };
    });
    const formattedExportOrders = resultExportOrder.map((order) => {
      return {
        ...order,
        type_order: TypeOrder.EXPORT,
        customer: { fullname: order.customer.fullname },
      };
    });
    const mergeData = [...formattedImportOrders, ...formattedExportOrders];
    return mergeData;
  }

  async getOrderOverdue() {
    const resultImportOrder = await this.importOrderRepository
      .createQueryBuilder('io')
      .leftJoinAndSelect('io.supplier', 'supplier')
      .where('DATE(io.payment_due_date) < DATE(NOW())')
      .andWhere('io.order_status = :status', { status: OrderStatus.COMPLETED })
      .andWhere('io.amount_due > 0')
      .getMany();

    const resultExportOrder = await this.exportOrderRepository
      .createQueryBuilder('eo')
      .leftJoinAndSelect('eo.customer', 'customer')
      .where('DATE(eo.payment_due_date) < DATE(NOW())')
      .andWhere('eo.order_status = :status', { status: OrderStatus.COMPLETED })
      .andWhere('eo.amount_due > 0')
      .getMany();

    const formattedImportOrders = resultImportOrder.map((order) => {
      return {
        ...order,
        type_order: TypeOrder.IMPORT,
        supplier: { name_company: order.supplier.name_company },
      };
    });
    const formattedExportOrders = resultExportOrder.map((order) => {
      return {
        ...order,
        type_order: TypeOrder.EXPORT,
        customer: { fullname: order.customer.fullname },
      };
    });
    const mergeData = [...formattedImportOrders, ...formattedExportOrders];
    return mergeData;
  }

  async getOrdersInMonth(month: number, year: number) {
    const importOrders = await this.importOrderRepository
      .createQueryBuilder('io')
      .leftJoinAndSelect('io.supplier', 'supplier')
      .where('MONTH(io.createdAt) = :month AND YEAR(io.createdAt) = :year', {
        month,
        year,
      })
      .andWhere('io.order_status = :completed', {
        completed: OrderStatus.COMPLETED,
      })
      .getMany();

    const exportOrders = await this.exportOrderRepository
      .createQueryBuilder('eo')
      .leftJoinAndSelect('eo.customer', 'customer')
      .where('MONTH(eo.createdAt) = :month AND YEAR(eo.createdAt) = :year', {
        month,
        year,
      })
      .andWhere('eo.order_status = :completed', {
        completed: OrderStatus.COMPLETED,
      })
      .getMany();

    const formattedImportOrders = importOrders.map((order) => {
      return {
        ...order,
        type_order: TypeOrder.IMPORT,
        supplier: { name_company: order.supplier.name_company },
      };
    });
    const formattedExportOrders = exportOrders.map((order) => {
      return {
        ...order,
        type_order: TypeOrder.EXPORT,
        customer: { fullname: order.customer.fullname },
      };
    });
    const mergeData = [...formattedImportOrders, ...formattedExportOrders];
    return mergeData;
  }

  // api tab 3
  async getProductsSales(fromDate: string, toDate: string) {
    const result = await this.importOrderRepository.query(
      `
        SELECT 
          p.product_code, 
          p.name,
          COALESCE(SUM(CASE 
            WHEN eo.order_status = 'COMPLETED' 
                AND DATE(eo.createdAt) >= ? 
                AND DATE(eo.createdAt) <= ? 
            THEN eod.quantity ELSE 0 
          END), 0) AS quantity_sold,

          COALESCE(SUM(CASE 
            WHEN eo.order_status = 'COMPLETED' 
                AND DATE(eo.createdAt) >= ?
                AND DATE(eo.createdAt) <= ? 
            THEN eod.quantity * eod.sell_price ELSE 0 
          END), 0) AS revenue_of_product

        FROM product p
        LEFT JOIN export_order_detail eod ON p.id = eod.productId
        LEFT JOIN export_order eo ON eo.id = eod.exportOrderId

        GROUP BY p.id, p.product_code, p.name
        ORDER BY quantity_sold DESC;
      `,
      [fromDate, toDate, fromDate, toDate],
    );
    return result;
  }

  async getProductsSalesForExcel(month: number, year: number) {
    const result = await this.importOrderRepository.query(
      `SELECT 
        p.product_code,
        p.name,
        COALESCE(eo_stats.quantity_sold, 0) AS quantity_sold,
        COALESCE(eo_stats.revenue, 0) AS revenue,
        COALESCE(io_stats.quantity_imported, 0) AS quantity_imported,
        COALESCE(io_stats.cost, 0) AS cost
      FROM product p

      LEFT JOIN (
        SELECT 
          eod.productId,
          SUM(eod.quantity) AS quantity_sold,
          SUM(eod.quantity * eod.sell_price) AS revenue
        FROM export_order_detail eod
        JOIN export_order eo ON eo.id = eod.exportOrderId
        WHERE eo.order_status = 'COMPLETED'
          AND MONTH(eo.createdAt) = ?
          AND YEAR(eo.createdAt) = ?
        GROUP BY eod.productId
      ) AS eo_stats ON eo_stats.productId = p.id

      LEFT JOIN (
        SELECT 
          iod.productId,
          SUM(iod.quantity) AS quantity_imported,
          SUM(iod.quantity * iod.purchase_price) AS cost
        FROM import_order_detail iod
        JOIN import_order io ON io.id = iod.importOrderId
        WHERE io.order_status = 'COMPLETED'
          AND MONTH(io.createdAt) = ?
          AND YEAR(io.createdAt) = ?
        GROUP BY iod.productId
      ) AS io_stats ON io_stats.productId = p.id

      ORDER BY revenue DESC;`,
      [month, year, month, year],
    );
    return result;
  }
}
