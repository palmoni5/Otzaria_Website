/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // מאפשר לטעון תמונות מכל דומיין
      },
    ],
    unoptimized: true,
  },
  
  // הגדרה שמאפשרת להפנות נתיבים לשרת אחר במצב פיתוח
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/uploads/:path*',
          destination: 'https://otzaria.org/uploads/:path*', // החלף בכתובת השרת שלך
        },
      ];
    }
    return [];
  },
};

export default nextConfig;