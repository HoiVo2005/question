'use client';

// Vẽ hình hình học theo quy ước SGK / đề thi Bộ GD&ĐT, từ dữ liệu toạ độ do AI cung cấp.
// Toạ độ x,y trong khoảng 0..10 (gốc dưới-trái, y hướng lên).
//
// figure = {
//   points:   [{ name:"A", x:1, y:2 }],
//   segments: [["A","B"], { from:"B", to:"C", dashed:true, label:"a", ticks:2, arrow:true }],
//   polygons: [["A","B","C"]],
//   circles:  [{ x:5, y:5, r:3 }],
//   rightAngles: [{ at:"A", from:"B", to:"C" }],          // dấu góc vuông tại A
//   angles:      [{ at:"B", from:"A", to:"C", label:"60°" }], // cung + nhãn góc tại B
//   axes: true,                                            // vẽ hệ trục Oxy
// }
// Segment có thể là tuple ["A","B"] (nét liền) hoặc object để thêm nét đứt/nhãn/gạch bằng/mũi tên.

interface Pt {
  name?: string;
  x: number;
  y: number;
}
type SegmentTuple = [string, string];
interface SegmentObj {
  from: string;
  to: string;
  dashed?: boolean;
  label?: string;
  ticks?: number; // số gạch ký hiệu cạnh bằng nhau
  arrow?: boolean; // mũi tên (vectơ)
}
interface RightAngle {
  at: string;
  from: string;
  to: string;
}
interface AngleMark {
  at: string;
  from: string;
  to: string;
  label?: string;
}
export interface FigureData {
  points?: Pt[];
  segments?: (SegmentTuple | SegmentObj)[];
  circles?: { x: number; y: number; r: number }[];
  polygons?: string[][];
  rightAngles?: RightAngle[];
  angles?: AngleMark[];
  axes?: boolean;
}

const SIZE = 300;
const PAD = 30;
const SPAN = SIZE - PAD * 2;
const STROKE = '#1e3a8a';

function tx(x: number) {
  return PAD + (Math.max(0, Math.min(10, x)) / 10) * SPAN;
}
function ty(y: number) {
  return PAD + ((10 - Math.max(0, Math.min(10, y))) / 10) * SPAN;
}

// Vector tiện ích trong KHÔNG GIAN PIXEL (đã chiếu qua tx/ty).
function px(p: Pt) {
  return { x: tx(p.x), y: ty(p.y) };
}
function sub(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x: a.x - b.x, y: a.y - b.y };
}
function add(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x: a.x + b.x, y: a.y + b.y };
}
function mul(a: { x: number; y: number }, k: number) {
  return { x: a.x * k, y: a.y * k };
}
function len(a: { x: number; y: number }) {
  return Math.hypot(a.x, a.y) || 1;
}
function unit(a: { x: number; y: number }) {
  return mul(a, 1 / len(a));
}
function norm(a: { x: number; y: number }) {
  return { x: -a.y, y: a.x };
}

function normalizeSeg(s: SegmentTuple | SegmentObj): SegmentObj {
  return Array.isArray(s) ? { from: s[0], to: s[1] } : s;
}

