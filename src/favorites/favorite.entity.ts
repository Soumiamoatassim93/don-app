import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('favorites')
export class Favorite {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  donationId: number;
}