// src/users/users.service.ts
import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(
    email: string,
    password: string,
    nom: string,
    telephone?: string, // optionnel, peut être undefined
  ): Promise<User> {
    if (!nom || nom.trim() === '') {
      throw new BadRequestException('Le nom est obligatoire');
    }

    const exists = await this.findByEmail(email);
    if (exists) throw new ConflictException('Email déjà utilisé');

    const hashed = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      email,
      password: hashed,
      nom,
      telephone, // on passe undefined si non fourni, pas null
    });
    return this.usersRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.usersRepository.findOne({ where: { email } });
    return user === null ? undefined : user;
  }

  async findById(id: number): Promise<User | undefined> {
    const user = await this.usersRepository.findOne({ where: { id } });
    return user === null ? undefined : user;
  }

  async updateUser(id: number, data: { nom?: string; telephone?: string }) {
    const user = await this.findById(id);
    if (!user) throw new Error('Utilisateur non trouvé');
    if (data.nom) user.nom = data.nom;
    if (data.telephone !== undefined) user.telephone = data.telephone;
    return this.usersRepository.save(user);
  }
}