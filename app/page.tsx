"use client";
export const dynamic = "force-static";

import { useEffect, useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import ClassicCard from "@/components/ClassicCard";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frontCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const [rate, setRate] = useState<any>(null);
  const [displayImg, setDisplayImg] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [hideShare, setHideShare] = useState(false);
  const [hideFront, setHideFront] = useState(false);

  const [settings, setSettings] = useState({
    theme: "classic" as const,
    primaryColor: "#fbbf24",
    accentColor: null as string | null,
    bgColor: "#451a03",
    logoUrl: null as string | null,
  });

  /**
   * 🟡 Export the card to PNG
   * Waits until the main image is fully loaded and rendered before capture.
   */
  const exportCard = async () => {
    const node = cardRef.current;
    if (!node || exporting) return;

    try {
      setExporting(true);
      setHideShare(true);
      setHideFront(true);

      // ✅ Wait until card image is fully loaded and rendered
      const imgEl = node.querySelector("img");
      if (imgEl && !imgEl.complete) {
        await new Promise<void>((resolve) => {
          imgEl.onload = () => resolve();
          imgEl.onerror = () => resolve();
        });
      }

      // Small layout settle delay
      await new Promise((r) => setTimeout(r, 150));

      const dataUrl = await htmlToImage.toPng(node, {
        cacheBust: true,
        pixelRatio: Math.min(2, window.devicePixelRatio || 1.5),
        backgroundColor: "#0b0b0b",
        fetchRequestInit: { mode: "cors", credentials: "omit" },
        imagePlaceholder:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFWgKcS8b5VwAAAABJRU5ErkJggg==",
      });

      const blob = await (await fetch(dataUrl)).blob();
      const date = new Date();
      const fileName = `kgp-gold-${date.getFullYear()}${String(
        date.getMonth() + 1
      ).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      // ✅ Native share or fallback to download
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "KGP Gold",
          text: "Today’s Gold Rate",
        });
      } else {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = fileName;
        link.click();
      }
    } catch (e) {
      console.warn("Export failed", e);
    } finally {
      setHideShare(false);
      setHideFront(false);
      setExporting(false);
    }
  };

  /**
   * 🟡 Fetch latest rate and image
   */
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch("/api/rates", { cache: "no-store" });
        const json = await res.json();
        const latest = json?.rate ?? null;
        setRate(latest);

        const url = latest?.image_url;
        if (url) {
          setImageLoading(true);
          setDisplayImg(url); // leave as-is, no base64 conversion
          setImageLoading(false);
        } else {
          setDisplayImg(null);
        }
      } catch (e) {
        console.warn("Failed to fetch rate", e);
      }
    };

    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        const json = await res.json();
        const s = json?.settings;
        if (s)
          setSettings((p) => ({
            ...p,
            primaryColor: s.primaryColor ?? p.primaryColor,
            accentColor: s.accentColor ?? p.accentColor,
            bgColor: s.bgColor ?? p.bgColor,
            logoUrl: s.logoUrl ?? p.logoUrl,
          }));
      } catch {}
    };

    fetchRate();
    fetchSettings();
  }, []);

  /**
   * ✨ Gold sparkle animation background (unchanged)
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const particles: any[] = [];
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
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
          vx: Math.random() * 0.4 - 0.2,
          vy: 0.6 + Math.random() * 1.3,
          alpha: 0.6 + Math.random() * 0.4,
        });
      }
    };

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y - p.r > h) p.y = -p.r;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = "rgba(255,207,64,0.9)";
        ctx.shadowBlur = 10;
        ctx.fillStyle = "#ffcf40";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <main
      className="relative min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-br from-gray-950 via-black to-amber-950 overflow-hidden px-4 py-2 sm:px-6"
      style={{
        backgroundImage: `linear-gradient(to bottom right, #0b0b0b, ${
          settings.bgColor || "#451a03"
        })`,
      }}
    >
      {/* Falling gold particles */}
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" />

      <div className="relative z-10 w-full max-w-md overflow-hidden">
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
          hideFrontCanvas={hideFront}
        />
      </div>

      {/* Small decorative glows */}
      <div className="absolute top-2 right-2 w-3 h-3 bg-amber-400 rounded-full opacity-60 animate-bounce"></div>
      <div
        className="absolute bottom-2 left-2 w-2 h-2 bg-amber-300 rounded-full opacity-40 animate-bounce"
        style={{ animationDelay: "0.2s" }}
      ></div>
    </main>
  );
}
