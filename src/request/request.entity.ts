import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum RequestStatus {
  EN_COURS = 'en_cours',
  ACCEPTE = 'accepte',
  REFUSE = 'refuse',
}

@Entity('requests')
export class Request {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  donationId: number;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.EN_COURS,
  })
  status: RequestStatus;

  @CreateDateColumn()
  createdAt: Date;
}