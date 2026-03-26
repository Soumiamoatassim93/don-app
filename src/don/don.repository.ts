import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Don } from './don.entity';

@Injectable()
export class DonRepository extends Repository<Don> {
  constructor(private dataSource: DataSource) {
    super(Don, dataSource.createEntityManager());
  }

  async findAvailable() {
    return this.find({
      where: { status: 'disponible' },
    });
  }
}