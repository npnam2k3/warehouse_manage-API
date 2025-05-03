import { Customer } from 'src/modules/customers/entities/customer.entity';
import { OrderStatus, PaymentStatus } from 'src/modules/import-order/enum';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ExportOrderDetail } from './export-order-detail.entity';
import { PaymentDetail } from 'src/modules/payments/entities/payment-detail.entity';

@Entity()
export class ExportOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  export_order_code: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 0,
    transformer: {
      to: (value: number | null) => value, // Store as number
      from: (value: string | null) => (value ? parseInt(value, 10) : null), // Convert to number when retrieving
    },
    default: 0,
  })
  total_amount: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.UNPAID })
  payment_status: PaymentStatus;

  @Column({ type: 'date', nullable: true })
  payment_due_date: Date | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 0,
    transformer: {
      to: (value: number | null) => value, // Store as number
      from: (value: string | null) => (value ? parseInt(value, 10) : null), // Convert to number when retrieving
    },
    default: 0,
  })
  amount_paid: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 0,
    transformer: {
      to: (value: number | null) => value, // Store as number
      from: (value: string | null) => (value ? parseInt(value, 10) : null), // Convert to number when retrieving
    },
    default: 0,
  })
  amount_due: number;

  @Column({ type: 'varchar', nullable: true })
  note: string | null;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PROCESSING })
  order_status: OrderStatus;

  @Column({ type: 'text', nullable: true })
  cancel_reason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;

  @ManyToOne(() => Customer, (customer) => customer.exportOrders)
  customer: Customer;

  @OneToMany(
    () => ExportOrderDetail,
    (exportOrderDetail) => exportOrderDetail.export_order,
  )
  export_order_details: ExportOrderDetail[];

  @OneToMany(() => PaymentDetail, (paymentDetail) => paymentDetail.export_order)
  paymentDetails: PaymentDetail[];
}
