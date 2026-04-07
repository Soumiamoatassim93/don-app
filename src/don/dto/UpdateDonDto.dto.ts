import { PartialType } from '@nestjs/mapped-types';
import { CreateDonDto } from './CreateDonDto.dto';
import { IsArray, IsOptional } from 'class-validator';

export class UpdateDonDto extends PartialType(CreateDonDto) {
  @IsOptional()
  @IsArray()
  imagesToRemove?: number[];
}