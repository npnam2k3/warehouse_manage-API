import { ImportOrder } from 'src/modules/import-order/entities/import-order.entity';
import { Product } from 'src/modules/products/entities/product.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Supply {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name_company: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column()
  address: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;

  @ManyToMany(() => Product, (product) => product.suppliers)
  @JoinTable({ name: 'suppliers_products' })
  products: Product[];

  @OneToMany(() => ImportOrder, (importOrder) => importOrder.supplier)
  importOrders: ImportOrder[];
}
