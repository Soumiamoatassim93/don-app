import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { UserPushToken } from './entities/user-push-token.entity';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class NotificationsService {
  private expo: Expo;
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    @InjectRepository(UserPushToken)
    private pushTokenRepo: Repository<UserPushToken>,
    private httpService: HttpService,
  ) {
    this.expo = new Expo();
  }

  // Enregistrer un token push
  async registerToken(userId: number, token: string, deviceType: string) {
    let existingToken = await this.pushTokenRepo.findOne({
      where: { userId, token },
    });

    if (existingToken) {
      existingToken.isActive = true;
      existingToken.deviceType = deviceType;
      return this.pushTokenRepo.save(existingToken);
    }

    const pushToken = this.pushTokenRepo.create({
      userId,
      token,
      deviceType,
      isActive: true,
    });

    return this.pushTokenRepo.save(pushToken);
  }

  // Désactiver un token
  async deactivateToken(token: string) {
    const pushToken = await this.pushTokenRepo.findOne({ where: { token } });
    if (pushToken) {
      pushToken.isActive = false;
      await this.pushTokenRepo.save(pushToken);
      this.logger.log(`Token désactivé: ${token}`);
    }
  }

  // Envoyer une notification push à un utilisateur
  async sendPushNotification(userId: number, title: string, body: string, data: any = {}) {
    try {
      // 1. Sauvegarder la notification en BDD
      const notification = this.notificationRepo.create({
        userId,
        title,
        body,
        data,
        isRead: false,
      });
      await this.notificationRepo.save(notification);

      // 2. Récupérer les tokens push de l'utilisateur
      const pushTokens = await this.pushTokenRepo.find({
        where: { userId, isActive: true },
      });

      if (pushTokens.length === 0) {
        this.logger.log(`Aucun token push pour l'utilisateur ${userId}`);
        return notification;
      }

      // 3. Préparer les messages pour Expo
      const messages: ExpoPushMessage[] = [];
      
      for (const pushToken of pushTokens) {
        if (!Expo.isExpoPushToken(pushToken.token)) {
          this.logger.error(`Token invalide: ${pushToken.token}`);
          continue;
        }

        messages.push({
          to: pushToken.token,
          sound: 'default',
          title: title,
          body: body,
          data: { ...data, notificationId: notification.id },
        });
      }

      if (messages.length === 0) {
        return notification;
      }

      // 4. Envoyer les notifications via Expo
      const chunks = this.expo.chunkPushNotifications(messages);
      
      // ✅ CORRECTION : Parcourir chaque chunk
      for (const chunk of chunks) {
        try {
          const tickets: ExpoPushTicket[] = await this.expo.sendPushNotificationsAsync(chunk);
          
          // ✅ CORRECTION : Utiliser l'index de la boucle
          for (let i = 0; i < tickets.length; i++) {
            const ticket = tickets[i];
            const originalMessage = chunk[i];
            
            if (ticket.status === 'error') {
              this.logger.error(`Erreur ticket: ${ticket.message} - Token: ${originalMessage.to}`);
              
              // Si le token n'est plus enregistré chez Expo, le désactiver
              if (ticket.details?.error === 'DeviceNotRegistered') {
                await this.deactivateToken(originalMessage.to as string);
              }
            } else if (ticket.status === 'ok') {
              this.logger.log(`✅ Notification envoyée avec succès, ID: ${ticket.id}`);
            }
          }
        } catch (error) {
          const err = error as Error;
          this.logger.error(`Erreur envoi chunk: ${err.message}`);
        }
      }

      return notification;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Erreur sendPushNotification: ${err.message}`);
      throw error;
    }
  }

  // Récupérer les notifications d'un utilisateur
  async getUserNotifications(userId: number) {
    return this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  // Marquer une notification comme lue
  async markAsRead(notificationId: number) {
    await this.notificationRepo.update(notificationId, { isRead: true });
    return { success: true };
  }

  // Marquer toutes les notifications comme lues
  async markAllAsRead(userId: number) {
    await this.notificationRepo.update({ userId, isRead: false }, { isRead: true });
    return { success: true };
  }

  // Supprimer une notification
  async deleteNotification(notificationId: number) {
    await this.notificationRepo.delete(notificationId);
    return { success: true };
  }

  // Envoyer une notification de décision (accepté/refusé)
  async sendDecisionNotification(senderId: number, donationTitle: string, isAccepted: boolean) {
    const title = isAccepted ? '✅ Demande acceptée' : '❌ Demande refusée';
    const body = isAccepted
      ? `Votre demande pour "${donationTitle}" a été acceptée`
      : `Votre demande pour "${donationTitle}" a été refusée`;
    
    return this.sendPushNotification(senderId, title, body, {
      screen: 'Requests',
      type: 'decision',
      isAccepted,
      donationTitle,
    });
  }

  // Envoyer une notification de nouvelle demande
  async sendNewRequestNotification(ownerId: number, donationTitle: string, requesterName: string) {
    return this.sendPushNotification(ownerId, '📨 Nouvelle demande', 
      `${requesterName} a demandé votre don "${donationTitle}"`,
      { 
        screen: 'Requests', 
        type: 'new_request',
        donationTitle,
        requesterName,
      }
    );
  }

  // Envoyer une notification de proximité
  async sendProximityNotification(ownerId: number, donationTitle: string, distance: number) {
    const distanceText = distance < 1000 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(1)}km`;
    
    return this.sendPushNotification(ownerId, '📍 Demandeur proche', 
      `Le demandeur est à ${distanceText} de votre don "${donationTitle}"`,
      { 
        screen: 'Tracking', 
        type: 'proximity',
        distance,
        donationTitle,
      }
    );
  }

  // Envoyer une notification de tracking commencé
  async sendTrackingStartedNotification(ownerId: number, donationTitle: string) {
    return this.sendPushNotification(ownerId, '🚀 Suivi commencé', 
      `Le demandeur a commencé à partager sa position pour le don "${donationTitle}"`,
      { 
        screen: 'Tracking', 
        type: 'tracking_started',
        donationTitle,
      }
    );
  }
}