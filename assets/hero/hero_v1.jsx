import { useState, useEffect, useRef, useCallback } from "react";

const PARTICLE_COUNT = 48;
const COLS = 8;
const ROWS = 6;

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function lerpColor(grey, color, t) {
  const g = hexToRgb(grey);
  const c = hexToRgb(color);
  const r = Math.round(g.r + (c.r - g.r) * t);
  const gr = Math.round(g.g + (c.g - g.g) * t);
  const b = Math.round(g.b + (c.b - g.b) * t);
  return `rgb(${r},${gr},${b})`;
}

function generateParticles() {
  const rng = seededRandom(42);
  const particles = [];

  const accents = [
    "#C9553A",
    "#2A7A7A",
    "#C4943D",
    "#4A6BB5",
    "#9E4D72",
  ];

  const greys = ["#B0B0B0", "#9A9A9A", "#C2C2C2", "#A8A8A8", "#BFBFBF"];

  const shapes = ["circle", "square", "triangle", "line", "diamond", "cross"];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);

    const orderedX = ((col + 0.5) / COLS) * 100;
    const orderedY = ((row + 0.5) / ROWS) * 100;

    const chaoticX = rng() * 100;
    const chaoticY = rng() * 100;
    const chaoticRotation = rng() * 360;
    const chaoticScale = 0.3 + rng() * 1.4;
    const chaoticOpacity = 0.12 + rng() * 0.3;

    particles.push({
      id: i,
      shape: shapes[Math.floor(rng() * shapes.length)],
      greyColor: greys[Math.floor(rng() * greys.length)],
      accentColor: accents[Math.floor(rng() * accents.length)],
      size: 10 + rng() * 18,
      chaotic: {
        x: chaoticX,
        y: chaoticY,
        rotation: chaoticRotation,
        scale: chaoticScale,
        opacity: chaoticOpacity,
      },
      ordered: {
        x: orderedX,
        y: orderedY,
        rotation: 0,
        scale: 1,
        opacity: 0.9,
      },
      delay: rng() * 0.3,
      speed: 0.7 + rng() * 0.6,
    });
  }
  return particles;
}

const PARTICLES = generateParticles();

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function Shape({ shape, color, size }) {
  const half = size / 2;

  if (shape === "circle") {
    return <circle cx={half} cy={half} r={half * 0.85} fill={color} />;
  }
  if (shape === "square") {
    const inset = size * 0.1;
    return (
      <rect
        x={inset}
        y={inset}
        width={size - inset * 2}
        height={size - inset * 2}
        fill={color}
        rx={2}
      />
    );
  }
  if (shape === "triangle") {
    const points = `${half},${size * 0.1} ${size * 0.9},${size * 0.85} ${size * 0.1},${size * 0.85}`;
    return <polygon points={points} fill={color} />;
  }
  if (shape === "line") {
    return (
      <line
        x1={size * 0.1}
        y1={half}
        x2={size * 0.9}
        y2={half}
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
    );
  }
  if (shape === "diamond") {
    const points = `${half},${size * 0.08} ${size * 0.92},${half} ${half},${size * 0.92} ${size * 0.08},${half}`;
    return <polygon points={points} fill={color} />;
  }
  if (shape === "cross") {
    return (
      <g stroke={color} strokeWidth={3} strokeLinecap="round">
        <line x1={size * 0.2} y1={size * 0.2} x2={size * 0.8} y2={size * 0.8} />
        <line x1={size * 0.8} y1={size * 0.2} x2={size * 0.2} y2={size * 0.8} />
      </g>
    );
  }
  return null;
}

export default function SignalFromNoise() {
  const containerRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const animFrameRef = useRef(null);
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);

  const animate = useCallback(() => {
    const current = currentProgressRef.current;
    const target = targetProgressRef.current;
    const diff = target - current;

    if (Math.abs(diff) > 0.001) {
      currentProgressRef.current += diff * 0.06;
      setProgress(currentProgressRef.current);
    }

    animFrameRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [animate]);

  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    targetProgressRef.current = Math.max(0, Math.min(1, x));
  }, []);

  const handleMouseLeave = useCallback(() => {
    targetProgressRef.current = 0;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) / rect.width;
    targetProgressRef.current = Math.max(0, Math.min(1, x));
  }, []);

  const handleTouchEnd = useCallback(() => {
    targetProgressRef.current = 0;
  }, []);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 720,
        margin: "0 auto",
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&display=swap"
        rel="stylesheet"
      />

      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "4 / 3",
          borderRadius: 12,
          overflow: "hidden",
          cursor: "crosshair",
          background: "#FAFAFA",
          border: "1px solid #E8E8E8",
        }}
      >
        {/* Subtle grid fades in */}
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: progress * 0.18,
          }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {Array.from({ length: COLS + 1 }, (_, i) => (
            <line
              key={`v${i}`}
              x1={(i / COLS) * 100}
              y1={0}
              x2={(i / COLS) * 100}
              y2={100}
              stroke="#000"
              strokeWidth={0.12}
            />
          ))}
          {Array.from({ length: ROWS + 1 }, (_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={(i / ROWS) * 100}
              x2={100}
              y2={(i / ROWS) * 100}
              stroke="#000"
              strokeWidth={0.12}
            />
          ))}
        </svg>

        {/* Particles */}
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
        >
          {PARTICLES.map((p) => {
            const rawT = Math.max(
              0,
              Math.min(1, (progress - p.delay) / p.speed)
            );
            const t = easeInOutCubic(rawT);

            const x = lerp(p.chaotic.x, p.ordered.x, t);
            const y = lerp(p.chaotic.y, p.ordered.y, t);
            const rotation = lerp(p.chaotic.rotation, p.ordered.rotation, t);
            const scale = lerp(p.chaotic.scale, p.ordered.scale, t);
            const opacity = lerp(p.chaotic.opacity, p.ordered.opacity, t);
            const svgSize = p.size / 10;

            const color = lerpColor(p.greyColor, p.accentColor, t);

            return (
              <g
                key={p.id}
                transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scale})`}
                opacity={opacity}
                style={{ transformOrigin: "center", transformBox: "fill-box" }}
              >
                <svg
                  x={-svgSize / 2}
                  y={-svgSize / 2}
                  width={svgSize}
                  height={svgSize}
                  viewBox={`0 0 ${p.size} ${p.size}`}
                  overflow="visible"
                >
                  <Shape shape={p.shape} color={color} size={p.size} />
                </svg>
              </g>
            );
          })}
        </svg>

        {/* Labels */}
        <div
          style={{
            position: "absolute",
            bottom: 14,
            left: 20,
            right: 20,
            display: "flex",
            justifyContent: "space-between",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: `rgba(0,0,0,${0.15 + (1 - progress) * 0.25})`,
            }}
          >
            Complexity
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: `rgba(0,0,0,${0.15 + progress * 0.25})`,
            }}
          >
            Clarity
          </span>
        </div>

        {/* Hint */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            opacity: progress < 0.05 ? 0.4 : 0,
            transition: "opacity 0.6s",
            color: "rgba(0,0,0,0.3)",
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.05em",
            whiteSpace: "nowrap",
          }}
        >
          ← Move across →
        </div>
      </div>
    </div>
  );
}
