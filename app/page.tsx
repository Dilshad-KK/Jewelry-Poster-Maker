"use client";
export const dynamic = "force-static";
import { useEffect, useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import ClassicCard from "@/components/ClassicCard";
// import OverlayCard from "@/components/OverlayCard"; // Theme/layout deferred

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
  // Defer theme/layout: keep simple defaults
  const [settings, setSettings] = useState<{ theme: 'classic' | 'overlay'; primaryColor?: string | null; accentColor?: string | null; bgColor?: string | null }>({ theme: 'classic', primaryColor: '#fbbf24', accentColor: null, bgColor: '#451a03' });

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
    // Load color settings (theme still fixed to classic)
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' });
        const json = await res.json();
        const s = json?.settings;
        if (s) setSettings((prev) => ({ ...prev, primaryColor: s.primaryColor ?? prev.primaryColor, accentColor: s.accentColor ?? prev.accentColor, bgColor: (s as any).bgColor ?? prev.bgColor }));
      } catch {}
    };
    fetchRate();
    fetchSettings();
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
    <main
      className="relative min-h-[100dvh] w-full bg-gradient-to-br from-gray-950 via-black to-amber-950 flex items-center justify-center px-4 py-2 sm:px-6 overflow-hidden"
      style={{ backgroundImage: `linear-gradient(to bottom right, #0b0b0b, ${settings.bgColor || '#451a03'})` }}
    >
      {/* Falling gold particles canvas */}
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" />

      <div className="relative z-10 w-full max-w-md overflow-hidden">
        
        {/* Background Elements */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-amber-600/10 rounded-full blur-3xl"></div>
        
        {/* Main Card (componentized) — theme switch deferred */}
        <ClassicCard
          rate={rate}
          settings={settings}
          displayImg={displayImg}
          imageLoading={imageLoading}
          cardRef={cardRef}
          frontCanvasRef={frontCanvasRef}
          exporting={exporting}
          hideShare={hideShare}
          onShare={exportCard}
        />

        {/* Legacy card removed */}
        {false && (<div>legacy</div>)}
        {/* Duplicate inline card removed during theme/layout defer */}
      </div>

      {/* Floating Elements */}
        <div className="absolute top-2 right-2 w-3 h-3 bg-amber-400 rounded-full opacity-60 animate-bounce"></div>
        <div className="absolute bottom-2 left-2 w-2 h-2 bg-amber-300 rounded-full opacity-40 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      
    </main>
  );
}
