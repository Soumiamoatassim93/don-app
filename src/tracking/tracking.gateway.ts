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
    console.log(`✅ Client connecté: ${client.id}`);
    // Correction: Utiliser server.sockets.sockets.size ou compter les clients
    const clientCount = this.server?.sockets?.sockets?.size || 0;
    console.log(`   - Nombre total de clients: ${clientCount}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ Client déconnecté: ${client.id}`);
    const clientCount = this.server?.sockets?.sockets?.size || 0;
    console.log(`   - Clients restants: ${clientCount}`);
  }

  // User envoie sa position
  @SubscribeMessage('updateUserLocation')
  async handleLocationUpdate(@MessageBody() data: CreateUserLocationDto) {
    console.log('=========================================');
    console.log(`📍 POSITION REÇUE - User ${data.userId}`);
    console.log(`   Latitude: ${data.latitude}, Longitude: ${data.longitude}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    console.log('=========================================');
    
    try {
      const savedLocation = await this.trackingService.saveLocation(data);
      
      if (savedLocation) {
        console.log(`✅ Position sauvegardée en BDD - ID: ${savedLocation.id}`);
        const clientCount = this.server?.sockets?.sockets?.size || 0;
        console.log(`📡 Broadcast à tous les clients (${clientCount} clients)`);
        
        // broadcast à tous les clients connectés
        this.server.emit('userLocationUpdated', savedLocation);
        
        console.log(`📡 Broadcast envoyé avec succès`);
        return { status: 'success', location: savedLocation };
      } else {
        console.log(`⚠️ Position ignorée (déplacement trop petit ou identique)`);
        return { status: 'ignored', message: 'Movement too small' };
      }
    } catch (error) {
      console.error(`❌ Erreur updateUserLocation:`, error);
      throw new WsException('Erreur lors de la mise à jour de la position du user');
    }
  }

  // Récupérer l'historique des positions d’un user
  @SubscribeMessage('getUserLocations')
  async handleGetLocations(@MessageBody() data: { userId: number; limit?: number }) {
    console.log('=========================================');
    console.log(`📡 DEMANDE HISTORIQUE - User ${data.userId}`);
    console.log(`   Limit: ${data.limit ?? 20}`);
    console.log('=========================================');
    
    try {
      const history = await this.trackingService.getLatestLocations(
        data.userId,
        data.limit ?? 20,
      );
      
      console.log(`📜 Envoi de ${history.length} positions pour user ${data.userId}`);
      
      if (history.length > 0) {
        const lastPos = history[history.length - 1];
        console.log(`   Dernière position: (${lastPos.latitude}, ${lastPos.longitude})`);
        console.log(`   Date dernière position: ${lastPos.createdAt}`);
      } else {
        console.log(`   ⚠️ Aucune position trouvée pour user ${data.userId}`);
      }
      
      return history;
    } catch (error) {
      console.error(`❌ Erreur getUserLocations:`, error);
      throw new WsException('Impossible de récupérer l’historique des positions du user');
    }
  }

  // src/tracking/tracking.gateway.ts
// ... dans la classe TrackingGateway

// ✅ AJOUTE CETTE MÉTHODE POUR RÉCUPÉRER LA DERNIÈRE POSITION D'UN USER
@SubscribeMessage('getUserLastLocation')
async handleGetLastLocation(@MessageBody() data: { userId: number }) {
  console.log(`📍 DEMANDE DERNIÈRE POSITION - User ${data.userId}`);
  
  try {
    const lastLocation = await this.trackingService.getLastLocation(data.userId);
    
    if (lastLocation) {
      console.log(`✅ Dernière position trouvée: (${lastLocation.latitude}, ${lastLocation.longitude})`);
      return { status: 'success', location: lastLocation };
    } else {
      console.log(`⚠️ Aucune position trouvée pour user ${data.userId}`);
      return { status: 'not_found', location: null };
    }
  } catch (error) {
    console.error(`❌ Erreur getUserLastLocation:`, error);
    throw new WsException('Impossible de récupérer la dernière position');
  }
}
}