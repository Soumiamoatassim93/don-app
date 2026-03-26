import { Controller, Post, Body, Param, Put, Get, UseGuards } from '@nestjs/common';
import { RequestService } from './request.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
@Controller('requests')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('user') // uniquement les utilisateurs avec le rôle "user"
export class RequestController {

  constructor(private readonly requestService: RequestService) {}

  @Post()
  create(@Body() body: { userId: number; donationId: number }) {
    return this.requestService.create(body.userId, body.donationId);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: number) {
    return this.requestService.findByUser(userId);
  }

  @Put(':id/accept')
  accept(@Param('id') id: number) {
    return this.requestService.accept(id);
  }

  @Put(':id/refuse')
  refuse(@Param('id') id: number) {
    return this.requestService.refuse(id);
  }
}