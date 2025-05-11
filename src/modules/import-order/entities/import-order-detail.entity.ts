import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ImportOrder } from './import-order.entity';
import { Product } from 'src/modules/products/entities/product.entity';
import { Warehouse } from 'src/modules/warehouse/entities/warehouse.entity';

@Entity()
export class ImportOrderDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 0 })
  quantity: number;

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

  @ManyToOne(
    () => ImportOrder,
    (importOrder) => importOrder.import_order_details,
  )
  @JoinColumn({ name: 'importOrderId' })
  import_order: ImportOrder;

  @ManyToOne(() => Product, (product) => product.import_order_details)
  product: Product | null;

  @ManyToOne(() => Warehouse)
  warehouse: Warehouse | null;
}
