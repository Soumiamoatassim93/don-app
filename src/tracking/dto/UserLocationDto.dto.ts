// src/tracking/dto/UserLocationDto.dto.ts
import { IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

export class CreateUserLocationDto {

  @IsNumber()
  @IsNotEmpty()
  userId!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;
}