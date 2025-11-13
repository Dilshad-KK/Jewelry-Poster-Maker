"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiHome,
  FiLogOut,
  FiImage,
  FiSave,
  FiScissors,
  FiSliders,
  FiShoppingBag,
  FiMapPin,
  FiCalendar,
  FiDollarSign,
  FiAward,
  FiLock,
} from "react-icons/fi";
import Cropper from "react-easy-crop";

// 🔸 Helper for HEIC → PNG preview
async function convertHeicToPngBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const heic2any = (await import("heic2any")).default;
  const blob = (await heic2any({ blob: new Blob([buffer]), toType: "image/png" })) as Blob;
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function AdminPage() {
  const router = useRouter();

  const [perGram, setPerGram] = useState("");
  const [perSovereign, setPerSovereign] = useState("");
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [date, setDate] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previousImageUrl, setPreviousImageUrl] = useState<string | null>(null);
  const [previousLogoUrl, setPreviousLogoUrl] = useState<string | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [croppedDataUrl, setCroppedDataUrl] = useState<string | null>(null);

  const [cropOpen, setCropOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const supportsDate = useMemo(() => {
    if (typeof document === "undefined") return true;
    const i = document.createElement("input");
    i.setAttribute("type", "date");
    return i.type === "date";
  }, []);

  // 🔸 Prefill from DB
  useEffect(() => {
    (async () => {
      try {
        const rateRes = await fetch(`/api/rates?t=${Date.now()}`, { cache: "no-store" });
        const rateJson = await rateRes.json();
        const r = rateJson?.rate;
        if (r) {
          if (r.per_gram) setPerGram(String(r.per_gram));
          if (r.per_sovereign) setPerSovereign(String(r.per_sovereign));
          if (r.shop_name) setShopName(r.shop_name);
          if (r.shop_address) setShopAddress(r.shop_address);
          if (r.image_url) setPreviousImageUrl(r.image_url);
        }

        const setRes = await fetch(`/api/settings?t=${Date.now()}`, { cache: "no-store" });
        const setJson = await setRes.json();
        if (setJson?.settings?.logoUrl) setPreviousLogoUrl(setJson.settings.logoUrl);
      } catch {}
    })();

    const now = new Date();
    const tzAdjusted = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    setDate(tzAdjusted.toISOString().slice(0, 10));
  }, []);

  // 🔸 Auto update perSovereign
  useEffect(() => {
    const g = Number(perGram);
    if (!isNaN(g) && perGram !== "") {
      const s = g * 8;
      const formatted = Number.isInteger(s) ? String(s) : s.toFixed(2);
      setPerSovereign(formatted);
    } else setPerSovereign("");
  }, [perGram]);

  // 🔸 Logo preview
  useEffect(() => {
    if (logoFile) {
      const url = URL.createObjectURL(logoFile);
      setLogoPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setLogoPreviewUrl(previousLogoUrl || null);
    }
  }, [logoFile, previousLogoUrl]);

  // 🔸 Cropper setup
  const createImage = (url: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });

  const getCroppedDataUrl = useCallback(async (src: string, crop: any) => {
    const image = await createImage(src);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const size = 1200;
    canvas.width = size;
    canvas.height = size;
    ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, size, size);
    return canvas.toDataURL("image/png", 1);
  }, []);

  const onCropComplete = useCallback((_a: any, b: any) => setCroppedAreaPixels(b), []);

  const openCropper = () => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setTempImageUrl(url);
    setCropOpen(true);
  };

  const confirmCrop = async () => {
    if (!tempImageUrl || !croppedAreaPixels) return setCropOpen(false);
    try {
      const cropped = await getCroppedDataUrl(tempImageUrl, croppedAreaPixels);
      setCroppedDataUrl(cropped);
    } catch {}
    setCropOpen(false);
  };

  // 🔸 Handle background image input (with HEIC fix)
  const handleBgImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    let previewUrl: string | null = null;

    if (/\.(heic|heif)$/i.test(f.name)) {
      try {
        previewUrl = await convertHeicToPngBase64(f);
        const blob = await (await fetch(previewUrl)).blob();
        const pngFile = new File([blob], f.name.replace(/\.\w+$/, ".png"), { type: "image/png" });
        setFile(pngFile);
      } catch {
        alert("Couldn't preview this HEIC file, but it will convert on upload.");
        setFile(f);
      }
    } else {
      setFile(f);
      previewUrl = URL.createObjectURL(f);
    }

    if (previewUrl) {
      setCroppedDataUrl(previewUrl);
      setTempImageUrl(previewUrl);
    }
  };

  // 🔸 Submit
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = previousImageUrl || undefined;
      let logoUrl = previousLogoUrl || undefined;

      // BG upload → /api/convert-upload
      if (file) {
        let uploadFile = file;
        if (croppedDataUrl) {
          const blob = await (await fetch(croppedDataUrl)).blob();
          uploadFile = new File([blob], file.name.replace(/\.\w+$/, "") + "-cropped.png", { type: "image/png" });
        }
        const fd = new FormData();
        fd.append("file", uploadFile);
        const up = await fetch("/api/convert-upload", { method: "POST", body: fd });
        const json = await up.json();
        if (up.ok && json.publicUrl) imageUrl = json.publicUrl;
      }

      // Logo → /api/upload
      if (logoFile) {
        const fd = new FormData();
        fd.append("file", logoFile);
        fd.append("folder", "logos");
        const up = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await up.json();
        if (up.ok && json.publicUrl) logoUrl = json.publicUrl;
      }

      await fetch("/api/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          perGram: Number(perGram),
          perSovereign: Number(perSovereign),
          shopName,
          shopAddress,
          imageUrl,
          date,
        }),
      });

      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl }),
      });

      router.push("/");
    } catch (err) {
      console.error(err);
      alert("Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-amber-950 p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <img src={logoPreviewUrl || "/logo.jpg"} alt="KGP Gold" className="mx-auto h-14 mb-4 object-contain" />
          <h1 className="text-2xl font-bold text-white mb-1">Update KGP Gold Rates</h1>
          <p className="text-amber-200/80 text-sm">Set today’s gold prices and shop info</p>
        </div>

        <form onSubmit={onSubmit} className="bg-white/5 p-6 rounded-2xl border border-amber-500/20 space-y-5">
          {/* Fields */}
          <div>
            <label className="block text-amber-300 text-sm mb-2"><FiDollarSign className="inline mr-2" />Per Gram (INR)</label>
            <input value={perGram} onChange={(e) => setPerGram(e.target.value)} type="number" step="0.01"
              className="w-full rounded-xl bg-black/40 border border-amber-500/30 p-4 text-white" />
          </div>
          <div>
            <label className="block text-amber-300 text-sm mb-2"><FiAward className="inline mr-2" />Per Sovereign (INR)</label>
            <input value={perSovereign} readOnly type="number"
              className="w-full rounded-xl bg-black/40 border border-amber-500/30 p-4 text-white" />
          </div>

          {/* Shop Info */}
          <div>
            <label className="block text-amber-300 text-sm mb-2"><FiShoppingBag className="inline mr-2" />Shop Name</label>
            <input value={shopName} onChange={(e) => setShopName(e.target.value)} type="text"
              className="w-full rounded-xl bg-black/40 border border-amber-500/30 p-4 text-white" />
          </div>
          <div>
            <label className="block text-amber-300 text-sm mb-2"><FiMapPin className="inline mr-2" />Shop Address</label>
            <input value={shopAddress} onChange={(e) => setShopAddress(e.target.value)} type="text"
              className="w-full rounded-xl bg-black/40 border border-amber-500/30 p-4 text-white" />
          </div>

          {/* Date */}
          <div>
            <label className="block text-amber-300 text-sm mb-2"><FiCalendar className="inline mr-2" />Date</label>
            <input type={supportsDate ? "date" : "text"} value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl bg-black/40 border border-amber-500/30 p-4 text-white" />
          </div>

          {/* Background image with HEIC handling */}
          <div>
            <label className="block text-amber-300 text-sm mb-2"><FiImage className="inline mr-2" />Background Image</label>
            <input type="file" accept="image/*,.heic,.heif" onChange={handleBgImageChange}
              className="w-full rounded-xl bg-black/40 border border-amber-500/30 p-4 text-white" />
            <div className="mt-3 flex gap-3">
              <button type="button" onClick={openCropper} disabled={!file}
                className={`px-3 py-2 rounded-lg border text-sm ${file
                  ? "border-amber-500/40 text-amber-200 hover:bg-amber-500/10"
                  : "border-white/10 text-white/40 cursor-not-allowed"}`}>
                <FiScissors className="inline mr-1" /> Adjust Crop
              </button>
            </div>
            {croppedDataUrl && (
              <div className="mt-3">
                <p className="text-xs text-amber-200/80 mb-1">Preview:</p>
                <img src={croppedDataUrl} className="rounded-xl border border-amber-500/30 w-32 h-32 object-cover" />
              </div>
            )}
          </div>

          {/* Logo upload */}
          <div>
            <label className="block text-amber-300 text-sm mb-2"><FiImage className="inline mr-2" />Logo Image</label>
            <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              className="w-full rounded-xl bg-black/40 border border-amber-500/30 p-4 text-white" />
            <div className="mt-2 flex items-center gap-3">
              {logoPreviewUrl ? (
                <img src={logoPreviewUrl} className="w-16 h-16 object-contain border border-amber-500/30 rounded-lg" />
              ) : (
                <span className="text-xs text-amber-200/60">No logo</span>
              )}
              {(logoFile || previousLogoUrl) && (
                <button type="button" onClick={() => { setLogoFile(null); setPreviousLogoUrl(null); setLogoPreviewUrl(null); }}
                  className="px-3 py-2 rounded-lg text-xs font-semibold border border-white/10 text-amber-200 hover:bg-white/5">
                  Remove Logo
                </button>
              )}
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white rounded-xl py-4 font-semibold">
            {loading ? "Saving..." : <><FiSave className="inline mr-2" /> Save</>}
          </button>
        </form>

        <Link href="/" className="block text-center mt-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15">
          <FiHome className="inline mr-2" /> Go to Main Page
        </Link>
        <form action="/api/auth/logout" method="POST" className="mt-3">
          <button className="w-full py-3 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 inline-flex items-center justify-center gap-2">
            <FiLogOut /> Logout
          </button>
        </form>
      </div>

      {/* Cropper */}
      {cropOpen && tempImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setCropOpen(false)} />
          <div className="relative z-10 w-[90vw] max-w-lg bg-gray-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-3 border-b border-white/10 flex justify-between">
              <h3 className="text-white text-sm font-semibold">Adjust Square Crop</h3>
              <button onClick={() => setCropOpen(false)} className="text-amber-200 hover:text-amber-300">✕</button>
            </div>
            <div className="relative" style={{ width: "100%", height: 360 }}>
              <Cropper
                image={tempImageUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="p-3 flex items-center gap-3 border-t border-white/10">
              <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1" />
              <button onClick={() => setCropOpen(false)} className="px-4 py-2 bg-white/10 text-white rounded-lg border border-white/20">Cancel</button>
              <button onClick={confirmCrop} className="px-4 py-2 bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-400">Apply</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
