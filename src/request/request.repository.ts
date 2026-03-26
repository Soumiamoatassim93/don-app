import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Request, RequestStatus } from './request.entity';

@Injectable()
export class RequestRepository extends Repository<Request> {
  constructor(private dataSource: DataSource) {
    super(Request, dataSource.createEntityManager());
  }

  async findByUser(userId: number) {
    return this.find({ where: { userId } });
  }

  async acceptRequest(id: number) {
    await this.update(id, { status: RequestStatus.ACCEPTE });
  }

  async refuseRequest(id: number) {
    await this.update(id, { status: RequestStatus.REFUSE });
  }
}