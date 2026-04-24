// ============================================================
// Nautilus mark — inspired by the Formulation Wizard logo.
// Renders a logarithmic spiral of tapered dashes, evoking a
// nautilus chamber pattern. Designed to read at 24–40px and
// scale cleanly up to 128px for favicon/social use.
// ============================================================

interface NautilusMarkProps {
  size?: number;
  color?: string;
  className?: string;
}

export function NautilusMark({
  size = 32,
  color = 'var(--color-brand-500, #3A7486)',
  className = '',
}: NautilusMarkProps) {
  // Generate tapered petals along a logarithmic spiral.
  // r(θ) = a * e^(b * θ)  — same equation as a real nautilus.
  // Smaller inner petals, larger outer ones, rotating ~24 steps.
  const petals = [];
  const N = 28;
  const a = 3.2;         // inner radius
  const b = 0.22;        // growth rate — gentle spiral
  const cx = 64, cy = 62;
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2.2; // slightly past one full rotation
    const r = a * Math.exp(b * i * 0.35);
    const x = cx + r * Math.cos(t);
    const y = cy + r * Math.sin(t);
    const angle = (t * 180) / Math.PI + 90;
    // Petal length grows with distance from center (Fibonacci-ish)
    const petalLen = 4 + r * 0.55;
    const petalWidth = 1.4 + Math.min(2.4, r * 0.08);
    petals.push({ x, y, angle, petalLen, petalWidth, opacity: 0.35 + (i / N) * 0.65 });
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Formulation Wizard"
    >
      <g transform="rotate(-8 64 64)">
        {petals.map((p, i) => (
          <ellipse
            key={i}
            cx={p.x}
            cy={p.y}
            rx={p.petalWidth}
            ry={p.petalLen}
            transform={`rotate(${p.angle} ${p.x} ${p.y})`}
            fill={color}
            opacity={p.opacity}
          />
        ))}
        {/* Inner center dots for the "tight core" nautilus look */}
        <circle cx={cx} cy={cy} r={1.4} fill={color} opacity="0.9" />
        <circle cx={cx + 2.2} cy={cy - 1.4} r={0.9} fill={color} opacity="0.75" />
      </g>
    </svg>
  );
}
