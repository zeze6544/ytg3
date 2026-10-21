import { nugBudUrl, nugPlateUrl } from "@/lib/nug";

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
  const src = compact ? nugBudUrl(name, slug) : nugPlateUrl;
  return (
    <img
      src={src}
      alt={compact ? "" : `Terminal plate for ${name}. Not a photograph of this batch.`}
      className={compact ? "block aspect-[154/102] w-full bg-black object-contain" : "block h-auto w-full bg-black"}
    />
  );
}
