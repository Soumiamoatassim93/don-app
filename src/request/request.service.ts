// request.service.ts
import { Injectable, ConflictException, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Request, RequestStatus } from './request.entity';
import { CreateRequestDto } from './dto/CreateRequestDto.dto';
import { ResponseRequestDto } from './dto/ResponseRequestDto.dto';
import { Don } from '../don/don.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RequestService {
  private readonly logger = new Logger(RequestService.name);

  constructor(
    @InjectRepository(Request)
    private requestRepo: Repository<Request>,
    @InjectRepository(Don)
    private donRepo: Repository<Don>,
    private notificationsService: NotificationsService,
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

  async findSent(userId: number): Promise<ResponseRequestDto[]> {
    const requests = await this.requestRepo.find({ 
      where: { userId: Number(userId) },
      relations: ['don']
    });
    return requests.map(r => this.toResponse(r));
  }

  async findReceived(userId: number): Promise<ResponseRequestDto[]> {
    const userDons = await this.donRepo.find({ 
      where: { userId: Number(userId) }
    });
    
    if (userDons.length === 0) {
      return [];
    }
    
    const donationIds = userDons.map(don => don.id);
    
    const requests = await this.requestRepo.find({ 
      where: { donationId: In(donationIds) },
      relations: ['don']
    });
    
    return requests.map(r => this.toResponse(r));
  }

  async create(data: CreateRequestDto): Promise<ResponseRequestDto> {
    const donation = await this.donRepo.findOne({
      where: { id: data.donationId },
      relations: ['user']
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
    
    // ✅ NOTIFICATION au propriétaire du don
    try {
      await this.notificationsService.sendNewRequestNotification(
        donation.userId,
        donation.title,
        `Utilisateur ${data.userId}`
      );
      this.logger.log(`✅ Notification nouvelle demande envoyée au propriétaire ${donation.userId}`);
    } catch (error) {
      // ✅ Correction: error est de type unknown
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      this.logger.error(`❌ Erreur envoi notification: ${errorMessage}`);
    }
    
    return this.toResponse(saved);
  }

  async accept(id: number): Promise<ResponseRequestDto> {
    const request = await this.requestRepo.findOne({ 
      where: { id },
      relations: ['don']
    });
    
    if (!request) {
      throw new NotFoundException('Demande non trouvée');
    }
    
    await this.requestRepo.update(id, { status: RequestStatus.ACCEPTE });
    
    // Mettre à jour le statut du don
    await this.donRepo.update(request.donationId, { status: 'reserve' });
    
    // ✅ NOTIFICATION au demandeur (request.userId)
    try {
      const donTitle = request.don?.title || 'le don';
      await this.notificationsService.sendDecisionNotification(
        request.userId,
        donTitle,
        true
      );
      this.logger.log(`✅ Notification acceptation envoyée au demandeur ${request.userId}`);
    } catch (error) {
      // ✅ Correction: error est de type unknown
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      this.logger.error(`❌ Erreur envoi notification acceptation: ${errorMessage}`);
    }
    
    const updated = await this.requestRepo.findOne({ where: { id } });
    return this.toResponse(updated!);
  }

  async refuse(id: number): Promise<ResponseRequestDto> {
    const request = await this.requestRepo.findOne({ 
      where: { id },
      relations: ['don']
    });
    
    if (!request) {
      throw new NotFoundException('Demande non trouvée');
    }
    
    await this.requestRepo.update(id, { status: RequestStatus.REFUSE });
    
    // ✅ NOTIFICATION au demandeur (request.userId)
    try {
      const donTitle = request.don?.title || 'le don';
      await this.notificationsService.sendDecisionNotification(
        request.userId,
        donTitle,
        false
      );
      this.logger.log(`✅ Notification refus envoyée au demandeur ${request.userId}`);
    } catch (error) {
      // ✅ Correction: error est de type unknown
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      this.logger.error(`❌ Erreur envoi notification refus: ${errorMessage}`);
    }
    
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