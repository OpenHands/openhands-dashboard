/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      '/*': ['./data/snapshots.json'],
    },
  },
};

export default nextConfig;
