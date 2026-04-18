/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cards.scryfall.io' },
      { protocol: 'https', hostname: 'c1.scryfall.com' },
      { protocol: 'https', hostname: 'c2.scryfall.com' },
      { protocol: 'https', hostname: 'img.scryfall.com' },
    ],
  },
  serverExternalPackages: ['better-sqlite3'],
  // better-sqlite3 is a native dep; mark it external on server builds
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'better-sqlite3'];
    }
    return config;
  },
};

module.exports = nextConfig;
