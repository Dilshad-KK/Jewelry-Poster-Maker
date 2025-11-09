import React from 'react';

type Rate = {
  date?: string;
  per_gram?: number;
  per_sovereign?: number;
  image_url?: string | null;
  shop_name?: string | null;
  shop_address?: string | null;
} | null;

type Settings = { theme: 'classic' | 'overlay'; primaryColor?: string | null; accentColor?: string | null; bgColor?: string | null };

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
};

export default function ClassicCard({ rate, settings, displayImg, imageLoading, cardRef, frontCanvasRef, exporting, hideShare, onShare }: Props) {
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
      <canvas ref={frontCanvasRef} className="pointer-events-none absolute inset-0 z-10" />

      <div className="relative z-20 flex flex-col items-center space-y-3 p-3 sm:space-y-3 sm:p-3">
        {/* Logo */}
        <div className="mt-2 sm:mt-1">
          <img src="/logo.jpg" alt="KGP Gold" className="h-14 sm:h-16 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" />
        </div>

        {/* Header */}
        <div className="text-center space-y-2 sm:space-y-3">
          <h1 className="text-2xl font-bold tracking-tight font-serif">
            <span className="text-white">Today's</span>{' '}
            <span className="text-transparent bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text">Gold Rate</span>
          </h1>
          <div className="inline-flex items-center space-x-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-amber-100 font-semibold text-sm">
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

        {/* Image */}
      <div className="relative w-full max-w-[300px] sm:max-w-xs">
          <div className="absolute -inset-3 rounded-2xl blur-xl" style={{ background: hexToRgba(accent, 0.12) }}></div>
          <div className="relative rounded-2xl overflow-hidden border shadow-2xl" style={{ borderColor: primary + '4D' }}>
            <div className="relative w-full pt-[100%]">{/* Square on all sizes to reduce height on small phones */}
              {displayImg ? (
                <img src={displayImg} alt="Gold Jewellery" className="absolute inset-0 w-full h-full object-cover transform hover:scale-105 transition-transform duration-700" />
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

        {/* Prices */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
          <div className="group relative">
            <div
              className="absolute -inset-0.5 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-300"
              style={{ backgroundImage: `linear-gradient(to right, ${primary}, ${accent})` }}
            ></div>
            <div
              className="relative backdrop-blur-md rounded-xl p-3 sm:p-4 text-center transition-all duration-300 border"
              style={{
                background: `linear-gradient(180deg, rgba(0,0,0,0.60), ${hexToRgba(accent, 0.10)})`,
                borderColor: hexToRgba(primary, 0.45),
                boxShadow: `0 4px 18px ${hexToRgba(primary, 0.15)}`,
              }}
            >
              <div className="text-2xl font-black mb-1" style={{ color: settings.primaryColor || '#fbbf24' }}>
                ₹ {rate?.per_gram?.toLocaleString('en-IN') ?? '—'}
              </div>
              <div className="text-amber-50/90 text-xs font-semibold uppercase tracking-wider">Per Gram</div>
            </div>
          </div>
          <div className="group relative">
            <div
              className="absolute -inset-0.5 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-300"
              style={{ backgroundImage: `linear-gradient(to right, ${primary}, ${accent})` }}
            ></div>
            <div
              className="relative backdrop-blur-md rounded-xl p-3 sm:p-4 text-center transition-all duration-300 border"
              style={{
                background: `linear-gradient(180deg, rgba(0,0,0,0.60), ${hexToRgba(accent, 0.10)})`,
                borderColor: hexToRgba(primary, 0.45),
                boxShadow: `0 4px 18px ${hexToRgba(primary, 0.15)}`,
              }}
            >
              <div className="text-2xl font-black mb-1" style={{ color: settings.primaryColor || '#fbbf24' }}>
                ₹ {rate?.per_sovereign?.toLocaleString('en-IN') ?? '—'}
              </div>
              <div className="text-amber-50/90 text-xs font-semibold uppercase tracking-wider">Per Sovereign</div>
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
