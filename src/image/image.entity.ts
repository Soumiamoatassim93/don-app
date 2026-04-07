import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Don } from '../don/don.entity';

@Entity('images')
export class Image {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @ManyToOne(() => Don, don => don.images, { onDelete: 'CASCADE' })
  don: Don;
}