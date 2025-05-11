import { Category } from 'src/modules/category/entities/category.entity';
import { Unit } from 'src/modules/unit/entities/unit.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Inventory } from './inventory.entity';
import { Supply } from 'src/modules/supplies/entities/supply.entity';
import { ImportOrderDetail } from 'src/modules/import-order/entities/import-order-detail.entity';
import { ExportOrderDetail } from 'src/modules/export-order/entities/export-order-detail.entity';
import { InventoryAdjustment } from 'src/modules/inventory-adjustment/entities/inventory-adjustment.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 10, unique: true })
  product_code: string;

  @Column({ unique: true })
  name: string;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 0,
    nullable: true,
    transformer: {
      to: (value: number | null) => value, // Store as number
      from: (value: string | null) => (value ? parseInt(value, 10) : null), // Convert to number when retrieving
    },
  })
  purchase_price: number | null;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 0,
    nullable: true,
    transformer: {
      to: (value: number | null) => value, // Store as number
      from: (value: string | null) => (value ? parseInt(value, 10) : null), // Convert to number when retrieving
    },
  })
  sell_price: number | null;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', nullable: true })
  imageUrl: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;

  @ManyToOne(() => Category, (category) => category.products)
  category: Category;

  @ManyToOne(() => Unit, (unit) => unit.products)
  unit: Unit;

  @OneToMany(() => Inventory, (inventory) => inventory.product)
  inventories: Inventory[];

  @ManyToMany(() => Supply, (supplier) => supplier.products)
  suppliers: Supply[];

  @OneToMany(
    () => ImportOrderDetail,
    (importOrderDetail) => importOrderDetail.product,
  )
  import_order_details: ImportOrderDetail[];

  @OneToMany(
    () => ExportOrderDetail,
    (exportOrderDetail) => exportOrderDetail.product,
  )
  export_order_details: ExportOrderDetail[];

  @OneToMany(
    () => InventoryAdjustment,
    (inventoryAdjustment) => inventoryAdjustment.product,
  )
  inventory_adjustments: InventoryAdjustment[];
}
