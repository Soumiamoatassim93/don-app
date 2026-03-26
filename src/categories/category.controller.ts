import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { CategoryService } from './category.service';
import { Category } from './category.entity';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard'; // ton guard existant
import { Roles } from '../auth/roles.decorator'; // ton décorateur @Roles
@Controller('categories')
@UseGuards(AuthGuard('jwt'), RolesGuard) // Applique le guard à toutes les routes
@Roles('user') // Seul le rôle "user" peut accéder
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  create(@Body() data: Partial<Category>) {
    return this.categoryService.create(data.name!);
  }

  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(+id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.categoryService.delete(+id);
  }
}