import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(email: string, password: string) {
  const user = await this.usersService.create(email, password);
  const payload = { sub: user.id, email: user.email, role: user.role };
  const { password: _, ...userWithoutPassword } = user;
  
  return { 
    access_token: this.jwtService.sign(payload),
    user: userWithoutPassword,
  };
}

  async login(email: string, password: string) {
  const user = await this.usersService.findByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new UnauthorizedException('Identifiants invalides');
  }

  const payload = { sub: user.id, email: user.email, role: user.role };
  const { password: _, ...userWithoutPassword } = user; 
  
  return { 
    access_token: this.jwtService.sign(payload),
    user: userWithoutPassword, // ✅ ajoute user dans la réponse
  };
}

  async getProfile(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }
    const { password, ...result } = user;
    return result; // ne retourne pas le mot de passe
  }
}