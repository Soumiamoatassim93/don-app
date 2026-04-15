// messaging.gateway.ts - Version complète qui fonctionne
import {
  WebSocketGateway, WebSocketServer,
  SubscribeMessage, MessageBody,
  ConnectedSocket, OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';  // ← Ajoute
import { MessagingService } from './messaging.service';
import { SendMessageDto } from './dto/send-message.dto';
import { WsJwtGuard } from './ws-jwt.guard';

@UseGuards(WsJwtGuard)
@WebSocketGateway({
  namespace: '/messaging',
  cors: { origin: '*' },
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  server: Server;
  private connectedUsers = new Map<string, string>();
  constructor(
    private messagingService: MessagingService,
    private jwtService: JwtService,  // ← Injecte JwtService
  ) {}

  async handleConnection(client: Socket) {
  console.log('🔵 Nouvelle connexion...');
  
  // Récupère le token
  const token =
    client.handshake.auth?.token ||
    client.handshake.headers?.authorization?.replace('Bearer', '').trim();
  
  if (!token) {
    console.log('❌ Pas de token, déconnexion');
    client.disconnect();
    return;
  }
  
  try {
    // Vérifie le token
    const user = await this.jwtService.verifyAsync(token);
    console.log('✅ Utilisateur vérifié:', user);
    
    // Stocke l'utilisateur
    (client as any).user = user;
    
    // Ajoute l'utilisateur à sa room personnelle
    const userId = String(user.sub);
    client.join(userId);
    this.connectedUsers.set(userId, client.id);
    
    console.log(`✅ ${user.email} (ID: ${userId}) a rejoint la room ${userId}`);
    try {
      console.log(`📊 Rooms actives:`, Array.from(this.server.sockets.adapter.rooms?.keys() || []));
    } catch (err) {
      // Ignore l'erreur, les rooms fonctionnent quand même
    }
    
  } catch (error) {
    console.log('❌ Erreur auth:', error.message);
    client.disconnect();
  }
}
  handleDisconnect(client: Socket) {
    const user = (client as any).user;
    if (user) {
      const userId = String(user.sub);
      this.connectedUsers.delete(userId);
      console.log(`[Messaging] Déconnecté : ${userId}`);
    }
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() dto: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const user = (client as any).user;
    if (!user) {
      return { status: 'error', message: 'Non authentifié' };
    }
    
    const senderId = String(user.sub);
    console.log(`📨 Message de ${senderId} à ${dto.receiverId}: ${dto.content}`);
    console.log(`📤 Émission à la room: ${dto.receiverId}`);
    
    const message = await this.messagingService.saveMessage(senderId, dto);
    
    // Émet à la room du destinataire
    this.server.to(dto.receiverId).emit('new_message', message);
    
    return { status: 'sent', message };
  }

  @SubscribeMessage('get_conversation')
  async handleGetConversation(
    @MessageBody() data: { withUserId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = (client as any).user;
    if (!user) return [];
    
    const userId = String(user.sub);
    return this.messagingService.getConversation(userId, data.withUserId);
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @MessageBody() data: { fromUserId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = (client as any).user;
    if (!user) return;
    
    const userId = String(user.sub);
    await this.messagingService.markAsRead(data.fromUserId, userId);
    this.server.to(data.fromUserId).emit('messages_read', { by: userId });
  }
}