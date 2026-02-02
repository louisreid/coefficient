import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ["@auth/prisma-adapter"],
};

export default nextConfig;
