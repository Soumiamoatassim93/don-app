import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './favorite.entity';

@Injectable()
export class FavoriteService {

  constructor(
    @InjectRepository(Favorite)
    private favRepo: Repository<Favorite>,
  ) {}

  add(userId: number, donationId: number) {
    const fav = this.favRepo.create({
      userId,
      donationId,
    });
    return this.favRepo.save(fav);
  }

  findUserFavorites(userId: number) {
    return this.favRepo.find({ where: { userId } });
  }

  remove(userId: number, donationId: number) {
    return this.favRepo.delete({ userId, donationId });
  }
}