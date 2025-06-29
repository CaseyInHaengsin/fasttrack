export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  isAdmin: boolean;
  createdAt: Date;
  lastLogin?: Date;
  preferences: {
    theme: string;
    notifications: boolean;
    dataRetention: number; // days
  };
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}