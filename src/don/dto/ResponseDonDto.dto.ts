export class ResponseDonDto {
  id: number;
  title: string;
  description: string;
  categoryId: number;
  userId: number;
  status: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
  images?: { id: number; url: string }[];
}