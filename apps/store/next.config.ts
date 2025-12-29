import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',

  images: {
    unoptimized: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "**.example.com",
      },
    ],
  },

  async rewrites() {
    return [
      // Catalogue
      { source: "/produits", destination: "/products" },
      { source: "/produits/:slug", destination: "/products/:slug" },
      { source: "/categories", destination: "/categories" },
      { source: "/categories/:slug", destination: "/categories/:slug" },
      { source: "/collections", destination: "/collections" },
      { source: "/collections/:slug", destination: "/collections/:slug" },
      // Panier & Checkout
      { source: "/panier", destination: "/cart" },
      { source: "/paiement", destination: "/checkout" },
      { source: "/paiement/confirmation", destination: "/checkout/confirmation" },
      { source: "/paiement/annule", destination: "/checkout/cancelled" },
      // Compte client
      { source: "/compte", destination: "/account" },
      { source: "/compte/:path*", destination: "/account/:path*" },
      // Auth
      { source: "/connexion", destination: "/login" },
      { source: "/inscription", destination: "/register" },
    ];
  },
};

export default nextConfig;
