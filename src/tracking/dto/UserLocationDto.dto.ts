import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateUserLocationDto {

  @IsNumber()
  @IsNotEmpty()
  userId!: number;

  @IsNotEmpty()
  @IsNumber()
  latitude!: number;

  @IsNotEmpty()
  @IsNumber()
  longitude!: number;
}