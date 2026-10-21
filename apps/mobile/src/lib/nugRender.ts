export const NUG_RENDERER_VERSION = 4;

export type NugSize = "thumb" | "detail";

export interface NugPlan {
  seed: number;
  code: string;
  archetype: string;
  height: number;
  width: number;
  lean: number;
  leanDir: number;
  twist: number;
  lumpA: number;
  lumpB: number;
  lumpPhaseA: number;
  lumpPhaseB: number;
  lumpRows: number;
  clusters: number;
  calyxPerCluster: number;
  calyxSize: number;
  calyxFat: number;
  upBias: number;
  leaves: number;
  leafLength: number;
  leafCurl: number;
  pistils: number;
  pistilLength: number;
  pistilCurl: number;
  trichome: number;
  branches: number;
  yaw: number;
  pitch: number;
  roll: number;
  light: [number, number, number];
  stipple: number;
  grid: number;
  reticle: number;
  scanPitch: number;
  lie: number;
  frameZoom: number;
  frameX: number;
  frameY: number;
}

export interface NugImage {
  width: number;
  height: number;
  data: Uint8ClampedArray;
  plan: NugPlan;
}

type Rng = () => number;

function rngFrom(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function nugSeed(key: string) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return h >>> 0;
}

export function specimenCode(key: string) {
  return `NX-${nugSeed(`code:${key}`).toString(36).toUpperCase().padStart(7, "0").slice(0, 7)}`;
}

const ARCHETYPES = ["spear", "egg", "foxtail", "chunky", "torpedo", "pinecone", "cluster", "spire"] as const;

export function nugPlan(key: string, type?: string | null): NugPlan {
  const seed = nugSeed(key);
  const rnd = rngFrom(seed);
  const range = (lo: number, hi: number) => lo + (hi - lo) * rnd();
  let archetype: string = ARCHETYPES[Math.floor(rnd() * ARCHETYPES.length)];
  const lean = type === "sativa" ? range(0.08, 0.34) : range(0, 0.26);
  let width = range(0.3, 0.6);
  if (type === "indica") width *= range(1.0, 1.18);
  if (type === "sativa") width *= range(0.78, 0.95);
  if (archetype === "torpedo" || archetype === "spire") width *= 0.8;
  if (archetype === "chunky" || archetype === "cluster") width *= 1.1;
  if (type === "ruderalis" && rnd() < 0.5) archetype = "egg";
  return {
    seed,
    code: specimenCode(key),
    archetype,
    height: 1,
    width,
    lean,
    leanDir: range(0, Math.PI * 2),
    twist: range(-1.6, 1.6),
    lumpA: range(0.04, 0.2),
    lumpB: range(0.02, 0.14),
    lumpPhaseA: range(0, Math.PI * 2),
    lumpPhaseB: range(0, Math.PI * 2),
    lumpRows: Math.floor(range(3, 9)),
    clusters: Math.floor(range(38, 120)),
    calyxPerCluster: Math.floor(range(3, 9)),
    calyxSize: range(0.05, 0.11),
    calyxFat: range(0.32, 0.6),
    upBias: range(0.15, 0.85),
    leaves: Math.floor(range(3, 15)),
    leafLength: range(0.1, 0.32),
    leafCurl: range(-2.2, 2.2),
    pistils: Math.floor(range(30, 190)),
    pistilLength: range(0.03, 0.11),
    pistilCurl: range(1, 7),
    trichome: range(0.05, 0.3),
    branches: rnd() < 0.42 ? Math.floor(range(1, 3.99)) : 0,
    yaw: range(0, Math.PI * 2),
    pitch: range(-0.28, 0.32),
    roll: range(-0.22, 0.22),
    light: [range(-1, 1), range(0.2, 1), range(0.3, 1)],
    stipple: range(0.55, 1),
    grid: Math.floor(range(0, 4)),
    reticle: range(0, 1),
    scanPitch: rnd() < 0.5 ? 2 : 3,
    // Framing: some specimens lie on their side, and the crop, scale and
    // offset vary so silhouettes do not all sit upright in the same box.
    lie: rnd() < 0.38 ? (rnd() < 0.5 ? -1 : 1) * range(0.85, 1.55) : range(-0.4, 0.4),
    frameZoom: rnd() < 0.22 ? range(1.12, 1.4) : range(0.72, 1.04),
    frameX: range(-0.14, 0.14),
    frameY: range(-0.08, 0.08),
  };
}

function profile(plan: NugPlan, t: number) {
  const s = Math.max(0, Math.min(1, t));
  const sin = Math.sin(Math.PI * s);
  let r: number;
  switch (plan.archetype) {
    case "spear":
      r = Math.pow(Math.sin(Math.PI * Math.pow(s, 0.72)), 0.9) * (1 - 0.35 * s);
      break;
    case "egg":
      r = Math.pow(sin, 0.62);
      break;
    case "foxtail":
      r = Math.pow(Math.sin(Math.PI * Math.pow(s, 0.8)), 0.8) * (0.82 + 0.22 * Math.abs(Math.sin(s * plan.lumpRows * Math.PI)));
      break;
    case "chunky":
      r = Math.min(1, 1.3 * Math.pow(sin, 0.45)) * (1 - 0.15 * s);
      break;
    case "torpedo":
      r = Math.pow(Math.min(1, s / 0.16) * Math.min(1, (1 - s) / 0.2), 0.55) * 0.82;
      break;
    case "pinecone":
      r = Math.pow(Math.sin(Math.PI * Math.pow(s, 1.35)), 0.85);
      break;
    case "cluster":
      r = Math.pow(sin, 0.55) * (0.78 + 0.3 * Math.abs(Math.sin(s * 3.1 + plan.lumpPhaseA)));
      break;
    default:
      r = Math.pow(Math.sin(Math.PI * Math.pow(s, 0.6)), 1.1) * (1 - 0.5 * s);
  }
  return r;
}

