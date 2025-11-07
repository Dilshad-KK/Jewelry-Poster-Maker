import type { ReactNode } from "react";
import { Cinzel, Inter } from "next/font/google";
import "@/styles/globals.css";

const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${inter.variable}`}>
      <body className="bg-[#1b1b1b] antialiased">{children}</body>
    </html>
  );
}
