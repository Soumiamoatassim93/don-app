import { IsString, IsNotEmpty, IsOptional, IsNumber ,IsArray} from 'class-validator';

export class CreateDonDto {

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  categoryId: number;

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsNumber()
  userId: number;
}