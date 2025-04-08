import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Payment } from './payment.entity';
import { ImportOrder } from 'src/modules/import-order/entities/import-order.entity';

@Entity()
export class PaymentDetail {
  @PrimaryGeneratedColumn()
  id: number;

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
  amount: number;

  @ManyToOne(() => Payment, (payment) => payment.paymentDetails)
  payment: Payment;

  @ManyToOne(() => ImportOrder, (importOrder) => importOrder.paymentDetails)
  import_order: ImportOrder;

  @CreateDateColumn()
  createdAt: Date;
}
