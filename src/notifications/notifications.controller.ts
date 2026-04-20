import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Req, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto, RegisterTokenDto } from './dto/send-notification.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('user')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register-token')
  async registerToken(@Body() registerTokenDto: RegisterTokenDto) {
    // Validation
    if (!registerTokenDto.userId) {
      throw new BadRequestException('userId est requis');
    }
    if (!registerTokenDto.token) {
      throw new BadRequestException('token est requis');
    }
    if (!registerTokenDto.deviceType) {
      throw new BadRequestException('deviceType est requis');
    }

    return this.notificationsService.registerToken(
      registerTokenDto.userId,
      registerTokenDto.token,
      registerTokenDto.deviceType,
    );
  }

  @Get('user/:userId')
  async getUserNotifications(@Param('userId', ParseIntPipe) userId: number) {
    if (!userId) {
      throw new BadRequestException('userId est requis');
    }
    return this.notificationsService.getUserNotifications(userId);
  }

  @Get('user/:userId/unread-count')
  async getUnreadCount(@Param('userId', ParseIntPipe) userId: number) {
    if (!userId) {
      throw new BadRequestException('userId est requis');
    }
    return this.notificationsService.getUnreadCount(userId);
  }

  @Put(':id/read')
  async markAsRead(@Param('id', ParseIntPipe) id: number) {
    if (!id) {
      throw new BadRequestException('id est requis');
    }
    return this.notificationsService.markAsRead(id);
  }

  @Put('user/:userId/read-all')
  async markAllAsRead(@Param('userId', ParseIntPipe) userId: number) {
    if (!userId) {
      throw new BadRequestException('userId est requis');
    }
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  async deleteNotification(@Param('id', ParseIntPipe) id: number) {
    if (!id) {
      throw new BadRequestException('id est requis');
    }
    return this.notificationsService.deleteNotification(id);
  }

  @Post('send')
  @Roles('admin') // Seul l'admin peut envoyer des notifications manuellement
  async sendNotification(@Body() sendNotificationDto: SendNotificationDto) {
    // Validation
    if (!sendNotificationDto.userId) {
      throw new BadRequestException('userId est requis');
    }
    if (!sendNotificationDto.title) {
      throw new BadRequestException('title est requis');
    }
    if (!sendNotificationDto.body) {
      throw new BadRequestException('body est requis');
    }

    return this.notificationsService.sendPushNotification(
      sendNotificationDto.userId,
      sendNotificationDto.title,
      sendNotificationDto.body,
      sendNotificationDto.data || {},
    );
  }
}