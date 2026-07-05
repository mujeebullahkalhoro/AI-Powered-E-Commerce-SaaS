import { apiRequest } from "./client";
import type { User } from "./types";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

interface AuthResponse {
  success: true;
  accessToken: string;
  user: User;
}

interface RefreshResponse {
  success: true;
  accessToken: string;
}

interface MeResponse {
  success: true;
  user: User;
}

interface MessageResponse {
  success: true;
  message: string;
}

export async function login(
  credentials: LoginCredentials,
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: credentials,
    auth: false,
    skipAuthRetry: true,
  });
}

export async function register(
  credentials: RegisterCredentials,
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: credentials,
    auth: false,
    skipAuthRetry: true,
  });
}

export async function logout(): Promise<MessageResponse> {
  return apiRequest<MessageResponse>("/auth/logout", {
    method: "POST",
  });
}

export async function getMe(): Promise<MeResponse> {
  return apiRequest<MeResponse>("/auth/me");
}

export async function refreshToken(): Promise<RefreshResponse> {
  return apiRequest<RefreshResponse>("/auth/refresh-token", {
    method: "POST",
    auth: false,
    skipAuthRetry: true,
  });
}
