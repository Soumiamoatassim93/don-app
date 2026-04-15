import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {

  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> { 
    const client: Socket = context.switchToWs().getClient();

    const token =
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization?.replace('Bearer', '').trim();

    if (!token) {
      throw new UnauthorizedException('Token manquant');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);  // ← Utilise verifyAsync
      (client as any).user = payload;
      console.log('✅ Guard - Utilisateur vérifié:', payload);
      return true;
    } catch (error) {
      console.log('❌ Guard - Erreur:', error.message);
      throw new UnauthorizedException('Token invalide');
    }
  }
}