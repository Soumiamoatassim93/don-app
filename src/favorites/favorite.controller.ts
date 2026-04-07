import { Controller, Post, Body, Get, Param, Delete, UseGuards } from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateFavoriteDto } from './dto/CreateFavoriteDto.dto';

@Controller('favorites')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('user')
export class FavoriteController {
  constructor(private readonly favService: FavoriteService) {}

  @Post()
  add(@Body() createFavDto: CreateFavoriteDto) {
    return this.favService.add(createFavDto);
  }

  @Get('user/:userId')
  findUserFavorites(@Param('userId') userId: number) {
    return this.favService.findUserFavorites(userId);
  }

  @Delete('/:id')
  remove(@Param('id') id: number) {
    return this.favService.delete(id);
  }
}