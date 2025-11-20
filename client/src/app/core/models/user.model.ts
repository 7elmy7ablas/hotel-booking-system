export interface User {
  Id: string;
  FullName: string;
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
  FullName: string;
  Email: string;
  Password: string;
  PhoneNumber: string;
}

export interface AuthResponse {
  Token: string;
  User: User;
}
