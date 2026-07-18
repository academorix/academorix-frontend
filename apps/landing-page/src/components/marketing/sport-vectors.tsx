import type { ReactElement } from "react";

import type { VectorKind } from "../../data/sports";

const line = { fill: "none", stroke: "white", strokeWidth: 2, strokeOpacity: 0.85 } as const;
const faint = { fill: "none", stroke: "white", strokeWidth: 2, strokeOpacity: 0.5 } as const;

function PitchLines() {
  return (
    <svg
      className="absolute inset-0 size-full"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 400 300"
    >
      <rect height="260" rx="6" width="360" x="20" y="20" {...line} />
      <line x1="200" x2="200" y1="20" y2="280" {...line} />
      <circle cx="200" cy="150" r="46" {...line} />
      <circle cx="200" cy="150" r="3" fill="white" fillOpacity="0.85" stroke="none" />
      <rect height="120" width="56" x="20" y="90" {...faint} />
      <rect height="120" width="56" x="324" y="90" {...faint} />
      <rect height="52" width="22" x="20" y="124" {...faint} />
      <rect height="52" width="22" x="358" y="124" {...faint} />
    </svg>
  );
}

function LaneLines() {
  return (
    <svg
      className="absolute inset-0 size-full"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 400 300"
    >
      {[60, 100, 140, 180, 220, 260].map((y) => (
        <line key={y} x1="0" x2="400" y1={y} y2={y} {...faint} strokeDasharray="14 10" />
      ))}
      <line x1="0" x2="400" y1="40" y2="40" {...line} />
      <line x1="0" x2="400" y1="280" y2="280" {...line} />
      {[80, 200, 320].map((x) => (
        <line key={x} x1={x} x2={x} y1="46" y2="66" {...line} />
      ))}
      {[80, 200, 320].map((x) => (
        <line key={"b" + x} x1={x} x2={x} y1="254" y2="274" {...line} />
      ))}
    </svg>
  );
}

function CourtLines() {
  return (
    <svg
      className="absolute inset-0 size-full"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 400 300"
    >
      <rect height="240" rx="4" width="320" x="40" y="30" {...line} />
      <rect height="240" width="272" x="64" y="30" {...faint} />
      <line x1="200" x2="200" y1="30" y2="270" strokeDasharray="6 8" {...line} />
      <line x1="120" x2="280" y1="30" y2="30" {...faint} />
      <line x1="120" x2="280" y1="270" y2="270" {...faint} />
      <line x1="120" x2="120" y1="30" y2="270" {...faint} />
      <line x1="280" x2="280" y1="30" y2="270" {...faint} />
    </svg>
  );
}

function TrackLines() {
  return (
    <svg
      className="absolute inset-0 size-full"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 400 300"
    >
      {[0, 12, 24, 36].map((o) => (
        <rect
          key={o}
          height={200 - o * 2}
          rx={100 - o}
          width={360 - o * 2}
          x={20 + o}
          y={50 + o}
          {...faint}
        />
      ))}
      <rect height="200" rx="100" width="360" x="20" y="50" {...line} />
      <line x1="200" x2="200" y1="50" y2="86" {...line} />
    </svg>
  );
}

function MatLines() {
  return (
    <svg
      className="absolute inset-0 size-full"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 400 300"
    >
      <rect height="260" width="360" x="20" y="20" {...line} />
      <rect height="200" width="300" x="50" y="50" {...faint} />
      <rect height="120" width="180" x="110" y="90" {...faint} />
      <circle cx="200" cy="150" r="30" {...line} />
      <line x1="20" x2="380" y1="150" y2="150" strokeDasharray="4 12" {...faint} />
      <line x1="200" x2="200" y1="20" y2="280" strokeDasharray="4 12" {...faint} />
    </svg>
  );
}

function ApparatusLines() {
  return (
    <svg
      className="absolute inset-0 size-full"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 400 300"
    >
      <rect height="180" width="180" x="30" y="180" transform="skewX(-12)" {...faint} />
      <line x1="60" x2="200" y1="120" y2="120" {...line} />
      <line x1="80" x2="80" y1="120" y2="230" {...line} />
      <line x1="180" x2="180" y1="120" y2="230" {...line} />
      <line x1="250" x2="360" y1="80" y2="80" {...line} />
      <line x1="250" x2="360" y1="150" y2="150" {...line} />
      <line x1="270" x2="270" y1="80" y2="230" {...faint} />
      <line x1="340" x2="340" y1="150" y2="230" {...faint} />
      <circle cx="200" cy="150" r="4" fill="white" fillOpacity="0.85" stroke="none" />
    </svg>
  );
}

const vectors: Record<VectorKind, () => ReactElement> = {
  pitch: PitchLines,
  lanes: LaneLines,
  court: CourtLines,
  mat: MatLines,
  track: TrackLines,
  apparatus: ApparatusLines,
};

export function SportVector({
  kind,
  accent,
  className,
}: {
  kind: VectorKind;
  accent: string;
  className?: string;
}) {
  const Lines = vectors[kind];

  return (
    <div
      className={"relative overflow-hidden rounded-3xl " + (className ?? "")}
      style={{ color: accent }}
    >
      <div className="absolute inset-0 bg-current" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/25" />
      <Lines />
    </div>
  );
}
