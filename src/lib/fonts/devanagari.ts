import { Noto_Sans_Devanagari } from "next/font/google";

export const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  display: "swap",
  weight: ["400", "700"],
  preload: false,
});
