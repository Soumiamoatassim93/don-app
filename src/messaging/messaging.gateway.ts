// messaging.gateway.ts
import {
  WebSocketGateway, WebSocketServer,
  SubscribeMessage, MessageBody,
  ConnectedSocket, OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MessagingService } from './messaging.service';
import { SendMessageDto } from './dto/send-message.dto';
import { WsJwtGuard } from './ws-jwt.guard';

interface AuthenticatedSocket extends Socket {
  user?: {
    sub: number;
    email: string;
    role?: string;
  };
}

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
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    console.log('=========================================');
    console.log('🔵 NOUVELLE CONNEXION');
    console.log(`   Client ID: ${client.id}`);
    console.log('=========================================');
    
    const token = client.handshake.auth?.token ||
                  client.handshake.headers?.authorization?.replace('Bearer', '').trim();
    
    console.log(`📝 Token présent: ${!!token}`);
    
    if (!token) {
      console.log('❌ PAS DE TOKEN - Déconnexion');
      client.disconnect();
      return;
    }
    
    try {
      const user = await this.jwtService.verifyAsync(token);
      console.log('✅ USER AUTHENTIFIÉ:', {
        id: user.sub,
        email: user.email,
      });
      
      client.user = user;
      const userId = String(user.sub);
      
      // Rejoindre la room personnelle
      client.join(userId);
      console.log(`🏠 USER ${userId} a REJOINT la room: ${userId}`);
      
      // Stocker l'utilisateur
      this.connectedUsers.set(userId, client.id);
      console.log(`📊 Utilisateurs connectés: ${this.connectedUsers.size}`);
      
      // AFFICHER LES ROOMS SANS ERREUR
      try {
        if (this.server && this.server.sockets && this.server.sockets.adapter) {
          const rooms = this.server.sockets.adapter.rooms;
          if (rooms) {
            console.log(`📊 ROOMS ACTIVES:`, Array.from(rooms.keys()));
            const roomExists = rooms.has(userId);
            console.log(`✅ Room ${userId} existe: ${roomExists}`);
          } else {
            console.log(`📊 Pas de rooms disponibles pour le moment`);
          }
        } else {
          console.log(`📊 Server adapter non disponible`);
        }
      } catch (err) {
        const error = err as Error;
        console.log(`⚠️ Impossible de lister les rooms:`, error.message);
      }
      
      console.log('=========================================');
      
    } catch (error) {
      const err = error as Error;
      console.log('❌ ERREUR AUTH:', err.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const user = client.user;
    if (user) {
      const userId = String(user.sub);
      this.connectedUsers.delete(userId);
      console.log(`🔴 DÉCONNECTÉ: ${userId} (${user.email})`);
      console.log(`📊 Utilisateurs restants: ${this.connectedUsers.size}`);
    } else {
      console.log(`🔴 DÉCONNECTÉ: Client ${client.id} (non authentifié)`);
    }
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() dto: SendMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    console.log('=========================================');
    console.log('📨 SEND_MESSAGE reçu');
    
    const user = client.user;
    if (!user) {
      console.log('❌ Utilisateur non authentifié');
      return { status: 'error', message: 'Non authentifié' };
    }
    
    const senderId = String(user.sub);
    const receiverId = dto.receiverId;
    
    console.log(`   De: ${senderId} (${user.email})`);
    console.log(`   À: ${receiverId}`);
    console.log(`   Contenu: ${dto.content}`);
    
    // Vérifier les rooms sans erreur
    try {
      if (this.server && this.server.sockets && this.server.sockets.adapter) {
        const rooms = this.server.sockets.adapter.rooms;
        if (rooms) {
          const receiverRoomExists = rooms.has(receiverId);
          console.log(`🔍 Room du destinataire ${receiverId} existe: ${receiverRoomExists}`);
          
          if (receiverRoomExists) {
            const roomSize = rooms.get(receiverId)?.size || 0;
            console.log(`👥 Clients dans room ${receiverId}: ${roomSize}`);
          }
        }
      }
    } catch (err) {
      const error = err as Error;
      console.log(`⚠️ Impossible de vérifier les rooms:`, error.message);
    }
    
    // Sauvegarder en base de données
    const message = await this.messagingService.saveMessage(senderId, dto);
    console.log(`💾 Message sauvegardé - ID: ${message.id}`);
    
    // Émettre à la room du destinataire
    console.log(`📤 ÉMISSION à la room: ${receiverId}`);
    this.server.to(receiverId).emit('new_message', message);
    console.log(`✅ Message émis avec succès`);
    console.log('=========================================');
    
    return { status: 'sent', message };
  }

  @SubscribeMessage('get_conversation')
  async handleGetConversation(
    @MessageBody() data: { withUserId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const user = client.user;
    if (!user) {
      console.log('❌ GET_CONVERSATION: Non authentifié');
      return [];
    }
    
    const userId = String(user.sub);
    console.log('=========================================');
    console.log('📥 GET_CONVERSATION');
    console.log(`   User: ${userId} (${user.email})`);
    console.log(`   Avec: ${data.withUserId}`);
    
    const messages = await this.messagingService.getMessagesBetween(userId, data.withUserId);
    console.log(`📨 ${messages.length} messages trouvés`);
    console.log('=========================================');
    
    return messages;
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @MessageBody() data: { fromUserId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const user = client.user;
    if (!user) return;
    
    const userId = String(user.sub);
    console.log(`👀 MARK_READ: ${data.fromUserId} -> ${userId}`);
    
    await this.messagingService.markAsRead(data.fromUserId, userId);
    this.server.to(data.fromUserId).emit('messages_read', { by: userId });
  }

  // Méthode utilitaire pour envoyer un message à un utilisateur spécifique
  async sendToUser(userId: string, event: string, data: any) {
    this.server.to(userId).emit(event, data);
  }

  // Méthode pour obtenir le nombre d'utilisateurs connectés
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Méthode pour vérifier si un utilisateur est connecté
  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}