// src/tracking/tracking.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TrackingService } from './tracking.service';
import { CreateUserLocationDto } from './dto/UserLocationDto.dto';

@WebSocketGateway({
  namespace: 'tracking-user',
  cors: { origin: '*', methods: ['GET', 'POST'], credentials: true },
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly trackingService: TrackingService) {}

  handleConnection(client: Socket) {
    console.log(`Client connecté: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client déconnecté: ${client.id}`);
  }

  // User envoie sa position
  @SubscribeMessage('updateUserLocation')
  async handleLocationUpdate(@MessageBody() data: CreateUserLocationDto) {
    try {
      const savedLocation = await this.trackingService.saveLocation(data);

      // broadcast à tous les clients connectés
      this.server.emit('userLocationUpdated', savedLocation);

      return { status: 'success', location: savedLocation };
    } catch (error) {
      console.error('Erreur updateUserLocation:', error);
      throw new WsException('Erreur lors de la mise à jour de la position du user');
    }
  }

  // Récupérer l'historique des positions d’un user
  @SubscribeMessage('getUserLocations')
  async handleGetLocations(@MessageBody() data: { userId: number; limit?: number }) {
    try {
      const history = await this.trackingService.getLatestLocations(
        data.userId,
        data.limit ?? 20,
      );
      return history;
    } catch (error) {
      console.error('Erreur getUserLocations:', error);
      throw new WsException('Impossible de récupérer l’historique des positions du user');
    }
  }
}