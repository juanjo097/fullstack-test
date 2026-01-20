export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthToken {
  accessToken: string;
  expiresAt: Date;
}

export interface AuthUser {
  id: string;
  organizationId: string | null;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  roleId: string | null;
  role?: {
    id: string;
    name: string;
    permissions: string[];
  } | null;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    organizationId: string | null;
    roleId: string | null;
    role?: {
      id: string;
      name: string;
      permissions: string[];
    } | null;
  };
  token: AuthToken;
  refreshToken: string;
}

export interface AuthSession {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}
