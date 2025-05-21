import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserNotification } from './user-notification.entity';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  short_message: string;

  @Column({ type: 'simple-json' })
  full_message: {
    productName: string;
    warehouse: string;
    quantity: number;
  }[];

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(
    () => UserNotification,
    (userNotification) => userNotification.notification,
  )
  user_notification: UserNotification[];
}
