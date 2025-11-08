"use client";
export const dynamic = "force-static";
import { useEffect, useRef, useState } from "react";
import * as htmlToImage from "html-to-image";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frontCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const shareBtnRef = useRef<HTMLButtonElement | null>(null);
  const [rate, setRate] = useState<{
    date?: string;
    per_gram?: number;
    per_sovereign?: number;
    image_url?: string | null;
    shop_name?: string | null;
    shop_address?: string | null;
  } | null>(null);
  const [displayImg, setDisplayImg] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [hideShare, setHideShare] = useState<boolean>(false);

  const exportCard = async () => {
    const node = cardRef.current;
    if (!node || exporting) return;
    try {
      setExporting(true);
      // hide share button during capture
      setHideShare(true);
      await new Promise((r) => setTimeout(r, 60));
      const dataUrl = await htmlToImage.toPng(node, {
        cacheBust: true,
        pixelRatio: Math.min(2, window.devicePixelRatio || 1.5),
        backgroundColor: "#0b0b0b",
        // try to inline images cross-origin
        quality: 1,
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const date = new Date();
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      const fileName = `kgp-gold-${y}${m}${d}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "KGP Gold", text: "Today’s Gold Rate" });
      } else {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("Export failed", e);
    } finally {
      setHideShare(false);
      setExporting(false);
    }
  };

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch('/api/rates', { cache: 'no-store' });
        const json = await res.json();
        const latest = json?.rate ?? null;
        setRate(latest);

        // Preload new image while keeping the old one visible
        const url = latest?.image_url as string | undefined;
        if (!url) {
          setDisplayImg(null);
          setImageLoading(false);
        } else if (url !== displayImg) {
          const img = new Image();
          img.src = url;
          if (img.complete && img.naturalWidth > 0) {
            // Already in cache, swap instantly without spinner
            setDisplayImg(url);
            setImageLoading(false);
          } else {
            setImageLoading(true);
            img.onload = () => {
              setDisplayImg(url);
              setImageLoading(false);
            };
            img.onerror = () => {
              setImageLoading(false);
            };
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to fetch rate', e);
      }
    };
    fetchRate();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const particles: {
      x: number;
      y: number;
      r: number;
      vx: number;
      vy: number;
      alpha: number;
      tw: number;
    }[] = [];

    const resize = () => {
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      const count = w < 480 ? 40 : w < 768 ? 60 : 90;
      particles.length = 0;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 1 + Math.random() * 2.2,
          vx: (Math.random() * 0.4 - 0.2),
          vy: 0.6 + Math.random() * 1.3,
          alpha: 0.6 + Math.random() * 0.4,
          tw: Math.random() * Math.PI * 2,
        });
      }
    };

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      // soft vignette
      const grd = ctx.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, "rgba(0,0,0,0)");
      grd.addColorStop(1, "rgba(0,0,0,0.08)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);

      const time = performance.now() / 1000;
      for (const p of particles) {
        // movement
        p.x += p.vx + Math.sin(p.tw + time * 1.2) * 0.15;
        p.y += p.vy;
        if (p.y - p.r > h) {
          p.y = -p.r - Math.random() * 20;
          p.x = Math.random() * w;
        }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;

        // glow circle
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = "rgba(255,207,64,0.9)";
        ctx.shadowBlur = 10;
        ctx.fillStyle = "#ffcf40";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // occasional sparkle
        if (((p.tw * 1000) | 0) % 17 === 0) {
          const s = p.r * 1.5;
          ctx.save();
          ctx.globalAlpha = p.alpha * 0.8;
          ctx.strokeStyle = "rgba(255,230,150,0.8)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x - s, p.y);
          ctx.lineTo(p.x + s, p.y);
          ctx.moveTo(p.x, p.y - s);
          ctx.lineTo(p.x, p.y + s);
          ctx.stroke();
          ctx.restore();
        }
      }

      raf = requestAnimationFrame(draw);
    };

    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        raf = requestAnimationFrame(draw);
      }
    };

    resize();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVis);

    // FRONT CANVAS inside card (particles in front of card background)
    const frontCanvas = frontCanvasRef.current;
    const cardEl = cardRef.current;
    let raf2 = 0;
    let ro: ResizeObserver | null = null;
    let ctx2: CanvasRenderingContext2D | null = null;
    const particles2: { x: number; y: number; r: number; vx: number; vy: number; alpha: number; tw: number }[] = [];

    const resizeFront = () => {
      if (!frontCanvas || !cardEl) return;
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const rect = cardEl.getBoundingClientRect();
      frontCanvas.width = Math.floor(rect.width * dpr);
      frontCanvas.height = Math.floor(rect.height * dpr);
      frontCanvas.style.width = `${rect.width}px`;
      frontCanvas.style.height = `${rect.height}px`;
      ctx2 = frontCanvas.getContext("2d");
      if (!ctx2) return;
      ctx2.setTransform(1, 0, 0, 1, 0, 0);
      ctx2.scale(dpr, dpr);
      const count = rect.width < 420 ? 14 : 22;
      particles2.length = 0;
      for (let i = 0; i < count; i++) {
        particles2.push({
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          r: 0.6 + Math.random() * 1.2,
          vx: (Math.random() * 0.3 - 0.15),
          vy: 0.5 + Math.random() * 0.9,
          alpha: 0.35 + Math.random() * 0.35,
          tw: Math.random() * Math.PI * 2,
        });
      }
    };

    const drawFront = () => {
      if (!frontCanvas || !ctx2) return;
      const w = frontCanvas.clientWidth;
      const h = frontCanvas.clientHeight;
      ctx2.clearRect(0, 0, w, h);
      const time = performance.now() / 1000;
      for (const p of particles2) {
        p.x += p.vx + Math.sin(p.tw + time * 1.4) * 0.12;
        p.y += p.vy;
        if (p.y - p.r > h) {
          p.y = -p.r - Math.random() * 10;
          p.x = Math.random() * w;
        }
        if (p.x < -8) p.x = w + 8;
        if (p.x > w + 8) p.x = -8;

        // small glow
        ctx2.save();
        ctx2.globalAlpha = p.alpha;
        ctx2.shadowColor = "rgba(255,207,64,0.8)";
        ctx2.shadowBlur = 6;
        ctx2.fillStyle = "#ffcf40";
        ctx2.beginPath();
        ctx2.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx2.fill();
        ctx2.restore();
      }
      raf2 = requestAnimationFrame(drawFront);
    };

    if (frontCanvas && cardEl) {
      resizeFront();
      drawFront();
      ro = new ResizeObserver(resizeFront);
      ro.observe(cardEl);
      window.addEventListener("resize", resizeFront);
    }

    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
      cancelAnimationFrame(raf);
      if (frontCanvas && cardEl) {
        window.removeEventListener("resize", resizeFront);
      }
      cancelAnimationFrame(raf2);
      if (ro && cardEl) ro.disconnect();
    };
  }, []);

  return (
    <main className="relative min-h-[100dvh] w-full bg-gradient-to-br from-gray-950 via-black to-amber-950 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Falling gold particles canvas */}
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" />

      <div className="relative z-10 w-full max-w-md overflow-hidden">
        
        {/* Background Elements */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-amber-600/10 rounded-full blur-3xl"></div>
        
        {/* Main Card */}
        <div ref={cardRef} className="relative bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl rounded-3xl border border-amber-500/20 shadow-2xl overflow-hidden">
          {/* Share button (top-right) */}
          <button
            ref={shareBtnRef}
            onClick={exportCard}
            aria-label="Share image"
            className={`absolute top-2 right-2 z-30 inline-flex items-center justify-center rounded-full bg-amber-500 text-black shadow-lg hover:scale-105 active:scale-95 transition-transform duration-150 ${hideShare ? "opacity-0 pointer-events-none" : "opacity-100"}`}
            style={{ width: 36, height: 36 }}
            title="Share / Save image"
            disabled={exporting}
          >
            {exporting ? (
              <span className="block w-4 h-4 rounded-full border-2 border-black/70 border-t-transparent animate-spin" />
            ) : (
              // Filled share icon (custom SVG), golden button with black icon for contrast
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7a3.048 3.048 0 0 0 0-1.39l7.05-4.11A2.99 2.99 0 1 0 14 4a2.99 2.99 0 0 0 .04.49L7 8.6A3 3 0 1 0 7 15.4l7.04 4.11c-.02.16-.04.32-.04.49a3 3 0 1 0 3-3.92z" />
              </svg>
            )}
          </button>
          
          {/* Top Decorative Strip */}
          <div className="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
          {/* Front particles overlay within card */}
          <canvas ref={frontCanvasRef} className="pointer-events-none absolute inset-0 z-10" />

          <div className="relative z-20 flex flex-col items-center space-y-4 p-4 sm:space-y-6 sm:p-6">
            
            {/* Logo */}
            <div className="mt-2 sm:mt-4">
              <img
                src="/logo.jpg"
                alt="KGP Gold"
                className="h-14 sm:h-16 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
              />
            </div>

            {/* Header */}
            <div className="text-center space-y-2 sm:space-y-3">
              {/* <div className="inline-flex items-center space-x-2 text-amber-400/80 text-xs font-semibold tracking-widest uppercase">
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></div>
                <span>Live Gold Rates</span>
              </div> */}
              
              <h1 className="text-2xl font-bold tracking-tight font-serif">
                <span className="text-white">Today's</span>{' '}
                <span className="text-transparent bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text">
                  Gold Rate
                </span>
              </h1>
              
              <div className="inline-flex items-center space-x-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-amber-100 font-semibold text-sm">
                  {(() => {
                    const d = rate?.date ? new Date(rate.date) : new Date();
                    const day = String(d.getDate()).padStart(2, '0');
                    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
                    const year = d.getFullYear();
                    return `${day} / ${month} / ${year}`;
                  })()}
                </span>
              </div>
            </div>

            {/* Jewellery Image - square within constraints */}
            <div className="relative w-full max-w-[260px] sm:max-w-xs">
              <div className="absolute -inset-3 bg-amber-500/10 rounded-2xl blur-xl"></div>
              <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 shadow-2xl">
                <div className="relative w-full pt-[100%]">{/* 1:1 square */}
                  {displayImg ? (
                    <img
                      src={displayImg}
                      alt="Gold Jewellery"
                      className="absolute inset-0 w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                      <span className="text-amber-200/60 text-xs">No image</span>
                    </div>
                  )}
                  {imageLoading && (
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              </div>
            </div>

            {/* Price Cards: two per row on mobile */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
              {/* Per Gram */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-300"></div>
                <div className="relative bg-gray-900/80 backdrop-blur-sm border border-amber-500/20 rounded-xl p-3 sm:p-4 text-center group-hover:border-amber-500/40 transition-all duration-300">
                  <div className="text-2xl font-black text-amber-300 mb-1">
                    ₹ {rate?.per_gram?.toLocaleString('en-IN') ?? '—'}
                  </div>
                  <div className="text-amber-100/80 text-xs font-semibold uppercase tracking-wider">
                    Per Gram
                  </div>
                </div>
              </div>

              {/* Per Sovereign */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-300"></div>
                <div className="relative bg-gray-900/80 backdrop-blur-sm border border-amber-500/20 rounded-xl p-3 sm:p-4 text-center group-hover:border-amber-500/40 transition-all duration-300">
                  <div className="text-2xl font-black text-amber-300 mb-1">
                    ₹ {rate?.per_sovereign?.toLocaleString('en-IN') ?? '—'}
                  </div>
                  <div className="text-amber-100/80 text-xs font-semibold uppercase tracking-wider">
                    Per Sovereign
                  </div>
                </div>
              </div>
            </div>

            {/* Shop Info */}
            <div className="text-center w-full">
              <p className="text-amber-200/90 font-medium tracking-wide bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-2 text-sm">
                🏛️ {rate?.shop_name || 'KGP Gold, Mangalya Complex'}<br />
                <span className="text-amber-100/70 text-xs">{rate?.shop_address || 'Main Road, Koduvally'}</span>
              </p>
            </div>

            {/* CTA removed in favor of share icon */}

            {/* Accent Elements removed to fit within 100dvh */}

          </div>

          {/* Bottom Decorative Strip */}
          <div className="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
        </div>

        {/* Floating Elements */}
        <div className="absolute top-2 right-2 w-3 h-3 bg-amber-400 rounded-full opacity-60 animate-bounce"></div>
        <div className="absolute bottom-2 left-2 w-2 h-2 bg-amber-300 rounded-full opacity-40 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        
      </div>
    </main>
  );
}
