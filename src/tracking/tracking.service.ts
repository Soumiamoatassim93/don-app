import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { UserLocation } from './entities/UserLocation.entity';
import { CreateUserLocationDto } from './dto/UserLocationDto.dto';
import { getDistance } from 'geolib';

@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(UserLocation)
    private readonly userLocationRepo: Repository<UserLocation>,
  ) {}

  // Sauvegarde la position d'un user si il a bougé > 10m
  async saveLocation(data: CreateUserLocationDto): Promise<UserLocation | null> {
    // dernière position enregistrée
    const lastLocation = await this.userLocationRepo.findOne({
      where: { userId: data.userId },
      order: { createdAt: 'DESC' },
    });

    // Pas de dernière position → insertion directe
    if (!lastLocation) return this.userLocationRepo.save(data);

    // Distance entre la dernière position et la nouvelle
    const distanceMoved = getDistance(
      { latitude: lastLocation.latitude, longitude: lastLocation.longitude },
      { latitude: data.latitude, longitude: data.longitude },
    );

    // Si déplacement > 10 mètres → insertion
    if (distanceMoved > 10) {
      return this.userLocationRepo.save(data);
    }

    // Sinon rien n'est inséré
    return null;
  }

  async getLatestLocations(userId: number, limit = 20): Promise<UserLocation[]> {
    const locations = await this.userLocationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return locations.reverse(); // pour ordre chronologique
  }

  // Récupérer la dernière position d'un utilisateur
  async getLastLocation(userId: number): Promise<UserLocation | null> {
    return this.userLocationRepo.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  // Récupérer toutes les dernières positions de chaque utilisateur (Version MySQL)
  async getAllLatestLocations(): Promise<UserLocation[]> {
    // Version MySQL utilisant une sous-requête
    const locations = await this.userLocationRepo
      .createQueryBuilder('ul')
      .where(qb => {
        const subQuery = qb
          .subQuery()
          .select('MAX(ul2.createdAt)')
          .from(UserLocation, 'ul2')
          .where('ul2.userId = ul.userId')
          .getQuery();
        return 'ul.createdAt = ' + subQuery;
      })
      .orderBy('ul.createdAt', 'DESC')
      .getMany();

    return locations;
  }

  // Récupérer les utilisateurs dans un rayon géographique
  async getUsersInRadius(
    latitude: number,
    longitude: number,
    radiusKm: number,
    limit: number,
  ): Promise<UserLocation[]> {
    // Conversion approximative km en degrés
    const latDegrees = radiusKm / 111;
    const lngDegrees = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));

    const locations = await this.userLocationRepo
      .createQueryBuilder('ul')
      .where('ul.latitude BETWEEN :minLat AND :maxLat', {
        minLat: latitude - latDegrees,
        maxLat: latitude + latDegrees,
      })
      .andWhere('ul.longitude BETWEEN :minLng AND :maxLng', {
        minLng: longitude - lngDegrees,
        maxLng: longitude + lngDegrees,
      })
      .orderBy('ul.createdAt', 'DESC')
      .limit(limit)
      .getMany();

    return locations;
  }

  // Obtenir les statistiques de tracking
  async getTrackingStats(): Promise<any> {
    const totalLocations = await this.userLocationRepo.count();
    
    const uniqueUsers = await this.userLocationRepo
      .createQueryBuilder('ul')
      .select('COUNT(DISTINCT ul.userId)', 'count')
      .getRawOne();

    const lastHour = new Date();
    lastHour.setHours(lastHour.getHours() - 1);
    
    const recentLocations = await this.userLocationRepo.count({
      where: { createdAt: MoreThanOrEqual(lastHour) },
    });

    // Dernière activité par utilisateur
    const lastActivity = await this.userLocationRepo
      .createQueryBuilder('ul')
      .select('ul.userId', 'userId')
      .addSelect('MAX(ul.createdAt)', 'lastActivity')
      .groupBy('ul.userId')
      .orderBy('lastActivity', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      totalLocations,
      uniqueUsers: parseInt(uniqueUsers.count),
      recentLocations,
      lastHourUpdates: recentLocations,
      lastActivity,
    };
  }

  // Récupérer les utilisateurs actifs récemment (Version MySQL)
  async getRecentlyActiveUsers(minutes: number): Promise<UserLocation[]> {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - minutes);

    // Version MySQL: Récupérer la dernière position de chaque utilisateur actif récemment
    const locations = await this.userLocationRepo
      .createQueryBuilder('ul')
      .where('ul.createdAt >= :cutoffTime', { cutoffTime })
      .andWhere(qb => {
        const subQuery = qb
          .subQuery()
          .select('MAX(ul2.createdAt)')
          .from(UserLocation, 'ul2')
          .where('ul2.userId = ul.userId')
          .getQuery();
        return 'ul.createdAt = ' + subQuery;
      })
      .orderBy('ul.userId', 'ASC')
      .addOrderBy('ul.createdAt', 'DESC')
      .getMany();

    return locations;
  }

  // Calculer la distance parcourue par un utilisateur
  async getDistanceTraveled(
    userId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    let whereCondition: any = { userId };
    
    if (startDate && endDate) {
      whereCondition.createdAt = Between(startDate, endDate);
    } else if (startDate) {
      whereCondition.createdAt = MoreThanOrEqual(startDate);
    } else if (endDate) {
      whereCondition.createdAt = LessThanOrEqual(endDate);
    }

    const locations = await this.userLocationRepo.find({
      where: whereCondition,
      order: { createdAt: 'ASC' },
    });

    let totalDistance = 0;
    
    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i - 1];
      const curr = locations[i];
      totalDistance += this.calculateDistance(
        prev.latitude, prev.longitude,
        curr.latitude, curr.longitude
      );
    }

    return parseFloat(totalDistance.toFixed(2));
  }

  // Récupérer les positions de plusieurs utilisateurs en une fois
  async getBatchLocations(userIds: number[]): Promise<UserLocation[]> {
    const locations = await Promise.all(
      userIds.map(userId => this.getLastLocation(userId))
    );
    
    return locations.filter(loc => loc !== null) as UserLocation[];
  }

  // Supprimer les anciennes positions (plus de X jours)
  async deleteOldLocations(daysOld: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.userLocationRepo
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected || 0;
  }

  // Calculer la distance entre deux points (formule Haversine)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Obtenir le nombre de positions par utilisateur
  async getLocationCountByUser(userId: number): Promise<number> {
    return this.userLocationRepo.count({
      where: { userId },
    });
  }

  // Obtenir la première et dernière position d'un utilisateur
  async getLocationBounds(userId: number): Promise<{
    firstLocation: UserLocation | null;
    lastLocation: UserLocation | null;
  }> {
    const [firstLocation, lastLocation] = await Promise.all([
      this.userLocationRepo.findOne({
        where: { userId },
        order: { createdAt: 'ASC' },
      }),
      this.userLocationRepo.findOne({
        where: { userId },
        order: { createdAt: 'DESC' },
      }),
    ]);

    return { firstLocation, lastLocation };
  }
}