import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, UseInterceptors, UploadedFiles, Req } from '@nestjs/common';
import { DonService } from './don.service';
import { UpdateDonDto } from './dto/UpdateDonDto.dto';
import { ResponseDonDto } from './dto/ResponseDonDto.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Request } from 'express';

const uploadDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

const storage = diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + extname(file.originalname));
  },
});

@Controller('dons')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('user')
export class DonController {
  constructor(private readonly donService: DonService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images', 10, { storage }))
  create(
    @Req() req: Request,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const dto = req.body;
    console.log('BODY via req:', dto);
    console.log('FILES:', files);
    return this.donService.create(dto, files ?? []);
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
  @UseInterceptors(FilesInterceptor('images', 10, { storage }))
  update(
    @Req() req: Request,
    @Param('id') id: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const dto = req.body;
    return this.donService.update(id, dto, files ?? []);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.donService.delete(id);
  }
}