function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", start.x, start.y,
    "A", r, r, 0, largeArcFlag, 1, end.x, end.y,
  ].join(" ");
}

export default function Compound({ abbreviation, color }: { abbreviation: string; color: string }) {
  // Arc parameters
  const cx = 128, cy = 128, r = 100;
  // Left arc: from 210deg to 330deg
  const leftArc = arcPath(cx, cy, r, 210, 330);
  // Right arc: from 30deg to 150deg
  const rightArc = arcPath(cx, cy, r, 30, 150);

  return (
    <svg viewBox="0 0 256 256" className="w-4 h-4 md:w-6 md:h-6" fill="none">
      {/* Left red arc */}
      <path
        d={leftArc}
        stroke={color}
        strokeWidth={32}
        strokeLinecap="round"
        fill="none"
      />
      {/* Right red arc */}
      <path
        d={rightArc}
        stroke={color}
        strokeWidth={32}
        strokeLinecap="round"
        fill="none"
      />
      {/* S letter */}
      <text
        x="128"
        y="136"
        textAnchor="middle"
        fontFamily="'Arial Black', Arial, sans-serif"
        fontSize="120"
        fill="white"
        fontWeight="bold"
        alignmentBaseline="middle"
        dominantBaseline="middle"
        style={{ userSelect: "none" }}
      >
        {abbreviation}
      </text>
    </svg>
  );
}