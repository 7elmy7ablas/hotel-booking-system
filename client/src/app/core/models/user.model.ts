export interface User {
  Id: string;
  FirstName: string;
  LastName: string;
  Email: string;
  PhoneNumber: string;
  Role: string;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface LoginRequest {
  Email: string;
  Password: string;
}

export interface RegisterRequest {
  FirstName: string;
  LastName: string;
  Email: string;
  Password: string;
  PhoneNumber: string;
}

export interface AuthResponse {
  Token: string;
  User: User;
}
