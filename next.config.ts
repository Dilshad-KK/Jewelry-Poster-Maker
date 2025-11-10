import type { NextConfig } from "next";

// Use CommonJS require for next-pwa to align with its plugin style
// and keep TS config working across Next versions.
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: require("next-pwa/cache"),
  buildExcludes: [/middleware-manifest\.json$/],
  ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);
