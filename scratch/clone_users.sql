-- 1. Clone HR Administrator
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at,
  email_change_token_new, email_change, email_change_sent_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
  phone, phone_confirmed_at, phone_change, phone_change_sent_at, phone_change_token,
  email_change_token_current, email_change_confirm_status, banned_until,
  reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous
)
SELECT 
  '11111111-1111-1111-1111-111111111111'::uuid, instance_id, 'authenticated', 'authenticated', 'hr@test.com', encrypted_password, now(),
  invited_at, NULL, confirmation_sent_at, NULL, recovery_sent_at,
  NULL, email_change, email_change_sent_at, last_sign_in_at,
  raw_app_meta_data, '{"full_name":"Sarah HR Admin","company_name":"Test Company","role":"hr","email":"hr@test.com","sub":"11111111-1111-1111-1111-111111111111","email_verified":true,"phone_verified":false}'::jsonb, is_super_admin, now(), now(),
  phone, phone_confirmed_at, phone_change, phone_change_sent_at, phone_change_token,
  email_change_token_current, email_change_confirm_status, banned_until,
  reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous
FROM auth.users 
WHERE email = 'worksphere@company.com'
LIMIT 1;

-- 2. Clone Manager
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at,
  email_change_token_new, email_change, email_change_sent_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
  phone, phone_confirmed_at, phone_change, phone_change_sent_at, phone_change_token,
  email_change_token_current, email_change_confirm_status, banned_until,
  reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous
)
SELECT 
  '22222222-2222-2222-2222-222222222222'::uuid, instance_id, 'authenticated', 'authenticated', 'manager@test.com', encrypted_password, now(),
  invited_at, NULL, confirmation_sent_at, NULL, recovery_sent_at,
  NULL, email_change, email_change_sent_at, last_sign_in_at,
  raw_app_meta_data, '{"full_name":"John Manager","company_name":"Test Company","role":"manager","email":"manager@test.com","sub":"22222222-2222-2222-2222-222222222222","email_verified":true,"phone_verified":false}'::jsonb, is_super_admin, now(), now(),
  phone, phone_confirmed_at, phone_change, phone_change_sent_at, phone_change_token,
  email_change_token_current, email_change_confirm_status, banned_until,
  reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous
FROM auth.users 
WHERE email = 'worksphere@company.com'
LIMIT 1;

-- 3. Clone Employee
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at,
  email_change_token_new, email_change, email_change_sent_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
  phone, phone_confirmed_at, phone_change, phone_change_sent_at, phone_change_token,
  email_change_token_current, email_change_confirm_status, banned_until,
  reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous
)
SELECT 
  '33333333-3333-3333-3333-333333333333'::uuid, instance_id, 'authenticated', 'authenticated', 'employee@test.com', encrypted_password, now(),
  invited_at, NULL, confirmation_sent_at, NULL, recovery_sent_at,
  NULL, email_change, email_change_sent_at, last_sign_in_at,
  raw_app_meta_data, '{"full_name":"Alex Employee","company_name":"Test Company","role":"employee","email":"employee@test.com","sub":"33333333-3333-3333-3333-333333333333","email_verified":true,"phone_verified":false}'::jsonb, is_super_admin, now(), now(),
  phone, phone_confirmed_at, phone_change, phone_change_sent_at, phone_change_token,
  email_change_token_current, email_change_confirm_status, banned_until,
  reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous
FROM auth.users 
WHERE email = 'worksphere@company.com'
LIMIT 1;

-- Seed public.employees profiles status
UPDATE public.employees 
SET status = 'active' 
WHERE user_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333');

-- Link the employee to the manager profile
UPDATE public.employees 
SET manager_id = '22222222-2222-2222-2222-222222222222'
WHERE user_id = '33333333-3333-3333-3333-333333333333';
