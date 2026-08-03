import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    /** Client Router Cache — revisiting pages feels instant. */
    staleTimes: {
      dynamic: 0,
      static: 180,
    },
  },
};

export default nextConfig;
