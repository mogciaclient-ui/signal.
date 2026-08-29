import { config } from "../config.js";

export class InstagramApiError extends Error {
  constructor(public status: number, public code: string, message: string, public requestId?: string) { super(message); }
}

export async function instagramFetch<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const url = path.startsWith("http") ? new URL(path) : new URL(`https://graph.instagram.com/${config.apiVersion}/${path.replace(/^\//, "")}`);
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(url, { ...init, headers });
  const payload = await response.json() as { error?: { message?: string; code?: number; type?: string; fbtrace_id?: string } } & T;
  if (!response.ok || payload.error) {
    throw new InstagramApiError(response.status, String(payload.error?.code || response.status), payload.error?.message || "Instagram API request failed", payload.error?.fbtrace_id);
  }
  return payload;
}
