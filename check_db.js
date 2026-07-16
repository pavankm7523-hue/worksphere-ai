import { createClient } from '@supabase/supabase-js';

const url = 'https://gseevsxscedmczzxjtan.supabase.co';
const key = 'sb_publishable_x3PMoZsW_HavNhmH-km0aQ__JY5fm7k';
const supabase = createClient(url, key);

async function checkDatabase() {
  console.log("=== DIAGNOSTIC AUTHENTICATED DB CHECK ===");
  
  // 1. Authenticate as Employee
  try {
    console.log("\n--- Logging in as testuser1@example.com (Employee) ---");
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'testuser1@example.com',
      password: 'password123'
    });

    if (authError) {
      console.error("Employee login failed:", authError.message);
      return;
    }

    console.log("Logged in! Checking employee profile from database...");
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*');

    if (empError) {
      console.error("Error fetching employees:", empError.message);
    } else {
      console.log("Employees visible to Employee:", employees);
    }

    console.log("Checking leave requests visible to Employee...");
    const { data: leaves, error: leaveError } = await supabase
      .from('leave_requests')
      .select('*');

    if (leaveError) {
      console.error("Error fetching leave requests:", leaveError.message);
    } else {
      console.log("Leave requests visible to Employee:", leaves);
    }

    await supabase.auth.signOut();
  } catch (err) {
    console.error("Error during employee check:", err.message);
  }

  // 2. Authenticate as HR Manager
  try {
    console.log("\n--- Logging in as testmanager1@example.com (HR Manager) ---");
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'testmanager1@example.com',
      password: 'password123'
    });

    if (authError) {
      console.error("HR login failed:", authError.message);
      return;
    }

    console.log("Logged in! Checking all leave requests visible to HR...");
    const { data: allLeaves, error: allLeavesError } = await supabase
      .from('leave_requests')
      .select('*, employees(full_name)');

    if (allLeavesError) {
      console.error("Error fetching all leave requests for HR:", allLeavesError.message);
    } else {
      console.log("All leave requests visible to HR:", allLeaves);
    }

    await supabase.auth.signOut();
  } catch (err) {
    console.error("Error during HR check:", err.message);
  }
}

checkDatabase();
