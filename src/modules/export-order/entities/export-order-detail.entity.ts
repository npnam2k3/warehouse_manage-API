import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from 'src/modules/products/entities/product.entity';
import { Warehouse } from 'src/modules/warehouse/entities/warehouse.entity';
import { ExportOrder } from './export-order.entity';

@Entity()
export class ExportOrderDetail {
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
  sell_price: number | null;

  @ManyToOne(
    () => ExportOrder,
    (exportOrder) => exportOrder.export_order_details,
  )
  @JoinColumn({ name: 'exportOrderId' })
  export_order: ExportOrder;

  @ManyToOne(() => Product, (product) => product.export_order_details)
  product: Product | null;

  @ManyToOne(() => Warehouse)
  warehouse: Warehouse | null;
}
