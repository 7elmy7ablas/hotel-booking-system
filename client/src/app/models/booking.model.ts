export interface Booking {
  id: number;
  userId: number;
  roomId: number;
  hotelId: number;
  checkInDate: Date;
  checkOutDate: Date;
  totalPrice: number;
  status: BookingStatus;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests?: string;
  createdAt?: Date;
}

export enum BookingStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Cancelled = 'Cancelled',
  Completed = 'Completed'
}

export interface CreateBookingRequest {
  roomId: number;
  checkInDate: Date;
  checkOutDate: Date;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests?: string;
}
