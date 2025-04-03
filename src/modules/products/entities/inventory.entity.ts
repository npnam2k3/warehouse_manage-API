import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';
import { Warehouse } from 'src/modules/warehouse/entities/warehouse.entity';

@Entity()
export class Inventory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 0 })
  quantity: number;

  @ManyToOne(() => Product, (product) => product.inventories)
  product: Product;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.inventories, {
    nullable: true,
  })
  warehouse: Warehouse | null;
}
