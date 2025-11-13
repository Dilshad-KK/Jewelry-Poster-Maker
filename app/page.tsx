"use client";
export const dynamic = "force-static";

import { useEffect, useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import ClassicCard from "@/components/ClassicCard";

/**
 * Helper — fetch any image URL and return Base64 data URL
 */
async function fetchAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("Base64 fetch failed:", e);
    return null;
  }
}

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

  // Generate PNG data and file for the current card
  const generateCardPng = async () => {
    const node = cardRef.current;
    if (!node) throw new Error("No card node");
    // wait until all images are loaded
    const imgs = node.querySelectorAll("img");
    await Promise.all(
      Array.from(imgs).map(
        (img) =>
          new Promise<void>((res) => {
            if (img.complete) return res();
            img.onload = () => res();
            img.onerror = () => res();
          })
      )
    );
    await new Promise((r) => setTimeout(r, 150));

    let dataUrl: string;
    try {
      dataUrl = await htmlToImage.toPng(node, {
        cacheBust: true,
        pixelRatio: Math.min(3, (window.devicePixelRatio || 2) * 1.25),
        quality: 1,
        backgroundColor: "#000000",
        fetchRequestInit: { mode: "cors", credentials: "omit" },
        style: { transform: "none", transformOrigin: "top left", filter: "none" },
      });
    } catch {
      dataUrl = await htmlToImage.toPng(node, {
        cacheBust: true,
        pixelRatio: Math.min(2.25, window.devicePixelRatio || 2),
        backgroundColor: "#000000",
        fetchRequestInit: { mode: "cors", credentials: "omit" },
        style: { transform: "none", transformOrigin: "top left", filter: "none" },
      });
    }
    const base64Data = dataUrl.split(",")[1];
    const byteChars = atob(base64Data);
    const byteNums = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
    const blob = new Blob([new Uint8Array(byteNums)], { type: "image/png" });
    const date = new Date();
    const name = `kgp-gold-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}.png`;
    const file = new File([blob], name, { type: "image/png" });
    return { dataUrl, file, name };
  };

  /**
   * 🟡 Export card as PNG (works on iPhone)
   */
  const exportCard = async () => {
    if (exporting) return;
    const node = cardRef.current;
    if (!node) return;
    try {
      setExporting(true);
      setHideShare(true);
      setHideFront(true);
      const { dataUrl, file, name } = await generateCardPng();

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "KGP Gold" });
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = name;
        a.click();
      }
    } catch (e) {
      console.error("Export failed", e);
      alert("Export failed: " + (e instanceof Error ? e.message : "unknown"));
    } finally {
      setHideShare(false);
      setHideFront(false);
      setExporting(false);
    }
  };

  // Explicit save to device (prefers File System Access API; falls back to download)
  const saveCard = async () => {
    if (exporting) return;
    try {
      setExporting(true);
      setHideShare(true);
      setHideFront(true);
      const anyWin = window as any;
      let writable: FileSystemWritableFileStream | null = null;
      let pickedName: string | null = null;
      // Call picker immediately to retain user activation
      if (anyWin.showSaveFilePicker) {
        try {
          const handle = await anyWin.showSaveFilePicker({
            suggestedName: `kgp-gold-${new Date().toISOString().slice(0,10)}.png`,
            types: [{ description: "PNG Image", accept: { "image/png": [".png"] } }],
          });
          writable = await handle.createWritable();
        } catch (e) {
          // user canceled or picker not allowed; continue with fallback
        }
      }

      const { dataUrl, file, name } = await generateCardPng();
      pickedName = pickedName || name;

      if (writable) {
        await writable.write(await file.arrayBuffer());
        await writable.close();
        return;
      }

      // Fallback: force a download via object URL for better compatibility
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = pickedName!;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Save failed", e);
      try {
        // Last-resort: open image in a new tab (iOS can long-press to save)
        const { dataUrl } = await generateCardPng();
        const win = window.open(dataUrl, "_blank");
        if (!win) alert("Save failed. Please allow popups or long‑press the image to save.");
      } catch {}
    } finally {
      setHideShare(false);
      setHideFront(false);
      setExporting(false);
    }
  };


  /**
   * 🟡 Fetch rate + image + settings
   */
  useEffect(() => {
    const fetchRate = async () => {
      try {
        // Ensure today's row exists by copying latest if needed
        try {
          await fetch("/api/rates/ensure-today", { method: "POST", cache: "no-store" });
        } catch {}

        const res = await fetch("/api/rates", { cache: "no-store" });
        const json = await res.json();
        const latest = json?.rate ?? null;
        // Normalize date: if not today's date, show today
        let adjusted = latest;
        if (latest && latest.date) {
          const now = new Date();
          const tzAdjusted = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
          const todayLocal = tzAdjusted.toISOString().slice(0, 10);
          if (latest.date !== todayLocal) {
            adjusted = { ...latest, date: todayLocal };
          }
        }
        setRate(adjusted);

        const url = adjusted?.image_url;
        if (url) {
          setImageLoading(true);
          setDisplayImg(url);
          setImageLoading(false);
        } else setDisplayImg(null);
      } catch (e) {
        console.warn("Failed to fetch rate", e);
      }
    };

    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        const json = await res.json();
        const s = json?.settings;
        if (!s) return;

        let safeLogo = s.logoUrl;
        if (s.logoUrl && !s.logoUrl.startsWith("data:image")) {
          const base64 = await fetchAsBase64(s.logoUrl);
          if (base64) safeLogo = base64;
        }

        setSettings((p) => ({
          ...p,
          primaryColor: s.primaryColor ?? p.primaryColor,
          accentColor: s.accentColor ?? p.accentColor,
          bgColor: s.bgColor ?? p.bgColor,
          logoUrl: safeLogo,
        }));
      } catch (e) {
        console.warn("Failed to fetch settings", e);
      }
    };

    fetchRate();
    fetchSettings();
  }, []);

  /**
   * ✨ Floating particles
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const parts: any[] = [];
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
      parts.length = 0;
      for (let i = 0; i < count; i++) {
        parts.push({
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
      for (const p of parts) {
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
        backgroundImage: `linear-gradient(to bottom right, #0b0b0b, ${settings.bgColor || "#451a03"
          })`,
      }}
    >
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
          onSave={saveCard}
          hideFrontCanvas={hideFront}
        />
      </div>

      {exporting && (
        <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white">
            <div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            <span className="font-medium">Preparing image…</span>
          </div>
        </div>
      )}
    </main>
  );
}
