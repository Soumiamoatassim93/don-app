// request.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestController } from './request.controller';
import { RequestService } from './request.service';
import { Request } from './request.entity';
import { Don } from '../don/don.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Request, Don]),
    NotificationsModule, // ✅ Ajouter pour utiliser NotificationsService
  ],
  controllers: [RequestController],
  providers: [RequestService],
  exports: [RequestService],
})
export class RequestModule {}