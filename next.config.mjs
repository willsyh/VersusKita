/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lets a test build use its own folder (NEXT_DIST_DIR=.next-test) without
  // clobbering a running `npm run dev`, which uses .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
