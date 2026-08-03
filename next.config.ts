import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray lockfile in the user profile makes Next infer the wrong workspace root.
  outputFileTracingRoot: import.meta.dirname,
};

export default nextConfig;
