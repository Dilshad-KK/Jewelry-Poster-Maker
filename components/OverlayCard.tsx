import React from 'react';

type Rate = {
  date?: string;
  per_gram?: number;
  per_sovereign?: number;
  image_url?: string | null;
  shop_name?: string | null;
  shop_address?: string | null;
} | null;

type Settings = { theme: 'classic' | 'overlay'; primaryColor?: string | null; accentColor?: string | null; bgColor?: string | null; logoUrl?: string | null };

type Props = {
  rate: Rate;
  settings: Settings;
  displayImg: string | null;
  imageLoading: boolean;
  cardRef: React.RefObject<HTMLDivElement | null>;
  frontCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  exporting: boolean;
  hideShare: boolean;
  onShare: () => void | Promise<void>;
  hideFrontCanvas?: boolean;
};

export default function OverlayCard({ rate, settings, displayImg, imageLoading, cardRef, frontCanvasRef, exporting, hideShare, onShare, hideFrontCanvas }: Props) {
  const hexToRgba = (hex: string, alpha: number) => {
    const h = hex.replace('#', '');
    const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  const primary = settings.primaryColor || '#f59e0b';
  const accent = settings.accentColor || '#fbbf24';
  const bg = settings.bgColor || '#0b0b0b';
  return (
    <div
      ref={cardRef}
      className="relative backdrop-blur-xl rounded-3xl border shadow-2xl overflow-hidden"
      style={{
        borderColor: primary + '33',
        backgroundImage: `linear-gradient(to bottom right, ${hexToRgba(bg, 0.88)}, rgba(0,0,0,0.92))`,
      }}
    >
      {/* Share button (top-right) */}
      <button
        onClick={onShare}
        aria-label="Share image"
        className={`absolute top-2 right-2 z-30 inline-flex items-center justify-center rounded-full text-black shadow-lg hover:scale-105 active:scale-95 transition-transform duration-150 ${hideShare ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{ width: 36, height: 36, backgroundColor: settings.primaryColor || '#fbbf24' }}
        title="Share / Save image"
        disabled={exporting}
      >
        {exporting ? (
          <span className="block w-4 h-4 rounded-full border-2 border-black/70 border-t-transparent animate-spin" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7a3.048 3.048 0 0 0 0-1.39l7.05-4.11A2.99 2.99 0 1 0 14 4a2.99 2.99 0 0 0 .04.49L7 8.6A3 3 0 1 0 7 15.4l7.04 4.11c-.02.16-.04.32-.04.49a3 3 0 1 0 3-3.92z" />
          </svg>
        )}
      </button>

      {/* Top Decorative Strip */}
      <div className="h-1 bg-gradient-to-r from-transparent to-transparent" style={{ backgroundImage: `linear-gradient(to right, transparent, ${settings.primaryColor || '#fbbf24'}, transparent)` }} />
      {/* Front particles overlay within card */}
      {!hideFrontCanvas && (
        <canvas ref={frontCanvasRef} className="pointer-events-none absolute inset-0 z-10" />
      )}

      <div className="relative z-20 flex flex-col items-center space-y-4 p-4 sm:space-y-6 sm:p-6">
        {/* Logo placeholder (no spinner). If logoUrl exists, image fades in over placeholder. */}
        <div className="mt-2 sm:mt-4 relative h-14 sm:h-16 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="px-3 py-1.5 rounded-md bg-white/10 border border-white/15 text-amber-200/80 text-xs">Logo</div>
          </div>
          { (settings.logoUrl || "/logo.jpg") && (
            <img
              crossOrigin="anonymous"
              src={settings.logoUrl || "/logo.jpg"}
              alt="Logo"
              onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '1'; }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '1'; }}
              className="h-14 sm:h-16 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] opacity-0 transition-opacity duration-300 relative z-10"
            />
          )}
        </div>

        {/* Image with overlays */}
        <div className="relative w-full max-w-[300px] sm:max-w-xs">
          <div className="absolute -inset-3 rounded-2xl blur-xl" style={{ background: hexToRgba(accent, 0.12) }}></div>
          <div className="relative rounded-2xl overflow-hidden border shadow-2xl" style={{ borderColor: primary + '4D' }}>
            <div className="relative w-full pt-[125%]">{/* 4:5 portrait */}
              {displayImg ? (
                <img crossOrigin="anonymous" src={displayImg} alt="Gold Jewellery" className="absolute inset-0 w-full h-full object-cover transform hover:scale-105 transition-transform duration-700" />
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

              {/* Title + Date at top */}
              <div className="absolute inset-x-0 top-0 p-3 sm:p-4 z-20 flex flex-col items-center text-center">
                <h2 className="text-white text-lg sm:text-xl font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">Today's Gold Rate</h2>
                <div className="mt-1 inline-flex items-center space-x-2 bg-black/35 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-amber-100 text-xs font-semibold">
                    {(() => {
                      const d = new Date(rate?.date ?? Date.now());
                      const day = String(d.getDate()).padStart(2, '0');
                      const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
                      const year = d.getFullYear();
                      return `${day} / ${month} / ${year}`;
                    })()}
                  </span>
                </div>
              </div>

              {/* Prices at bottom */}
              <div className="absolute inset-0 flex items-end p-2 sm:p-3 z-20">
                <div className="w-full flex gap-2">
                  <div
                    className="flex-1 rounded-lg backdrop-blur-md border p-2 text-center"
                    style={{
                      background: `linear-gradient(180deg, rgba(0,0,0,0.60), ${hexToRgba(accent, 0.10)})`,
                      borderColor: (primary + '66') as any,
                      boxShadow: `0 4px 18px ${hexToRgba(primary, 0.15)}`,
                    }}
                  >
                    <div className="text-xl font-black" style={{ color: settings.primaryColor || '#fbbf24' }}>
                      ₹ {rate?.per_gram?.toLocaleString('en-IN') ?? '—'}
                    </div>
                    <div className="text-amber-50/90 text-[10px] font-semibold uppercase tracking-wider">Per Gram</div>
                  </div>
                  <div
                    className="flex-1 rounded-lg backdrop-blur-md border p-2 text-center"
                    style={{
                      background: `linear-gradient(180deg, rgba(0,0,0,0.60), ${hexToRgba(accent, 0.10)})`,
                      borderColor: (primary + '66') as any,
                      boxShadow: `0 4px 18px ${hexToRgba(primary, 0.15)}`,
                    }}
                  >
                    <div className="text-xl font-black" style={{ color: settings.primaryColor || '#fbbf24' }}>
                      ₹ {rate?.per_sovereign?.toLocaleString('en-IN') ?? '—'}
                    </div>
                    <div className="text-amber-50/90 text-[10px] font-semibold uppercase tracking-wider">Per Sovereign</div>
                  </div>
                </div>
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
      </div>

      {/* Bottom Decorative Strip (themed) */}
      <div
        className="h-1 bg-gradient-to-r from-transparent to-transparent"
        style={{ backgroundImage: `linear-gradient(to right, transparent, ${settings.primaryColor || '#fbbf24'}, transparent)` }}
      />
    </div>
  );
}
