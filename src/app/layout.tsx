import type { Metadata } from "next";
import { Bangers, Poppins } from "next/font/google";
import "./globals.css";

const bangers = Bangers({
  variable: "--font-bangers",
  weight: "400",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YUMSO | Bigger Crunch. Better Fun.",
  description:
    "YUMSO snacks: Classic Chips, Hot & Spicy Nachos, Cheese Puffs and Sea Salt Popcorn. Real ingredients, great taste, made in Canada.",};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bangers.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