type Vec = [number, number, number];

class Cloud {
  x: number[] = [];
  y: number[] = [];
  z: number[] = [];
  nx: number[] = [];
  ny: number[] = [];
  nz: number[] = [];
  k: number[] = [];
  add(p: Vec, n: Vec, kind: number) {
    this.x.push(p[0]);
    this.y.push(p[1]);
    this.z.push(p[2]);
    this.nx.push(n[0]);
    this.ny.push(n[1]);
    this.nz.push(n[2]);
    this.k.push(kind);
  }
}

interface Hair {
  pts: Vec[];
}

function norm(v: Vec): Vec {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

function cross(a: Vec, b: Vec): Vec {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function basis(d: Vec): [Vec, Vec] {
  const up: Vec = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const u = norm(cross(d, up));
  const v = norm(cross(d, u));
  return [u, v];
}

interface Cola {
  origin: Vec;
  axis: Vec;
  scale: number;
}

function spine(plan: NugPlan, cola: Cola, t: number): Vec {
  const bend = plan.lean * t * t * cola.scale;
  const [u] = basis(cola.axis);
  const wob = 0.025 * Math.sin(t * 9 + plan.lumpPhaseB) * cola.scale;
  return [
    cola.origin[0] + cola.axis[0] * t * cola.scale + (Math.cos(plan.leanDir) * bend + u[0] * wob),
    cola.origin[1] + cola.axis[1] * t * cola.scale + u[1] * wob,
    cola.origin[2] + cola.axis[2] * t * cola.scale + (Math.sin(plan.leanDir) * bend + u[2] * wob),
  ];
}

function radiusAt(plan: NugPlan, cola: Cola, t: number, theta: number) {
  const base = profile(plan, t) * plan.width * 0.5 * cola.scale;
  const lump = 1 + plan.lumpA * Math.sin(2 * theta + plan.lumpPhaseA + t * 5) + plan.lumpB * Math.sin(3 * theta + plan.lumpPhaseB - t * 7);
  return base * lump;
}

function buildCola(plan: NugPlan, cola: Cola, rnd: Rng, cloud: Cloud, hairs: Hair[], budget: number, tips: Vec[]) {
  const [ax, ay] = basis(cola.axis);
  const clusterCount = Math.max(8, Math.round(plan.clusters * Math.sqrt(cola.scale)));
  const calyxes: { c: Vec; d: Vec; len: number; fat: number }[] = [];
  for (let i = 0; i < clusterCount; i += 1) {
    let t = rnd();
    for (let tries = 0; tries < 4 && profile(plan, t) < rnd() * 0.9; tries += 1) t = rnd();
    t = 0.04 + t * 0.94;
    const theta = rnd() * Math.PI * 2 + plan.twist * t;
    const r = radiusAt(plan, cola, t, theta) * (0.62 + 0.3 * rnd());
    const center = spine(plan, cola, t);
    const out: Vec = [
      Math.cos(theta) * ax[0] + Math.sin(theta) * ay[0],
      Math.cos(theta) * ax[1] + Math.sin(theta) * ay[1],
      Math.cos(theta) * ax[2] + Math.sin(theta) * ay[2],
    ];
    const cc: Vec = [center[0] + out[0] * r, center[1] + out[1] * r, center[2] + out[2] * r];
    const csize = plan.calyxSize * cola.scale * (0.55 + 0.9 * rnd()) * (0.55 + 0.7 * profile(plan, t));
    const n = Math.max(2, Math.round(plan.calyxPerCluster * (0.6 + 0.8 * rnd())));
    for (let j = 0; j < n; j += 1) {
      const jitter: Vec = [(rnd() - 0.5) * csize * 1.2, (rnd() - 0.5) * csize * 1.2, (rnd() - 0.5) * csize * 1.2];
      const d = norm([
        out[0] + cola.axis[0] * plan.upBias + (rnd() - 0.5) * 0.9,
        out[1] + cola.axis[1] * plan.upBias + (rnd() - 0.5) * 0.9,
        out[2] + cola.axis[2] * plan.upBias + (rnd() - 0.5) * 0.9,
      ]);
      calyxes.push({ c: [cc[0] + jitter[0], cc[1] + jitter[1], cc[2] + jitter[2]], d, len: csize * (0.8 + 0.6 * rnd()), fat: plan.calyxFat * (0.8 + 0.4 * rnd()) });
    }
  }
  const top = spine(plan, cola, 1.0);
  for (let j = 0; j < 6; j += 1) {
    const d = norm([cola.axis[0] + (rnd() - 0.5) * 0.7, cola.axis[1] + (rnd() - 0.5) * 0.3, cola.axis[2] + (rnd() - 0.5) * 0.7]);
    calyxes.push({ c: [top[0] + (rnd() - 0.5) * 0.04 * cola.scale, top[1] - 0.03 * cola.scale, top[2] + (rnd() - 0.5) * 0.04 * cola.scale], d, len: plan.calyxSize * cola.scale * (0.9 + 0.5 * rnd()), fat: plan.calyxFat });
  }

  const corePts = Math.round(budget * 0.16);
  for (let i = 0; i < corePts; i += 1) {
    const t = 0.02 + rnd() * 0.96;
    const theta = rnd() * Math.PI * 2;
    const r = radiusAt(plan, cola, t, theta) * 0.8;
    const c = spine(plan, cola, t);
    const out: Vec = [
      Math.cos(theta) * ax[0] + Math.sin(theta) * ay[0],
      Math.cos(theta) * ax[1] + Math.sin(theta) * ay[1],
      Math.cos(theta) * ax[2] + Math.sin(theta) * ay[2],
    ];
    cloud.add([c[0] + out[0] * r, c[1] + out[1] * r, c[2] + out[2] * r], out, 4);
  }

  const area = calyxes.reduce((sum, item) => sum + item.len * item.len * item.fat, 0) || 1;
  for (const cal of calyxes) {
    const [u, v] = basis(cal.d);
    const count = Math.max(6, Math.round((budget * 0.78 * cal.len * cal.len * cal.fat) / area));
    for (let i = 0; i < count; i += 1) {
      const s = Math.pow(rnd(), 0.8);
      const phi = rnd() * Math.PI * 2;
      const rho = cal.len * cal.fat * Math.pow(Math.sin(Math.PI * Math.min(0.999, s * 0.92 + 0.04)), 0.75) * (1 - 0.45 * s);
      const radial: Vec = [Math.cos(phi) * u[0] + Math.sin(phi) * v[0], Math.cos(phi) * u[1] + Math.sin(phi) * v[1], Math.cos(phi) * u[2] + Math.sin(phi) * v[2]];
      const along = (s - 0.35) * cal.len;
      const p: Vec = [cal.c[0] + cal.d[0] * along + radial[0] * rho, cal.c[1] + cal.d[1] * along + radial[1] * rho, cal.c[2] + cal.d[2] * along + radial[2] * rho];
      const nrm = norm([radial[0] + cal.d[0] * (s - 0.4), radial[1] + cal.d[1] * (s - 0.4), radial[2] + cal.d[2] * (s - 0.4)]);
      const isTrichome = rnd() < plan.trichome;
      if (isTrichome) {
        const lift = cal.len * (0.04 + 0.06 * rnd());
        cloud.add([p[0] + nrm[0] * lift, p[1] + nrm[1] * lift, p[2] + nrm[2] * lift], nrm, 2);
      } else {
        cloud.add(p, nrm, 0);
      }
    }
    tips.push([cal.c[0] + cal.d[0] * cal.len * 0.6, cal.c[1] + cal.d[1] * cal.len * 0.6, cal.c[2] + cal.d[2] * cal.len * 0.6]);
  }

  const leafCount = Math.max(1, Math.round(plan.leaves * Math.sqrt(cola.scale)));
  for (let i = 0; i < leafCount; i += 1) {
    const t = 0.08 + rnd() * 0.8;
    const theta = rnd() * Math.PI * 2;
    const center = spine(plan, cola, t);
    const r = radiusAt(plan, cola, t, theta) * 0.7;
    const out: Vec = [
      Math.cos(theta) * ax[0] + Math.sin(theta) * ay[0],
      Math.cos(theta) * ax[1] + Math.sin(theta) * ay[1],
      Math.cos(theta) * ax[2] + Math.sin(theta) * ay[2],
    ];
    const base: Vec = [center[0] + out[0] * r, center[1] + out[1] * r, center[2] + out[2] * r];
    let dir = norm([out[0] + cola.axis[0] * (0.4 + rnd() * 0.8), out[1] + cola.axis[1] * (0.4 + rnd() * 0.8), out[2] + cola.axis[2] * (0.4 + rnd() * 0.8)]);
    const side = norm(cross(dir, cola.axis));
    const length = plan.leafLength * cola.scale * (0.55 + 0.7 * rnd());
    const widthMax = length * (0.12 + 0.12 * rnd());
    const curl = plan.leafCurl * (0.6 + 0.8 * rnd());
    const steps = 22;
    let pos: Vec = base;
    const pts = Math.round((budget * 0.12) / leafCount);
    const spine2: Vec[] = [];
    for (let sIndex = 0; sIndex <= steps; sIndex += 1) {
      spine2.push(pos);
      const bendAxis = side;
      const angle = (curl / steps) * 0.6;
      const c = Math.cos(angle);
      const sn = Math.sin(angle);
      const k = cross(bendAxis, dir);
      dir = norm([dir[0] * c + k[0] * sn, dir[1] * c + k[1] * sn, dir[2] * c + k[2] * sn]);
      pos = [pos[0] + (dir[0] * length) / steps, pos[1] + (dir[1] * length) / steps, pos[2] + (dir[2] * length) / steps];
    }
    const leafNormal = norm(cross(side, dir));
    for (let i2 = 0; i2 < pts; i2 += 1) {
      const s = rnd();
      const fi = s * steps;
      const idx = Math.min(steps - 1, Math.floor(fi));
      const f = fi - idx;
      const a0 = spine2[idx];
      const a1 = spine2[idx + 1];
      const sp: Vec = [a0[0] + (a1[0] - a0[0]) * f, a0[1] + (a1[1] - a0[1]) * f, a0[2] + (a1[2] - a0[2]) * f];
      const serr = 1 + 0.22 * Math.sin(s * 46 + i);
      const w = widthMax * Math.pow(Math.sin(Math.PI * Math.min(0.999, s)), 0.7) * serr;
      const off = (rnd() * 2 - 1) * w;
      const edge = Math.abs(off) > w * 0.82 || Math.abs(off) < w * 0.06 ? 1 : 3;
      cloud.add([sp[0] + side[0] * off, sp[1] + side[1] * off, sp[2] + side[2] * off], leafNormal, edge);
    }
  }

  const pistilCount = Math.max(4, Math.round(plan.pistils * cola.scale));
  for (let i = 0; i < pistilCount && tips.length; i += 1) {
    const start = tips[Math.floor(rnd() * tips.length)];
    const center = spine(plan, cola, 0.5);
    let d = norm([start[0] - center[0] + (rnd() - 0.5) * 0.3, start[1] - center[1] + rnd() * 0.3, start[2] - center[2] + (rnd() - 0.5) * 0.3]);
    const len = plan.pistilLength * cola.scale * (0.5 + rnd());
    const steps = 10;
    const pts: Vec[] = [start];
    const curl = plan.pistilCurl * (rnd() - 0.5);
    const [cu] = basis(d);
    let p = start;
    for (let s = 0; s < steps; s += 1) {
      const a = (curl / steps) * (1 + s * 0.15);
      const c = Math.cos(a);
      const sn = Math.sin(a);
      const k = cross(cu, d);
      d = norm([d[0] * c + k[0] * sn, d[1] * c + k[1] * sn - 0.02, d[2] * c + k[2] * sn]);
      p = [p[0] + (d[0] * len) / steps, p[1] + (d[1] * len) / steps, p[2] + (d[2] * len) / steps];
      pts.push(p);
    }
    hairs.push({ pts });
  }
}

export function nugGeometry(plan: NugPlan, budget: number) {
  const rnd = rngFrom(plan.seed ^ 0x9e3779b9);
  const cloud = new Cloud();
  const hairs: Hair[] = [];
  const tips: Vec[] = [];
  const main: Cola = { origin: [0, -0.5, 0], axis: [0, 1, 0], scale: 1 };
  const branchShare = plan.branches ? 0.25 : 0;
  buildCola(plan, main, rnd, cloud, hairs, budget * (1 - branchShare), tips);
  for (let b = 0; b < plan.branches; b += 1) {
    const t = 0.12 + rnd() * 0.35;
    const theta = rnd() * Math.PI * 2;
    const at = spine(plan, main, t);
    const r = radiusAt(plan, main, t, theta) * 0.85;
    const axis = norm([Math.cos(theta) * 0.9, 0.75 + rnd() * 0.5, Math.sin(theta) * 0.9]);
    const scale = 0.32 + rnd() * 0.22;
    const bt: Vec[] = [];
    buildCola(plan, { origin: [at[0] + Math.cos(theta) * r, at[1], at[2] + Math.sin(theta) * r], axis, scale }, rnd, cloud, hairs, (budget * branchShare) / plan.branches, bt);
  }
  const stemPts = Math.round(budget * 0.025);
  const stemLen = 0.08 + rnd() * 0.08;
  for (let i = 0; i < stemPts; i += 1) {
    const s = rnd();
    const phi = rnd() * Math.PI * 2;
    const rr = 0.022 * (1 - 0.3 * s);
    cloud.add([Math.cos(phi) * rr + plan.lean * 0.02, -0.5 - s * stemLen, Math.sin(phi) * rr], [Math.cos(phi), 0, Math.sin(phi)], 1);
  }
  return { cloud, hairs };
}

function rotation(yaw: number, pitch: number, roll: number) {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const cr = Math.cos(roll);
  const sr = Math.sin(roll);
  return [
    [cy * cr + sy * sp * sr, -cy * sr + sy * sp * cr, sy * cp],
    [cp * sr, cp * cr, -sp],
    [-sy * cr + cy * sp * sr, sy * sr + cy * sp * cr, cy * cp],
  ];
}

interface Canvas {
  w: number;
  h: number;
  acc: Float32Array;
  zbuf: Float32Array;
  over: Float32Array;
}

interface View {
  x0: number;
  y0: number;
  w: number;
  h: number;
  yaw: number;
  pitch: number;
  roll: number;
  zoom: number;
  focus?: Vec;
  shiftX?: number;
  shiftY?: number;
  splat: number;
  gain: number;
}

function renderView(cv: Canvas, plan: NugPlan, geo: ReturnType<typeof nugGeometry>, view: View, rnd: Rng) {
  const m = rotation(view.yaw, view.pitch, view.roll);
  const { cloud, hairs } = geo;
  const n = cloud.x.length;
  const px = new Float32Array(n);
  const py = new Float32Array(n);
  const pz = new Float32Array(n);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < n; i += 1) {
    const x = cloud.x[i];
    const y = cloud.y[i];
    const z = cloud.z[i];
    px[i] = m[0][0] * x + m[0][1] * y + m[0][2] * z;
    py[i] = m[1][0] * x + m[1][1] * y + m[1][2] * z;
    pz[i] = m[2][0] * x + m[2][1] * y + m[2][2] * z;
    if (px[i] < minX) minX = px[i];
    if (px[i] > maxX) maxX = px[i];
    if (py[i] < minY) minY = py[i];
    if (py[i] > maxY) maxY = py[i];
  }
  let scale = Math.min((view.w * 0.84) / (maxX - minX || 1), (view.h * 0.86) / (maxY - minY || 1));
  let cx = (minX + maxX) / 2;
  let cy = (minY + maxY) / 2;
  if (view.focus) {
    const f = view.focus;
    cx = m[0][0] * f[0] + m[0][1] * f[1] + m[0][2] * f[2];
    cy = m[1][0] * f[0] + m[1][1] * f[1] + m[1][2] * f[2];
  }
  scale *= view.zoom;
  const ox = view.x0 + view.w * (0.5 + (view.shiftX ?? 0));
  const oy = view.y0 + view.h * (0.5 + (view.shiftY ?? 0));
  const x1 = view.x0 + view.w;
  const y1 = view.y0 + view.h;
  for (let y = view.y0; y < y1; y += 1) cv.zbuf.fill(-1e9, y * cv.w + view.x0, y * cv.w + x1);
  const sx = new Int32Array(n);
  const sy = new Int32Array(n);
  const r = view.splat;
  for (let i = 0; i < n; i += 1) {
    const X = Math.round(ox + (px[i] - cx) * scale);
    const Y = Math.round(oy - (py[i] - cy) * scale);
    sx[i] = X;
    sy[i] = Y;
    if (X < view.x0 || Y < view.y0 || X >= x1 || Y >= y1) continue;
    for (let dy = -r; dy <= r; dy += 1) {
      const yy = Y + dy;
      if (yy < view.y0 || yy >= y1) continue;
      for (let dx = -r; dx <= r; dx += 1) {
        const xx = X + dx;
        if (xx < view.x0 || xx >= x1) continue;
        const idx = yy * cv.w + xx;
        if (pz[i] > cv.zbuf[idx]) cv.zbuf[idx] = pz[i];
      }
    }
  }
  let hit = 0;
  for (let y = view.y0; y < y1; y += 1) {
    for (let x = view.x0; x < x1; x += 1) if (cv.zbuf[y * cv.w + x] > -1e8) hit += 1;
  }
  const density = (0.45 * n) / Math.max(1, hit);
  const stride = Math.max(1, Math.round(density / 1.4));
  const gain = view.gain * Math.min(1.5, 1.25 / Math.max(0.4, density / stride));
  const L = norm(plan.light);
  const eps = 0.035;
  const worldPerPixel = 1 / scale;
  const aoR = Math.max(2, Math.round(view.w / 70));
  const ring: [number, number][] = [];
  for (let a = 0; a < 8; a += 1) ring.push([Math.round(Math.cos((a * Math.PI) / 4) * aoR), Math.round(Math.sin((a * Math.PI) / 4) * aoR)]);
  const zAt = (X: number, Y: number) => (X < view.x0 || Y < view.y0 || X >= x1 || Y >= y1 ? -1e9 : cv.zbuf[Y * cv.w + X]);
  for (let i = 0; i < n; i += stride) {
    const X = sx[i];
    const Y = sy[i];
    if (X < view.x0 || Y < view.y0 || X >= x1 || Y >= y1) continue;
    const idx = Y * cv.w + X;
    if (pz[i] < cv.zbuf[idx] - eps) continue;
    const nx = m[0][0] * cloud.nx[i] + m[0][1] * cloud.ny[i] + m[0][2] * cloud.nz[i];
    const ny = m[1][0] * cloud.nx[i] + m[1][1] * cloud.ny[i] + m[1][2] * cloud.nz[i];
    const nz = m[2][0] * cloud.nx[i] + m[2][1] * cloud.ny[i] + m[2][2] * cloud.nz[i];
    const diffuse = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
    const rim = Math.pow(1 - Math.min(1, Math.abs(nz)), 2.2);
    let occ = 0;
    let edge = 0;
    for (const [dx, dy] of ring) {
      const zn = zAt(X + dx, Y + dy);
      if (zn < -1e8) {
        edge += 1;
        continue;
      }
      const dz = (zn - pz[i]) / (aoR * worldPerPixel);
      if (dz > 0.15) occ += Math.min(1, dz * 0.6);
      else if (dz < -1.2) edge += 0.5;
    }
    occ /= ring.length;
    edge = Math.min(1, edge / 3);
    const kind = cloud.k[i];
    let v = (0.3 + 0.75 * diffuse + 0.35 * rim) * (1 - 0.85 * occ) + 0.75 * edge;
    if (kind === 2) v = (1.1 + 0.5 * rnd()) * (1 - 0.5 * occ);
    else if (kind === 1) v *= 0.75;
    else if (kind === 3) v *= 0.7;
    else if (kind === 4) v *= 0.45;
    v *= plan.stipple + (1 - plan.stipple) * rnd();
    cv.acc[idx] += v * gain;
  }
  for (const hair of hairs) {
    for (let s = 0; s < hair.pts.length - 1; s += 1) {
      const a = hair.pts[s];
      const b = hair.pts[s + 1];
      const ax = m[0][0] * a[0] + m[0][1] * a[1] + m[0][2] * a[2];
      const ay = m[1][0] * a[0] + m[1][1] * a[1] + m[1][2] * a[2];
      const az = m[2][0] * a[0] + m[2][1] * a[1] + m[2][2] * a[2];
      const bx = m[0][0] * b[0] + m[0][1] * b[1] + m[0][2] * b[2];
      const by = m[1][0] * b[0] + m[1][1] * b[1] + m[1][2] * b[2];
      const bz = m[2][0] * b[0] + m[2][1] * b[1] + m[2][2] * b[2];
      const X0 = ox + (ax - cx) * scale;
      const Y0 = oy - (ay - cy) * scale;
      const X1 = ox + (bx - cx) * scale;
      const Y1 = oy - (by - cy) * scale;
      const steps = Math.max(1, Math.ceil(Math.hypot(X1 - X0, Y1 - Y0)));
      for (let k = 0; k <= steps; k += 1) {
        const f = k / steps;
        const X = Math.round(X0 + (X1 - X0) * f);
        const Y = Math.round(Y0 + (Y1 - Y0) * f);
        if (X < view.x0 || Y < view.y0 || X >= x1 || Y >= y1) continue;
        const idx = Y * cv.w + X;
        const z = az + (bz - az) * f;
        if (z < cv.zbuf[idx] - eps * 1.5) continue;
        cv.acc[idx] += 0.7 * Math.min(1, gain * 1.5);
      }
    }
  }
  return { scale, cx, cy, ox, oy, m };
}

const GLYPHS: Record<string, string> = {
  A: "01110100011000111111100011000110001", B: "11110100011000111110100011000111110", C: "01110100011000010000100001000101110",
  D: "11110100011000110001100011000111110", E: "11111100001000011110100001000011111", F: "11111100001000011110100001000010000",
  G: "01110100011000010111100011000101111", H: "10001100011000111111100011000110001", I: "01110001000010000100001000010001110",
  J: "00111000100001000010000101001001100", K: "10001100101010011000101001001010001", L: "10000100001000010000100001000011111",
  M: "10001110111010110101100011000110001", N: "10001100011100110101100111000110001", O: "01110100011000110001100011000101110",
  P: "11110100011000111110100001000010000", Q: "01110100011000110001101011001001101", R: "11110100011000111110101001001010001",
  S: "01111100001000001110000010000111110", T: "11111001000010000100001000010000100", U: "10001100011000110001100011000101110",
  V: "10001100011000110001100010101000100", W: "10001100011000110101101011010101010", X: "10001100010101000100010101000110001",
  Y: "10001100010101000100001000010000100", Z: "11111000010001000100010001000011111", "0": "01110100011001110101110011000101110",
  "1": "00100011000010000100001000010001110", "2": "01110100010000100010001000100011111", "3": "11111000100010000010000011000101110",
  "4": "00010001100101010010111110001000010", "5": "11111100001111000001000011000101110", "6": "00110010001000011110100011000101110",
  "7": "11111000010001000100010000100001000", "8": "01110100011000101110100011000101110", "9": "01110100011000101111000010001001100",
  "-": "00000000000000011111000000000000000", ":": "00000011000110000000011000110000000", ".": "00000000000000000000000000110001100",
  "/": "00001000100001000100010000100010000", "#": "0101001010111110101011111010100101", "%": "11000110010001000100010001001100011",
  " ": "00000000000000000000000000000000000",
};

function text(cv: Canvas, x: number, y: number, value: string, level = 0.75, size = 1) {
  let cx = x;
  for (const ch of value.toUpperCase()) {
    const g = GLYPHS[ch] ?? GLYPHS[" "];
    for (let row = 0; row < 7; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        if (g[row * 5 + col] !== "1") continue;
        for (let sy = 0; sy < size; sy += 1) {
          for (let sx = 0; sx < size; sx += 1) {
            const X = cx + col * size + sx;
            const Y = y + row * size + sy;
            if (X >= 0 && Y >= 0 && X < cv.w && Y < cv.h) cv.over[Y * cv.w + X] = Math.max(cv.over[Y * cv.w + X], level);
          }
        }
      }
    }
    cx += 6 * size;
  }
}

