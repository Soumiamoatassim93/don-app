import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request, RequestStatus } from './request.entity';
import { CreateRequestDto } from './dto/CreateRequestDto.dto';
import { ResponseRequestDto } from './dto/ResponseRequestDto.dto';

@Injectable()
export class RequestService {
  constructor(
    @InjectRepository(Request)
    private requestRepo: Repository<Request>,
  ) {}

  // Convertit l'entité Request en ResponseRequestDto
  private toResponse(request: Request): ResponseRequestDto {
    return {
      id: request.id,
      userId: request.userId,
      donationId: request.donationId,
    };
  }

  // ✅ CRÉER UNE DEMANDE
  async create(data: CreateRequestDto): Promise<ResponseRequestDto> {
    const request = this.requestRepo.create({
      ...data,
      status: data.status || RequestStatus.EN_COURS,
      createdAt: new Date(),
    });
    const saved = await this.requestRepo.save(request);
    return this.toResponse(saved);
  }

  // ✅ TROUVER LES DEMANDES D'UN UTILISATEUR
  async findByUser(userId: number): Promise<ResponseRequestDto[]> {
    const requests = await this.requestRepo.find({ where: { userId } });
    return requests.map(r => this.toResponse(r));
  }

  // ✅ ACCEPTER UNE DEMANDE
  async accept(id: number): Promise<ResponseRequestDto> {
    await this.requestRepo.update(id, { status: RequestStatus.ACCEPTE });
    const updated = await this.requestRepo.findOne({ where: { id } });
    return this.toResponse(updated!);
  }

  // ✅ REFUSER UNE DEMANDE
  async refuse(id: number): Promise<ResponseRequestDto> {
    await this.requestRepo.update(id, { status: RequestStatus.REFUSE });
    const updated = await this.requestRepo.findOne({ where: { id } });
    return this.toResponse(updated!);
  }

  // ✅ SUPPRIMER UNE DEMANDE
async delete(id: number): Promise<ResponseRequestDto | null> {
  const request = await this.requestRepo.findOne({ where: { id } });
  if (!request) return null; // si la demande n'existe pas
  await this.requestRepo.delete(id);
  return this.toResponse(request); // retourne l'objet supprimé
}
}