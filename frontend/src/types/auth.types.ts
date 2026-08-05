export interface AuthResponseDto {
  userId: string;
  email: string;
  fullName: string;
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  roles: string[];
}

export interface RegisterUserRequest {
  email: string;
  password: string;
  fullName: string;
  role: string;
}

export interface LoginUserRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  accessToken: string;
  refreshToken: string;
}
