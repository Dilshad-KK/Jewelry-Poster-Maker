import type { NextConfig } from "next";

// Use CommonJS require for next-pwa to align with its plugin style
// and keep TS config working across Next versions.
const defaultRuntimeCaching = require("next-pwa/cache");

// Ensure API calls always hit network (avoid stale cached data)
const runtimeCaching = [
  {
    urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith("/api/"),
    handler: "NetworkOnly",
  },
  ...defaultRuntimeCaching,
];

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching,
  buildExcludes: [/middleware-manifest\.json$/],
  ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);
