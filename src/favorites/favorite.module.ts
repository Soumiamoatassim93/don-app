// favorite.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoriteController } from './favorite.controller';
import { FavoriteService } from './favorite.service';
import { Favorite } from './favorite.entity'; // assume que tu as une entité Favorite

@Module({
  imports: [TypeOrmModule.forFeature([Favorite])], // lie le module à la table 'favorites'
  controllers: [FavoriteController],
  providers: [FavoriteService],
  exports: [FavoriteService], // si d'autres modules ont besoin de ce service
})
export class FavoriteModule {}