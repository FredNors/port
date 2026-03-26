import { useState, useEffect, useRef } from "react";

const COLS = 8;
const ROWS = 6;
const PARTICLE_COUNT = COLS * ROWS;

function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function hexToRgb(hex) {
  return { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) };
}

function lerpColor(grey, color, t) {
  const a = hexToRgb(grey), b = hexToRgb(color);
  return `rgb(${Math.round(a.r + (b.r - a.r) * t)},${Math.round(a.g + (b.g - a.g) * t)},${Math.round(a.b + (b.b - a.b) * t)})`;
}

function lerp(a, b, t) { return a + (b - a) * t; }
function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

const ACCENTS = ["#C9553A", "#2A7A7A", "#C4943D", "#4A6BB5", "#9E4D72"];
const GREYS = ["#B0B0B0", "#9A9A9A", "#C2C2C2", "#A8A8A8", "#BFBFBF"];
const SHAPES = ["circle", "square", "triangle", "line", "diamond", "cross"];

function generateParticles() {
  const rng = seededRandom(113);
  const particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const col = i % COLS, row = Math.floor(i / COLS);
    particles.push({
      id: i,
      shape: SHAPES[Math.floor(rng() * SHAPES.length)],
      greyColor: GREYS[Math.floor(rng() * GREYS.length)],
      accentColor: ACCENTS[Math.floor(rng() * ACCENTS.length)],
      size: 10 + rng() * 18,
      chaotic: {
        x: rng() * 100, y: rng() * 100,
        rotation: rng() * 360, scale: 0.3 + rng() * 1.4,
        opacity: 0.12 + rng() * 0.3,
      },
      ordered: {
        x: ((col + 0.5) / COLS) * 100,
        y: ((row + 0.5) / ROWS) * 100,
        rotation: 0, scale: 1, opacity: 0.9,
      },
      delay: rng() * 0.3,
      speed: 0.7 + rng() * 0.6,
    });
  }
  return particles;
}

const PARTICLES = generateParticles();

function Shape({ shape, color, size }) {
  const h = size / 2;
  if (shape === "circle") return <circle cx={h} cy={h} r={h * 0.85} fill={color} />;
  if (shape === "square") { const i = size * 0.1; return <rect x={i} y={i} width={size - i * 2} height={size - i * 2} fill={color} rx={2} />; }
  if (shape === "triangle") return <polygon points={`${h},${size * 0.1} ${size * 0.9},${size * 0.85} ${size * 0.1},${size * 0.85}`} fill={color} />;
  if (shape === "line") return <line x1={size * 0.1} y1={h} x2={size * 0.9} y2={h} stroke={color} strokeWidth={3} strokeLinecap="round" />;
  if (shape === "diamond") return <polygon points={`${h},${size * 0.08} ${size * 0.92},${h} ${h},${size * 0.92} ${size * 0.08},${h}`} fill={color} />;
  if (shape === "cross") return <g stroke={color} strokeWidth={3} strokeLinecap="round"><line x1={size * 0.2} y1={size * 0.2} x2={size * 0.8} y2={size * 0.8} /><line x1={size * 0.8} y1={size * 0.2} x2={size * 0.2} y2={size * 0.8} /></g>;
  return null;
}

export default function HeroIllustration() {
  const ref = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const windowH = window.innerHeight;
      const start = windowH;
      const end = windowH * 0.15;
      const t = clamp((start - rect.top) / (start - end), 0, 1);
      setProgress(t);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "4 / 3",
        borderRadius: 12,
        overflow: "hidden",
        background: "#FAFAFA",
        border: "1px solid #E8E8E8",
      }}
    >
      {/* Grid */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: progress * 0.18 }} viewBox="0 0 100 100" preserveAspectRatio="none">
        {Array.from({ length: COLS + 1 }, (_, i) => (
          <line key={`v${i}`} x1={(i / COLS) * 100} y1={0} x2={(i / COLS) * 100} y2={100} stroke="#000" strokeWidth={0.12} />
        ))}
        {Array.from({ length: ROWS + 1 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={(i / ROWS) * 100} x2={100} y2={(i / ROWS) * 100} stroke="#000" strokeWidth={0.12} />
        ))}
      </svg>

      {/* Particles */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {PARTICLES.map((p) => {
          const rawT = clamp((progress - p.delay) / p.speed, 0, 1);
          const t = easeInOutCubic(rawT);
          const x = lerp(p.chaotic.x, p.ordered.x, t);
          const y = lerp(p.chaotic.y, p.ordered.y, t);
          const rot = lerp(p.chaotic.rotation, p.ordered.rotation, t);
          const sc = lerp(p.chaotic.scale, p.ordered.scale, t);
          const op = lerp(p.chaotic.opacity, p.ordered.opacity, t);
          const sz = p.size / 10;
          const color = lerpColor(p.greyColor, p.accentColor, t);
          return (
            <g key={p.id} transform={`translate(${x},${y}) rotate(${rot}) scale(${sc})`} opacity={op} style={{ transformOrigin: "center", transformBox: "fill-box" }}>
              <svg x={-sz / 2} y={-sz / 2} width={sz} height={sz} viewBox={`0 0 ${p.size} ${p.size}`} overflow="visible">
                <Shape shape={p.shape} color={color} size={p.size} />
              </svg>
            </g>
          );
        })}
      </svg>

      {/* Labels */}
      <div style={{ position: "absolute", bottom: 14, left: 20, right: 20, display: "flex", justifyContent: "space-between", pointerEvents: "none", fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>
        <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: `rgba(0,0,0,${0.15 + (1 - progress) * 0.25})` }}>Complexity</span>
        <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: `rgba(0,0,0,${0.15 + progress * 0.25})` }}>Clarity</span>
      </div>
    </div>
  );
}
