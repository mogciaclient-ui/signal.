import crypto from "node:crypto";
import { config, permissions } from "../config.js";
import { db } from "../firebase.js";
import type { ApiList, FacebookPage, InstagramAccount } from "./types.js";

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
  const url = new URL(
    `https://www.facebook.com/${config.apiVersion}/dialog/oauth`,
  );
  url.search = new URLSearchParams({
    client_id: config.appId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: permissions.join(","),
    state,
    auth_type: "rerequest",
  }).toString();
  return url.toString();
}

export async function consumeOAuthState(state: string) {
  const digest = crypto.createHash("sha256").update(state).digest("hex");
  const ref = db.collection("oauthStates").doc(digest);
  return db.runTransaction(async (tx) => {
    const snapshot = await tx.get(ref);
    const value = snapshot.data();
    if (!snapshot.exists || !value || value.expiresAt < Date.now()) {
      throw new Error("Invalid or expired OAuth state");
    }
    tx.delete(ref);
    return value.userId as string;
  });
}

type MetaError = {
  message?: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  fbtrace_id?: string;
};

function redactMetaPayload(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactMetaPayload);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      /access_token|client_secret|token/i.test(key)
        ? "[REDACTED]"
        : redactMetaPayload(item),
    ]),
  );
}

async function graphJson<T>(url: URL, operation: string): Promise<T> {
  const response = await fetch(url);
  const raw = await response.text();
  let payload: T & { error?: MetaError };
  try {
    payload = JSON.parse(raw) as T & { error?: MetaError };
  } catch {
    console.error(
      JSON.stringify({
        event: "meta_api_response",
        operation,
        status: response.status,
        ok: false,
        response: "[NON_JSON_RESPONSE]",
      }),
    );
    throw new Error(`Meta ${operation} returned a non-JSON response`);
  }

  console.log(
    JSON.stringify({
      event: "meta_api_response",
      operation,
      status: response.status,
      ok: response.ok && !payload.error,
      response: redactMetaPayload(payload),
    }),
  );
  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message || "Facebook OAuth request failed");
  }
  return payload;
}

export async function exchangeCode(code: string) {
  const tokenUrl = new URL(
    `https://graph.facebook.com/${config.apiVersion}/oauth/access_token`,
  );
  tokenUrl.search = new URLSearchParams({
    client_id: config.appId,
    client_secret: config.appSecret,
    redirect_uri: config.redirectUri,
    code,
  }).toString();
  const short = await graphJson<{
    access_token: string;
    expires_in?: number;
  }>(tokenUrl, "oauth_code_exchange");

  const longUrl = new URL(
    `https://graph.facebook.com/${config.apiVersion}/oauth/access_token`,
  );
  longUrl.search = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: config.appId,
    client_secret: config.appSecret,
    fb_exchange_token: short.access_token,
  }).toString();
  const long = await graphJson<{
    access_token: string;
    expires_in?: number;
  }>(longUrl, "long_lived_token_exchange");
  return {
    accessToken: long.access_token,
    expiresIn: long.expires_in || short.expires_in || 0,
  };
}

export async function fetchAccount(userToken: string): Promise<{
  account: InstagramAccount;
  pageId: string;
  pageAccessToken: string;
}> {
  const pagesUrl = new URL(
    `https://graph.facebook.com/${config.apiVersion}/me/accounts`,
  );
  pagesUrl.searchParams.set(
    "fields",
    "id,name,access_token,tasks,instagram_business_account",
  );
  pagesUrl.searchParams.set("access_token", userToken);
  const pages = await graphJson<ApiList<FacebookPage>>(
    pagesUrl,
    "managed_pages_lookup",
  );
  const page = pages.data.find(
    (candidate) =>
      candidate.instagram_business_account?.id && candidate.access_token,
  );
  if (!page?.instagram_business_account?.id) {
    console.error(
      JSON.stringify({
        event: "instagram_account_selection_failed",
        pageCount: pages.data.length,
        pagesWithInstagram: pages.data.filter(
          (candidate) => candidate.instagram_business_account?.id,
        ).length,
      }),
    );
    throw new Error(
      "Facebookページに接続されたInstagramプロアカウントが見つかりません",
    );
  }

  const accountUrl = new URL(
    `https://graph.facebook.com/${config.apiVersion}/${page.instagram_business_account.id}`,
  );
  accountUrl.searchParams.set("fields", "id,username,media_count");
  accountUrl.searchParams.set("access_token", page.access_token);
  const account = await graphJson<InstagramAccount>(
    accountUrl,
    "instagram_account_lookup",
  );
  return {
    account,
    pageId: page.id,
    pageAccessToken: page.access_token,
  };
}
