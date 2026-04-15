import { IsNumber, IsString, IsOptional, IsObject } from 'class-validator';

export class SendNotificationDto {
  @IsNumber()
  userId: number;

  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsObject()
  data?: any;
}

export class RegisterTokenDto {
  @IsNumber()
  userId: number;

  @IsString()
  token: string;

  @IsString()
  deviceType: string;
}