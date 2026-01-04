/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // הגדלת מגבלה להעלאת PDF
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // או הדומיין של השרת שלך
      },
    ],
    unoptimized: true, // אם אתה מגיש תמונות לוקאליות דרך Nginx עדיף לעקוף את האופטימיזציה של נקסט לביצועים
  },
  // הסרת ההערה אם יש בעיות עם mongoose בבנייה
  // serverExternalPackages: ["mongoose"], 
};

export default nextConfig;