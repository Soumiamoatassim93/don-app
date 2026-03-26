import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Request } from '@nestjs/common';
import { DonService } from './don.service';
import { Don } from './don.entity';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
@Controller('dons')
@UseGuards(AuthGuard('jwt'), RolesGuard) // applique JWT + guard des rôles
@Roles('user') // Seul le rôle "user" peut accéder
export class DonController {

  constructor(private readonly donService: DonService) {}

  @Post()
  create(@Body() data: Partial<Don>) {
    return this.donService.create(data);
  }

  @Get()
  findAll() {
    return this.donService.findAll();
  }

  @Get('available')
  findAvailable() {
    return this.donService.findAvailable();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.donService.findOne(id);
  }

  @Put(':id/taken')
  markAsTaken(@Param('id') id: number) {
    return this.donService.markAsTaken(id);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.donService.delete(id);
  }
}