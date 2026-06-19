"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiDollarSign,
  FiAward,
  FiImage,
  FiScissors,
  FiSliders,
  FiLock,
  FiExternalLink,
  FiLogOut,
} from "react-icons/fi";
import Cropper from "react-easy-crop";

export default function AdminPage() {
  const router = useRouter();

  // Core states
  const [initialLoading, setInitialLoading] = useState(true);
  const [perGram, setPerGram] = useState("");
  const [perGram18k, setPerGram18k] = useState("");
  const [perGram9k, setPerGram9k] = useState("");
  const [perSovereign, setPerSovereign] = useState("");
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [date, setDate] = useState("");

  // Date input support
  const supportsDate = useMemo(() => {
    if (typeof document === "undefined") return true;
    const i = document.createElement("input");
    i.setAttribute("type", "date");
    return i.type === "date";
  }, []);

  // Image + Logo states
  const [file, setFile] = useState<File | null>(null);
  const [previousImageUrl, setPreviousImageUrl] = useState<string | null>(null);
  const [previousLogoUrl, setPreviousLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

  // Cropper
  const [cropOpen, setCropOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [croppedDataUrl, setCroppedDataUrl] = useState<string | null>(null);
  const [imageProcessing, setImageProcessing] = useState(false);

  // Colors
  const palettes = [
    { name: "Gold", primary: "#f59e0b", accent: "#fbbf24", bg: "#451a03" },
    { name: "Emerald", primary: "#10b981", accent: "#34d399", bg: "#064e3b" },
    { name: "Ruby", primary: "#ef4444", accent: "#f87171", bg: "#7f1d1d" },
    { name: "Sapphire", primary: "#3b82f6", accent: "#60a5fa", bg: "#0c4a6e" },
    { name: "Amethyst", primary: "#8b5cf6", accent: "#a78bfa", bg: "#4c1d95" },
  ];
  const [primaryColor, setPrimaryColor] = useState(palettes[0].primary);
  const [accentColor, setAccentColor] = useState(palettes[0].accent);
  const [bgColor, setBgColor] = useState(palettes[0].bg);
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
  const hexToRgb = (hex: string) => {
    const v = hex.replace("#", "");
    const s = v.length === 3 ? v.split("").map((c) => c + c).join("") : v;
    const n = parseInt(s, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  };
  const rgbToHsl = ({ r, g, b }: { r: number; g: number; b: number }) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h = 0,
      s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return { h, s, l };
  };
  const hslToHex = (h: number, s: number, l: number) => {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    let r: number, g: number, b: number;
    if (s === 0) r = g = b = l;
    else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    const toHex = (x: number) =>
      Math.round(x * 255)
        .toString(16)
        .padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };
  const deriveFromPrimary = (hex: string) => {
    try {
      const hsl = rgbToHsl(hexToRgb(hex));
      const accentL = clamp01(hsl.l + 0.2);
      const accentS = clamp01(hsl.s * 0.9 + 0.05);
      const bgL = clamp01(hsl.l * 0.22);
      const bgS = clamp01(hsl.s * 0.9 + 0.05);
      return {
        accent: hslToHex(hsl.h, accentS, accentL),
        bg: hslToHex(hsl.h, bgS, bgL),
      };
    } catch {
      return { accent: "#fbbf24", bg: "#451a03" };
    }
  };

  useEffect(() => {
    const d = deriveFromPrimary(primaryColor);
    setAccentColor(d.accent);
    setBgColor(d.bg);
  }, [primaryColor]);

  // Fetch data
  useEffect(() => {
    (async () => {
      setInitialLoading(true);
      const now = new Date();
      const tzAdjusted = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
      const todayLocal = tzAdjusted.toISOString().slice(0, 10);
      setDate(todayLocal);

      try {
        const res = await fetch(`/api/rates?t=${Date.now()}`, { cache: "no-store" });
        const json = await res.json();
        const r = json?.rate;
        if (r) {
          if (r.shop_name) setShopName(r.shop_name);
          if (r.shop_address) setShopAddress(r.shop_address);
          if (typeof r.per_gram === "number") setPerGram(String(r.per_gram));
          if (typeof r.per_gram_18k === "number") setPerGram18k(String(r.per_gram_18k));
          if (typeof r.per_gram_9k === "number") setPerGram9k(String(r.per_gram_9k));
          if (typeof r.per_sovereign === "number")
            setPerSovereign(String(r.per_sovereign));
          if (r.image_url) setPreviousImageUrl(r.image_url);
        }
      } catch (err) {
        console.error("Fetch failed:", err);
      }

      // Fetch latest settings to get the logo URL and theme colors for preview
      try {
        const sres = await fetch(`/api/settings?t=${Date.now()}`, { cache: "no-store" });
        const sjson = await sres.json();
        const settings = sjson?.settings;
        const logo = settings?.logoUrl as string | null | undefined;
        if (logo) {
          setPreviousLogoUrl(logo);
          // Only set the visible preview if user hasn't picked a new file yet
          setLogoPreviewUrl((prev) => (prev ? prev : logo));
        }
        if (settings?.primaryColor) {
          setPrimaryColor(settings.primaryColor);
        }
      } catch (err) {
        console.error("Settings fetch failed:", err);
      } finally {
        setInitialLoading(false);
      }
    })();
  }, []);

  // Auto calc per sovereign
  useEffect(() => {
    const g = Number(perGram);
    if (!isNaN(g) && perGram !== "") {
      const s = g * 8;
      setPerSovereign(Number.isInteger(s) ? String(s) : s.toFixed(2));
    } else setPerSovereign("");
  }, [perGram]);



  // Live logo preview
  useEffect(() => {
    if (logoFile) {
      const url = URL.createObjectURL(logoFile);
      setLogoPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (previousLogoUrl) {
      setLogoPreviewUrl(previousLogoUrl);
    } else {
      setLogoPreviewUrl(null);
    }
  }, [logoFile, previousLogoUrl]);

  // Crop functions
  const onCropComplete = useCallback((_a: any, p: any) => setCroppedAreaPixels(p), []);
  const createImage = (url: string) =>
    new Promise<HTMLImageElement>((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.crossOrigin = "anonymous";
      img.src = url;
    });
  const getCroppedDataUrl = useCallback(async (src: string, crop: any) => {
    const image = await createImage(src);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No canvas context");
    const width = 1200;
    const height = Math.round(width * 0.9); // match main card image aspect (pt-[90%])
    canvas.width = width;
    canvas.height = height;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);
    return canvas.toDataURL("image/png", 1);
  }, []);
  const confirmCrop = useCallback(async () => {
    if (!tempImageUrl || !croppedAreaPixels) return setCropOpen(false);
    try {
      const dataUrl = await getCroppedDataUrl(tempImageUrl, croppedAreaPixels);
      setCroppedDataUrl(dataUrl);
      setPreviousImageUrl(dataUrl);
    } catch (e) {
      console.error("Crop failed:", e);
    }
    setCropOpen(false);
  }, [tempImageUrl, croppedAreaPixels, getCroppedDataUrl]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout failed", e);
    } finally {
      setLoggingOut(false);
      router.replace("/admin/login");
    }
  };

  // HEIC conversion
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setCroppedDataUrl(null);
    setTempImageUrl(null);
    if (!f) return setFile(null);

    setImageProcessing(true);
    try {
      const isHeic =
        f.name.toLowerCase().endsWith(".heic") || (f.type && f.type.includes("heic"));

      let uploadFile: File = f;
      let lastError: any = null;

      if (isHeic) {
        try {
          const mod = await import("heic2any");
          const heic2any = (mod as any).default || mod;
          const convertedBlob = (await heic2any({ blob: f, toType: "image/png" })) as Blob;
          uploadFile = new File([convertedBlob], f.name.replace(/\.heic$/i, ".png"), {
            type: "image/png",
          });
        } catch (e) {
          // Client conversion failed; fall back to server conversion endpoint with original file
          lastError = e;
          const fd = new FormData();
          fd.append("file", f);
          const res = await fetch("/api/convert-upload", { method: "POST", body: fd });
          const json = await res.json();
          if (!res.ok || !json.publicUrl) throw new Error(json.error || "Invalid image");
          const url = json.publicUrl;
          setPreviousImageUrl(url);
          setTempImageUrl(url);
          setCropOpen(true);
          return; // done via convert endpoint
        }
      }

      // For non-HEIC or successfully converted HEIC, upload directly
      const fd = new FormData();
      fd.append("file", uploadFile);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.publicUrl) throw new Error(json.error || "Invalid image");
      const url = json.publicUrl;
      setPreviousImageUrl(url);
      setTempImageUrl(url);
      setCropOpen(true);
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("⚠️ Could not process this image. Try JPG/PNG.");
    } finally {
      setImageProcessing(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = previousImageUrl || undefined;
      let logoUrl = previousLogoUrl || undefined;
      if (logoFile) {
        const isHeicLogo =
          logoFile.name.toLowerCase().endsWith(".heic") ||
          (logoFile.type && logoFile.type.includes("heic"));

        let uploadLogo: File = logoFile;
        let uploadedUrl: string | null = null;

        if (isHeicLogo) {
          try {
            const mod = await import("heic2any");
            const heic2any = (mod as any).default || mod;
            const converted = (await heic2any({ blob: logoFile, toType: "image/png" })) as Blob;
            uploadLogo = new File([converted], logoFile.name.replace(/\.heic$/i, ".png"), {
              type: "image/png",
            });
          } catch (e) {
            // Fallback to server convert endpoint with original HEIC
            const fd = new FormData();
            fd.append("file", logoFile);
            fd.append("folder", "logos");
            const res = await fetch("/api/convert-upload", { method: "POST", body: fd });
            const json = await res.json();
            if (res.ok && json.publicUrl) uploadedUrl = json.publicUrl;
          }
        }

        if (!uploadedUrl) {
          const fd = new FormData();
          fd.append("file", uploadLogo);
          fd.append("folder", "logos");
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          const json = await res.json();
          if (res.ok && json.publicUrl) uploadedUrl = json.publicUrl;
        }

        if (uploadedUrl) logoUrl = uploadedUrl;
      }
      // First, persist theme + logo in settings
      {
        const sres = await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            theme: "classic",
            primaryColor,
            accentColor,
            bgColor,
            logoUrl: logoUrl ?? null,
          }),
        });
        if (!sres.ok) {
          const j = await sres.json().catch(() => ({}));
          throw new Error(j.error || "Failed to save settings");
        }
      }

      // Then, save the price/rate data
      {
        const rres = await fetch("/api/rates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            perGram: Number(perGram),
            perGram18k: perGram18k === "" ? null : Number(perGram18k),
            perGram9k: perGram9k === "" ? null : Number(perGram9k),
            perSovereign: Number(perSovereign),
            imageUrl,
            shopName,
            shopAddress,
            date,
          }),
        });
        if (!rres.ok) {
          const j = await rres.json().catch(() => ({}));
          throw new Error(j.error || "Failed to save rate");
        }
      }
      router.push("/");
    } catch (err) {
      console.error(err);
      alert("Failed to save data");
    } finally {
      setLoading(false);
    }
  };

  const canCrop = Boolean(tempImageUrl) && !imageProcessing;

  return (
    <main className="min-h-dvh bg-gradient-to-br from-gray-950 via-black to-amber-950 p-4">
      {/* Top bar with link to main page */}
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          {logoPreviewUrl && (
            <img
              src={logoPreviewUrl}
              alt="KGP Gold"
              className="mx-auto h-14 mb-4 object-contain"
            />
          )}
          <h1 className="text-2xl font-bold text-white mb-1">
            Update KGP Gold Rates
          </h1>
          <p className="text-amber-200/80 text-sm">
            Set today's gold prices and shop info
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-white/5 p-6 rounded-2xl border border-amber-500/20 space-y-5"
        >
          {/* Prices */}
          <div className="space-y-3">
            <label className="block text-amber-300 font-semibold">
              <FiDollarSign className="inline mr-2" /> Per Gram
            </label>
            <input
              type="number"
              step="0.01"
              value={perGram}
              onChange={(e) => setPerGram(e.target.value)}
              className="w-full rounded-xl bg-black/40 border border-amber-500/30 p-4 text-white"
              required
            />

            <label className="block text-amber-300 font-semibold">
              <FiAward className="inline mr-2" /> Per Sovereign
            </label>
            <input
              type="number"
              value={perSovereign}
              readOnly
              className="w-full rounded-xl bg-black/40 border border-amber-500/30 p-4 text-white"
            />

            <label className="block text-amber-300 font-semibold">
              <FiAward className="inline mr-2" /> 18K Per Gram
            </label>
            <input
              type="number"
              step="0.01"
              value={perGram18k}
              onChange={(e) => setPerGram18k(e.target.value)}
              className="w-full rounded-xl bg-black/40 border border-amber-500/30 p-4 text-white"
            />

            <label className="block text-amber-300 font-semibold">
              <FiAward className="inline mr-2" /> 9K Per Gram
            </label>
            <input
              type="number"
              step="0.01"
              value={perGram9k}
              onChange={(e) => setPerGram9k(e.target.value)}
              className="w-full rounded-xl bg-black/40 border border-amber-500/30 p-4 text-white"
            />
          </div>

          {/* Shop Info */}
          <input
            type="text"
            placeholder="Shop name"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            className="w-full rounded-xl bg-black/40 border border-amber-500/30 p-4 text-white"
            required
          />
          <input
            type="text"
            placeholder="Shop address"
            value={shopAddress}
            onChange={(e) => setShopAddress(e.target.value)}
            className="w-full rounded-xl bg-black/40 border border-amber-500/30 p-4 text-white"
            required
          />

          {/* Date */}
          <input
            type={supportsDate ? "date" : "text"}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl bg-black/40 border border-amber-500/30 p-4 text-white"
            required
          />

          {/* Background image */}
          <label className="block text-amber-300 text-sm font-semibold mb-2">
            <FiImage className="inline mr-2" /> Background Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full rounded-xl bg-black/40 border border-amber-500/30 p-4 text-white"
          />

          {/* Preview */}
          <div className="mt-3">
            <p className="text-amber-200/80 text-xs mb-1">Preview:</p>
            <div className="relative w-32 rounded-xl overflow-hidden border border-amber-500/30 bg-black/30">
              <div className="relative w-full pt-[90%]">
                {imageProcessing ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-amber-300 text-xs font-medium animate-pulse">
                    Converting...
                  </div>
                ) : croppedDataUrl ? (
                  <img
                    src={croppedDataUrl}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : previousImageUrl ? (
                  <img
                    src={previousImageUrl}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-amber-200/60 text-xs">No image</span>
                  </div>
                )}
              </div>
            </div>

            {/* Crop Button */}
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setCropOpen(true)}
                disabled={!canCrop}
                className={`mt-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  canCrop
                    ? "border-amber-500/40 text-amber-200 hover:bg-amber-500/10"
                    : "border-white/10 text-white/40 opacity-50 cursor-not-allowed"
                }`}
              >
                <FiScissors className="inline mr-1" /> Adjust Crop
              </button>
            </div>
          </div>

          {/* Logo Upload */}
          <label className="block text-amber-300 text-sm font-semibold mb-2 mt-3">
            <FiImage className="inline mr-2" /> Logo Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
            className="w-full rounded-xl bg-black/40 border border-amber-500/30 p-4 text-white"
          />

          <div className="mt-3">
            <p className="text-amber-200/80 text-xs mb-1">Logo Preview:</p>
            <div className="w-28 h-28 rounded-xl overflow-hidden border border-amber-500/30 bg-black/30 flex items-center justify-center">
              {logoPreviewUrl ? (
                <img
                  src={logoPreviewUrl}
                  alt="Logo preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-amber-200/60 text-xs">No logo</span>
              )}
            </div>

            {(previousLogoUrl || logoFile) && (
              <button
                type="button"
                onClick={() => {
                  setLogoFile(null);
                  setPreviousLogoUrl(null);
                  setLogoPreviewUrl(null);
                }}
                className="mt-2 px-3 py-2 rounded-lg text-xs font-semibold border border-white/10 text-amber-200 hover:bg-white/5 transition"
              >
                Remove Logo
              </button>
            )}
          </div>

          {/* 🎨 Colors */}
          <div className="pt-2 space-y-4">
            <h3 className="text-amber-300 text-sm font-semibold tracking-wide mb-1 inline-flex items-center gap-2">
              <FiSliders /> Theme Colors
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
              <div>
                <label className="block text-amber-100/80 text-xs font-semibold mb-1">
                  Primary
                </label>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-full h-10 rounded-md bg-black/30 border border-white/10"
                />
              </div>
              <div>
                <label className="block text-amber-100/80 text-xs font-semibold mb-1">
                  Accent <FiLock className="inline opacity-60" />
                </label>
                <input
                  type="color"
                  value={accentColor}
                  disabled
                  className="w-full h-10 rounded-md bg-black/20 border border-white/10 opacity-70"
                />
              </div>
              <div>
                <label className="block text-amber-100/80 text-xs font-semibold mb-1">
                  Background <FiLock className="inline opacity-60" />
                </label>
                <input
                  type="color"
                  value={bgColor}
                  disabled
                  className="w-full h-10 rounded-md bg-black/20 border border-white/10 opacity-70"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {palettes.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setPrimaryColor(p.primary)}
                  className={`p-1 rounded-xl border ${
                    primaryColor === p.primary
                      ? "border-amber-400"
                      : "border-white/10"
                  }`}
                  title={p.name}
                >
                  <span
                    className="block w-8 h-8 rounded-lg"
                    style={{
                      background: `linear-gradient(135deg, ${p.primary}, ${p.accent})`,
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 text-white font-bold py-4"
          >
            {loading ? "Saving..." : "Save Rate"}
          </button>

          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <Link
              href="/"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-amber-100 hover:bg-white/15 transition"
              title="Go to main page"
            >
              <FiExternalLink /> Main Page
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600/80 border border-red-500/60 px-4 py-3 text-white hover:bg-red-600 transition disabled:opacity-60"
              title="Logout"
            >
              <FiLogOut />
              {loggingOut ? "Logging out…" : "Logout"}
            </button>
          </div>
        </form>

        {/* Initial loader overlay */}
        {initialLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white">
              <div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              <span className="font-medium">Loading data…</span>
            </div>
          </div>
        )}
      </div>

      {/* Cropper */}
      {cropOpen && tempImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setCropOpen(false)}
          />
          <div className="relative z-10 w-[92vw] max-w-lg bg-gray-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-3 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm">
                Adjust Square Crop
              </h3>
              <button
                onClick={() => setCropOpen(false)}
                className="text-amber-200/80 hover:text-amber-300"
              >
                ✕
              </button>
            </div>
            <div className="relative" style={{ width: "100%", height: 360 }}>
              <Cropper
                image={tempImageUrl}
                crop={crop}
                zoom={zoom}
                aspect={10 / 9}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="rect"
                showGrid={false}
                objectFit="cover"
              />
            </div>
            <div className="p-3 flex items-center gap-3 border-t border-white/10">
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1"
              />
              <button
                onClick={() => setCropOpen(false)}
                className="px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/15"
              >
                Cancel
              </button>
              <button
                onClick={confirmCrop}
                className="px-4 py-2 rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-400"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
