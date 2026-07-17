import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gseevsxscedmczzxjtan.supabase.co';
const supabaseKey = 'sb_publishable_x3PMoZsW_HavNhmH-km0aQ__JY5fm7k';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Seeding HR...');
  const hr = await supabase.auth.signUp({
    email: 'hr@test.com',
    password: 'test123456',
    options: {
      data: {
        full_name: 'Sarah HR Admin',
        company_name: 'Test Company',
        role: 'hr'
      }
    }
  });
  console.log('HR:', hr.error ? hr.error.message : 'Created successfully');

  console.log('Seeding Manager...');
  const mgr = await supabase.auth.signUp({
    email: 'manager@test.com',
    password: 'test123456',
    options: {
      data: {
        full_name: 'John Manager',
        company_name: 'Test Company',
        role: 'manager'
      }
    }
  });
  console.log('Manager:', mgr.error ? mgr.error.message : 'Created successfully');

  console.log('Seeding Employee...');
  const emp = await supabase.auth.signUp({
    email: 'employee@test.com',
    password: 'test123456',
    options: {
      data: {
        full_name: 'Alex Employee',
        company_name: 'Test Company',
        role: 'employee'
      }
    }
  });
  console.log('Employee:', emp.error ? emp.error.message : 'Created successfully');
}

seed();
