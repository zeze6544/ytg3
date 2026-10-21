-- Normalised strain archive. Records are keyed by the archive slug used by the
-- app and the build pipeline (scripts/strains). Public tables are read-only to
-- clients; the pipeline writes with the service role, which bypasses RLS.
-- Admin requests go through strain_jobs and strain_review, which only users
-- holding the sealed 'admin' role can insert into.

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.strain_sources (
  id text PRIMARY KEY,
  registry_id text NOT NULL,
  rank smallint NOT NULL CHECK (rank BETWEEN 1 AND 8),
  label text NOT NULL,
  url text,
  license text,
  retrieved_on date,
  link_status text,
  link_checked_on date
);

CREATE TABLE IF NOT EXISTS public.strain_records (
  slug text PRIMARY KEY,
  archive_id text NOT NULL UNIQUE,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('cultivar', 'product')),
  origin text NOT NULL CHECK (origin IN ('curated', 'namelist', 'listing', 'registry')),
  type text NOT NULL CHECK (type IN ('indica', 'sativa', 'hybrid', 'ruderalis', 'unspecified')),
  family_key text,
  canonical_slug text REFERENCES public.strain_records (slug) ON DELETE SET NULL,
  completeness smallint NOT NULL DEFAULT 0 CHECK (completeness BETWEEN 0 AND 100),
  status text NOT NULL CHECK (status IN ('documented', 'partial', 'needs_research')),
  best_rank smallint NOT NULL DEFAULT 8,
  source_count integer NOT NULL DEFAULT 0,
  lineage_score smallint NOT NULL DEFAULT 0,
  lineage_conflict boolean NOT NULL DEFAULT false,
  suspected_duplicate boolean NOT NULL DEFAULT false,
  evidence_updated_on date,
  open_questions text[] NOT NULL DEFAULT '{}',
  built_on date NOT NULL DEFAULT current_date
);
CREATE INDEX IF NOT EXISTS strain_records_name_trgm ON public.strain_records USING gin (name extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS strain_records_family ON public.strain_records (family_key);
CREATE INDEX IF NOT EXISTS strain_records_status ON public.strain_records (status, completeness DESC);
CREATE INDEX IF NOT EXISTS strain_records_updated ON public.strain_records (evidence_updated_on DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS public.strain_aliases (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug text NOT NULL REFERENCES public.strain_records (slug) ON DELETE CASCADE,
  alias text NOT NULL,
  source_id text REFERENCES public.strain_sources (id),
  UNIQUE (slug, alias)
);
CREATE INDEX IF NOT EXISTS strain_aliases_trgm ON public.strain_aliases USING gin (alias extensions.gin_trgm_ops);

-- One row per parent per claim. claim_no groups the parents of one claim; several
-- claims per record are kept so disagreements stay visible.
CREATE TABLE IF NOT EXISTS public.strain_lineage_claims (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug text NOT NULL REFERENCES public.strain_records (slug) ON DELETE CASCADE,
  claim_no smallint NOT NULL,
  parent_name text NOT NULL,
  parent_slug text REFERENCES public.strain_records (slug) ON DELETE SET NULL,
  source_id text REFERENCES public.strain_sources (id),
  status text NOT NULL CHECK (status IN ('seller-listed', 'legacy', 'reviewed'))
);
CREATE INDEX IF NOT EXISTS strain_lineage_slug ON public.strain_lineage_claims (slug, claim_no);
CREATE INDEX IF NOT EXISTS strain_lineage_parent ON public.strain_lineage_claims (parent_slug);

CREATE TABLE IF NOT EXISTS public.strain_measurements (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug text NOT NULL REFERENCES public.strain_records (slug) ON DELETE CASCADE,
  analyte text NOT NULL,
  class text NOT NULL CHECK (class IN ('cannabinoid', 'terpene')),
  kind text NOT NULL CHECK (kind IN ('lab_aggregate', 'lab_sample', 'registry', 'label', 'listing_claim', 'legacy')),
  low numeric,
  p25 numeric,
  median numeric,
  p75 numeric,
  high numeric,
  n integer,
  unit text NOT NULL,
  jurisdiction text,
  context text NOT NULL,
  measured_from date,
  measured_to date,
  source_id text NOT NULL REFERENCES public.strain_sources (id),
  implausible boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS strain_measurements_slug ON public.strain_measurements (slug, class);
CREATE INDEX IF NOT EXISTS strain_measurements_analyte ON public.strain_measurements (analyte, kind);

-- Descriptive claims: aroma words, effect words, botany figures, seller copy.
CREATE TABLE IF NOT EXISTS public.strain_claims (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug text NOT NULL REFERENCES public.strain_records (slug) ON DELETE CASCADE,
  field text NOT NULL CHECK (field IN ('aroma', 'effect', 'breeder', 'flowering_days', 'height_indoor_cm', 'height_outdoor_cm', 'indica_pct', 'harvest', 'flowering_habit', 'description', 'terpene_mention')),
  value_text text,
  value_low numeric,
  value_high numeric,
  unit text,
  evidence text NOT NULL DEFAULT 'anecdotal' CHECK (evidence IN ('anecdotal', 'seller', 'regulatory', 'clinical', 'legacy')),
  source_id text NOT NULL REFERENCES public.strain_sources (id)
);
CREATE INDEX IF NOT EXISTS strain_claims_slug ON public.strain_claims (slug, field);

CREATE TABLE IF NOT EXISTS public.strain_products (
  id text PRIMARY KEY,
  region text NOT NULL,
  brand text,
  product text NOT NULL,
  form text,
  thc_label text,
  cbd_label text,
  period text,
  source_id text NOT NULL REFERENCES public.strain_sources (id)
);

-- A product is linked to a cultivar only by name; the relation says so.
CREATE TABLE IF NOT EXISTS public.strain_product_links (
  slug text NOT NULL REFERENCES public.strain_records (slug) ON DELETE CASCADE,
  product_id text NOT NULL REFERENCES public.strain_products (id) ON DELETE CASCADE,
  relation text NOT NULL DEFAULT 'same_cleaned_name' CHECK (relation IN ('same_cleaned_name', 'is_product_record', 'reviewed')),
  PRIMARY KEY (slug, product_id)
);

CREATE TABLE IF NOT EXISTS public.strain_image_assets (
  slug text PRIMARY KEY REFERENCES public.strain_records (slug) ON DELETE CASCADE,
  renderer_version smallint NOT NULL,
  status text NOT NULL CHECK (status IN ('queued', 'stored', 'failed', 'on-device')),
  dhash64 text,
  dhash256 text,
  bytes integer,
  generated_on date,
  error text
);
CREATE INDEX IF NOT EXISTS strain_image_status ON public.strain_image_assets (status);
CREATE UNIQUE INDEX IF NOT EXISTS strain_image_hash_unique ON public.strain_image_assets (dhash256) WHERE status = 'stored';

CREATE TABLE IF NOT EXISTS public.strain_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('regen_image', 'not_duplicate', 'recheck_links', 'research')),
  slug text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'done', 'failed')),
  error text,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE INDEX IF NOT EXISTS strain_jobs_status ON public.strain_jobs (status, created_at);

