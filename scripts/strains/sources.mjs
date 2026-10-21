// Source registry. Every claim in a strain file points at one of these ids.
// Rank: 1 regulatory, 2 peer-reviewed, 3 laboratory, 4 manufacturer,
// 5 breeder, 6 secondary database, 7 community/retail, 8 unsourced.
export const RANKS = {
  1: "Regulatory or government",
  2: "Peer-reviewed",
  3: "Laboratory certificate or lab dataset",
  4: "Manufacturer or licensed producer",
  5: "Breeder",
  6: "Secondary database",
  7: "Retail or community listing",
  8: "Unsourced",
};

export const SOURCES = {
  tga: {
    rank: 1,
    label: "TGA medicinal cannabis product list (SAS/AP dried herb, Jan–Jun 2026)",
    url: "https://www.tga.gov.au/resources/explore-topic/medicinal-cannabis-hub/medicinal-cannabis-product-list",
    note: "Sponsor-declared product lines. The list names products and cannabinoid labels, not cultivars.",
  },
  ct_dcp: {
    rank: 1,
    label: "Connecticut DCP cannabis product registry",
    url: "https://data.ct.gov/d/egd5-wb6r",
    note: "Registration filings by licensed producers. A filing describes one registered product, not a cultivar.",
  },
  nida: {
    rank: 1,
    label: "NIDA — Cannabis (Marijuana) DrugFacts",
    url: "https://nida.nih.gov/publications/drugfacts/cannabis-marijuana",
    note: "Class-level adverse effects of cannabis. Not specific to any cultivar.",
  },
  cannlytics_nv: {
    rank: 3,
    label: "Cannlytics cannabis_results — Nevada lab results (CC BY 4.0)",
    url: "https://huggingface.co/datasets/cannlytics/cannabis_results",
    fetch: "https://huggingface.co/datasets/cannlytics/cannabis_results/resolve/main/data/nv/nv-results-latest.csv",
    file: "lab-nv.csv",
    license: "CC BY 4.0",
    note: "State traceability lab results for flower sold under a product name. Results describe tested lots, not a cultivar.",
  },
  cannlytics_md: {
    rank: 3,
    label: "Cannlytics cannabis_results — Maryland lab results (CC BY 4.0)",
    url: "https://huggingface.co/datasets/cannlytics/cannabis_results",
    fetch: "https://huggingface.co/datasets/cannlytics/cannabis_results/resolve/main/data/md/md-results-latest.csv",
    file: "lab-md.csv",
    license: "CC BY 4.0",
    note: "State lab results for buds sold under a strain name. Results describe tested packages, not a cultivar.",
  },
  cannlytics_hi: {
    rank: 3,
    label: "Cannlytics cannabis_results — Hawaii lab results (CC BY 4.0)",
    url: "https://huggingface.co/datasets/cannlytics/cannabis_results",
    fetch: "https://huggingface.co/datasets/cannlytics/cannabis_results/resolve/main/data/hi/hi-results-latest.csv",
    file: "lab-hi.csv",
    license: "CC BY 4.0",
    note: "Hawaii medical dispensary flower lot results. Results describe tested lots, not a cultivar.",
  },
  ci_strains: {
    rank: 6,
    label: "Cannabis Intelligence Database by Shannon Goddard (CC BY 4.0)",
    url: "https://github.com/Shannon-Goddard/ci-strains-pro",
    fetch: "https://raw.githubusercontent.com/Shannon-Goddard/ci-strains-pro/main/raw-data.csv",
    file: "ci-raw.csv",
    license: "CC BY 4.0",
    note: "Scraped seed-bank listings. Each row is what one seller printed on one page on the scrape date.",
  },
  cnb_names: {
    rank: 7,
    label: "cnb_strns all_strain_names.txt",
    url: "https://github.com/Lguyogiro/cnb_strns/blob/master/all_strain_names.txt",
    note: "A list of names in circulation. It carries no chemistry, lineage, or breeder data.",
  },
  legacy: {
    rank: 8,
    label: "NARCØDEX legacy curated range (source not recorded)",
    url: null,
    note: "Ranges entered before provenance was tracked. Kept visible, ranked last, and queued for a sourced replacement.",
  },
};

export const SOURCE_FILES = Object.entries(SOURCES)
  .filter(([, source]) => source.fetch)
  .map(([id, source]) => ({ id, url: source.fetch, file: source.file, license: source.license }));
