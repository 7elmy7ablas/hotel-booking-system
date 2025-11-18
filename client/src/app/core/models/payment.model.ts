export interface Payment {
  Id: string;
  BookingId: string;
  Amount: number;
  PaymentMethod: string;
  PaymentStatus: string;
  TransactionId?: string;
  PaymentDate: string;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface CreatePaymentRequest {
  BookingId: string;
  Amount: number;
  PaymentMethod: string;
}
