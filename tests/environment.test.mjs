import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

const requiredVariables = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_INSTAGRAM_SERVICE_URL",
];

for (const missingVariable of requiredVariables) {
  test(`build rejects a missing ${missingVariable}`, () => {
    const result = spawnSync(process.execPath, ["node_modules/next/dist/bin/next", "build"], {
      cwd: new URL("../", import.meta.url),
      encoding: "utf8",
      env: { ...process.env, [missingVariable]: "" },
    });
    const output = `${result.stdout}\n${result.stderr}`;
    assert.notEqual(result.status, 0);
    assert.match(output, new RegExp(`missing required environment variables:.*${missingVariable}`));
  });
}
