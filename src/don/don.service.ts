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

  private toResponse(don: Don): ResponseDonDto {
    return {
      id: don.id,
      title: don.title,
      description: don.description,
      categoryId: don.categoryId,
      userId: don.userId,
      status: don.status,
      latitude: don.latitude,
      longitude: don.longitude,
      createdAt: don.createdAt,
      images: don.images?.map(img => ({ id: img.id, url: img.url })) || [],
    };
  }

  // ✅ CREATE
  async create(data: CreateDonDto): Promise<ResponseDonDto> {
    const don = this.donRepo.create({
      title: data.title,
      description: data.description,
      categoryId: data.categoryId,
      userId: data.userId,
      latitude: data.latitude,
      longitude: data.longitude,
      images: data.images?.map(url => {
        const img = new Image();
        img.url = url;
        return img;
      }) || [],
    });

    const saved = await this.donRepo.save(don);
    return this.toResponse(saved);
  }

  // ✅ UPDATE
  async update(id: number, data: UpdateDonDto): Promise<ResponseDonDto> {
    const don = await this.donRepo.findOne({ where: { id }, relations: ['images'] });
    if (!don) throw new Error('Don non trouvé');

    // Champs simples
    don.title = data.title ?? don.title;
    don.description = data.description ?? don.description;
    don.categoryId = data.categoryId ?? don.categoryId;
    don.latitude = data.latitude ?? don.latitude;
    don.longitude = data.longitude ?? don.longitude;
    don.status = data.status ?? don.status;

    // Supprimer les images demandées
    if (data.imagesToRemove && data.imagesToRemove.length > 0) {
      don.images = don.images.filter(img => !data.imagesToRemove!.includes(img.id));
    }

    // Ajouter de nouvelles images
    if (data.images && data.images.length > 0) {
      const newImages: Image[] = data.images.map(url => {
        const img = new Image();
        img.url = url;
        img.don = don;
        return img;
      });
      don.images.push(...newImages);
    }

    const saved = await this.donRepo.save(don);
    return this.toResponse(saved);
  }

  // ✅ GET ONE
  async findOne(id: number): Promise<ResponseDonDto> {
    const don = await this.donRepo.findOne({ where: { id }, relations: ['images'] });
    if (!don) throw new Error('Don non trouvé');
    return this.toResponse(don);
  }

  // ✅ GET ALL
  async findAll(): Promise<ResponseDonDto[]> {
    const dons = await this.donRepo.find({ relations: ['images'] });
    return dons.map(d => this.toResponse(d));
  }

  // ✅ GET AVAILABLE
  async findAvailable(): Promise<ResponseDonDto[]> {
    const dons = await this.donRepo.find({ 
      where: { status: 'disponible' }, 
      relations: ['images'] 
    });
    return dons.map(d => this.toResponse(d));
  }

  // ✅ MARK AS TAKEN
  async markAsTaken(id: number): Promise<ResponseDonDto> {
    const don = await this.donRepo.findOne({ where: { id } });
    if (!don) throw new Error('Don non trouvé');

    don.status = 'pris';
    const saved = await this.donRepo.save(don);
    return this.toResponse(saved);
  }

  // ✅ DELETE
  async delete(id: number) {
    return this.donRepo.delete(id);
  }
}