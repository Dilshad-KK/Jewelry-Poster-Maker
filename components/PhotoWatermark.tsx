type Props = {
  logoUrl?: string | null;
};

const positions = [
  [18, 20], [50, 20], [82, 20],
  [34, 43], [66, 58],
  [18, 80], [82, 80],
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
          className="absolute aspect-square w-[13%] -translate-x-1/2 -translate-y-1/2 rounded-full object-cover opacity-[0.35]"
          style={{ left: `${left}%`, top: `${top}%` }}
        />
      ))}
    </div>
  );
}
