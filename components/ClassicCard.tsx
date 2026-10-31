import React, { useState } from "react";
import Link from "next/link";
import { FiDownload } from "react-icons/fi";
import PhotoWatermark from "./PhotoWatermark";

type Rate = {
  date?: string;
  per_gram?: number;
  per_gram_18k?: number | null;
  per_gram_9k?: number | null;
  per_sovereign?: number;
  image_url?: string | null;
  shop_name?: string | null;
  shop_address?: string | null;
} | null;

type Settings = {
  theme: "classic" | "overlay";
  primaryColor?: string | null;
  accentColor?: string | null;
  bgColor?: string | null;
  logoUrl?: string | null;
};

type Props = {
  rate: Rate;
  previousRate?: Rate;
  settings: Settings;
  displayImg: string | null;
  imageLoading: boolean;
  cardRef: React.RefObject<HTMLDivElement | null>;
  frontCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  exporting: boolean;
  hideShare: boolean;
  onShare: () => void | Promise<void>;
  onSave?: () => void | Promise<void>;
  hideFrontCanvas?: boolean;
};

export default function ClassicCard({
  rate,
  previousRate,
  settings,
  displayImg,
  imageLoading,
  cardRef,
  frontCanvasRef,
  exporting,
  hideShare,
  onShare,
  onSave,
  hideFrontCanvas,
}: Props) {
  const [logoLoaded, setLogoLoaded] = useState(false);
  const hexToRgba = (hex: string, alpha: number) => {
    const h = hex.replace("#", "");
    const bigint = parseInt(
      h.length === 3 ? h.split("").map((c) => c + c).join("") : h,
      16
    );
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const primary = settings.primaryColor || "#f59e0b";
  const accent = settings.accentColor || "#fbbf24";
  const bg = settings.bgColor || "#0b0b0b";

  const toFiniteNumber = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const n = Number(value);
      if (Number.isFinite(n)) return n;
    }
    return null;
  };

  const formatINR = (value: unknown) => {
    const n = toFiniteNumber(value);
    if (n === null) return "—";
    return n.toLocaleString("en-IN");
  };

  const perGram22k = toFiniteNumber(rate?.per_gram);
  const perGram18k = toFiniteNumber(rate?.per_gram_18k);
  const perGram9k   = toFiniteNumber(rate?.per_gram_9k);

  // Previous day — stored values only, no derivation
  const prevPerGram22k = toFiniteNumber(previousRate?.per_gram);
  const prevPerGram18k = toFiniteNumber(previousRate?.per_gram_18k);
  const prevPerGram9k  = toFiniteNumber(previousRate?.per_gram_9k);
  const prevSovereign  = toFiniteNumber(previousRate?.per_sovereign);


  // Returns signed delta, 0 if no change, null only if no previous data
  const delta = (current: number | null | undefined, previous: number | null | undefined): number | null => {
    const c = toFiniteNumber(current);
    const p = toFiniteNumber(previous);
    if (c === null || p === null) return null;
    return Math.round((c - p) * 100) / 100;
  };

  return (
    <div
      ref={cardRef}
      className="relative rounded-3xl border shadow-2xl overflow-hidden backdrop-blur-xl"
      style={{
        borderColor: primary + "33",
        background: `linear-gradient(to bottom right, ${hexToRgba(
          bg,
          0.92
        )}, rgba(0,0,0,0.95))`,
        backdropFilter: exporting ? "none" : "blur(14px)",
        WebkitBackdropFilter: exporting ? "none" : "blur(14px)",
        transition: "all 0.3s ease",
      }}
    >
      {/* Home button (to Admin) */}
      <Link
        href="/admin"
        aria-label="Go to admin"
        className={`absolute top-2 left-2 z-30 inline-flex items-center justify-center rounded-full text-black shadow-lg transition-transform duration-150 ${
          hideShare ? "opacity-0 pointer-events-none" : "opacity-100 hover:scale-105 active:scale-95"
        }`}
        style={{
          width: 34,
          height: 34,
          backgroundColor: settings.primaryColor || "#fbbf24",
        }}
        title="Go to Admin"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 3.172 2.293 12.88a1 1 0 0 0 1.414 1.414L5 13.001V20a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-6l1.293 1.293a1 1 0 1 0 1.414-1.414L12 3.172z" />
        </svg>
      </Link>

      {/* Share button */}
      <button
        onClick={onShare}
        aria-label="Share image"
        className={`absolute top-2 right-[58px] z-30 inline-flex items-center justify-center rounded-full text-black shadow-lg transition-transform duration-150 ${
          hideShare
            ? "opacity-0 pointer-events-none"
            : "opacity-100 hover:scale-105 active:scale-95"
        }`}
        style={{
          width: 34,
          height: 34,
          backgroundColor: settings.primaryColor || "#fbbf24",
        }}
        title="Share / Save image"
        disabled={exporting}
      >
        {exporting ? (
          <span className="block w-4 h-4 rounded-full border-2 border-black/70 border-t-transparent animate-spin" />
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7a3.048 3.048 0 0 0 0-1.39l7.05-4.11A2.99 2.99 0 1 0 14 4a2.99 2.99 0 0 0 .04.49L7 8.6A3 3 0 1 0 7 15.4l7.04 4.11c-.02.16-.04.32-.04.49a3 3 0 1 0 3-3.92z" />
          </svg>
        )}
      </button>

      {/* Save button (to the right of Share) */}
      {onSave && (
        <button
          onClick={onSave}
          aria-label="Save image"
          className={`absolute top-2 right-2 z-30 inline-flex items-center justify-center rounded-full text-black shadow-lg transition-transform duration-150 ${
            hideShare ? "opacity-0 pointer-events-none" : "opacity-100 hover:scale-105 active:scale-95"
          }`}
          style={{ width: 34, height: 34, backgroundColor: settings.primaryColor || "#fbbf24" }}
          title="Save to gallery"
          disabled={exporting}
        >
          {exporting ? (
            <span className="block w-4 h-4 rounded-full border-2 border-black/70 border-t-transparent animate-spin" />
          ) : (
            <FiDownload size={16} />
          )}
        </button>
      )}

      {/* Top strip */}
      <div
        className="h-[2px]"
        style={{
          backgroundImage: `linear-gradient(to right, transparent, ${primary}, transparent)`,
        }}
      />

      {/* Particle layer */}
      {!hideFrontCanvas && (
        <canvas
          ref={frontCanvasRef}
          className="pointer-events-none absolute inset-0 z-10"
        />
      )}

      <div className="relative z-20 flex flex-col items-center space-y-3.5 p-4 sm:p-5">
        {/* Logo with loading indicator */}
        <div className="mt-2 relative h-20 sm:h-24 flex items-center justify-center">
          {!logoLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/10 border border-white/15 text-amber-200/80 text-xs">
                <span className="inline-block w-3 h-3 rounded-full border-2 border-amber-300/70 border-t-transparent animate-spin" />
                Loading…
              </div>
            </div>
          )}
          {settings.logoUrl && (
            <img
              src={settings.logoUrl}
              alt="Logo"
              crossOrigin="anonymous"
              decoding="sync"
              onLoad={(e) => {
                (e.currentTarget as HTMLImageElement).style.opacity = "1";
                setLogoLoaded(true);
              }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.opacity = "1";
                setLogoLoaded(true);
              }}
              className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] opacity-0 transition-opacity duration-300 relative z-10"
            />
          )}
        </div>

        {/* Title */}
        <h1 className="text-center text-xl sm:text-2xl font-bold tracking-tight font-serif text-white drop-shadow-sm leading-tight"
            style={{textRendering: 'optimizeLegibility', fontKerning: 'none'}}>
          Today’s{" "}
          <span className="text-transparent bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text">
            Gold Rate
          </span>
        </h1>

        {/* Date */}
        <div className="inline-flex items-center space-x-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1 shadow-inner">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-amber-100 font-semibold text-xs sm:text-sm">
            {(() => {
              const d = new Date(rate?.date ?? Date.now());
              const day = String(d.getDate()).padStart(2, "0");
              const month = d
                .toLocaleString("en-US", { month: "short" })
                .toUpperCase();
              const year = d.getFullYear();
              return `${day} / ${month} / ${year}`;
            })()}
          </span>
        </div>

        {/* Image */}
        <div className="relative w-full max-w-[270px] sm:max-w-xs mt-2.5">
          <div
            className="absolute -inset-2 rounded-2xl blur-lg"
            style={{ background: hexToRgba(accent, 0.1) }}
          />
          <div
            className="relative rounded-2xl overflow-hidden border shadow-lg"
            style={{ borderColor: primary + "4D" }}
          >
            <div className="relative w-full pt-[90%]">
              {displayImg ? (
                <img
                  src={displayImg}
                  alt="Gold Jewellery"
                  crossOrigin="anonymous"
                  decoding="sync"
                  className={`absolute inset-0 w-full h-full object-cover ${
                    exporting
                      ? ""
                      : "transform hover:scale-105 transition-transform duration-700"
                  }`}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 text-amber-200/80 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded-full border-2 border-amber-300/70 border-t-transparent animate-spin" />
                    Loading…
                  </div>
                </div>
              )}
              {displayImg && <PhotoWatermark logoUrl={settings.logoUrl} />}
              {imageLoading && (
                !exporting && (
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Price strip — 4 cols, single row */}
        <div className="w-full mt-3.5">
          <div className="group relative">
            <div
              className="absolute -inset-0.5 rounded-2xl blur opacity-40 group-hover:opacity-70 transition duration-300"
              style={{ backgroundImage: `linear-gradient(to right, ${primary}, ${accent})` }}
            />
            <div
              className="relative backdrop-blur-md rounded-2xl overflow-hidden border"
              style={{
                background: `linear-gradient(180deg, rgba(0,0,0,0.55), ${hexToRgba(accent, 0.08)})`,
                borderColor: hexToRgba(primary, 0.45),
                boxShadow: `0 3px 12px ${hexToRgba(primary, 0.12)}`,
              }}
            >
              <div className="grid grid-cols-4">
                {[
                  { unit: "1GM", karat: "22K", value: rate?.per_gram,      prev: prevPerGram22k },
                  { unit: "8GM", karat: "22K", value: rate?.per_sovereign, prev: prevSovereign  },
                  { unit: "1GM", karat: "18K", value: perGram18k,          prev: prevPerGram18k },
                  { unit: "1GM", karat: "9K",  value: perGram9k,           prev: prevPerGram9k  },
                ].map((item, i) => {
                  const d = delta(item.value, item.prev);
                  const isUp = d !== null && d > 0;
                  const isDown = d !== null && d < 0;
                  return (
                    <div
                      key={i}
                      className={`px-2 py-2 ${i > 0 ? "border-l border-dotted" : ""}`}
                      style={{ borderColor: hexToRgba(primary, 0.35) }}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <span
                          className="font-extrabold font-serif leading-none"
                          style={{ color: accent, fontSize: 14, fontKerning: "none" }}
                        >
                          {item.karat}
                        </span>
                        <span
                          className="inline-flex items-center rounded border px-1 py-0.5 text-[8px] font-bold tracking-wider leading-none"
                          style={{
                            background: hexToRgba(accent, 0.18),
                            borderColor: hexToRgba(accent, 0.35),
                            color: "rgba(255,255,255,0.85)",
                            fontKerning: "none",
                          }}
                        >
                          {item.unit}
                        </span>
                      </div>
                      <div
                        className="font-extrabold text-white leading-tight tracking-tight whitespace-nowrap"
                        style={{
                          fontSize: "clamp(12px, 3vw, 15px)",
                          textRendering: "geometricPrecision",
                          fontKerning: "none",
                        }}
                      >
                        <span style={{ opacity: 0.6, fontSize: "0.75em" }}>₹</span>
                        {formatINR(item.value)}
                      </div>
                      {/* Delta indicator */}
                      {previousRate && (
                        <div
                          className="flex items-center gap-0.5 mt-0.5 whitespace-nowrap"
                          style={{
                            fontSize: "clamp(9px, 2vw, 11px)",
                            fontWeight: 700,
                            color: d !== null ? accent : "rgba(255,255,255,0.25)",
                            fontKerning: "none",
                          }}
                        >
                          {d !== null ? (
                            <>
                              <span>{d > 0 ? "▲" : d < 0 ? "▼" : "▲▼"}</span>
                              <span>₹{formatINR(Math.abs(d))}</span>
                            </>
                          ) : (
                            <span>—</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Shop Info (ensure both lines stay inside the box) */}
        <div className="mt-3.5 w-full flex items-center justify-center">
          <div className="text-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-2 sm:py-2.5 shadow-inner" style={{minWidth: 240}}>
            <div className="flex items-center justify-center gap-2 text-amber-200/90 font-medium tracking-wide text-xs sm:text-sm">
              <span>{rate?.shop_name || "KGP Gold, Mangalya Gold Souk"}</span>
            </div>
            <div className="text-amber-100/80 text-[11px] sm:text-xs mt-0.5" style={{fontKerning:'none'}}>
              {rate?.shop_address || "Main Road, Koduvally"}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div
        className="h-[2px]"
        style={{
          backgroundImage: `linear-gradient(to right, transparent, ${primary}, transparent)`,
        }}
      />
    </div>
  );
}
