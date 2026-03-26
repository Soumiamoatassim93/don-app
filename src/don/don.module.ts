// don.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonController } from './don.controller';
import { DonService } from './don.service';
import { Don } from './don.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Don])], // lie le module à la table 'dons'
  controllers: [DonController],
  providers: [DonService],
  exports: [DonService], // optionnel, si tu veux utiliser DonService dans d'autres modules
})
export class DonModule {}