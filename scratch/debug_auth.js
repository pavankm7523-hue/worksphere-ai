import { createClient } from '@supabase/supabase-js';

const url = 'https://gseevsxscedmczzxjtan.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZWV2c3hzY2VkbWN6enhqdGFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzU4NzM5NywiZXhwIjoyMDk5MTYzMzk3fQ.De4rHiFjWRHzFoCmQuS_n_3pn83xgh3mD1oiE8xtjTk';
const supabaseAdmin = createClient(url, serviceKey);

async function checkUsers() {
  console.log("=== Auth Users ===");
  const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
  if (usersError) console.error(usersError);
  else {
    users.forEach(u => console.log(`Auth User: email=${u.email}, id=${u.id}`));
  }

  console.log("\n=== Employees Table ===");
  const { data: employees, error: empError } = await supabaseAdmin.from('employees').select('*');
  if (empError) console.error(empError);
  else console.log(employees);
}

checkUsers();
