import { Warehouse } from 'src/modules/warehouse/entities/warehouse.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class WarehouseLocation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  location_code: string;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.warehouse_locations)
  warehouse: Warehouse;
}
