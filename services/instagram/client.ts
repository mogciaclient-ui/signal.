import { firebaseServices } from "../../lib/firebase/client";

const serviceUrl = process.env.NEXT_PUBLIC_INSTAGRAM_SERVICE_URL;

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!serviceUrl) throw new Error("Instagram service URL is not configured.（サービスURLが未登録です）");
  const user = firebaseServices().auth.currentUser;
  if (!user) throw new Error("Sign in to Signal.（Signal.へログインしてください）");
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${await user.getIdToken()}`);
  if (init.body) headers.set("Content-Type", "application/json");
  const response = await fetch(`${serviceUrl}${path}`, { ...init, headers });
  const payload = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || "Instagram request failed.（Instagram処理に失敗しました）");
  return payload;
}

export const instagramService = {
  oauthUrl: () => request<{ url: string }>("/oauth/start"),
  sync: () => request<{ itemCount: number }>("/sync", { method: "POST" }),
  publish: (storagePath: string, caption: string) => request<{ status: string; platformPostId: string }>("/publish", { method: "POST", body: JSON.stringify({ storagePath, caption }) }),
  schedule: (storagePath: string, caption: string, scheduledAt: string) => request<{ id: string; status: string }>("/scheduled", { method: "POST", body: JSON.stringify({ storagePath, caption, scheduledAt }) }),
  disconnectReviewer: () => request<{ status: string }>("/account/disconnect", { method: "POST" }),
  deleteAccount: () => request<{ status: string }>("/account/delete", { method: "POST" }),
};
