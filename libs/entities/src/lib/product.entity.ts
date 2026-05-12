import { Column, Entity } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity({ name: 'products' })
export class Product extends BaseEntity {
  @Column('varchar', { length: 255 })
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('varchar', { length: 100, unique: true })
  sku: string;

  @Column('varchar', { length: 50 })
  unit: string;

  @Column('float', { default: 0 })
  price: number;

  @Column('float', { default: 0 })
  vatRate: number;
}
