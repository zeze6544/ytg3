export function blurb(summary?: string | null, max = 160) {
  if (!summary) return "";
  let text = summary
    .replace(/^.+?\s+is filed here as a harm-reduction record\.\s*/i, "")
    .replace(/\s*This is not a dose, a source, or a reason to use it\.\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, "")}…`;
}
