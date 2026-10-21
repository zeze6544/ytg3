import { nugPlan } from "@/lib/nug";

export function NugMark({
  slug,
  name,
  type,
  compact = false,
}: {
  slug: string;
  name: string;
  type?: string | null;
  compact?: boolean;
}) {
  const plan = nugPlan({ slug, name, type });
  return (
    <svg
      viewBox="0 0 360 280"
      role="img"
      aria-label={`Generated terminal mark for ${name}. Not a photograph.`}
      className={`w-full ${compact ? "h-28" : "h-auto max-h-[420px]"} bg-[#07140c]`}
    >
      <rect x="1" y="1" width="358" height="278" fill="#07140c" stroke={plan.stroke} strokeWidth="1.5" />
      <text x="14" y="24" fill={plan.stroke} fontFamily="VT323, monospace" fontSize="18">
        NARCØDEX
      </text>
      <text x="250" y="24" fill="#5ee2ff" fontFamily="VT323, monospace" fontSize="14">
        PLANT FILE
      </text>
      <line x1="12" y1="34" x2="348" y2="34" stroke={plan.stroke} strokeOpacity="0.45" />
      {plan.buds.map((bud, index) => (
        <ellipse
          key={`bud-${index}`}
          cx={bud.x}
          cy={bud.y}
          rx={bud.rx}
          ry={bud.ry}
          fill={plan.fill}
          stroke={plan.stroke}
          strokeWidth={index === 0 ? 1.6 : 1}
        />
      ))}
      {plan.pistils.map((hair, index) => (
        <line
          key={`hair-${index}`}
          x1={hair.x1}
          y1={hair.y1}
          x2={hair.x2}
          y2={hair.y2}
          stroke={plan.pistil}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      ))}
      {plan.crystals.map((dot, index) => (
        <circle key={`frost-${index}`} cx={dot.x} cy={dot.y} r={dot.rx} fill={plan.frost} opacity="0.85" />
      ))}
      {Array.from({ length: 18 }, (_, index) => (
        <line
          key={`scan-${index}`}
          x1="8"
          y1={46 + index * 12}
          x2="352"
          y2={46 + index * 12}
          stroke="#c6ff4a"
          strokeOpacity="0.06"
        />
      ))}
      {!compact ? (
        <text x="14" y="266" fill="#8eae86" fontFamily="JetBrains Mono, monospace" fontSize="10">
          GENERATED MARK · NOT A PHOTOGRAPH
        </text>
      ) : null}
    </svg>
  );
}