CREATE TABLE IF NOT EXISTS public.strain_review (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('not_duplicate', 'lineage_override', 'accept_proposal', 'reject_proposal')),
  slug text NOT NULL,
  other_slug text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.strain_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strain_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strain_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strain_lineage_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strain_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strain_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strain_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strain_product_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strain_image_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strain_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strain_review ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['strain_sources', 'strain_records', 'strain_aliases', 'strain_lineage_claims', 'strain_measurements', 'strain_claims', 'strain_products', 'strain_product_links', 'strain_image_assets'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "public read" ON public.%I', t);
    EXECUTE format('CREATE POLICY "public read" ON public.%I FOR SELECT TO anon, authenticated USING (true)', t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "admin read jobs" ON public.strain_jobs;
CREATE POLICY "admin read jobs" ON public.strain_jobs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "admin request jobs" ON public.strain_jobs;
CREATE POLICY "admin request jobs" ON public.strain_jobs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND created_by = auth.uid() AND status = 'queued');

DROP POLICY IF EXISTS "admin read review" ON public.strain_review;
CREATE POLICY "admin read review" ON public.strain_review FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "admin write review" ON public.strain_review;
CREATE POLICY "admin write review" ON public.strain_review FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND created_by = auth.uid());

REVOKE ALL ON public.strain_jobs, public.strain_review FROM anon;
GRANT SELECT ON public.strain_sources, public.strain_records, public.strain_aliases, public.strain_lineage_claims, public.strain_measurements, public.strain_claims, public.strain_products, public.strain_product_links, public.strain_image_assets TO anon, authenticated;
GRANT SELECT, INSERT ON public.strain_jobs, public.strain_review TO authenticated;
