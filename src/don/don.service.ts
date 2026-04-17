// src/don/don.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Don } from './don.entity';
import { CreateDonDto } from './dto/CreateDonDto.dto';
import { UpdateDonDto } from './dto/UpdateDonDto.dto';
import { ResponseDonDto } from './dto/ResponseDonDto.dto';
import { Image } from '../image/image.entity';

@Injectable()
export class DonService {
  constructor(
    @InjectRepository(Don)
    private donRepo: Repository<Don>,
  ) {}

  // ✅ Mapping réponse avec inclusion du user (donateur)
  private toResponse(don: Don): ResponseDonDto {
    return {
      id: don.id,
      title: don.title,
      description: don.description,
      categoryId: don.categoryId,
      userId: don.userId,
      status: don.status,
      condition: don.condition,
      address: don.address ?? undefined,
      latitude: don.latitude,
      longitude: don.longitude,
      createdAt: don.createdAt,
      images: don.images?.map(img => ({
        id: img.id,
        url: `/uploads/${img.filename}`,
      })) || [],
      // ✅ Ajout des infos du donateur si la relation user est chargée
      user: don.user ? {
        id: don.user.id,
        nom: don.user.nom,
        email: don.user.email,
        telephone: don.user.telephone,
      } : undefined,
    };
  }

  async create(data: CreateDonDto, files: Express.Multer.File[]): Promise<ResponseDonDto> {
    const don = this.donRepo.create({
      title: data.title,
      description: data.description,
      categoryId: Number(data.categoryId),
      userId: Number(data.userId),
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      condition: data.condition ?? 'nouveau',
      address: data.address ?? undefined,
    });

    if (files && files.length > 0) {
      don.images = files.map(file => {
        const img = new Image();
        img.filename = file.filename;
        img.don = don;
        return img;
      });
    }

    return this.toResponse(await this.donRepo.save(don));
  }

  // ✅ FIND BY USER (avec user chargé)
  async findByUser(userId: number): Promise<ResponseDonDto[]> {
    const dons = await this.donRepo.find({
      where: { userId },
      relations: ['images', 'user'], // Ajout de 'user'
      order: { createdAt: 'DESC' },
    });
    return dons.map(d => this.toResponse(d));
  }

  // ✅ UPDATE (avec chargement de user pour la réponse)
  async update(id: number, data: UpdateDonDto, files: Express.Multer.File[]): Promise<ResponseDonDto> {
    const don = await this.donRepo.findOne({ where: { id }, relations: ['images', 'user'] }); // Ajout de 'user'
    if (!don) throw new Error('Don non trouvé');

    don.title = data.title ?? don.title;
    don.description = data.description ?? don.description;
    don.categoryId = data.categoryId ? Number(data.categoryId) : don.categoryId;
    don.latitude = data.latitude ? Number(data.latitude) : don.latitude;
    don.longitude = data.longitude ? Number(data.longitude) : don.longitude;
    don.status = data.status ?? don.status;
    don.condition = data.condition ?? don.condition;
    don.address = data.address ?? don.address;

    if (data.imagesToRemove?.length) {
      don.images = don.images.filter(img => !(data.imagesToRemove ?? []).includes(img.id));
    }

    if (files && files.length > 0) {
      const newImages = files.map(file => {
        const img = new Image();
        img.filename = file.filename;
        img.don = don;
        return img;
      });
      don.images.push(...newImages);
    }

    return this.toResponse(await this.donRepo.save(don));
  }

  // ✅ FIND ONE (déjà correct avec 'user')
  async findOne(id: number): Promise<ResponseDonDto> {
    const don = await this.donRepo.findOne({ where: { id }, relations: ['images', 'user'] });
    if (!don) throw new Error('Don non trouvé');
    return this.toResponse(don);
  }

  // ✅ FIND ALL (avec user chargé)
  async findAll(): Promise<ResponseDonDto[]> {
    const dons = await this.donRepo.find({ relations: ['images', 'user'] }); // Ajout de 'user'
    return dons.map(d => this.toResponse(d));
  }

  // ✅ DISPONIBLES (avec user chargé)
  async findAvailable(): Promise<ResponseDonDto[]> {
    const dons = await this.donRepo.find({
      where: { status: 'disponible' },
      relations: ['images', 'user'], // Ajout de 'user'
    });
    return dons.map(d => this.toResponse(d));
  }

  // ✅ MARK AS TAKEN (avec user chargé pour la réponse)
  async markAsTaken(id: number): Promise<ResponseDonDto> {
    const don = await this.donRepo.findOne({ where: { id }, relations: ['images', 'user'] }); // Ajout de 'user'
    if (!don) throw new Error('Don non trouvé');
    don.status = 'pris';
    return this.toResponse(await this.donRepo.save(don));
  }

  // ✅ DELETE
  async delete(id: number) {
    return this.donRepo.delete(id);
  }
}