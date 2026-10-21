export type NugDot = { x: number; y: number; rx: number; ry: number };
export type NugLine = { x1: number; y1: number; x2: number; y2: number };
export type NugPlan = {
  stroke: string;
  fill: string;
  pistil: string;
  frost: string;
  buds: NugDot[];
  pistils: NugLine[];
  crystals: NugDot[];
};

function hashSlug(slug: string) {
  let hash = 2166136261;
  for (let index = 0; index < slug.length; index += 1) {
    hash ^= slug.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function series(seed: number) {
  let state = seed || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function nugPlan(input: { slug: string; name: string; type?: string | null }): NugPlan {
  const name = input.name.toLowerCase();
  const purple = /purple|violet|lavender|blueberry|granddaddy|urkle/.test(name);
  const citrus = /lemon|lime|citrus|orange|tangie|pineapple|mango|jack|citron/.test(name);
  const gas = /gas|diesel|fuel|chem|kush|gmo|og\b/.test(name);
  const haze = /haze/.test(name) || input.type === "sativa";
  const rand = series(hashSlug(input.slug || input.name));
  const stroke = purple ? "#d58bff" : citrus ? "#d6ff6a" : gas ? "#9bbf72" : "#c6ff4a";
  const fill = purple ? "#241432" : citrus ? "#14210c" : gas ? "#101910" : "#102117";
  const pistil = purple ? "#ff8ad4" : citrus ? "#ffc14a" : gas ? "#d4895a" : "#ffb15a";
  const cx = 188;
  const cy = 146;
  const colaWidth = gas ? 62 : haze ? 48 : 58;
  const colaHeight = haze ? 108 : gas ? 78 : 90;
  const rows = (haze ? 6 : 5) + (rand() > 0.5 ? 1 : 0);
  const buds: NugDot[] = [];
  for (let row = 0; row < rows; row += 1) {
    const t = rows === 1 ? 0.5 : row / (rows - 1);
    const bulge = Math.sin(t * Math.PI);
    const y = cy - colaHeight / 2 + t * colaHeight;
    const span = colaWidth * (0.35 + bulge);
    const across = bulge > 0.55 ? 3 : 2;
    for (let col = 0; col < across; col += 1) {
      const x = cx - span / 2 + (col / (across - 1)) * span + (rand() - 0.5) * 7;
      buds.push({
        x,
        y: y + (rand() - 0.5) * 5,
        rx: (gas ? 11 : 14) + rand() * 7 + bulge * 5,
        ry: (haze ? 14 : 11) + rand() * 7,
      });
    }
  }
  buds.push({ x: cx, y: cy + colaHeight / 2 + 10, rx: 2.5, ry: 14 });
  const pistils: NugLine[] = [];
  const hairs = 12 + Math.floor(rand() * (citrus ? 10 : 6));
  for (let index = 0; index < hairs; index += 1) {
    const host = buds[Math.floor(rand() * Math.max(1, buds.length - 1))] ?? buds[0];
    const angle = -Math.PI * 0.9 + rand() * Math.PI * 1.6;
    const length = 12 + rand() * (citrus ? 18 : 12);
    pistils.push({
      x1: host.x + Math.cos(angle) * host.rx * 0.4,
      y1: host.y + Math.sin(angle) * host.ry * 0.35,
      x2: host.x + Math.cos(angle + 0.35) * (host.rx * 0.4 + length),
      y2: host.y - 4 + Math.sin(angle) * (host.ry * 0.3 + length * 0.7),
    });
  }
  const crystals: NugDot[] = [];
  for (const bud of buds) {
    const spark = 2 + Math.floor(rand() * (gas ? 2 : 4));
    for (let index = 0; index < spark; index += 1) {
      crystals.push({
        x: bud.x + (rand() - 0.5) * bud.rx * 1.4,
        y: bud.y + (rand() - 0.5) * bud.ry * 1.2,
        rx: rand() > 0.75 ? 1.7 : 1,
        ry: 1,
      });
    }
  }
  return { stroke, fill, pistil, frost: "#e7ffc4", buds, pistils, crystals };
}
