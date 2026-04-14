import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, JoinColumn ,ManyToOne} from 'typeorm';
import { Don } from '../don/don.entity';

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

  @ManyToOne(() => Don, (don) => don.requests, { eager: true })
@JoinColumn({ name: 'donationId' })
don: Don;
}