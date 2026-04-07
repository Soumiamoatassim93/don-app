import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { DonService } from './don.service';
import { CreateDonDto } from './dto/CreateDonDto.dto';
import { UpdateDonDto } from './dto/UpdateDonDto.dto';
import { ResponseDonDto } from './dto/ResponseDonDto.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('dons')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('user')
export class DonController {
  constructor(private readonly donService: DonService) {}

  @Post()
  create(@Body() data: CreateDonDto): Promise<ResponseDonDto> {
    return this.donService.create(data);
  }

  @Get()
  findAll(): Promise<ResponseDonDto[]> {
    return this.donService.findAll();
  }

  @Get('available')
  findAvailable(): Promise<ResponseDonDto[]> {
    return this.donService.findAvailable();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<ResponseDonDto> {
    return this.donService.findOne(id);
  }

  @Put(':id/taken')
  markAsTaken(@Param('id') id: number): Promise<ResponseDonDto> {
    return this.donService.markAsTaken(id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() data: UpdateDonDto): Promise<ResponseDonDto> {
    return this.donService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.donService.delete(id);
  }
}