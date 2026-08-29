import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { config } from "./config.js";
const secrets = new SecretManagerServiceClient();
const secretId = (accountId) => `instagram-token-${accountId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
export async function saveToken(accountId, token) { const parent = `projects/${config.projectId}`; const id = secretId(accountId); try {
    await secrets.createSecret({ parent, secretId: id, secret: { replication: { automatic: {} } } });
}
catch (error) {
    if (!(error instanceof Error) || !error.message.includes("ALREADY_EXISTS"))
        throw error;
} await secrets.addSecretVersion({ parent: `${parent}/secrets/${id}`, payload: { data: Buffer.from(token) } }); return `${parent}/secrets/${id}`; }
export async function readToken(reference) { const [version] = await secrets.accessSecretVersion({ name: `${reference}/versions/latest` }); const token = version.payload?.data?.toString(); if (!token)
    throw new Error("Instagram token is unavailable"); return token; }
