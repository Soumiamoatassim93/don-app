import { Module } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { TrackingGateway } from './tracking.gateway';
import { UserLocation } from './entities/UserLocation.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackingController } from './tracking.controller';

  @Module({
  imports: [
    TypeOrmModule.forFeature([UserLocation])
  ],
  providers: [TrackingService, TrackingGateway],
  controllers: [TrackingController],
})
export class TrackingModule {}
