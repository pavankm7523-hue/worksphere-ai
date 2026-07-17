import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gseevsxscedmczzxjtan.supabase.co';
const supabaseKey = 'sb_publishable_x3PMoZsW_HavNhmH-km0aQ__JY5fm7k';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Logging in as hr@test.com...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'hr@test.com',
    password: 'test123456',
  });

  if (error) {
    console.error('Login failed entire error:', error);
    return;
  }

  console.log('Login succeeded! User ID:', data.user.id);
  console.log('Session present:', !!data.session);

  console.log('Fetching profile...');
  const { data: employeeData, error: dbError } = await supabase
    .from('employees')
    .select('role, company_id, status')
    .eq('user_id', data.user.id);

  if (dbError) {
    console.error('DB fetch failed:', dbError.message);
    return;
  }

  console.log('Profile rows found:', employeeData.length);
  console.log('Profile data:', employeeData);
}

test();
