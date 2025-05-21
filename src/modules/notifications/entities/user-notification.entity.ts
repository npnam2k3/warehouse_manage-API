import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Notification } from './notification.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Entity()
export class UserNotification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: false })
  seen: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ nullable: true })
  seenAt: Date;

  @ManyToOne(
    () => Notification,
    (notification) => notification.user_notification,
  )
  notification: Notification;

  @ManyToOne(() => User, (user) => user.user_notification)
  user: User;
}
