export interface Room {
  Id: string;
  HotelId: string;
  RoomNumber: string;
  Type: string;
  Description: string;
  PricePerNight: number;
  Capacity: number;
  IsAvailable: boolean;
  ImageUrl?: string;
  CreatedAt: string;
  UpdatedAt: string;
}
