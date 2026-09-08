import type { NextConfig } from "next";

const requiredPublicEnvironmentVariables = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_INSTAGRAM_SERVICE_URL",
] as const;

const missingEnvironmentVariables = requiredPublicEnvironmentVariables.filter(
  (name) => !process.env[name]?.trim(),
);

if (missingEnvironmentVariables.length > 0) {
  throw new Error(
    `Signal. build aborted: missing required environment variables: ${missingEnvironmentVariables.join(
      ", ",
    )}. Add them to Vercel before the first deployment.`,
  );
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
};

export default nextConfig;