function line(cv: Canvas, x0: number, y0: number, x1: number, y1: number, level: number, dash = 0) {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
  for (let i = 0; i <= steps; i += 1) {
    if (dash && Math.floor(i / dash) % 2 === 1) continue;
    const X = Math.round(x0 + ((x1 - x0) * i) / steps);
    const Y = Math.round(y0 + ((y1 - y0) * i) / steps);
    if (X >= 0 && Y >= 0 && X < cv.w && Y < cv.h) cv.over[Y * cv.w + X] = Math.max(cv.over[Y * cv.w + X], level);
  }
}

function rect(cv: Canvas, x: number, y: number, w: number, h: number, level: number) {
  line(cv, x, y, x + w, y, level);
  line(cv, x, y + h, x + w, y + h, level);
  line(cv, x, y, x, y + h, level);
  line(cv, x + w, y, x + w, y + h, level);
}

function corners(cv: Canvas, x: number, y: number, w: number, h: number, len: number, level: number) {
  line(cv, x, y, x + len, y, level);
  line(cv, x, y, x, y + len, level);
  line(cv, x + w, y, x + w - len, y, level);
  line(cv, x + w, y, x + w, y + len, level);
  line(cv, x, y + h, x + len, y + h, level);
  line(cv, x, y + h, x, y + h - len, level);
  line(cv, x + w, y + h, x + w - len, y + h, level);
  line(cv, x + w, y + h, x + w, y + h - len, level);
}

