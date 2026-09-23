import React, { useLayoutEffect, useRef, useState } from 'react';

/**
 * Artwork for the Halloween site, drawn to match the organizer's 9/22 slides:
 * flat 2D shapes with a heavy black outline on a purple ground, inside a cream
 * frame with a wavy edge and a dashed inner line.
 *
 * Every icon is a <g> on a 100×100 grid, so the same drawing serves the page
 * pattern, the corner ghosts, and anywhere else a single icon is wanted. Colours
 * are the theme's CSS variables, which inline SVG resolves like any other CSS.
 */

const OUTLINE = { stroke: 'var(--hallo-black)', strokeWidth: 3, strokeLinejoin: 'round', strokeLinecap: 'round' };

export function Ghost(props) {
  return (
    <g {...props}>
      <path
        d="M20 90 C16 58 20 22 50 14 C80 22 84 58 80 90 Q72 82 65 92 Q57 82 50 92 Q43 82 35 92 Q28 82 20 90 Z"
        fill="var(--hallo-cream)"
        {...OUTLINE}
      />
      {/* Folds in the sheet, as on the slides' corner ghosts. */}
      <path d="M36 70 Q34 80 35 88 M62 66 Q64 78 65 88" fill="none" {...OUTLINE} strokeWidth={2} />
      <ellipse cx="41" cy="44" rx="4.5" ry="7" fill="var(--hallo-black)" />
      <ellipse cx="59" cy="44" rx="4.5" ry="7" fill="var(--hallo-black)" />
    </g>
  );
}

export function WitchHat(props) {
  return (
    <g {...props}>
      <ellipse cx="50" cy="80" rx="44" ry="10" fill="var(--hallo-black)" />
      <path d="M26 78 L42 32 Q47 14 68 8 Q56 20 58 34 L74 78 Z" fill="var(--hallo-black)" />
      <path d="M30 66 L70 66 L74 78 L26 78 Z" fill="var(--hallo-purple-deep)" />
      <rect x="43" y="65" width="14" height="13" rx="1.5" fill="none" stroke="var(--hallo-orange)" strokeWidth="3.5" />
    </g>
  );
}

export function CandyCorn(props) {
  // Three bands, drawn back to front rather than clipped, so the icon can be
  // repeated inside a <pattern> without needing a unique clipPath id per copy.
  return (
    <g {...props}>
      <path d="M50 10 L72 80 Q50 90 28 80 Z" fill="var(--hallo-cream)" />
      <path d="M42.1 35 L57.9 35 L72 80 Q50 90 28 80 Z" fill="var(--hallo-orange)" />
      <path d="M33.7 62 L66.3 62 L72 80 Q50 90 28 80 Z" fill="var(--hallo-yellow)" />
      <path d="M50 10 L72 80 Q50 90 28 80 Z" fill="none" {...OUTLINE} />
    </g>
  );
}

export function BlackCat(props) {
  return (
    <g {...props}>
      <path d="M72 88 Q92 82 86 60" fill="none" stroke="var(--hallo-black)" strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="50" cy="74" rx="23" ry="20" fill="var(--hallo-black)" />
      <path d="M32 34 L28 12 L46 26 Z M68 34 L72 12 L54 26 Z" fill="var(--hallo-black)" strokeLinejoin="round" />
      <circle cx="50" cy="42" r="21" fill="var(--hallo-black)" />
      <circle cx="41" cy="41" r="7" fill="var(--hallo-cream)" />
      <circle cx="59" cy="41" r="7" fill="var(--hallo-cream)" />
      <circle cx="41" cy="42" r="4" fill="var(--hallo-black)" />
      <circle cx="59" cy="42" r="4" fill="var(--hallo-black)" />
      <path d="M50 64 L40 58 L40 70 Z M50 64 L60 58 L60 70 Z" fill="var(--hallo-orange)" strokeLinejoin="round" />
    </g>
  );
}

