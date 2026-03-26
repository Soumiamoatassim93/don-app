import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Favorite } from './favorite.entity';

@Injectable()
export class FavoriteRepository extends Repository<Favorite> {
  constructor(private dataSource: DataSource) {
    super(Favorite, dataSource.createEntityManager());
  }

  async findUserFavorites(userId: number) {
    return this.find({ where: { userId } });
  }
}