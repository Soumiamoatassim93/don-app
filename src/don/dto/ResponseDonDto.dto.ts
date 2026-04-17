// src/don/dto/ResponseDonDto.dto.ts
export class ResponseDonDto {
  id: number;
  title: string;
  description: string;
  categoryId: number;
  userId: number;
  status: string;
  condition: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  createdAt: Date;
  images: { id: number; url: string }[];
  user?: {
    id: number;
    nom: string;
    email: string;
    telephone?: string;
  };
}