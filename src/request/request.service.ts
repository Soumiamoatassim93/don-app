import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request, RequestStatus } from './request.entity';

@Injectable()
export class RequestService {

  constructor(
    @InjectRepository(Request)
    private requestRepo: Repository<Request>,
  ) {}

  create(userId: number, donationId: number) {
    const request = this.requestRepo.create({
      userId,
      donationId,
      status: RequestStatus.EN_COURS,
      createdAt: new Date()
    });
    return this.requestRepo.save(request);
  }

  findByUser(userId: number) {
    return this.requestRepo.find({ where: { userId } });
  }

  accept(id: number) {
    return this.requestRepo.update(id, {
      status: RequestStatus.ACCEPTE,
    });
  }

  refuse(id: number) {
    return this.requestRepo.update(id, {
      status: RequestStatus.REFUSE,
    });
  }
}