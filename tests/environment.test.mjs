import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

const publicEnvironmentVariables = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_INSTAGRAM_SERVICE_URL",
];

test("the initial Vercel build succeeds before environment variables are added", () => {
  const environment = { ...process.env };
  for (const name of publicEnvironmentVariables) environment[name] = "";

  const result = spawnSync(
    process.execPath,
    ["node_modules/next/dist/bin/next", "build"],
    {
      cwd: new URL("../", import.meta.url),
      encoding: "utf8",
      env: environment,
    },
  );

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});
