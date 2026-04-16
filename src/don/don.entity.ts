import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Image } from '../image/image.entity';
import { Request } from '../request/request.entity';
import { User } from '../users/user.entity';  // ← AJOUTE CETTE LIGNE

@Entity('dons')
export class Don {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column()
  categoryId: number;

  @OneToMany(() => Image, image => image.don, { cascade: true })
  images: Image[];

  @Column('decimal', { precision: 10, scale: 8 })
  latitude: number;

  @Column('decimal', { precision: 11, scale: 8 })
  longitude: number;

  @Column({ default: 'disponible' })
  status: string;

  @Column()
  userId: number;

  // 🔥 AJOUTE CETTE RELATION
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: 'nouveau' })
  condition: string;

  @Column({ nullable: true })
  address: string;

  @OneToMany(() => Request, (request) => request.don)
  requests: Request[];
}