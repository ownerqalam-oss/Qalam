import { Cormorant_Garamond } from "next/font/google";

// The manuscript serif for the homepage headline and the verse translation.
export const serif = Cormorant_Garamond({
  variable: "--font-serif",
  weight: ["500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});
