import { createClient } from '@supabase/supabase-js';

const url = 'https://gseevsxscedmczzxjtan.supabase.co';
const key = 'sb_publishable_x3PMoZsW_HavNhmH-km0aQ__JY5fm7k';
const supabase = createClient(url, key);

async function insertProfiles() {
  console.log("=== CREATING EMPLOYEE PROFILES ===");
  
  // 1. Profile for Employee
  try {
    console.log("Logging in as testuser1@example.com...");
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'testuser1@example.com',
      password: 'password123'
    });

    if (authError) {
      console.error("Employee login failed:", authError.message);
    } else {
      console.log("Successfully logged in! Inserting employee profile...");
      const { data: profile, error: insertError } = await supabase
        .from('employees')
        .insert([
          {
            user_id: authData.user.id,
            full_name: 'Test User One',
            department: 'Engineering',
            role: 'employee'
          }
        ])
        .select();

      if (insertError) {
        console.error("Employee profile insert failed:", insertError.message);
      } else {
        console.log("Employee profile created:", profile[0]);
      }
    }
  } catch (e) {
    console.error("Error inserting employee profile:", e);
  }

  // 2. Profile for HR Manager
  try {
    console.log("\nLogging in as testmanager1@example.com...");
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'testmanager1@example.com',
      password: 'password123'
    });

    if (authError) {
      console.error("HR Manager login failed:", authError.message);
    } else {
      console.log("Successfully logged in! Inserting HR manager profile...");
      const { data: profile, error: insertError } = await supabase
        .from('employees')
        .insert([
          {
            user_id: authData.user.id,
            full_name: 'Test Manager One',
            department: 'HR',
            role: 'hr'
          }
        ])
        .select();

      if (insertError) {
        console.error("HR profile insert failed:", insertError.message);
      } else {
        console.log("HR profile created:", profile[0]);
      }
    }
  } catch (e) {
    console.error("Error inserting HR profile:", e);
  }
  
  // Sign out
  await supabase.auth.signOut();
  console.log("\n=== PROFILE INSERTS COMPLETED ===");
}

insertProfiles();
