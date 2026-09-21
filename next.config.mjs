/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Pilotes de base de données chargés à l'exécution, hors bundle.
  serverExternalPackages: ['pg', 'bcryptjs'],
}

export default nextConfig
