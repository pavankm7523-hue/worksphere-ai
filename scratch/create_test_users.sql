-- Insert a test company
INSERT INTO public.companies (name) VALUES ('Test Company') ON CONFLICT DO NOTHING;

-- 1. HR Administrator Test User
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, instance_id)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'hr@test.com',
  '$2a$10$OvcSTgCD00/yt6IxkDXXpeXBz7bpbkDFhgAFgCfbXBVYF7OW.VPYe', -- bcrypt hash of 'test123456'
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Sarah HR Admin","company_name":"Test Company","role":"hr"}',
  false,
  'authenticated',
  'authenticated',
  '00000000-0000-0000-0000-000000000000'
) ON CONFLICT (id) DO NOTHING;

-- 2. Manager Test User
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, instance_id)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'manager@test.com',
  '$2a$10$OvcSTgCD00/yt6IxkDXXpeXBz7bpbkDFhgAFgCfbXBVYF7OW.VPYe', -- bcrypt hash of 'test123456'
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"John Manager","company_name":"Test Company","role":"manager"}',
  false,
  'authenticated',
  'authenticated',
  '00000000-0000-0000-0000-000000000000'
) ON CONFLICT (id) DO NOTHING;

-- 3. Employee Test User
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, instance_id)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'employee@test.com',
  '$2a$10$OvcSTgCD00/yt6IxkDXXpeXBz7bpbkDFhgAFgCfbXBVYF7OW.VPYe', -- bcrypt hash of 'test123456'
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Alex Employee","company_name":"Test Company","role":"employee"}',
  false,
  'authenticated',
  'authenticated',
  '00000000-0000-0000-0000-000000000000'
) ON CONFLICT (id) DO NOTHING;

-- Mark all three profiles as Active
UPDATE public.employees 
SET status = 'active' 
WHERE user_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333');

-- Link the employee to the manager profile
UPDATE public.employees 
SET manager_id = '22222222-2222-2222-2222-222222222222'
WHERE user_id = '33333333-3333-3333-3333-333333333333';
