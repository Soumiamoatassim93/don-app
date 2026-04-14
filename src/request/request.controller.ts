// request.controller.ts
import { Controller, Post, Body, Param, Put, Get, UseGuards, Delete } from '@nestjs/common';
import { RequestService } from './request.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateRequestDto } from './dto/CreateRequestDto.dto';

@Controller('requests')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('user')
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  @Post()
  create(@Body() createReqDto: CreateRequestDto) {
    return this.requestService.create(createReqDto);
  }

  // Demandes envoyées par l'utilisateur
  @Get('sent/:userId')
  findSent(@Param('userId') userId: number) {
    return this.requestService.findSent(userId);
  }

  // Demandes reçues pour les dons de l'utilisateur
  @Get('received/:userId')
  findReceived(@Param('userId') userId: number) {
    return this.requestService.findReceived(userId);
  }

  // Gardez cet endpoint pour compatibilité (optionnel)
  @Get('user/:userId')
  findByUser(@Param('userId') userId: number) {
    return this.requestService.findSent(userId);
  }

  @Put(':id/accept')
  accept(@Param('id') id: number) {
    return this.requestService.accept(id);
  }

  @Put(':id/refuse')
  refuse(@Param('id') id: number) {
    return this.requestService.refuse(id);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.requestService.delete(id);
  }
}