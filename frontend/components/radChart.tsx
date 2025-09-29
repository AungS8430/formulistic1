interface RadialChartProps {
  value: number; // Current value
  min?: number;  // Minimum value (default 0)
  max?: number;  // Maximum value (default 100)
  label?: string;
  sublabel?: string;
  theme?: "dark" | "light";
  size?: number;
  startColor?: string; // Start of gradient (e.g. "#17ead9")
  endColor?: string;   // End of gradient (e.g. "#fa709a")
}

function interpolateColor(start: string, end: string, t: number) {
  // Accept #RRGGBB and interpolate
  const hexToRgb = (hex: string) => {
    let c = hex.replace("#", "");
    if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
    return [
      parseInt(c.substring(0, 2), 16),
      parseInt(c.substring(2, 4), 16),
      parseInt(c.substring(4, 6), 16)
    ];
  };
  const [r1, g1, b1] = hexToRgb(start);
  const [r2, g2, b2] = hexToRgb(end);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}

export default function RadialChart({
                                            value,
                                            min = 0,
                                            max = 100,
                                            label = "TRC",
                                            sublabel,
                                            theme = "dark",
                                            size = 96,
                                            startColor = "#17ead9",
                                            endColor = "#fa709a"
                                          }: RadialChartProps) {
  // Clamp value and map to percent
  const safeMin = Math.min(min, max);
  const safeMax = Math.max(min, max);
  const safeValue = Math.max(safeMin, Math.min(safeMax, value));
  const percent = ((safeValue - safeMin) / (safeMax - safeMin)) * 100;

  const angle = (percent / 100) * 270; // 270deg arc
  const radius = size / 2 - 7;
  const stroke = 10;
  const center = size / 2;
  const startAngle = 135;

  // Arc paths
  const backgroundPath = describeArc(center, center, radius, startAngle, startAngle + 270);
  const arcPath = describeArc(center, center, radius, startAngle, startAngle + angle);

  // Interpolated arc color
  const color = interpolateColor(startColor, endColor, percent / 100);

  // Knob
  const knobAngle = startAngle + angle;
  const knobRadians = (knobAngle - 90) * (Math.PI / 180);
  const knobX = center + radius * Math.cos(knobRadians);
  const knobY = center + radius * Math.sin(knobRadians);

  // Theme colors
  const bg = theme === "dark" ? "#18181c" : "#f7f7fa";
  const text = theme === "dark" ? "#fff" : "#151515";
  const labelColor = theme === "dark" ? "#79ffe1" : "#3c3c3c";
  const sublabelColor = theme === "dark" ? "#f9f871" : "#fa709a";
  const minMaxColor = theme === "dark" ? "#6e759f" : "#b3b3b3";

  // Shadow filter for knob
  const filterId = "knobShadowGradient";

  return (
    <svg
      width={size}
      height={size}
      style={{
        background: bg,
        borderRadius: "50%",
        boxShadow: theme === "dark"
          ? "0 2px 8px 2px #111c5b50"
          : "0 2px 8px 2px #e0e8ff40"
      }}
    >
      <defs>
        {/* Glow filter for knob */}
        <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={color} />
        </filter>
        {/* Dashed arc pattern */}
        <pattern id="dashes" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="2" height="4" fill={theme === "dark" ? "#23232f" : "#e0e0e6"} />
        </pattern>
      </defs>
      {/* Dashed Background Arc */}
      <path
        d={backgroundPath}
        stroke="url(#dashes)"
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
      />
      {/* Progress Arc */}
      <path
        d={arcPath}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        style={{
          filter: `drop-shadow(0px 0px 10px ${color}55)`
        }}
      />
      {/* Progress Knob */}
      {percent > 0 && (
        <circle
          cx={knobX}
          cy={knobY}
          r={stroke / 2 + 2}
          fill="#fff"
          stroke={color}
          strokeWidth={4}
          filter={`url(#${filterId})`}
        />
      )}
      {/* Value */}
      <text
        x={center}
        y={center}
        fontSize={size / 3.5}
        fill={text}
        fontWeight="bold"
        textAnchor="middle"
        alignmentBaseline="central"
        style={{
          fontFamily: "Inter, sans-serif",
          letterSpacing: "-0.03em"
        }}
      >
        {safeValue}
      </text>
      {/* Label */}
      <text
        x={center}
        y={center + size / 6.8}
        fontSize={size / 7}
        fill={labelColor}
        textAnchor="middle"
        alignmentBaseline="hanging"
        fontFamily="Inter, sans-serif"
        fontWeight={600}
      >
        {label}
      </text>
      {/* Sublabel (optional) */}
      {sublabel && (
        <text
          x={center}
          y={center + size / 3.7}
          fontSize={size / 8}
          fill={sublabelColor}
          textAnchor="middle"
          alignmentBaseline="hanging"
          fontFamily="Inter, sans-serif"
          fontWeight={400}
        >
          {sublabel}
        </text>
      )}
    </svg>
  );
}

// Helper: SVG arc
function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);

  const arcSweep = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    arcSweep,
    0,
    end.x,
    end.y
  ].join(" ");
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  var angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
}