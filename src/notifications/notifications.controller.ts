import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
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
    return this.notificationsService.registerToken(
      registerTokenDto.userId,
      registerTokenDto.token,
      registerTokenDto.deviceType,
    );
  }

  @Get('user/:userId')
  async getUserNotifications(@Param('userId') userId: number) {
    return this.notificationsService.getUserNotifications(userId);
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: number) {
    return this.notificationsService.markAsRead(id);
  }

  @Put('user/:userId/read-all')
  async markAllAsRead(@Param('userId') userId: number) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  async deleteNotification(@Param('id') id: number) {
    return this.notificationsService.deleteNotification(id);
  }

  @Post('send')
  async sendNotification(@Body() sendNotificationDto: SendNotificationDto) {
    return this.notificationsService.sendPushNotification(
      sendNotificationDto.userId,
      sendNotificationDto.title,
      sendNotificationDto.body,
      sendNotificationDto.data,
    );
  }
}