export function FigureView({ figure }: { figure?: FigureData | null }) {
  if (!figure || typeof figure !== 'object') return null;
  const points = Array.isArray(figure.points) ? figure.points : [];
  const segments = Array.isArray(figure.segments) ? figure.segments : [];
  const circles = Array.isArray(figure.circles) ? figure.circles : [];
  const polygons = Array.isArray(figure.polygons) ? figure.polygons : [];
  const rightAngles = Array.isArray(figure.rightAngles) ? figure.rightAngles : [];
  const angles = Array.isArray(figure.angles) ? figure.angles : [];

  if (!points.length && !circles.length && !figure.axes) return null;

  const byName = new Map(points.map((p) => [p.name, p]));
  const get = (n: string) => byName.get(n);
  const getPx = (n: string) => {
    const p = get(n);
    return p ? px(p) : null;
  };

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="my-3 h-auto w-full max-w-[320px] rounded-lg border border-border bg-white"
    >
      <defs>
        <marker
          id="fv-arrow"
          markerWidth="9"
          markerHeight="9"
          refX="7.5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L8,3 L0,6 Z" fill={STROKE} />
        </marker>
        <marker
          id="fv-axis"
          markerWidth="8"
          markerHeight="8"
          refX="6.5"
          refY="2.5"
          orient="auto"
        >
          <path d="M0,0 L7,2.5 L0,5 Z" fill="#64748b" />
        </marker>
      </defs>

      {/* Hệ trục toạ độ Oxy */}
      {figure.axes && (
        <g>
          <line
            x1={tx(0)}
            y1={ty(0)}
            x2={SIZE - 6}
            y2={ty(0)}
            stroke="#64748b"
            strokeWidth={1}
            markerEnd="url(#fv-axis)"
          />
          <line
            x1={tx(0)}
            y1={ty(0)}
            x2={tx(0)}
            y2={6}
            stroke="#64748b"
            strokeWidth={1}
            markerEnd="url(#fv-axis)"
          />
          <text x={SIZE - 10} y={ty(0) + 14} fontSize={12} fill="#64748b">
            x
          </text>
          <text x={tx(0) - 14} y={12} fontSize={12} fill="#64748b">
            y
          </text>
          <text x={tx(0) - 12} y={ty(0) + 14} fontSize={12} fill="#64748b">
            O
          </text>
        </g>
      )}

      {/* Đa giác (tô nhạt) */}
      {polygons.map((poly, i) => {
        const pts = poly.map(get).filter(Boolean) as Pt[];
        if (pts.length < 3) return null;
        return (
          <polygon
            key={`poly-${i}`}
            points={pts.map((p) => `${tx(p.x)},${ty(p.y)}`).join(' ')}
            fill="rgba(30,58,138,0.06)"
            stroke={STROKE}
            strokeWidth={1.6}
          />
        );
      })}

      {/* Đường tròn */}
      {circles.map((c, i) => (
        <circle
          key={`c-${i}`}
          cx={tx(c.x)}
          cy={ty(c.y)}
          r={(Math.max(0, c.r) / 10) * SPAN}
          fill="none"
          stroke={STROKE}
          strokeWidth={1.6}
        />
      ))}

      {/* Đoạn thẳng / vectơ + nhãn + gạch ký hiệu cạnh bằng nhau */}
      {segments.map((raw, i) => {
        const s = normalizeSeg(raw);
        const pa = getPx(s.from);
        const pb = getPx(s.to);
        if (!pa || !pb) return null;
        const dir = unit(sub(pb, pa));
        const n = norm(dir);
        const mid = mul(add(pa, pb), 0.5);
        const ticks = Math.max(0, Math.min(3, s.ticks || 0));
        return (
          <g key={`s-${i}`}>
            <line
              x1={pa.x}
              y1={pa.y}
              x2={pb.x}
              y2={pb.y}
              stroke={STROKE}
              strokeWidth={1.6}
              strokeDasharray={s.dashed ? '5 4' : undefined}
              markerEnd={s.arrow ? 'url(#fv-arrow)' : undefined}
            />
            {/* Gạch ký hiệu cạnh bằng nhau */}
            {Array.from({ length: ticks }).map((_, k) => {
              const off = (k - (ticks - 1) / 2) * 5;
              const c = add(mid, mul(dir, off));
              const a = add(c, mul(n, 5));
              const b = add(c, mul(n, -5));
              return (
                <line
                  key={k}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={STROKE}
                  strokeWidth={1.4}
                />
              );
            })}
            {/* Nhãn cạnh (độ dài) */}
            {s.label && (
              <text
                x={add(mid, mul(n, 12)).x}
                y={add(mid, mul(n, 12)).y}
                fontSize={12}
                fontStyle="italic"
                textAnchor="middle"
                fill={STROKE}
              >
                {s.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Dấu góc vuông */}
      {rightAngles.map((ra, i) => {
        const p = getPx(ra.at);
        const a = getPx(ra.from);
        const b = getPx(ra.to);
        if (!p || !a || !b) return null;
        const ua = unit(sub(a, p));
        const ub = unit(sub(b, p));
        const d = 12;
        const c1 = add(p, mul(ua, d));
        const c2 = add(add(p, mul(ua, d)), mul(ub, d));
        const c3 = add(p, mul(ub, d));
        return (
          <polyline
            key={`ra-${i}`}
            points={`${c1.x},${c1.y} ${c2.x},${c2.y} ${c3.x},${c3.y}`}
            fill="none"
            stroke={STROKE}
            strokeWidth={1.3}
          />
        );
      })}

      {/* Cung ký hiệu góc + nhãn */}
      {angles.map((ang, i) => {
        const p = getPx(ang.at);
        const a = getPx(ang.from);
        const b = getPx(ang.to);
        if (!p || !a || !b) return null;
        const ua = unit(sub(a, p));
        const ub = unit(sub(b, p));
        const r = 18;
        const start = add(p, mul(ua, r));
        const end = add(p, mul(ub, r));
        // Hướng quét cung (cùng chiều kim đồng hồ trong hệ pixel hay không).
        const cross = ua.x * ub.y - ua.y * ub.x;
        const sweep = cross < 0 ? 1 : 0;
        const bis = unit(add(ua, ub));
        const labelPos = add(p, mul(bis, r + 12));
        return (
          <g key={`ang-${i}`}>
            <path
              d={`M ${start.x} ${start.y} A ${r} ${r} 0 0 ${sweep} ${end.x} ${end.y}`}
              fill="none"
              stroke={STROKE}
              strokeWidth={1.3}
            />
            {ang.label && (
              <text
                x={labelPos.x}
                y={labelPos.y}
                fontSize={11}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={STROKE}
              >
                {ang.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Điểm + nhãn */}
      {points.map((p, i) => (
        <g key={`p-${i}`}>
          <circle cx={tx(p.x)} cy={ty(p.y)} r={2.6} fill={STROKE} />
          {p.name && (
            <text
              x={tx(p.x) + 7}
              y={ty(p.y) - 7}
              fontSize={13}
              fontWeight={600}
              fill="#0f172a"
            >
              {p.name}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
