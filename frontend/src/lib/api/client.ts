import type { ApiErrorBody } from "./types";

const ACCESS_TOKEN_KEY = "accessToken";
const ACCESS_TOKEN_COOKIE = "accessToken";
const ACCESS_TOKEN_MAX_AGE =
  Number(process.env.NEXT_PUBLIC_ACCESS_TOKEN_MAX_AGE_SECONDS) || 2 * 60 * 60;

function setAccessTokenCookie(token: string): void {
  document.cookie = `${ACCESS_TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${ACCESS_TOKEN_MAX_AGE}; samesite=strict`;
}

function clearAccessTokenCookie(): void {
  document.cookie = `${ACCESS_TOKEN_COOKIE}=; path=/; max-age=0; samesite=strict`;
}

export class ApiError extends Error {
  status: number;
  errors?: string[];

  constructor(message: string, status: number, errors?: string[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export function getBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined");
  }

  let normalized = baseUrl.replace(/\/$/, "");

  // Server-side fetch on Windows may resolve localhost to ::1 while the API
  // only listens on IPv4 — use 127.0.0.1 to avoid intermittent ECONNREFUSED.
  if (
    typeof window === "undefined" &&
    normalized.includes("://localhost")
  ) {
    normalized = normalized.replace("://localhost", "://127.0.0.1");
  }

  return normalized;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  setAccessTokenCookie(token);
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  clearAccessTokenCookie();
}

function redirectToLogin(): void {
  clearAccessToken();

  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const response = await fetch(`${getBaseUrl()}/auth/refresh-token`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await parseResponseBody(response)) as {
    success?: boolean;
    accessToken?: string;
  };

  if (!data.accessToken) {
    return null;
  }

  setAccessToken(data.accessToken);
  return data.accessToken;
}

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
  skipAuthRetry?: boolean;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
  isRetry = false,
): Promise<T> {
  const {
    body,
    auth = true,
    skipAuthRetry = false,
    headers: customHeaders,
    ...rest
  } = options;

  const headers = new Headers(customHeaders);

  if (!headers.has("Content-Type") && body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getAccessToken();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const url = path.startsWith("http") ? path : `${getBaseUrl()}${path}`;

  const response = await fetch(url, {
    ...rest,
    credentials: "include",
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && auth && !skipAuthRetry) {
    if (isRetry) {
      redirectToLogin();
      throw new ApiError("Session expired. Please log in again.", 401);
    }

    const newToken = await refreshAccessToken();

    if (newToken) {
      return apiRequest<T>(path, options, true);
    }

    redirectToLogin();
    throw new ApiError("Session expired. Please log in again.", 401);
  }

  const data = await parseResponseBody(response);

  if (!response.ok) {
    const errorBody = data as ApiErrorBody;
    throw new ApiError(
      errorBody.message ?? "Request failed",
      response.status,
      errorBody.errors,
    );
  }

  return data as T;
}

export async function apiFormRequest<T>(
  path: string,
  formData: FormData,
  options: Omit<RequestInit, "body"> = {},
  isRetry = false,
): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getAccessToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = path.startsWith("http") ? path : `${getBaseUrl()}${path}`;

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      method: options.method ?? "POST",
      credentials: "include",
      headers,
      body: formData,
    });
  } catch {
    throw new ApiError(
      "Could not reach the server. Make sure the backend is running on port 5000.",
      0,
    );
  }

  if (response.status === 401) {
    if (isRetry) {
      redirectToLogin();
      throw new ApiError("Session expired. Please log in again.", 401);
    }

    const newToken = await refreshAccessToken();

    if (newToken) {
      return apiFormRequest<T>(path, formData, options, true);
    }

    redirectToLogin();
    throw new ApiError("Session expired. Please log in again.", 401);
  }

  const data = await parseResponseBody(response);

  if (!response.ok) {
    const errorBody = data as ApiErrorBody;
    throw new ApiError(
      errorBody.message ?? "Request failed",
      response.status,
      errorBody.errors,
    );
  }

  return data as T;
}

export function buildQueryString(params: object): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}
