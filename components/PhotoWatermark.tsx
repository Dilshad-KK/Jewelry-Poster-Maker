type Props = {
  logoUrl?: string | null;
};

// Symmetric 2–3–2 pattern with equal row spacing and a clear lower-center locket area.
const positions = [
  [18, 24], [82, 24],
  [18, 48], [50, 48], [82, 48],
  [18, 72], [82, 72],
];

export default function PhotoWatermark({ logoUrl }: Props) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden select-none"
    >
      {positions.map(([left, top]) => (
        <img
          key={`${left}-${top}`}
          src={logoUrl || "/logo.jpg"}
          alt=""
          crossOrigin="anonymous"
          decoding="sync"
          draggable={false}
          className="absolute aspect-square w-[11%] -translate-x-1/2 -translate-y-1/2 rounded-full object-cover opacity-[0.28]"
          style={{ left: `${left}%`, top: `${top}%` }}
        />
      ))}
    </div>
  );
}
