import { createClient } from '@supabase/supabase-js';

const url = 'https://gseevsxscedmczzxjtan.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZWV2c3hzY2VkbWN6enhqdGFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzU4NzM5NywiZXhwIjoyMDk5MTYzMzk3fQ.De4rHiFjWRHzFoCmQuS_n_3pn83xgh3mD1oiE8xtjTk';
const supabaseAdmin = createClient(url, serviceKey);

async function seed() {
  console.log('Cleaning up existing test accounts...');
  
  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
  const testEmails = ['hr@test.com', 'manager@test.com', 'employee@test.com'];
  const testUsers = usersData?.users.filter(u => testEmails.includes(u.email || '')) || [];
  
  for (const tu of testUsers) {
    console.log(`Deleting existing Auth user: ${tu.email}`);
    await supabaseAdmin
      .from('employees')
      .delete()
      .eq('user_id', tu.id);
    await supabaseAdmin.auth.admin.deleteUser(tu.id);
  }

  console.log('\nCreating HR Admin...');
  const hrRes = await supabaseAdmin.auth.admin.createUser({
    email: 'hr@test.com',
    password: 'test123456',
    email_confirm: true,
    user_metadata: {
      full_name: 'Sarah HR Admin',
      company_name: 'Test Company',
      role: 'hr'
    }
  });
  if (hrRes.error) {
    console.error('HR Admin failed:', hrRes.error.message);
    return;
  }
  const hrId = hrRes.data.user.id;
  console.log(`HR Admin created with ID: ${hrId}`);

  console.log('Creating Manager...');
  const mgrRes = await supabaseAdmin.auth.admin.createUser({
    email: 'manager@test.com',
    password: 'test123456',
    email_confirm: true,
    user_metadata: {
      full_name: 'John Manager',
      company_name: 'Test Company',
      role: 'manager'
    }
  });
  if (mgrRes.error) {
    console.error('Manager failed:', mgrRes.error.message);
    return;
  }
  const mgrId = mgrRes.data.user.id;
  console.log(`Manager created with ID: ${mgrId}`);

  console.log('Creating Employee...');
  const empRes = await supabaseAdmin.auth.admin.createUser({
    email: 'employee@test.com',
    password: 'test123456',
    email_confirm: true,
    user_metadata: {
      full_name: 'Alex Employee',
      company_name: 'Test Company',
      role: 'employee'
    }
  });
  if (empRes.error) {
    console.error('Employee failed:', empRes.error.message);
    return;
  }
  const empId = empRes.data.user.id;
  console.log(`Employee created with ID: ${empId}`);

  console.log('\nActivating employee profiles in database...');
  const { error: activeErr } = await supabaseAdmin
    .from('employees')
    .update({ status: 'active' })
    .in('user_id', [hrId, mgrId, empId]);
  if (activeErr) console.error('Error activating profiles:', activeErr.message);

  console.log('Linking Employee to Manager...');
  const { error: linkErr } = await supabaseAdmin
    .from('employees')
    .update({ manager_id: mgrId })
    .eq('user_id', empId);
  if (linkErr) console.error('Error linking manager:', linkErr.message);

  console.log('\nSeeding completed successfully!');
}

seed();
