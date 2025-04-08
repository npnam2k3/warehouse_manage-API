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
import { PaymentStatus } from '../enum';
import { Supply } from 'src/modules/supplies/entities/supply.entity';
import { ImportOrderDetail } from './import-order-detail.entity';
import { PaymentDetail } from 'src/modules/payments/entities/payment-detail.entity';

@Entity()
export class ImportOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  import_order_code: string;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;

  @ManyToOne(() => Supply, (supplier) => supplier.importOrders)
  supplier: Supply;

  @OneToMany(
    () => ImportOrderDetail,
    (importOrderDetail) => importOrderDetail.import_order,
  )
  import_order_details: ImportOrderDetail[];

  @OneToMany(() => PaymentDetail, (paymentDetail) => paymentDetail.import_order)
  paymentDetails: PaymentDetail[];
}
