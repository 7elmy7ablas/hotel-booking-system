export interface Booking {
  Id: string;
  UserId: string;
  RoomId: string;
  CheckInDate: string;
  CheckOutDate: string;
  TotalPrice: number;
  Status: string;
  SpecialRequests?: string;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface CreateBookingRequest {
  RoomId: string;
  CheckInDate: string;
  CheckOutDate: string;
  SpecialRequests?: string;
}
