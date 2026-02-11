import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/*': [
      './node_modules/@sparticuz/chromium/bin/**/*',
      './node_modules/.pnpm/@sparticuz+chromium@*/node_modules/@sparticuz/chromium/bin/**/*',
    ],
  },
};

export default nextConfig;
