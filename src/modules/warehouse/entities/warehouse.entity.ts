import { InventoryAdjustment } from 'src/modules/inventory-adjustment/entities/inventory-adjustment.entity';
import { Inventory } from 'src/modules/products/entities/inventory.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Warehouse {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;

  @OneToMany(() => Inventory, (inventory) => inventory.warehouse)
  inventories: Inventory[];

  @OneToMany(
    () => InventoryAdjustment,
    (inventoryAdjustment) => inventoryAdjustment.warehouse,
  )
  inventory_adjustments: InventoryAdjustment[];
}
