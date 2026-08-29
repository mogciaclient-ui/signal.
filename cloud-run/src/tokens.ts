import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { config } from "./config.js";
const secrets = new SecretManagerServiceClient();
export async function saveToken(_accountId: string, token: string) {
  void _accountId;
  await secrets.addSecretVersion({
    parent: config.instagramTokenSecret,
    payload: { data: Buffer.from(token) },
  });
  return config.instagramTokenSecret;
}
export async function readToken(reference: string) {
  if (reference !== config.instagramTokenSecret)
    throw new Error("Unexpected token reference");
  const [version] = await secrets.accessSecretVersion({
    name: `${reference}/versions/latest`,
  });
  const token = version.payload?.data?.toString();
  if (!token) throw new Error("Instagram token is unavailable");
  return token;
}
