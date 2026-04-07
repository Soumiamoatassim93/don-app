import { IsNumber, IsEnum, IsOptional } from 'class-validator';
import { RequestStatus } from '../request.entity';

export class CreateRequestDto {

  @IsNumber()
  userId: number;

  @IsNumber()
  donationId: number;

  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus; // optionnel car default déjà dans entity
}