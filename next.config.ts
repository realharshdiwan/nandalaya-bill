import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

const isStatic = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  ...(isStatic
    ? {
        output: "export",
        images: { unoptimized: true },
        typescript: { ignoreBuildErrors: true },
      }
    : {}),
};

export default isStatic ? nextConfig : withSerwist(nextConfig);