function circle(cv: Canvas, cx: number, cy: number, r: number, level: number) {
  const steps = Math.ceil(r * 6.3);
  for (let i = 0; i < steps; i += 1) {
    if (i % 4 === 3) continue;
    const a = (i / steps) * Math.PI * 2;
    const X = Math.round(cx + Math.cos(a) * r);
    const Y = Math.round(cy + Math.sin(a) * r);
    if (X >= 0 && Y >= 0 && X < cv.w && Y < cv.h) cv.over[Y * cv.w + X] = Math.max(cv.over[Y * cv.w + X], level);
  }
}

function grid(cv: Canvas, x0: number, y0: number, w: number, h: number, step: number, level: number) {
  for (let x = x0 + step; x < x0 + w; x += step) line(cv, x, y0, x, y0 + h, level, 2);
  for (let y = y0 + step; y < y0 + h; y += step) line(cv, x0, y, x0 + w, y, level, 2);
}

function finish(cv: Canvas, plan: NugPlan, gain: number) {
  const { w, h, acc, over } = cv;
  const lit = new Float32Array(w * h);
  for (let i = 0; i < lit.length; i += 1) lit[i] = 1 - Math.exp(-acc[i] * gain);
  const blur = new Float32Array(w * h);
  const tmp = new Float32Array(w * h);
  const R = 3;
  for (let y = 0; y < h; y += 1) {
    let sum = 0;
    for (let x = -R; x <= R; x += 1) sum += lit[y * w + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x += 1) {
      tmp[y * w + x] = sum / (2 * R + 1);
      sum += lit[y * w + Math.min(w - 1, x + R + 1)] - lit[y * w + Math.max(0, x - R)];
    }
  }
  for (let x = 0; x < w; x += 1) {
    let sum = 0;
    for (let y = -R; y <= R; y += 1) sum += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y += 1) {
      blur[y * w + x] = sum / (2 * R + 1);
      sum += tmp[Math.min(h - 1, y + R + 1) * w + x] - tmp[Math.max(0, y - R) * w + x];
    }
  }
  const out = new Uint8ClampedArray(w * h * 4);
  const noise = rngFrom(plan.seed ^ 0x51ed27);
  for (let y = 0; y < h; y += 1) {
    const scan = y % plan.scanPitch === 0 ? 0.58 : 1;
    for (let x = 0; x < w; x += 1) {
      const i = y * w + x;
      const dxv = (x / w - 0.5) * 2;
      const dyv = (y / h - 0.5) * 2;
      const vig = 1 - 0.28 * (dxv * dxv + dyv * dyv);
      let v = Math.min(1, lit[i] + blur[i] * 0.55);
      v = Math.max(v, over[i]);
      v = v * scan * vig + noise() * 0.018;
      const o = i * 4;
      out[o] = 3 + 235 * Math.pow(v, 2.6) * 0.62;
      out[o + 1] = 9 + 246 * Math.pow(v, 0.92);
      out[o + 2] = 5 + 255 * Math.pow(v, 2.9) * 0.28;
      out[o + 3] = 255;
    }
  }
  return out;
}

