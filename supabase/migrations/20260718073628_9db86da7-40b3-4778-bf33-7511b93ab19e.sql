
CREATE TABLE IF NOT EXISTS public._drug_fill_tmp (
  slug text PRIMARY KEY,
  history text,
  chemistry text,
  acute_risks text,
  chronic_risks text,
  tolerance text,
  medical_uses text,
  contraindications text,
  testing text,
  discovered_year integer
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public._drug_fill_tmp TO authenticated;
GRANT ALL ON public._drug_fill_tmp TO service_role, PUBLIC;
ALTER TABLE public._drug_fill_tmp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tmp all" ON public._drug_fill_tmp FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.apply_drug_fills()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n integer;
BEGIN
  UPDATE public.drugs d SET
    history           = COALESCE(NULLIF(d.history,''),           t.history),
    chemistry         = COALESCE(NULLIF(d.chemistry,''),         t.chemistry),
    acute_risks       = COALESCE(NULLIF(d.acute_risks,''),       t.acute_risks),
    chronic_risks     = COALESCE(NULLIF(d.chronic_risks,''),     t.chronic_risks),
    tolerance         = COALESCE(NULLIF(d.tolerance,''),         t.tolerance),
    medical_uses      = COALESCE(NULLIF(d.medical_uses,''),      t.medical_uses),
    contraindications = COALESCE(NULLIF(d.contraindications,''), t.contraindications),
    testing           = COALESCE(NULLIF(d.testing,''),           t.testing),
    discovered_year   = COALESCE(d.discovered_year,              t.discovered_year),
    updated_at        = now()
  FROM public._drug_fill_tmp t
  WHERE d.slug = t.slug;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.apply_drug_fills() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_drug_fills() TO PUBLIC;
