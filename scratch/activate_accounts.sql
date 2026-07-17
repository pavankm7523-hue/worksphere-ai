-- Fix vinnu6044@gmail.com: create company and activate
-- Step 1: Insert company for vinnu if not exists
INSERT INTO companies (name, created_at)
SELECT 'pk', now()
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE name ILIKE 'pk');

-- Step 2: Activate and link company for vinnu6044
UPDATE employees 
SET status = 'active',
    company_id = (SELECT id FROM companies WHERE name ILIKE 'pk' LIMIT 1)
WHERE user_id = '396ed3d4-73b7-4caf-b4a3-9e1703c7375b';

-- Also activate all the seeded test users
UPDATE employees SET status = 'active' WHERE user_id IN (
  (SELECT id FROM auth.users WHERE email = 'hr@test.com'),
  (SELECT id FROM auth.users WHERE email = 'manager@test.com'),
  (SELECT id FROM auth.users WHERE email = 'employee@test.com')
);

-- Also fix ashwithreddy - link to pk company and activate
UPDATE employees 
SET status = 'active',
    company_id = (SELECT id FROM companies WHERE name ILIKE 'pk' LIMIT 1)
WHERE user_id = '72190b18-7227-409a-bbb8-3900bdf6cbad';
