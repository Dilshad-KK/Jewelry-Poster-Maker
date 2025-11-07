"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  const [perGram, setPerGram] = useState<string>("");
  const [perSovereign, setPerSovereign] = useState<string>("");
  const [shopName, setShopName] = useState<string>("");
  const [shopAddress, setShopAddress] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [previousImageUrl, setPreviousImageUrl] = useState<string | null>(null);
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      let imageUrl: string | undefined = previousImageUrl || undefined;
      if (file) {
        try {
          const fd = new FormData();
          fd.append('file', file);
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
              <label className="block text-amber-300 text-sm font-semibold mb-2 tracking-wide">
                📅 Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl bg-black/40 border border-amber-500/30 p-4 text-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all duration-300"
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
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl bg-black/40 border border-amber-500/30 p-4 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-500 file:text-white hover:file:bg-amber-400 transition-all duration-300"
              />
              {previousImageUrl && (
                <p className="mt-2 text-xs text-amber-200/70">No new image selected — keeping previous image.</p>
              )}
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
    </main>
  );
}
