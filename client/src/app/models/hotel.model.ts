export interface Hotel {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  rating: number;
  amenities: string[];
  imageUrl?: string;
  createdAt?: Date;
}

export interface Room {
  id: string;
  hotelId: string;
  roomNumber: string;
  type: string;
  capacity: number;
  pricePerNight: number;
  isAvailable: boolean;
  amenities: string[];
}

export interface SearchCriteria {
  city?: string;
  checkInDate?: Date;
  checkOutDate?: Date;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
}
