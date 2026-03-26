// request.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestController } from './request.controller';
import { RequestService } from './request.service';
import { Request } from './request.entity'; // ton entité Request

@Module({
  imports: [TypeOrmModule.forFeature([Request])], // permet d'accéder à la table 'requests'
  controllers: [RequestController],
  providers: [RequestService],
  exports: [RequestService], // si besoin d'utiliser ce service dans d'autres modules
})
export class RequestModule {}