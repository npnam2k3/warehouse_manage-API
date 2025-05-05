import { Product } from 'src/modules/products/entities/product.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Warehouse } from 'src/modules/warehouse/entities/warehouse.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class InventoryAdjustment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  oldQuantity: number;

  @Column()
  newQuantity: number;

  @Column()
  discrepancy: number;

  @Column({ type: 'text' })
  reason_change: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Product, (product) => product.inventory_adjustments)
  product: Product;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.inventory_adjustments)
  warehouse: Warehouse;

  @ManyToOne(() => User, (user) => user.inventory_adjustments)
  user: User;
}
