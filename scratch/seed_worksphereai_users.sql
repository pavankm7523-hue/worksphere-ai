-- Enable pgcrypto if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- Create WorkSphere AI company
INSERT INTO public.companies (name) VALUES ('WorkSphere AI') ON CONFLICT DO NOTHING;

-- Declare variables for target ids
DO $$
DECLARE
  v_company_id bigint;
  v_manager_uid uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  v_hr_uid uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_emp1_uid uuid := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  v_emp2_uid uuid := 'dddddddd-dddd-dddd-dddd-dddddddddddd';
BEGIN
  SELECT id INTO v_company_id FROM public.companies WHERE name = 'WorkSphere AI' LIMIT 1;

  -- 1. HR User
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, instance_id)
  VALUES (
    v_hr_uid,
    'hr@worksphereai.com',
    crypt('Hr@12345', gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Sarah Jenkins","company_name":"WorkSphere AI","role":"hr"}',
    false,
    'authenticated',
    'authenticated',
    '00000000-0000-0000-0000-000000000000'
  ) ON CONFLICT (id) DO NOTHING;

  -- Update HR employee profile (created by trigger)
  UPDATE public.employees 
  SET company_id = v_company_id, status = 'active', department = 'HR'
  WHERE user_id = v_hr_uid;

  -- 2. Manager User
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, instance_id)
  VALUES (
    v_manager_uid,
    'manager@worksphereai.com',
    crypt('Manager@123', gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Marcus Aurelius","company_name":"WorkSphere AI","role":"manager"}',
    false,
    'authenticated',
    'authenticated',
    '00000000-0000-0000-0000-000000000000'
  ) ON CONFLICT (id) DO NOTHING;

  -- Update Manager employee profile (created by trigger)
  UPDATE public.employees 
  SET company_id = v_company_id, status = 'active', department = 'Engineering'
  WHERE user_id = v_manager_uid;

  -- 3. Employee 1 User
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, instance_id)
  VALUES (
    v_emp1_uid,
    'employee1@worksphereai.com',
    crypt('Employee@123', gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Alice Cooper","company_name":"WorkSphere AI","role":"employee"}',
    false,
    'authenticated',
    'authenticated',
    '00000000-0000-0000-0000-000000000000'
  ) ON CONFLICT (id) DO NOTHING;

  -- Update Employee 1 profile
  UPDATE public.employees 
  SET company_id = v_company_id, status = 'active', department = 'Engineering', manager_id = v_manager_uid
  WHERE user_id = v_emp1_uid;

  -- 4. Employee 2 User
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, instance_id)
  VALUES (
    v_emp2_uid,
    'employee2@worksphereai.com',
    crypt('Employee@123', gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Bob Dylan","company_name":"WorkSphere AI","role":"employee"}',
    false,
    'authenticated',
    'authenticated',
    '00000000-0000-0000-0000-000000000000'
  ) ON CONFLICT (id) DO NOTHING;

  -- Update Employee 2 profile
  UPDATE public.employees 
  SET company_id = v_company_id, status = 'active', department = 'Engineering', manager_id = v_manager_uid
  WHERE user_id = v_emp2_uid;

  -- Add some sample leave requests for Employee 1 & 2
  INSERT INTO public.leave_requests (employee_id, type, start_date, end_date, status, company_id)
  VALUES (
    (SELECT id FROM public.employees WHERE user_id = v_emp1_uid LIMIT 1),
    'Annual Leave',
    '2026-07-20',
    '2026-07-24',
    'pending',
    v_company_id
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.leave_requests (employee_id, type, start_date, end_date, status, company_id)
  VALUES (
    (SELECT id FROM public.employees WHERE user_id = v_emp2_uid LIMIT 1),
    'Sick Leave',
    '2026-07-27',
    '2026-07-28',
    'pending',
    v_company_id
  ) ON CONFLICT DO NOTHING;

END $$;