export function Bat(props) {
  return (
    <g {...props}>
      <path
        d="M50 38 L46 30 L44 40 C34 30 18 30 6 38 C14 42 16 50 14 58 C20 53 27 53 31 59 C35 52 43 52 46 60 L50 56 L54 60 C57 52 65 52 69 59 C73 53 80 53 86 58 C84 50 86 42 94 38 C82 30 66 30 56 40 L54 30 Z"
        fill="var(--hallo-black)"
        strokeLinejoin="round"
      />
      <circle cx="47" cy="44" r="1.8" fill="var(--hallo-cream)" />
      <circle cx="53" cy="44" r="1.8" fill="var(--hallo-cream)" />
    </g>
  );
}

export function JackOLantern(props) {
  return (
    <g {...props}>
      <path d="M46 30 Q45 18 53 13 L58 17 Q52 22 54 30 Z" fill="var(--hallo-black)" />
      <ellipse cx="50" cy="58" rx="36" ry="28" fill="var(--hallo-orange)" {...OUTLINE} />
      <path d="M50 31 Q36 58 50 85 M50 31 Q64 58 50 85" fill="none" stroke="var(--hallo-orange-deep)" strokeWidth="2.5" />
      <path d="M33 52 L40 41 L47 52 Z M53 52 L60 41 L67 52 Z" fill="var(--hallo-black)" strokeLinejoin="round" />
      <path
        d="M28 60 Q50 84 72 60 L65 63 L61 58 L56 65 L50 60 L44 65 L39 58 L35 63 Z"
        fill="var(--hallo-black)"
        strokeLinejoin="round"
      />
    </g>
  );
}

