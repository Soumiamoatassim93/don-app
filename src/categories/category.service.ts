import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { CategoryDto } from './dto/CategoryDto.dto';
import { ResponseCategoryDto } from './dto/ResponseCategoryDto.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
  ) {}

  // Convertit l'entité Category en ResponseCategoryDto
  private toResponse(category: Category): ResponseCategoryDto {
    return {
      id: category.id,
      name: category.name,
    };
  }

  // ✅ CRÉER UNE CATÉGORIE
  async create(data: CategoryDto): Promise<ResponseCategoryDto> {
    const category = this.categoryRepo.create(data);
    const saved = await this.categoryRepo.save(category);
    return this.toResponse(saved);
  }

  // ✅ TROUVER TOUTES LES CATÉGORIES
  async findAll(): Promise<ResponseCategoryDto[]> {
    const categories = await this.categoryRepo.find();
    return categories.map(c => this.toResponse(c));
  }

  // ✅ TROUVER UNE CATÉGORIE
  async findOne(id: number): Promise<ResponseCategoryDto | null> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) return null;
    return this.toResponse(category);
  }

  // ✅ SUPPRIMER UNE CATÉGORIE
  async delete(id: number): Promise<ResponseCategoryDto | null> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) return null;
    await this.categoryRepo.delete(id);
    return this.toResponse(category);
  }
}