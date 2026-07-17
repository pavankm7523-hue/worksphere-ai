-- Trigger function to automatically create company and employee record on user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id bigint;
  v_role text;
  v_full_name text;
  v_company_name text;
  v_status text;
BEGIN
  -- Extract metadata passed during signUp
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'employee');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'New Employee');
  v_company_name := NEW.raw_user_meta_data->>'company_name';

  -- Resolve company_id
  IF v_company_name IS NOT NULL AND v_company_name <> '' THEN
    IF v_role = 'hr' THEN
      -- Create company if new, or get existing
      INSERT INTO public.companies (name)
      VALUES (v_company_name)
      ON CONFLICT DO NOTHING;

      SELECT id INTO v_company_id
      FROM public.companies
      WHERE LOWER(name) = LOWER(v_company_name)
      LIMIT 1;
    ELSE
      -- Lookup existing company
      SELECT id INTO v_company_id
      FROM public.companies
      WHERE LOWER(name) = LOWER(v_company_name)
      LIMIT 1;
    END IF;
  END IF;

  -- Determine status
  IF v_role = 'hr' THEN
    v_status := 'active';
  ELSE
    v_status := 'pending';
  END IF;

  -- Insert employee profile
  INSERT INTO public.employees (user_id, full_name, role, company_id, status, department)
  VALUES (NEW.id, v_full_name, v_role, v_company_id, v_status, 'Engineering')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
