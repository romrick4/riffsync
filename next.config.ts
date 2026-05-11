import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["bcryptjs", "pg", "@prisma/adapter-pg"],
};

export default nextConfig;