function focusPoint(plan: NugPlan, geo: ReturnType<typeof nugGeometry>) {
  const rnd = rngFrom(plan.seed ^ 0x2545f491);
  const n = geo.cloud.x.length;
  let best = 0;
  let bestScore = -Infinity;
  for (let tries = 0; tries < 40; tries += 1) {
    const i = Math.floor(rnd() * n);
    const score = geo.cloud.y[i] * 0.4 - Math.abs(geo.cloud.x[i]) * 0.2 + (geo.cloud.k[i] === 2 ? 0.3 : 0) + rnd() * 0.4;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return [geo.cloud.x[best], geo.cloud.y[best], geo.cloud.z[best]] as Vec;
}

export function renderNug(key: string, size: NugSize, type?: string | null): NugImage {
  const plan = nugPlan(key, type);
  const rnd = rngFrom(plan.seed ^ 0x7f4a7c15);
  if (size === "thumb") {
    const w = 300;
    const h = 200;
    const cv: Canvas = { w, h, acc: new Float32Array(w * h), zbuf: new Float32Array(w * h), over: new Float32Array(w * h) };
    const geo = nugGeometry(plan, 34000);
    if (plan.grid) grid(cv, 6, 6, w - 12, h - 12, 18 + plan.grid * 6, 0.1);
    renderView(cv, plan, geo, { x0: 8, y0: 14, w: w - 16, h: h - 30, yaw: plan.yaw, pitch: plan.pitch, roll: plan.roll + plan.lie, zoom: plan.frameZoom, shiftX: plan.frameX, shiftY: plan.frameY, splat: 1, gain: 1 }, rnd);
    corners(cv, 4, 4, w - 9, h - 9, 14, 0.7);
    text(cv, 10, h - 14, plan.code, 0.62);
    text(cv, w - 10 - 6 * plan.archetype.length, h - 14, plan.archetype, 0.42);
    return { width: w, height: h, data: finish(cv, plan, 1.05), plan };
  }
  const w = 640;
  const h = 600;
  const cv: Canvas = { w, h, acc: new Float32Array(w * h), zbuf: new Float32Array(w * h), over: new Float32Array(w * h) };
  const geo = nugGeometry(plan, 170000);
  const mainW = 470;
  if (plan.grid) grid(cv, 10, 28, mainW - 20, h - 64, 26 + plan.grid * 8, 0.09);
  const main = renderView(cv, plan, geo, { x0: 10, y0: 30, w: mainW - 20, h: h - 70, yaw: plan.yaw, pitch: plan.pitch, roll: plan.roll + plan.lie * 0.6, zoom: Math.min(1.15, plan.frameZoom), shiftX: plan.frameX * 0.5, shiftY: plan.frameY * 0.5, splat: 1, gain: 1 }, rnd);
  const focus = focusPoint(plan, geo);
  const railX = mainW + 12;
  const frameW = w - railX - 12;
  const frameH = Math.floor((h - 40 - 3 * 12) / 4) - 14;
  const views: [string, number, number, number, number][] = [
    ["TOP", plan.yaw, 1.38, 0, 1],
    ["SIDE", plan.yaw + Math.PI / 2, 0.05, 0, 1],
    ["BOTTOM", plan.yaw, -1.38, 0, 1],
    ["ZOOM", plan.yaw, plan.pitch, plan.roll, 3.1],
  ];
  views.forEach(([label, yaw, pitch, roll, zoom], index) => {
    const y = 14 + index * (frameH + 26);
    rect(cv, railX, y, frameW, frameH, 0.62);
    renderView(cv, plan, geo, { x0: railX + 2, y0: y + 2, w: frameW - 3, h: frameH - 3, yaw, pitch, roll, zoom, focus: label === "ZOOM" ? focus : undefined, splat: 0, gain: 1.1 }, rnd);
    text(cv, railX + 2, y + frameH + 6, label, 0.82);
  });
  line(cv, railX - 6, 8, railX - 6, h - 8, 0.45);
  const fx = Math.round(main.ox + (main.m[0][0] * focus[0] + main.m[0][1] * focus[1] + main.m[0][2] * focus[2] - main.cx) * main.scale);
  const fy = Math.round(main.oy - (main.m[1][0] * focus[0] + main.m[1][1] * focus[1] + main.m[1][2] * focus[2] - main.cy) * main.scale);
  const rr = 16 + Math.round(plan.reticle * 14);
  circle(cv, fx, fy, rr, 0.55);
  line(cv, fx - rr - 10, fy, fx - rr + 4, fy, 0.6);
  line(cv, fx + rr - 4, fy, fx + rr + 10, fy, 0.6);
  line(cv, fx, fy - rr - 10, fx, fy - rr + 4, 0.6);
  line(cv, fx + rr + 10, fy, railX - 8, 14 + 3 * (frameH + 26) + frameH / 2, 0.22, 3);
  corners(cv, 6, 24, mainW - 12, h - 60, 22, 0.7);
  text(cv, 10, 8, `SPECIMEN ${plan.code}`, 0.8);
  text(cv, 12, h - 28, `FORM ${plan.archetype}`, 0.55);
  text(cv, 12, h - 16, `CALYX ${plan.clusters} PISTIL ${plan.pistils} BR ${plan.branches}`, 0.42);
  const bar = 40 + Math.round(plan.reticle * 50);
  line(cv, mainW - 20 - bar, h - 22, mainW - 20, h - 22, 0.6);
  line(cv, mainW - 20 - bar, h - 26, mainW - 20 - bar, h - 18, 0.6);
  line(cv, mainW - 20, h - 26, mainW - 20, h - 18, 0.6);
  text(cv, mainW - 20 - bar, h - 14, "ILLUSTRATIVE", 0.4);
  return { width: w, height: h, data: finish(cv, plan, 0.95), plan };
}

export function nugDHash(image: NugImage) {
  const { width, height, data } = image;
  const gw = 9;
  const gh = 8;
  const cells = new Float64Array(gw * gh);
  for (let gy = 0; gy < gh; gy += 1) {
    for (let gx = 0; gx < gw; gx += 1) {
      const x0 = Math.floor((gx * width) / gw);
      const x1 = Math.floor(((gx + 1) * width) / gw);
      const y0 = Math.floor((gy * height) / gh);
      const y1 = Math.floor(((gy + 1) * height) / gh);
      let sum = 0;
      for (let y = y0; y < y1; y += 1) for (let x = x0; x < x1; x += 1) sum += data[(y * width + x) * 4 + 1];
      cells[gy * gw + gx] = sum / Math.max(1, (x1 - x0) * (y1 - y0));
    }
  }
  let hi = 0;
  let lo = 0;
  for (let gy = 0; gy < gh; gy += 1) {
    for (let gx = 0; gx < 8; gx += 1) {
      const bit = cells[gy * gw + gx] > cells[gy * gw + gx + 1] ? 1 : 0;
      const index = gy * 8 + gx;
      if (index < 32) hi = (hi | (bit << index)) >>> 0;
      else lo = (lo | (bit << (index - 32))) >>> 0;
    }
  }
  return hi.toString(16).padStart(8, "0") + lo.toString(16).padStart(8, "0");
}

// 256-bit difference hash on a 17x16 grid; finer than nugDHash for checking
// that two specimens differ in shape, not just in overall layout.
export function nugDHash256(image: NugImage) {
  const { width, height, data } = image;
  const gw = 17;
  const gh = 16;
  const cells = new Float64Array(gw * gh);
  for (let gy = 0; gy < gh; gy += 1) {
    for (let gx = 0; gx < gw; gx += 1) {
      const x0 = Math.floor((gx * width) / gw);
      const x1 = Math.floor(((gx + 1) * width) / gw);
      const y0 = Math.floor((gy * height) / gh);
      const y1 = Math.floor(((gy + 1) * height) / gh);
      let sum = 0;
      for (let y = y0; y < y1; y += 1) for (let x = x0; x < x1; x += 1) sum += data[(y * width + x) * 4 + 1];
      cells[gy * gw + gx] = sum / Math.max(1, (x1 - x0) * (y1 - y0));
    }
  }
  const words = new Uint32Array(8);
  for (let gy = 0; gy < gh; gy += 1) {
    for (let gx = 0; gx < 16; gx += 1) {
      const bit = gy * 16 + gx;
      if (cells[gy * gw + gx] > cells[gy * gw + gx + 1]) words[bit >>> 5] |= 1 << (bit & 31);
    }
  }
  return Array.from(words, (w) => (w >>> 0).toString(16).padStart(8, "0")).join("");
}
