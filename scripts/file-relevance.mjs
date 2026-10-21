// Generic catalogue rows that repeat one sentence for thousands of names.
// A file with its own harm note stays. These patterns are the filler.

export function isBoilerplateFile(drug) {
  const summary = String(drug?.summary ?? "");
  const category = drug?.category;
  if (category === "other" && /investigational substance that has been in human trials/i.test(summary)) return true;
  if (category === "otc" && /non-prescription medicine name on a public listing/i.test(summary)) return true;
  if (category === "other" && /substance name on the public FDA list/i.test(summary)) return true;
  return false;
}

export function nameKey(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
