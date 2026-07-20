
CREATE OR REPLACE FUNCTION public.search_drugs(_term text, _category text DEFAULT NULL)
RETURNS SETOF public.drugs
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT d.* FROM public.drugs d
  WHERE (_category IS NULL OR _category = 'all' OR d.category::text = _category)
    AND (
      _term IS NULL OR btrim(_term) = '' OR
      d.name ILIKE '%' || _term || '%' OR
      d.slug ILIKE '%' || _term || '%' OR
      coalesce(d.summary,'') ILIKE '%' || _term || '%' OR
      coalesce(d.chemistry,'') ILIKE '%' || _term || '%' OR
      EXISTS (SELECT 1 FROM unnest(coalesce(d.aliases, '{}'::text[])) a WHERE a ILIKE '%' || _term || '%') OR
      EXISTS (SELECT 1 FROM unnest(coalesce(d.brand_names, '{}'::text[])) a WHERE a ILIKE '%' || _term || '%') OR
      EXISTS (SELECT 1 FROM unnest(coalesce(d.street_names, '{}'::text[])) a WHERE a ILIKE '%' || _term || '%')
    )
  ORDER BY
    (d.name ILIKE _term || '%') DESC,
    d.name ASC;
$$;

GRANT EXECUTE ON FUNCTION public.search_drugs(text, text) TO anon, authenticated;
