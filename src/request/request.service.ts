import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Request, RequestStatus } from './request.entity';
import { CreateRequestDto } from './dto/CreateRequestDto.dto';
import { ResponseRequestDto } from './dto/ResponseRequestDto.dto';
import { Don } from '../don/don.entity';

@Injectable()
export class RequestService {
  constructor(
    @InjectRepository(Request)
    private requestRepo: Repository<Request>,
    @InjectRepository(Don)
    private donRepo: Repository<Don>,
  ) {}

  private toResponse(request: Request): ResponseRequestDto {
    return {
      id: request.id,
      userId: request.userId,
      donationId: request.donationId,
      status: request.status,
      createdAt: request.createdAt,
    };
  }

  // Demandes envoyées PAR l'utilisateur
  async findSent(userId: number): Promise<ResponseRequestDto[]> {
    const requests = await this.requestRepo.find({ 
      where: { userId: Number(userId) }
    });
    return requests.map(r => this.toResponse(r));
  }

  // Demandes reçues POUR les dons de l'utilisateur
  async findReceived(userId: number): Promise<ResponseRequestDto[]> {
    // 1. Récupérer tous les IDs des dons de cet utilisateur
    const userDons = await this.donRepo.find({ 
      where: { userId: Number(userId) }
    });
    
    if (userDons.length === 0) {
      return [];
    }
    
    const donationIds = userDons.map(don => don.id);
    
    // 2. Récupérer toutes les demandes pour ces dons
    const requests = await this.requestRepo.find({ 
      where: { 
        donationId: In(donationIds)
      }
    });
    
    return requests.map(r => this.toResponse(r));
  }

  async create(data: CreateRequestDto): Promise<ResponseRequestDto> {
    const donation = await this.donRepo.findOne({
      where: { id: data.donationId }
    });
    
    if (!donation) {
      throw new BadRequestException('Ce don n\'existe pas');
    }

    if (donation.userId === data.userId) {
      throw new BadRequestException('Vous ne pouvez pas demander votre propre don');
    }

    if (donation.status !== 'disponible') {
      throw new BadRequestException('Ce don n\'est plus disponible');
    }

    const existingRequest = await this.requestRepo.findOne({
      where: {
        userId: data.userId,
        donationId: data.donationId,
      },
    });

    if (existingRequest) {
      throw new ConflictException('Vous avez déjà fait une demande pour ce don');
    }

    const request = this.requestRepo.create({
      userId: data.userId,
      donationId: data.donationId,
      status: RequestStatus.EN_COURS,
      createdAt: new Date(),
    });
    
    const saved = await this.requestRepo.save(request);
    return this.toResponse(saved);
  }

  async accept(id: number): Promise<ResponseRequestDto> {
    const request = await this.requestRepo.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException('Demande non trouvée');
    }
    
    await this.requestRepo.update(id, { status: RequestStatus.ACCEPTE });
    
    // Optionnel: Mettre à jour le statut du don
    await this.donRepo.update(request.donationId, { status: 'reserve' });
    
    const updated = await this.requestRepo.findOne({ where: { id } });
    return this.toResponse(updated!);
  }

  async refuse(id: number): Promise<ResponseRequestDto> {
    const request = await this.requestRepo.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException('Demande non trouvée');
    }
    
    await this.requestRepo.update(id, { status: RequestStatus.REFUSE });
    const updated = await this.requestRepo.findOne({ where: { id } });
    return this.toResponse(updated!);
  }

  async delete(id: number): Promise<ResponseRequestDto | null> {
    const request = await this.requestRepo.findOne({ where: { id } });
    if (!request) return null;
    await this.requestRepo.delete(id);
    return this.toResponse(request);
  }
}