-- Add email and phone columns to employees table
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS phone text;

-- Backfill emails from auth.users
UPDATE public.employees e
SET email = u.email
FROM auth.users u
WHERE e.user_id = u.id AND e.email IS NULL;

-- Update trigger function public.handle_new_user to copy email and phone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id bigint;
  v_role text;
  v_full_name text;
  v_company_name text;
  v_status text;
  v_phone text;
BEGIN
  -- Extract metadata passed during signUp
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'employee');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'New Employee');
  v_company_name := NEW.raw_user_meta_data->>'company_name';
  v_phone := NEW.raw_user_meta_data->>'phone';

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

  -- Insert employee profile if not exists
  IF NOT EXISTS (SELECT 1 FROM public.employees WHERE user_id = NEW.id) THEN
    INSERT INTO public.employees (user_id, full_name, role, company_id, status, department, email, phone)
    VALUES (NEW.id, v_full_name, v_role, v_company_id, v_status, 'Engineering', NEW.email, v_phone);
  ELSE
    -- Update existing profile if email is null
    UPDATE public.employees 
    SET email = NEW.email, phone = COALESCE(phone, v_phone)
    WHERE user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
