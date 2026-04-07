import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './favorite.entity';
import { CreateFavoriteDto } from './dto/CreateFavoriteDto.dto';
import { ResponseFavoriteDto } from './dto/ResponseFavoriteDto.dto';

@Injectable()
export class FavoriteService {
  constructor(
    @InjectRepository(Favorite)
    private favRepo: Repository<Favorite>,
  ) {}

  // Convertit l'entité Favorite en ResponseFavoriteDto
  private toResponse(fav: Favorite): ResponseFavoriteDto {
    return {
      id: fav.id,
      userId: fav.userId,
      donationId: fav.donationId,
    };
  }

  // ✅ AJOUTER FAVORI
  async add(data: CreateFavoriteDto): Promise<ResponseFavoriteDto> {
    const fav = this.favRepo.create(data);
    const saved = await this.favRepo.save(fav);
    return this.toResponse(saved);
  }

  // ✅ TROUVER FAVORIS D'UN UTILISATEUR
  async findUserFavorites(userId: number): Promise<ResponseFavoriteDto[]> {
    const favs = await this.favRepo.find({ where: { userId } });
    return favs.map(f => this.toResponse(f));
  }
  
  async delete(id: number): Promise<ResponseFavoriteDto | null> {
    const favorite = await this.favRepo.findOne({ where: { id } });
    if (!favorite) return null; // si le favori n'existe pas
    await this.favRepo.delete(id);
    return this.toResponse(favorite); // retourne l'objet supprimé
  }

  }
