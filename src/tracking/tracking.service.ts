import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserLocation } from './entities/UserLocation.entity';
import { CreateUserLocationDto } from './dto/UserLocationDto.dto';
import { getDistance } from 'geolib';
@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(UserLocation)
    private readonly userLocationRepo: Repository<UserLocation>,
  ) {}

//  Sauvegarde la position d'un user si il a bougé > 500m
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

    // Si déplacement > 500 mètres → insertion
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
}