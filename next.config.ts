/** @type {import('next').NextConfig} */
const nextConfig = {
  middlewareClientMaxBodySize: '500mb', // הגדלת מגבלת גוף הבקשה במידלוור
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb', // הגדלת מגבלה להעלאת PDF
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