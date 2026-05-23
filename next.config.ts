import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["apify-client"],
  outputFileTracingIncludes: {
    "/api/scrape": [
      "node_modules/proxy-agent/**/*",
      "node_modules/agent-base/**/*",
      "node_modules/http-proxy-agent/**/*",
      "node_modules/https-proxy-agent/**/*",
      "node_modules/socks-proxy-agent/**/*",
      "node_modules/pac-proxy-agent/**/*",
      "node_modules/pac-resolver/**/*",
      "node_modules/proxy-from-env/**/*",
      "node_modules/socks/**/*",
      "node_modules/ip-address/**/*",
      "node_modules/smart-buffer/**/*",
      "node_modules/lru-cache/**/*",
      "node_modules/data-uri-to-buffer/**/*",
      "node_modules/get-uri/**/*",
      "node_modules/debug/**/*",
      "node_modules/ms/**/*",
      "node_modules/degenerator/**/*",
      "node_modules/netmask/**/*",
    ],
  },
};

export default nextConfig;
