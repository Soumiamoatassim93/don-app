import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './entities/notification.entity';
import { UserPushToken } from './entities/user-push-token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, UserPushToken]),
    HttpModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService], // Pour utiliser dans d'autres modules
})
export class NotificationsModule {}