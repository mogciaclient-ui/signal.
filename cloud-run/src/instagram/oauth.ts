import crypto from "node:crypto";
import { config, permissions } from "../config.js";
import { db } from "../firebase.js";
import type { InstagramAccount } from "./types.js";

export async function createOAuthState(userId: string) {
  const state = crypto.randomBytes(32).toString("base64url");
  const digest = crypto.createHash("sha256").update(state).digest("hex");
  await db
    .collection("oauthStates")
    .doc(digest)
    .set({
      userId,
      expiresAt: Date.now() + 10 * 60_000,
      createdAt: Date.now(),
    });
  return state;
}

export function authorizationUrl(state: string) {
  const url = new URL("https://www.instagram.com/oauth/authorize");
  url.search = new URLSearchParams({
    enable_fb_login: "0",
    force_authentication: "1",
    client_id: config.appId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: permissions.join(","),
    state,
  }).toString();
  return url.toString();
}

export async function consumeOAuthState(state: string) {
  const digest = crypto.createHash("sha256").update(state).digest("hex");
  const ref = db.collection("oauthStates").doc(digest);
  return db.runTransaction(async (tx) => {
    const snapshot = await tx.get(ref);
    const value = snapshot.data();
    if (!snapshot.exists || !value || value.expiresAt < Date.now())
      throw new Error("Invalid or expired OAuth state");
    tx.delete(ref);
    return value.userId as string;
  });
}

export async function exchangeCode(code: string) {
  const body = new URLSearchParams({
    client_id: config.appId,
    client_secret: config.appSecret,
    grant_type: "authorization_code",
    redirect_uri: config.redirectUri,
    code,
  });
  const shortResponse = await fetch(
    "https://api.instagram.com/oauth/access_token",
    { method: "POST", body },
  );
  const short = (await shortResponse.json()) as {
    access_token?: string;
    user_id?: number;
    error_message?: string;
  };
  if (!shortResponse.ok || !short.access_token)
    throw new Error(short.error_message || "OAuth token exchange failed");
  const longUrl = new URL("https://graph.instagram.com/access_token");
  longUrl.search = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: config.appSecret,
    access_token: short.access_token,
  }).toString();
  const longResponse = await fetch(longUrl);
  const long = (await longResponse.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message?: string };
  };
  if (!longResponse.ok || !long.access_token)
    throw new Error(long.error?.message || "Long-lived token exchange failed");
  return { accessToken: long.access_token, expiresIn: long.expires_in || 0 };
}

export async function fetchAccount(token: string): Promise<InstagramAccount> {
  const url = new URL(`https://graph.instagram.com/${config.apiVersion}/me`);
  url.searchParams.set(
    "fields",
    "id,user_id,username,account_type,media_count",
  );
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Instagram account retrieval failed");
  return response.json() as Promise<InstagramAccount>;
}
