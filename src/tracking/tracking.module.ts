import { Module } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { TrackingGateway } from './tracking.gateway';
import { UserLocation } from './entities/UserLocation.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

  @Module({
  imports: [
    TypeOrmModule.forFeature([UserLocation]),
   
  ],
  providers: [TrackingService, TrackingGateway]
})
export class TrackingModule {}
