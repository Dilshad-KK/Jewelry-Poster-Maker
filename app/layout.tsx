import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import { supabaseAdmin } from "@/lib/supabase/server";
import { headers } from "next/headers";
import "@/styles/globals.css";

const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  // Prefer explicit site URL; otherwise infer from request headers
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "localhost:3000";
  const proto = (hdrs.get("x-forwarded-proto") || "http").split(",")[0];
  const inferredBase = `${proto}://${host}`;
  const base = process.env.NEXT_PUBLIC_SITE_URL || inferredBase;
  const metadataBase = new URL(base);

  // Defaults
  let perGram: number | undefined;
  let perSovereign: number | undefined;
  let imageUrl: string | undefined;
  let shopName: string | undefined;
  let shopAddress: string | undefined;

  try {
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("rates")
        .select("per_gram, per_sovereign, image_url, shop_name, shop_address")
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && data) {
        perGram = typeof data.per_gram === "number" ? data.per_gram : undefined;
        perSovereign = typeof data.per_sovereign === "number" ? data.per_sovereign : undefined;
        imageUrl = data.image_url || undefined;
        shopName = data.shop_name || undefined;
        shopAddress = data.shop_address || undefined;
      }
    }
  } catch {
    // ignore — use defaults below
  }

  // If the image is a Supabase Storage URL, ensure it is fetchable by crawlers.
  // We create a time-limited signed URL so previews work even if the bucket is private.
  if (imageUrl && supabaseAdmin) {
    try {
      const u = new URL(imageUrl);
      if (u.hostname.endsWith("supabase.co") && u.pathname.includes("/storage/v1/object/")) {
        // Extract bucket and path from: /storage/v1/object/(public|sign)/<bucket>/<path>
        const m = u.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/);
        if (m) {
          const [, bucket, path] = m;
          const { data: signed, error } = await supabaseAdmin.storage
            .from(bucket)
            .createSignedUrl(path, 60 * 60 * 24 * 7); // 7 days
          if (!error && signed?.signedUrl) {
            imageUrl = signed.signedUrl;
          }
        }
      }
    } catch {
      // ignore and keep original URL
    }
  }

  const title = "Today’s Gold Rate — KGP Gold, Koduvally";
  const descBase = shopName && shopAddress
    ? `${shopName}, ${shopAddress}`
    : "KGP Gold, Mangalya Complex, Main Road, Koduvally.";
  const description = perGram && perSovereign
    ? `Today’s gold price: ₹ ${perGram.toLocaleString("en-IN")} per gram and ₹ ${perSovereign.toLocaleString("en-IN")} per sovereign. ${descBase}`
    : `Today’s gold price. ${descBase}`;

  // Only include preview image if we actually have one from DB
  const hasImage = Boolean(imageUrl);

  return {
    metadataBase,
    title,
    description,
    openGraph: {
      title,
      description,
      url: "/",
      siteName: "KGP Gold",
      images: hasImage
        ? [
            {
              url: imageUrl as string,
              width: 1200,
              height: 630,
              alt: "Today’s Gold Rate — Uploaded image",
            },
          ]
        : undefined,
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: hasImage ? [imageUrl as string] : undefined,
    },
  } satisfies Metadata;
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${inter.variable}`}>
      <body className="bg-[#1b1b1b] antialiased">{children}</body>
    </html>
  );
}
