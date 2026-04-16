// src/tracking/tracking.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TrackingService } from './tracking.service';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  /**
   * Récupérer la dernière position d'un utilisateur
   * GET /tracking/users/:userId/last-location
   */
  @Get('users/:userId/last-location')
  async getLastLocation(@Param('userId', ParseIntPipe) userId: number) {
    const location = await this.trackingService.getLastLocation(userId);
    
    if (!location) {
      return {
        status: 'not_found',
        message: `Aucune position trouvée pour l'utilisateur ${userId}`,
        userId,
        lastLocation: null,
      };
    }

    return {
      status: 'success',
      userId,
      lastLocation: {
        id: location.id,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.createdAt,
        // updatedAt supprimé car n'existe pas dans l'entité
      },
    };
  }

  /**
   * Récupérer l'historique des positions d'un utilisateur
   * GET /tracking/users/:userId/locations?limit=10&offset=0
   */
  @Get('users/:userId/locations')
  async getUserLocations(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    const locations = await this.trackingService.getLatestLocations(
      userId,
      limit,
    );
    
    // Note: offset n'est pas utilisé dans getLatestLocations actuellement
    // Vous pouvez l'implémenter si nécessaire

    return {
      status: 'success',
      userId,
      locations,
      pagination: {
        limit,
        offset,
        count: locations.length,
      },
    };
  }

  /**
   * Récupérer toutes les positions actives (dernière position de chaque utilisateur)
   * GET /tracking/active-users
   */
  @Get('active-users')
  async getAllActiveUsers() {
    const activeUsers = await this.trackingService.getAllLatestLocations();
    
    return {
      status: 'success',
      total: activeUsers.length,
      users: activeUsers,
    };
  }

  /**
   * Récupérer les utilisateurs dans un rayon géographique
   * GET /tracking/nearby?lat=48.8566&lng=2.3522&radius=5&limit=10
   */
  @Get('nearby')
  async getUsersInRadius(
    @Query('lat') latitude: number,
    @Query('lng') longitude: number,
    @Query('radius', new DefaultValuePipe(5), ParseIntPipe) radiusKm: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    if (!latitude || !longitude) {
      return {
        status: 'error',
        message: 'Les paramètres lat et lng sont requis',
      };
    }

    const nearbyUsers = await this.trackingService.getUsersInRadius(
      Number(latitude),
      Number(longitude),
      radiusKm,
      limit,
    );

    return {
      status: 'success',
      center: { latitude: Number(latitude), longitude: Number(longitude) },
      radius: radiusKm,
      count: nearbyUsers.length,
      users: nearbyUsers,
    };
  }

  /**
   * Récupérer les statistiques de tracking
   * GET /tracking/stats
   */
  @Get('stats')
  async getTrackingStats() {
    const stats = await this.trackingService.getTrackingStats();
    
    return {
      status: 'success',
      stats,
    };
  }

  /**
   * Récupérer les utilisateurs qui ont bougé récemment
   * GET /tracking/recently-active?minutes=5
   */
  @Get('recently-active')
  async getRecentlyActiveUsers(
    @Query('minutes', new DefaultValuePipe(10), ParseIntPipe) minutes: number,
  ) {
    const activeUsers = await this.trackingService.getRecentlyActiveUsers(minutes);
    
    return {
      status: 'success',
      timeWindow: `${minutes} minutes`,
      count: activeUsers.length,
      users: activeUsers,
    };
  }

  /**
   * Récupérer la distance parcourue par un utilisateur sur une période
   * GET /tracking/users/:userId/distance?startDate=2024-01-01&endDate=2024-12-31
   */
  @Get('users/:userId/distance')
  async getDistanceTraveled(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const distance = await this.trackingService.getDistanceTraveled(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    return {
      status: 'success',
      userId,
      distance: {
        total: distance,
        unit: 'kilometers',
      },
      period: {
        startDate: startDate || 'all time',
        endDate: endDate || 'now',
      },
    };
  }

  /**
   * Récupérer la dernière position de plusieurs utilisateurs
   * POST /tracking/locations/batch
   */
  @Post('locations/batch')
  @HttpCode(HttpStatus.OK)
  async getBatchLocations(@Body() body: { userIds: number[] }) {
    if (!body.userIds || !Array.isArray(body.userIds)) {
      return {
        status: 'error',
        message: 'userIds doit être un tableau',
      };
    }

    const locations = await this.trackingService.getBatchLocations(body.userIds);
    
    return {
      status: 'success',
      requestedCount: body.userIds.length,
      foundCount: locations.length,
      locations,
    };
  }

  /**
   * Supprimer les anciennes positions
   * DELETE /tracking/cleanup?days=30
   */
  @Delete('cleanup')
  async cleanupOldLocations(
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    const deletedCount = await this.trackingService.deleteOldLocations(days);
    
    return {
      status: 'success',
      message: `${deletedCount} positions supprimées`,
      deletedCount,
      olderThanDays: days,
    };
  }

  /**
   * Obtenir les statistiques d'un utilisateur spécifique
   * GET /tracking/users/:userId/stats
   */
  @Get('users/:userId/stats')
  async getUserTrackingStats(@Param('userId', ParseIntPipe) userId: number) {
    const locationCount = await this.trackingService.getLocationCountByUser(userId);
    const bounds = await this.trackingService.getLocationBounds(userId);
    const lastLocation = await this.trackingService.getLastLocation(userId);
    const totalDistance = await this.trackingService.getDistanceTraveled(userId);

    return {
      status: 'success',
      userId,
      stats: {
        totalLocations: locationCount,
        totalDistance: {
          value: totalDistance,
          unit: 'kilometers',
        },
        firstSeen: bounds.firstLocation?.createdAt || null,
        lastSeen: bounds.lastLocation?.createdAt || null,
        lastLocation: lastLocation ? {
          latitude: lastLocation.latitude,
          longitude: lastLocation.longitude,
          timestamp: lastLocation.createdAt,
        } : null,
      },
    };
  }
}