import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateFavoriteDto {

  
  @IsNotEmpty()
  @IsNumber()
  userId: number;


  @IsNotEmpty()
  @IsNumber()
  donationId: number;
}