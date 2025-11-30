/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
  // Exclude supabase directory from build
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
};

module.exports = nextConfig;

