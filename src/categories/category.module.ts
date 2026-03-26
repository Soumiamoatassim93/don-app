// category.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { Category } from './category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Category])], // ← lien avec la table 'categories'
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService], // si tu veux l'utiliser ailleurs
})
export class CategoryModule {}