/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverComponentsExternalPackages: ["exceljs", "bcryptjs"],
    allowedDevOrigins: ["*.e2b.app", "*.trycloudflare.com", "*.onrender.com", "*.up.railway.app"],
  },
};

export default nextConfig;
