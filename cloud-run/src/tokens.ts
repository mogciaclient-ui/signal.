import { createHash } from "node:crypto";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { config } from "./config.js";

const secrets = new SecretManagerServiceClient();

function tokenReferenceFor(accountId: string) {
  const suffix = createHash("sha256").update(accountId).digest("hex").slice(0, 24);
  return `projects/${config.projectId}/secrets/signal-instagram-token-${suffix}`;
}

function isNotFound(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === 5;
}

function isAlreadyExists(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === 6;
}

export async function saveToken(accountId: string, token: string) {
  const reference = tokenReferenceFor(accountId);
  try {
    await secrets.createSecret({
      parent: `projects/${config.projectId}`,
      secretId: reference.split("/").at(-1)!,
      secret: {
        replication: { automatic: {} },
        labels: { application: "signal", purpose: "instagram-token" },
      },
    });
  } catch (error) {
    if (!isAlreadyExists(error)) throw error;
  }
  await secrets.addSecretVersion({
    parent: reference,
    payload: { data: Buffer.from(token) },
  });
  return reference;
}

export async function readToken(accountId: string, reference: string) {
  const expectedReference = tokenReferenceFor(accountId);
  if (reference !== expectedReference)
    throw new Error("Unexpected token reference");
  const [version] = await secrets.accessSecretVersion({
    name: `${reference}/versions/latest`,
  });
  const token = version.payload?.data?.toString();
  if (!token) throw new Error("Instagram token is unavailable");
  return token;
}

export async function deleteToken(accountId: string, reference: string) {
  const expectedReference = tokenReferenceFor(accountId);
  if (reference !== expectedReference) throw new Error("Unexpected token reference");
  try {
    await secrets.deleteSecret({ name: reference });
  } catch (error) {
    if (!isNotFound(error)) throw error;
  }
}
