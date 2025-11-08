import { ImageResponse } from "next/og";
import { headers } from "next/headers";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  const hdrs = headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "localhost:3000";
  const proto = (hdrs.get("x-forwarded-proto") || "http").split(",")[0];
  const base = `${proto}://${host}`;

  // Fetch latest rate via our public API (avoids using admin key at edge)
  let perGram: number | undefined;
  let perSovereign: number | undefined;
  let imageUrl: string | undefined;
  let shopName: string | undefined;
  let shopAddress: string | undefined;
  try {
    const res = await fetch(`${base}/api/rates`, { cache: "no-store" });
    const json = await res.json();
    const r = json?.rate || null;
    if (r) {
      perGram = typeof r.per_gram === "number" ? r.per_gram : undefined;
      perSovereign = typeof r.per_sovereign === "number" ? r.per_sovereign : undefined;
      imageUrl = r.image_url || undefined;
      shopName = r.shop_name || undefined;
      shopAddress = r.shop_address || undefined;
    }
  } catch {
    // ignore
  }

  const title = "Today’s Gold Rate";
  const subtitle = perGram && perSovereign
    ? `₹ ${perGram.toLocaleString("en-IN")} /g   •   ₹ ${perSovereign.toLocaleString("en-IN")} /sovereign`
    : "Latest prices from KGP Gold";
  const shop = shopName || "KGP Gold";
  const address = shopAddress || "Koduvally";

  return new ImageResponse(
    (
      <div
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#0b0b0b,#1a1206)",
          position: "relative",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        {/* Background image */}
        {imageUrl && (
          <img
            src={imageUrl}
            alt="bg"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.25,
              filter: "blur(2px) saturate(1.1)",
            }}
          />
        )}

        {/* Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg,rgba(0,0,0,0.2),rgba(0,0,0,0.65))",
          }}
        />

        {/* Card */}
        <div
          style={{
            width: 1060,
            height: 500,
            borderRadius: 28,
            background: "linear-gradient(135deg, rgba(22,22,22,0.9), rgba(8,8,8,0.9))",
            border: "1px solid rgba(255,191,71,0.35)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 18,
            position: "relative",
            boxShadow: "0 20px 80px rgba(255,191,71,0.15)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: "linear-gradient(90deg,transparent,#fbbf24,transparent)",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
            }}
          />

          <div style={{ color: "#fbbf24", fontSize: 22, letterSpacing: 6, textTransform: "uppercase" }}>
            Live Gold Rates
          </div>
          <div style={{ color: "#fff", fontSize: 64, fontWeight: 800 }}>{title}</div>
          <div style={{ color: "#fde68a", fontSize: 30, fontWeight: 700 }}>{subtitle}</div>
          <div style={{ color: "#fef3c7", fontSize: 22, marginTop: 8 }}>{shop}</div>
          <div style={{ color: "#fef3c7", fontSize: 18, opacity: 0.85 }}>{address}</div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

