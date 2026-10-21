import { ARCHIVE_ORIGIN } from "@/lib/localArchive";
import { nugBudUrl, nugPlateUrl } from "@/lib/nug";
import { Image } from "react-native";

function uri(path: string) {
  if (typeof window !== "undefined" && window.location?.host) return path;
  return `${ARCHIVE_ORIGIN}${path}`;
}

export function NugMark({
  slug,
  name,
  compact = false,
}: {
  slug: string;
  name: string;
  type?: string | null;
  compact?: boolean;
}) {
  const path = compact ? nugBudUrl(name, slug) : nugPlateUrl;
  return (
    <Image
      accessibilityRole="image"
      accessibilityLabel={compact ? name : `Terminal plate for ${name}. Not a photograph of this batch.`}
      source={{ uri: uri(path) }}
      resizeMode="contain"
      style={{ width: "100%", aspectRatio: compact ? 154 / 102 : 833 / 809, backgroundColor: "#000" }}
    />
  );
}
