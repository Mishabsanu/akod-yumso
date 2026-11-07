/**
 * Public URL of the live website. Set NEXT_PUBLIC_SITE_URL in your hosting
 * environment (e.g. https://www.yumso.ca). Used for canonical URLs, sitemap,
 * robots.txt, Open Graph and structured data.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://akod-yumso.vercel.app")
).replace(/\/$/, "");

export const SITE_NAME = "YUMSO";
export const SITE_TITLE = "YUMSO Snacks | Bigger Crunch. Better Fun.";
export const SITE_DESCRIPTION =
  "YUMSO snacks made in Canada with real ingredients: Classic Potato Chips, Hot & Spicy Nachos, Cheese Puffs and Air-Popped Sea Salt Popcorn. Order easily on WhatsApp.";