/** A five-point star centred in the 100×100 box. */
export function Star({ fill = 'var(--hallo-black)', ...props }) {
  const points = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? 44 : 18;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    return `${(50 + r * Math.cos(a)).toFixed(1)},${(52 + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
  return (
    <g {...props}>
      <polygon points={points} fill={fill} strokeLinejoin="round" />
    </g>
  );
}

/*
 * The page pattern: one 420px tile, laid out as a loose 4×4 grid so the repeat
 * is hard to spot. Nothing crosses the tile edge, because a <pattern> clips.
 */
const TILE = 420;
const at = (x, y, size, rotate = 0) =>
  `translate(${x} ${y}) rotate(${rotate} ${size / 2} ${size / 2}) scale(${size / 100})`;

const TILE_ITEMS = [
  [Ghost, 12, 8, 84, -8],
  [Star, 138, 24, 26, 0, { fill: 'var(--hallo-purple-deep)' }],
  [JackOLantern, 214, 6, 88, 0],
  [Bat, 318, 18, 86, -6],
  [CandyCorn, 22, 122, 70, -22],
  [BlackCat, 118, 108, 88, 0],
  [Star, 236, 132, 30, 12, { fill: 'var(--hallo-orange)' }],
  [WitchHat, 312, 110, 90, 8],
  [WitchHat, 8, 222, 86, -10],
  [Bat, 116, 238, 76, 8],
  [Ghost, 222, 212, 84, 6],
  [CandyCorn, 336, 226, 66, 24],
  [Star, 30, 344, 30, 0, { fill: 'var(--hallo-cream)' }],
  [JackOLantern, 104, 324, 86, 0],
  [BlackCat, 214, 320, 86, 0],
  [Star, 336, 350, 28, -10, { fill: 'var(--hallo-black)' }],
];

// Confetti dots, as scattered on the slides.
const DOTS = [
  [96, 92, 'cream'], [196, 104, 'orange'], [300, 92, 'purple-deep'], [404, 150, 'cream'],
  [96, 214, 'orange'], [200, 196, 'cream'], [306, 212, 'purple-deep'], [96, 312, 'purple-deep'],
  [200, 306, 'orange'], [304, 318, 'cream'], [404, 300, 'orange'], [16, 412, 'orange'],
];

export function PatternBackground() {
  return (
    <svg className="hallo-pattern" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="hallo-pattern-tile" width={TILE} height={TILE} patternUnits="userSpaceOnUse" patternTransform="scale(1.15)">
          {TILE_ITEMS.map(([Icon, x, y, size, rotate, extra], i) => (
            <Icon key={i} transform={at(x, y, size, rotate)} {...extra} />
          ))}
          {DOTS.map(([cx, cy, color], i) => (
            <circle key={`d${i}`} cx={cx} cy={cy} r="4" fill={`var(--hallo-${color})`} />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hallo-pattern-tile)" />
    </svg>
  );
}

/** A single icon as a standalone decorative image. */
export function Icon({ icon: IconShape, className, ...props }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      <IconShape {...props} />
    </svg>
  );
}

/*
 * The slides' cream frame: a rounded rectangle whose edges bulge outward in a
 * few soft waves, outlined in black, with a dashed line following it inside.
 *
 * It is computed in pixels from the element's measured size rather than drawn
 * once and stretched. A stretched SVG would squash the waves on a tall section
 * (the form and the map make some sections several screens tall); this keeps
 * the wave height and the dash length the same everywhere.
 */
function wavyRectPath(inset, w, h, { amp, period, radius }) {
  const x0 = inset;
  const y0 = inset;
  const x1 = w - inset;
  const y1 = h - inset;
  const r = Math.min(radius, (x1 - x0) / 2, (y1 - y0) / 2);
  const pts = [];

  // One straight side, from (ax, ay) to (bx, by), bulging along (nx, ny).
  const side = (ax, ay, bx, by, nx, ny) => {
    const len = Math.hypot(bx - ax, by - ay);
    const waves = Math.max(1, Math.round(len / period));
    const steps = Math.max(8, Math.ceil(len / 6));
    for (let i = 0; i < steps; i += 1) {
      const t = i / steps;
      const bulge = (amp * (1 - Math.cos(2 * Math.PI * waves * t))) / 2;
      pts.push([ax + (bx - ax) * t + nx * bulge, ay + (by - ay) * t + ny * bulge]);
    }
  };

  // A quarter-circle corner around (cx, cy), from angle a0 to a1.
  const corner = (cx, cy, a0, a1) => {
    for (let i = 0; i < 8; i += 1) {
      const a = a0 + ((a1 - a0) * i) / 8;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  };

  const H = Math.PI / 2;
  side(x0 + r, y0, x1 - r, y0, 0, -1);
  corner(x1 - r, y0 + r, -H, 0);
  side(x1, y0 + r, x1, y1 - r, 1, 0);
  corner(x1 - r, y1 - r, 0, H);
  side(x1 - r, y1, x0 + r, y1, 0, 1);
  corner(x0 + r, y1 - r, H, 2 * H);
  side(x0, y1 - r, x0, y0 + r, -1, 0);
  corner(x0 + r, y0 + r, 2 * H, 3 * H);

  return `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}Z`;
}

export function WavyFrame({ as: Tag = 'div', className = '', children, ...rest }) {
  const ref = useRef(null);
  const [size, setSize] = useState(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => {
      const w = Math.round(el.offsetWidth);
      const h = Math.round(el.offsetHeight);
      setSize((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Until measured (or with no ResizeObserver), CSS paints a plain cream
  // rounded box in the same footprint, so content is never unframed.
  let art = null;
  if (size && size.w > 0 && size.h > 0) {
    const small = size.w < 640;
    const shape = small
      ? { amp: 6, period: 150, radius: 22 }
      : { amp: 11, period: 230, radius: 40 };
    const outer = shape.amp + 3;
    const gap = small ? 9 : 14;
    art = (
      <svg className="hallo-frame-art" width={size.w} height={size.h} aria-hidden="true" focusable="false">
        <path className="hallo-frame-fill" d={wavyRectPath(outer, size.w, size.h, shape)} />
        <path className="hallo-frame-dash" d={wavyRectPath(outer + gap, size.w, size.h, shape)} />
      </svg>
    );
  }

  return (
    <Tag ref={ref} className={`hallo-frame${art ? ' is-drawn' : ''} ${className}`.trim()} {...rest}>
      {art}
      {children}
    </Tag>
  );
}
