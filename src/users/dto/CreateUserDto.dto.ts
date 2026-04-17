import { IsEmail, IsString, IsNotEmpty, MinLength, IsOptional, IsPhoneNumber } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  nom: string; // ✅ Nouveau champ obligatoire

  @IsOptional()
  @IsString()
  telephone?: string; // ✅ Nouveau champ optionnel

  @IsOptional()
  @IsString()
  role?: string; // optionnel (par défaut = 'user')
}