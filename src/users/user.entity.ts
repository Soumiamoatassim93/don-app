// src/users/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Don } from '../don/don.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: 'user' })
  role: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  nom: string;

  // ✅ Type string | undefined (car nullable: true)
  @Column({ nullable: true })
  telephone?: string;

  @OneToMany(() => Don, (don) => don.userId)
  dons: Don[];
}