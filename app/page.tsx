"use client";
export const dynamic = "force-static";
import { useEffect, useRef } from "react";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frontCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

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
              <div className="inline-flex items-center space-x-2 text-amber-400/80 text-xs font-semibold tracking-widest uppercase">
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></div>
                <span>Live Gold Rates</span>
              </div>
              
              <h1 className="text-3xl font-bold tracking-tight font-serif">
                <span className="text-white">Today's</span>{' '}
                <span className="text-transparent bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text">
                  Gold Rate
                </span>
              </h1>
              
              <div className="inline-flex items-center space-x-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-amber-100 font-semibold text-sm">07 / NOV / 2025</span>
              </div>
            </div>

            {/* Jewellery Image */}
            <div className="relative w-full max-w-xs">
              <div className="absolute -inset-3 bg-amber-500/10 rounded-2xl blur-xl"></div>
              <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 shadow-2xl">
                <img 
                  src="/uploads/Gemini_Generated_Image_etgzncetgzncetgz.png" 
                  alt="Gold Jewellery"
                  className="w-full h-32 sm:h-40 object-cover transform hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            </div>

            {/* Price Cards */}
            <div className="grid grid-cols-1 gap-4 w-full">
              {/* Per Gram */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-300"></div>
                <div className="relative bg-gray-900/80 backdrop-blur-sm border border-amber-500/20 rounded-xl p-4 text-center group-hover:border-amber-500/40 transition-all duration-300">
                  <div className="text-2xl font-black text-amber-300 mb-1">
                    ₹ 11,185
                  </div>
                  <div className="text-amber-100/80 text-xs font-semibold uppercase tracking-wider">
                    Per Gram
                  </div>
                </div>
              </div>

              {/* Per Sovereign */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-300"></div>
                <div className="relative bg-gray-900/80 backdrop-blur-sm border border-amber-500/20 rounded-xl p-4 text-center group-hover:border-amber-500/40 transition-all duration-300">
                  <div className="text-2xl font-black text-amber-300 mb-1">
                    ₹ 89,480
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
                🏛️ KGP Gold, Mangalya Complex<br />
                <span className="text-amber-100/70 text-xs">Main Road, Koduvally</span>
              </p>
            </div>

            {/* CTA Button (temporarily disabled: export not implemented) */}
            {/**
            <div className="flex justify-center w-full pt-2 pb-4">
              <button className="group relative inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-amber-500 to-amber-700 px-8 py-4 font-semibold text-white shadow-2xl hover:shadow-amber-500/25 transform hover:scale-105 transition-all duration-300 overflow-hidden w-full max-w-xs">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <span className="relative flex items-center justify-center space-x-2">Export Poster</span>
              </button>
            </div>
            */}

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
