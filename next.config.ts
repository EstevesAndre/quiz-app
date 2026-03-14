import type { NextConfig } from "next";

function readCsvEnv(name: string) {
  const rawValue = process.env[name];
  if (!rawValue) {
    return [];
  }

  return rawValue
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

const allowedOrigins = readCsvEnv("NEXT_SERVER_ACTIONS_ALLOWED_ORIGINS");
const deploymentId =
  process.env.NEXT_DEPLOYMENT_ID || process.env.DEPLOYMENT_VERSION;

const nextConfig: NextConfig = {
  ...(deploymentId ? { deploymentId } : {}),
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
      ...(allowedOrigins.length > 0 ? { allowedOrigins } : {}),
    },
  },
};

export default nextConfig;
