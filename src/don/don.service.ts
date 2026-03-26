import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Don } from './don.entity';

@Injectable()
export class DonService {

  constructor(
    @InjectRepository(Don)
    private donRepo: Repository<Don>,
  ) {}

  create(data: Partial<Don>) {
    const don = this.donRepo.create(data);
    return this.donRepo.save(don);
  }

  findAll() {
    return this.donRepo.find();
  }

  findAvailable() {
    return this.donRepo.find({
      where: { status: 'disponible' },
    });
  }

  findOne(id: number) {
    return this.donRepo.findOne({ where: { id } });
  }

  markAsTaken(id: number) {
    return this.donRepo.update(id, { status: 'pris' });
  }

  delete(id: number) {
    return this.donRepo.delete(id);
  }
}