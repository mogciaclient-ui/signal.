import { config } from "../config.js";
export class InstagramApiError extends Error {
    status;
    code;
    requestId;
    constructor(status, code, message, requestId) {
        super(message);
        this.status = status;
        this.code = code;
        this.requestId = requestId;
    }
}
export async function instagramFetch(path, token, init = {}) {
    const url = path.startsWith("http") ? new URL(path) : new URL(`https://graph.instagram.com/${config.apiVersion}/${path.replace(/^\//, "")}`);
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    if (init.body && !headers.has("Content-Type"))
        headers.set("Content-Type", "application/json");
    const response = await fetch(url, { ...init, headers });
    const payload = await response.json();
    if (!response.ok || payload.error) {
        throw new InstagramApiError(response.status, String(payload.error?.code || response.status), payload.error?.message || "Instagram API request failed", payload.error?.fbtrace_id);
    }
    return payload;
}
