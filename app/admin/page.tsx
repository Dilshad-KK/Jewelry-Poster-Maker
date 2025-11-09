"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Cropper from 'react-easy-crop';

export default function AdminPage() {
  const [perGram, setPerGram] = useState<string>("");
  const [perSovereign, setPerSovereign] = useState<string>("");
  const [shopName, setShopName] = useState<string>("");
  const [shopAddress, setShopAddress] = useState<string>("");
  const [date, setDate] = useState<string>("");
  // Feature-detect native date input support
  const supportsDate = useMemo(() => {
    if (typeof document === 'undefined') return true;
    const i = document.createElement('input');
    i.setAttribute('type', 'date');
    return i.type === 'date';
  }, []);
  const [file, setFile] = useState<File | null>(null);
  const [previousImageUrl, setPreviousImageUrl] = useState<string | null>(null);
  // Cropper state
  const [cropOpen, setCropOpen] = useState(false);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [croppedDataUrl, setCroppedDataUrl] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  // Colors palette (theme fixed to classic for now)
  const palettes = [
    { name: 'Gold', primary: '#f59e0b', accent: '#fbbf24', bg: '#451a03' },
    { name: 'Emerald', primary: '#10b981', accent: '#34d399', bg: '#064e3b' },
    { name: 'Ruby', primary: '#ef4444', accent: '#f87171', bg: '#7f1d1d' },
    { name: 'Sapphire', primary: '#3b82f6', accent: '#60a5fa', bg: '#0c4a6e' },
    { name: 'Amethyst', primary: '#8b5cf6', accent: '#a78bfa', bg: '#4c1d95' },
  ];
  const [primaryColor, setPrimaryColor] = useState<string>(palettes[0].primary);
  const [accentColor, setAccentColor] = useState<string>(palettes[0].accent);
  const [bgColor, setBgColor] = useState<string>(palettes[0].bg);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    const tzAdjusted = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    const todayLocal = tzAdjusted.toISOString().slice(0, 10);
    setDate(todayLocal);

    const prefill = async () => {
      try {
        const res = await fetch(`/api/rates?t=${Date.now()}`, { cache: 'no-store' });
        const json = await res.json();
        const r = json?.rate;
        if (r) {
          if (r.shop_name) setShopName(r.shop_name);
          if (r.shop_address) setShopAddress(r.shop_address);
          if (typeof r.per_gram === 'number') setPerGram(String(r.per_gram));
          if (typeof r.per_sovereign === 'number') setPerSovereign(String(r.per_sovereign));
          if (r.date) setDate(r.date);
          if (r.image_url) setPreviousImageUrl(r.image_url);
        }
        // Load color settings
        try {
          const sres = await fetch(`/api/settings?t=${Date.now()}`, { cache: 'no-store' });
          const sjson = await sres.json();
          const s = sjson?.settings;
          if (s) {
            if (s.primaryColor) setPrimaryColor(s.primaryColor);
            if (s.accentColor) setAccentColor(s.accentColor);
            if ((s as any).bgColor) setBgColor((s as any).bgColor);
          }
        } catch {}
      } catch {
        // ignore
      }
    };
    prefill();

    const onFocus = () => prefill();
    const onVis = () => { if (!document.hidden) prefill(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const onCropComplete = useCallback((_croppedArea: any, pixels: { x: number; y: number; width: number; height: number }) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const createImage = (url: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.crossOrigin = 'anonymous';
    img.src = url;
  });

  const getCroppedDataUrl = useCallback(async (imageSrc: string, pixelCrop: { x: number; y: number; width: number; height: number }) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No canvas context');
    // Output a square at sensible resolution
    const size = 1200;
    canvas.width = size;
    canvas.height = size;
    // Draw the cropped image into square canvas
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      image,
      pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
      0, 0, size, size
    );
    return canvas.toDataURL('image/png', 1);
  }, []);

  const openCropper = useCallback(() => {
    if (!file) return;
    // create object URL to feed into cropper
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setTempImageUrl(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCropOpen(true);
  }, [file]);

  const confirmCrop = useCallback(async () => {
    if (!tempImageUrl || !croppedAreaPixels) {
      setCropOpen(false);
      return;
    }
    try {
      const dataUrl = await getCroppedDataUrl(tempImageUrl, croppedAreaPixels);
      setCroppedDataUrl(dataUrl);
    } catch {
      // ignore
    } finally {
      setCropOpen(false);
    }
  }, [tempImageUrl, croppedAreaPixels, getCroppedDataUrl]);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      let imageUrl: string | undefined = previousImageUrl || undefined;
      if (file) {
        try {
          let uploadFile: File = file;
          // If user confirmed a crop, convert dataURL -> File for upload
          if (croppedDataUrl) {
            const res = await fetch(croppedDataUrl);
            const blob = await res.blob();
            uploadFile = new File([blob], file.name.replace(/\.(\w+)$/, '') + '-cropped.png', { type: 'image/png' });
          }
          const fd = new FormData();
          fd.append('file', uploadFile);
          const up = await fetch('/api/upload', {
            method: 'POST',
            body: fd,
          });
          if (up.ok) {
            const uploaded = await up.json();
            imageUrl = uploaded.publicUrl || previousImageUrl || undefined;
          } else {
            // keep previous image if upload fails
            const j = await up.json().catch(() => ({}));
            setMessage((j.error ? `Upload failed: ${j.error}` : 'Upload failed') + ' — keeping previous image.');
          }
        } catch (e: any) {
          setMessage('Upload failed — keeping previous image.');
        }
      }

      const body = {
        perGram: Number(perGram),
        perSovereign: Number(perSovereign),
        imageUrl,
        shopName: shopName || undefined,
        shopAddress: shopAddress || undefined,
        date: date || undefined,
      };

      if (!body.perGram || !body.perSovereign) {
        throw new Error('Enter valid numbers for prices');
      }

      const res = await fetch('/api/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to save rate');
      }
      // Save color settings (non-blocking)
      try {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ primaryColor, accentColor, bgColor }),
        });
      } catch {}
      setMessage('✅ Saved successfully! View at /');
      setPerGram("");
      setPerSovereign("");
      setFile(null);
    } catch (err: any) {
      setMessage(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh bg-gradient-to-br from-gray-950 via-black to-amber-950 p-4">
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="mt-2 sm:mt-4">
            <img
              src="/logo.jpg"
              alt="KGP Gold"
              className="block mx-auto h-14 sm:h-16 w-auto mb-4 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Update KGP Gold Rates
          </h1>
          <p className="text-amber-200/80 text-sm">
            Set today's gold prices and shop information
          </p>
        </div>

        {/* Buttons moved below form */}

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-5 bg-white/5 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-6 shadow-2xl">

          {/* Price Fields */}
          <div className="space-y-4">
            <div className="group">
              <label className="block text-amber-300 text-sm font-semibold mb-2 tracking-wide">
                💰 Per Gram (INR)
              </label>
              <input
                type="number"
                step="0.01"
                value={perGram}
                onChange={(e) => setPerGram(e.target.value)}
                className="w-full rounded-xl bg-black/40 border border-amber-500/30 p-4 text-white placeholder-amber-200/50 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all duration-300"
                placeholder="Enter per gram rate"
                required
              />
            </div>

            <div className="group">
              <label className="block text-amber-300 text-sm font-semibold mb-2 tracking-wide">
                👑 Per Sovereign (INR)
              </label>
              <input
                type="number"
                step="0.01"
                value={perSovereign}
                onChange={(e) => setPerSovereign(e.target.value)}
                className="w-full rounded-xl bg-black/40 border border-amber-500/30 p-4 text-white placeholder-amber-200/50 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all duration-300"
                placeholder="Enter per sovereign rate"
                required
              />
            </div>
          </div>

          {/* Shop Info */}
          <div className="space-y-4">
            <div className="group">
              <label className="block text-amber-300 text-sm font-semibold mb-2 tracking-wide">
                🏪 Shop Name
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full rounded-xl bg-black/40 border border-amber-500/30 p-4 text-white placeholder-amber-200/50 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all duration-300"
                placeholder="KGP Gold, Mangalya Complex"
                required
              />
            </div>

            <div className="group">
              <label className="block text-amber-300 text-sm font-semibold mb-2 tracking-wide">
                📍 Shop Address
              </label>
              <input
                type="text"
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                className="w-full rounded-xl bg-black/40 border border-amber-500/30 p-4 text-white placeholder-amber-200/50 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all duration-300"
                placeholder="Main Road, Koduvally"
                required
              />
            </div>
        </div>

        {/* Date & File */}
        <div className="space-y-4">
            <div className="group">
              <label htmlFor="rate-date" className="block text-amber-300 text-sm font-semibold mb-2 tracking-wide">
                📅 Date
              </label>
              <input
                id="rate-date"
                type={supportsDate ? 'date' : 'text'}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onFocus={(e) => (e.currentTarget as any).showPicker?.()}
                onClick={(e) => (e.currentTarget as any).showPicker?.()}
                inputMode={supportsDate ? undefined : 'numeric'}
                placeholder={supportsDate ? undefined : 'YYYY-MM-DD'}
                pattern={supportsDate ? undefined : '\\d{4}-\\d{2}-\\d{2}'}
                className="w-full rounded-xl bg-black/40 border border-amber-500/30 p-4 text-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all duration-300 cursor-pointer"
                required
              />
            </div>

            <div className="group">
              <label className="block text-amber-300 text-sm font-semibold mb-2 tracking-wide">
                🖼️ Background Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setFile(f);
                  setCroppedDataUrl(null);
                }}
                className="w-full rounded-xl bg-black/40 border border-amber-500/30 p-4 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-500 file:text-white hover:file:bg-amber-400 transition-all duration-300"
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={openCropper}
                  disabled={!file}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold border transition ${file ? 'border-amber-500/40 text-amber-200 hover:bg-amber-500/10' : 'border-white/10 text-white/40 cursor-not-allowed'}`}
                >
                  ✂️ Adjust Square Crop
                </button>
                {previousImageUrl && !file && (
                  <span className="text-xs text-amber-200/70">No new image selected — keeping previous image.</span>
                )}
              </div>
              {croppedDataUrl && (
                <div className="mt-3">
                  <p className="text-amber-200/80 text-xs mb-1">Preview (square, like home page):</p>
                  <div className="w-32 h-32 rounded-xl overflow-hidden border border-amber-500/30">
                    <img src={croppedDataUrl} alt="Cropped preview" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Colors */}
          <div className="pt-2">
            <h3 className="text-amber-300 text-sm font-semibold tracking-wide mb-2">Colors</h3>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-amber-100/80 text-xs font-semibold mb-1">Quick Palettes</label>
                <div className="flex gap-2 flex-wrap">
                  {palettes.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => { setPrimaryColor(p.primary); setAccentColor(p.accent); setBgColor(p.bg); }}
                      className={`group rounded-xl p-1 border ${primaryColor===p.primary && accentColor===p.accent && bgColor===p.bg ? 'border-amber-400' : 'border-white/10'}`}
                      title={p.name}
                    >
                      <span className="block w-8 h-8 rounded-lg" style={{ background: `linear-gradient(135deg, ${p.primary}, ${p.accent})` }} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-amber-100/80 text-xs font-semibold mb-1">Primary</label>
                  <input type="color" value={primaryColor} onChange={(e)=>setPrimaryColor(e.target.value)} className="w-full h-10 rounded-md bg-black/30 border border-white/10" />
                </div>
                <div>
                  <label className="block text-amber-100/80 text-xs font-semibold mb-1">Accent</label>
                  <input type="color" value={accentColor} onChange={(e)=>setAccentColor(e.target.value)} className="w-full h-10 rounded-md bg-black/30 border border-white/10" />
                </div>
                <div>
                  <label className="block text-amber-100/80 text-xs font-semibold mb-1">Background</label>
                  <input type="color" value={bgColor} onChange={(e)=>setBgColor(e.target.value)} className="w-full h-10 rounded-md bg-black/30 border border-white/10" />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button & Message */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-white font-bold py-4 px-6 shadow-2xl transform hover:scale-105 disabled:opacity-60 disabled:scale-100 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>💾 Save Rate</span>
                </>
              )}
            </button>

            {message && (
              <div className={`mt-4 text-center text-sm font-semibold p-3 rounded-xl ${message.includes('✅')
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                {message}
              </div>
            )}
          </div>
        </form>

        {/* Go to Main Page */}
        <div className="mt-4">
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white py-3 font-semibold hover:bg-white/15 transition-all duration-300"
          >
            🏠 Go to Main Page
          </Link>
        </div>

        {/* Logout Button */}
        <form action="/api/auth/logout" method="POST" className="mt-3">
          <button className="w-full rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white py-3 font-semibold hover:bg-white/15 transition-all duration-300">
            🔒 Logout
          </button>
        </form>

        {/* Footer Note */}
        <p className="text-xs text-amber-200/50 text-center mt-6 p-3 bg-black/30 rounded-xl border border-amber-500/10">
          🔐 Protected by admin authentication
        </p>

      </div>
      {/* Cropper Modal */}
      {cropOpen && tempImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setCropOpen(false)} />
          <div className="relative z-10 w-[92vw] max-w-lg bg-gray-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-3 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm">Adjust Square Crop</h3>
              <button onClick={() => setCropOpen(false)} className="text-amber-200/80 hover:text-amber-300">✕</button>
            </div>
            <div className="relative" style={{ width: '100%', height: 360 }}>
              <Cropper
                image={tempImageUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
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
                onChange={(e)=>setZoom(Number(e.target.value))}
                className="flex-1"
              />
              <button onClick={() => setCropOpen(false)} className="px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/15">Cancel</button>
              <button onClick={confirmCrop} className="px-4 py-2 rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-400">Apply</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
