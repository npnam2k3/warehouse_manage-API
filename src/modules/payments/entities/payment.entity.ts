import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PaymentMethod } from '../enum';
import { User } from 'src/modules/users/entities/user.entity';
import { PaymentDetail } from './payment-detail.entity';

@Entity()
export class Payment {
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
  total_amount: number;

  @Column({ type: 'date' })
  payment_date: Date;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.CASH })
  payment_method: PaymentMethod;

  @ManyToOne(() => User, (user) => user.payments)
  user: User;

  @OneToMany(() => PaymentDetail, (paymentDetail) => paymentDetail.payment)
  paymentDetails: PaymentDetail[];

  @CreateDateColumn()
  createdAt: Date;
}
