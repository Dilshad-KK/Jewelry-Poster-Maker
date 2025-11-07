import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import "@/styles/globals.css";

const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "Today’s Gold Rate — KGP Gold, Koduvally",
  description:
    "Today’s gold price: ₹ 11,185 per gram and ₹ 89,480 per sovereign. KGP Gold, Mangalya Complex, Main Road, Koduvally.",
  openGraph: {
    title: "Today’s Gold Rate — KGP Gold, Koduvally",
    description:
      "Today’s gold price: ₹ 11,185 per gram and ₹ 89,480 per sovereign. KGP Gold, Mangalya Complex, Main Road, Koduvally.",
    url: "/",
    siteName: "KGP Gold",
    images: [
      {
        url: "/uploads/gold-og.jpg",
        width: 1200,
        height: 630,
        alt: "Today’s Gold Rate poster — KGP Gold",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Today’s Gold Rate — KGP Gold, Koduvally",
    description:
      "Today’s gold price: ₹ 11,185 per gram and ₹ 89,480 per sovereign. KGP Gold, Mangalya Complex, Main Road, Koduvally.",
    images: ["/uploads/gold-og.jpg"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${inter.variable}`}>
      <body className="bg-[#1b1b1b] antialiased">{children}</body>
    </html>
  );
}
