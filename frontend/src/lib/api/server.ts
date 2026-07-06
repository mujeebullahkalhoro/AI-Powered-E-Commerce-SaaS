import { cookies } from "next/headers";
import { redirect } from "next/navigation";

function getServerBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined");
  }

  let normalized = baseUrl.replace(/\/$/, "");

  if (normalized.includes("://localhost")) {
    normalized = normalized.replace("://localhost", "://127.0.0.1");
  }

  return normalized;
}

async function getCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}

export async function getServerAccessToken(): Promise<string> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (accessToken) {
    return decodeURIComponent(accessToken);
  }

  const cookieHeader = await getCookieHeader();

  const response = await fetch(`${getServerBaseUrl()}/auth/refresh-token`, {
    method: "POST",
    headers: cookieHeader ? { Cookie: cookieHeader } : {},
    cache: "no-store",
  });

  if (!response.ok) {
    redirect("/login");
  }

  const data = (await response.json()) as { accessToken: string };
  return data.accessToken;
}

export async function serverApiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const accessToken = await getServerAccessToken();
  const headers = new Headers(init.headers);

  headers.set("Authorization", `Bearer ${accessToken}`);

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${getServerBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "API request failed");
  }

  return response.json() as Promise<T>;
}
