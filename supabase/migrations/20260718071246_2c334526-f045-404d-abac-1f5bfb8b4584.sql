
CREATE OR REPLACE FUNCTION public.lock_admin_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.role = 'admin' THEN
    RAISE EXCEPTION 'admin role is sealed';
  END IF;
  IF TG_OP = 'UPDATE' AND (OLD.role = 'admin' OR NEW.role = 'admin') THEN
    RAISE EXCEPTION 'admin role is sealed';
  END IF;
  IF TG_OP = 'DELETE' AND OLD.role = 'admin' THEN
    RAISE EXCEPTION 'admin role is sealed';
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS lock_admin_role_trg ON public.user_roles;
CREATE TRIGGER lock_admin_role_trg
BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.lock_admin_role();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles(id, handle) VALUES (NEW.id, split_part(NEW.email,'@',1))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
