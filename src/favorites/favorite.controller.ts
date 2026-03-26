import { Controller, Post, Body, Get, Param, Delete, UseGuards } from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
@Controller('favorites')
@UseGuards(AuthGuard('jwt'), RolesGuard) // protège toutes les routes
@Roles('user') // seul le rôle "user" peut accéder
export class FavoriteController {

  constructor(private readonly favService: FavoriteService) {}

  @Post()
  add(@Body() body: { userId: number; donationId: number }) {
    return this.favService.add(body.userId, body.donationId);
  }

  @Get('user/:userId')
  findUserFavorites(@Param('userId') userId: number) {
    return this.favService.findUserFavorites(userId);
  }

  @Delete()
  remove(@Body() body: { userId: number; donationId: number }) {
    return this.favService.remove(body.userId, body.donationId);
  }
}