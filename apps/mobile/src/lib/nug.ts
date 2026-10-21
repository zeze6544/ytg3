const NAMES = [
  "OG Kush", "Blue Dream", "White Widow", "Sour Diesel", "Gelato", "Purple Punch", "LA Confidential", "GSC", "Bubba Kush", "Lemon Haze",
  "Skunk #1", "Chemdawg", "Jack Herer", "AK-47", "Super Silver Haze", "Grape Ape", "Hex", "Mango Kush", "Black Cherry Pie", "Pineapple Express",
  "Tangie", "Alien OG", "Sherbet", "Wedding Cake", "Zkittlez", "Do-Si-Dos", "Candyland", "Runtz", "Banana OG", "God's Gift",
  "Durban Poison", "Northern Lights", "Haze", "Larry OG", "Sky Walker", "Pink Kush", "Bruce Banner", "Pure Michigan", "Jet Fuel", "Raspberry Cough",
  "Violet Fog", "Cherry AK", "Lemon OG", "Critical Mass", "Apple Fritter", "Tropicana Cookies", "Mimosa", "Purple Haze", "White Runtz", "Greco's Sicker",
  "Biscotti", "MAC 1", "Bubblegum", "Orange Cookies", "Space Cake", "Afghoo", "Blueberry", "Pineapple OG", "Sunset Kush", "Skywalker OG",
  "Mexican Sativas", "Lava Cake", "Cookie Dawg", "Strawberry Cough", "Granddaddy Purp", "Jungle Cake", "Rainbow Belts", "Black Runtz", "Wilson Sherbet", "Crywalker OG",
  "Killer Queen", "Ice Cream Cake", "Forbidden Fruit", "Lemon G", "Pancakez", "Raspberry Diesel", "Brain Fog", "Gorilla Glue", "Gelato 33", "Blaze",
  "Eleven Roses", "Captain Kush", "French OG", "Black Diamond", "Silverback", "King OG", "Lemon Cherry Gelato", "Moonrocks", "Lucky Charms", "Cereal Milk",
];

const ALIAS: Record<string, string> = {
  "skywalker": "sky walker",
  "granddaddy purple": "granddaddy purp",
  "grand daddy purp": "granddaddy purp",
  "granddaddy purple og": "granddaddy purp",
  "gdp": "granddaddy purp",
  "chemdog": "chemdawg",
  "chem dog": "chemdawg",
  "dosidos": "do si dos",
  "do si do": "do si dos",
  "girl scout cookies": "gsc",
  "gelato33": "gelato 33",
  "silver back": "silverback",
  "mac": "mac 1",
  "ak47": "ak 47",
  "la confidential og": "la confidential",
};

function keyOf(value: string) {
  return value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();
}

const byName = new Map<string, number>();
NAMES.forEach((name, index) => byName.set(keyOf(name), index));
for (const [alias, target] of Object.entries(ALIAS)) {
  const index = byName.get(keyOf(target));
  if (index != null) byName.set(keyOf(alias), index);
}

function hash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function nugSlot(name: string, slug: string) {
  const key = keyOf(name);
  const named = byName.get(key);
  if (named != null) return named;
  return hash(slug || key) % NAMES.length;
}

export function nugBudUrl(name: string, slug: string) {
  return `/nug/bud-${String(nugSlot(name, slug)).padStart(2, "0")}.jpg`;
}

export const nugPlateUrl = "/nug/plate.jpg";
