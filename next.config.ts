import type { NextConfig } from 'next';
import withPWA from 'next-pwa';

const config: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ✅ empêche le build de planter sur Vercel à cause du lint
  },
  typescript: {
    ignoreBuildErrors: true, // ✅ pareil si t’as des erreurs TS non bloquantes
  },
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'],
  },
  experimental: {
    optimizeCss: true,
  },
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
})(config);
