import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Don } from './don.entity';
import { Image } from '../image/image.entity';
import { DonService } from './don.service';
import { DonController } from './don.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Don, Image]),
  ],
  providers: [DonService],
  controllers: [DonController],
})
export class DonModule {}