INSERT INTO auth.users (id, email, encrypted_password, raw_user_meta_data) 
VALUES (
  gen_random_uuid(), 
  'trigger_test@test.com', 
  'password_hash', 
  '{"role":"hr","company_name":"Trigger Test Company"}'::jsonb
);
