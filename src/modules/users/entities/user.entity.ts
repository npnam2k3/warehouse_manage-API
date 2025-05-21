import { InventoryAdjustment } from 'src/modules/inventory-adjustment/entities/inventory-adjustment.entity';
import { UserNotification } from 'src/modules/notifications/entities/user-notification.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { Role } from 'src/modules/roles/entities/role.entity';
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

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  hashedPassword: string;

  @Column()
  fullname: string;

  @Column()
  email: string;

  @Column({ default: false })
  isBlock: boolean;

  @Column({ type: 'varchar', nullable: true })
  refreshToken: string | null;

  @Column({ type: 'varchar', nullable: true })
  tokenResetPassword: string | null;

  @Column({ type: 'datetime', nullable: true })
  tokenResetPasswordExpiration: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;

  @ManyToOne(() => Role, (role) => role.users)
  role: Role;

  @OneToMany(() => Payment, (payment) => payment.user)
  payments: Payment[];

  @OneToMany(
    () => InventoryAdjustment,
    (inventoryAdjustment) => inventoryAdjustment.user,
  )
  inventory_adjustments: InventoryAdjustment[];

  @OneToMany(
    () => UserNotification,
    (userNotification) => userNotification.user,
  )
  user_notification: UserNotification[];
}
