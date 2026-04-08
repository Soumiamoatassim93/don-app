import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('user_locations')
export class UserLocation {

  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column('float')
  latitude!: number;

  @Column('float')
  longitude!: number;

  @CreateDateColumn()
  createdAt!: Date;
}