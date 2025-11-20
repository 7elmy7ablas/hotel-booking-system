export interface Booking {
  id: string;
  userId: string;
  roomId: string;
  hotelId: string;
  checkInDate: Date;
  checkOutDate: Date;
  totalPrice: number;
  status: BookingStatus;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests?: string;
  createdAt?: Date;
  hotelName?: string;
  roomType?: string;
}

export enum BookingStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Cancelled = 'Cancelled',
  Completed = 'Completed'
}

export interface CreateBookingRequest {
  roomId: string;
  checkInDate: Date;
  checkOutDate: Date;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests?: string;
}
