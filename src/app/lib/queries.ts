import { supabase } from "./supabaseClient";

export interface LeaveRequest {
  id: number;
  employee_id: number;
  type: "Annual Leave" | "Sick Leave" | "Personal Days";
  start_date: string;
  end_date: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  employees?: {
    full_name: string;
  };
}

export interface Attendance {
  id: number;
  employee_id: number;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: "present" | "absent" | "late";
  created_at: string;
  employees?: {
    full_name: string;
  };
}

export interface EmployeeProfile {
  id: number;
  user_id: string;
  full_name: string;
  department: string;
  role: "hr" | "employee" | "manager";
  company_id: number | null;
  status: "pending" | "active" | "denied";
  created_at: string;
  email?: string;
  phone?: string;
}

// 1. Fetch employee profile linked to user_id
export async function getEmployeeProfile(userId: string) {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("user_id", userId);
  
  if (error) throw error;
  if (!data || data.length === 0) return null;
  return data[0] as EmployeeProfile;
}

// 2. Fetch leave requests history for specific employee
export async function getLeaveRequests(employeeId: number, companyId?: number) {
  let query = supabase
    .from("leave_requests")
    .select("*")
    .eq("employee_id", employeeId);

  if (companyId !== undefined) {
    query = query.eq("company_id", companyId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;
  return data as LeaveRequest[];
}

// 3. Submit a new leave request
export async function createLeaveRequest(leaveData: {
  employee_id: number;
  type: "Annual Leave" | "Sick Leave" | "Personal Days";
  start_date: string;
  end_date: string;
}, companyId?: number) {
  const { data, error } = await supabase
    .from("leave_requests")
    .insert([
      {
        ...leaveData,
        status: "pending",
        company_id: companyId
      },
    ])
    .select();

  if (error) throw error;

  const insertedLeave = data[0] as LeaveRequest;

  // Trigger notification for the manager asynchronously
  try {
    // 1. Get employee full name and manager user_id
    const { data: empProfile } = await supabase
      .from("employees")
      .select("full_name, manager_id")
      .eq("id", leaveData.employee_id)
      .single();

    if (empProfile && companyId) {
      await createNotification({
        company_id: companyId,
        role: "manager",
        user_id: empProfile.manager_id || undefined,
        type: "leave_request",
        text: `New leave request submitted by ${empProfile.full_name} (${leaveData.type}: ${leaveData.start_date} to ${leaveData.end_date})`
      });
    }
  } catch (notifErr) {
    console.error("Failed to create leave submission notification:", notifErr);
  }

  return insertedLeave;
}

// 4. Fetch attendance records for specific employee
export async function getAttendanceLogs(employeeId: number, companyId?: number) {
  let query = supabase
    .from("attendance")
    .select("*")
    .eq("employee_id", employeeId);

  if (companyId !== undefined) {
    query = query.eq("company_id", companyId);
  }

  const { data, error } = await query.order("date", { ascending: false });

  if (error) throw error;
  return data as Attendance[];
}

// 5. Check in for today (create row)
export async function checkIn(employeeId: number, companyId?: number) {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("attendance")
    .insert([
      {
        employee_id: employeeId,
        date: today,
        check_in: new Date().toISOString(),
        status: "present",
        company_id: companyId
      },
    ])
    .select();

  if (error) throw error;
  return data[0] as Attendance;
}

// 6. Check out for today (update check_out field)
export async function checkOut(employeeId: number, companyId?: number) {
  const today = new Date().toISOString().split("T")[0];
  let query = supabase
    .from("attendance")
    .update({
      check_out: new Date().toISOString(),
    })
    .eq("employee_id", employeeId)
    .eq("date", today);

  if (companyId !== undefined) {
    query = query.eq("company_id", companyId);
  }

  const { data, error } = await query.select();

  if (error) throw error;
  return data[0] as Attendance;
}

// --- HR Role Functions (Unfiltered queries showing all employees data) ---

// 7. Get leave requests for all employees (joined with employee full name)
export async function getAllLeaveRequests(companyId?: number) {
  let query = supabase
    .from("leave_requests")
    .select("*, employees(full_name, status, role)");

  if (companyId !== undefined) {
    query = query.eq("company_id", companyId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;
  return data as LeaveRequest[];
}

// 8. Update status of a leave request (Approve/Reject)
export async function updateLeaveRequestStatus(requestId: number, status: "approved" | "rejected") {
  const { data, error } = await supabase
    .from("leave_requests")
    .update({ status })
    .eq("id", requestId)
    .select();

  if (error) throw error;

  const updatedLeave = data[0] as LeaveRequest;

  // Trigger notification for the employee asynchronously
  try {
    // Get leave details and employee user_id
    const { data: leaveDetails } = await supabase
      .from("leave_requests")
      .select("company_id, start_date, end_date, type, employees(user_id, full_name)")
      .eq("id", requestId)
      .single();

    if (leaveDetails && leaveDetails.employees) {
      const emp = leaveDetails.employees as any;
      await createNotification({
        company_id: leaveDetails.company_id,
        role: "employee",
        user_id: emp.user_id,
        type: `leave_${status}`,
        text: `Your leave request for ${leaveDetails.type} (${leaveDetails.start_date} to ${leaveDetails.end_date}) has been ${status}.`
      });
    }
  } catch (notifErr) {
    console.error("Failed to create leave status update notification:", notifErr);
  }

  return updatedLeave;
}

// 9. Get attendance records for all employees
export async function getAllAttendanceLogs(companyId?: number) {
  let query = supabase
    .from("attendance")
    .select("*, employees(full_name, status, role)");

  if (companyId !== undefined) {
    query = query.eq("company_id", companyId);
  }

  const { data, error } = await query.order("date", { ascending: false });

  if (error) throw error;
  return data as Attendance[];
}

// 10. Get all employees profiles
export async function getAllEmployees(companyId?: number) {
  let query = supabase
    .from("employees")
    .select("*");

  if (companyId !== undefined) {
    query = query.eq("company_id", companyId);
  }

  const { data, error } = await query.order("full_name", { ascending: true });

  if (error) throw error;
  return data as EmployeeProfile[];
}

// --- Candidates / Recruitment Table Queries ---

export interface Candidate {
  id: number;
  job_title: string;
  resume_url: string;
  candidate_name: string | null;
  candidate_email: string | null;
  ai_score: number | null;
  ai_summary: string | null;
  matched_skills: string[] | null;
  missing_skills: string[] | null;
  stage: "screening" | "interview" | "offer" | "rejected";
  company_id: number | null;
  created_at: string;
}

// 11. Fetch all candidates
export async function getCandidates(companyId?: number) {
  let query = supabase
    .from("candidates")
    .select("*");

  if (companyId !== undefined) {
    query = query.eq("company_id", companyId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;
  return data as Candidate[];
}

// 12. Create a candidate row with initial stage
export async function createCandidate(candidate: {
  job_title: string;
  resume_url: string;
  stage?: "screening" | "interview" | "offer" | "rejected";
}, companyId?: number) {
  const { data, error } = await supabase
    .from("candidates")
    .insert([
      {
        ...candidate,
        stage: candidate.stage || "screening",
        company_id: companyId
      }
    ])
    .select();

  if (error) throw error;
  return data[0] as Candidate;
}

// 13. Update candidate scores and parsed details
export async function updateCandidate(id: number, updates: Partial<Candidate>) {
  const { data, error } = await supabase
    .from("candidates")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) throw error;
  return data[0] as Candidate;
}

// 14. Update candidate pipeline stage (drag and drop)
export async function updateCandidateStage(id: number, stage: "screening" | "interview" | "offer" | "rejected") {
  const { data, error } = await supabase
    .from("candidates")
    .update({ stage })
    .eq("id", id)
    .select();

  if (error) throw error;
  return data[0] as Candidate;
}

// 15. Get Pending Requests
export async function getPendingRequests(companyId: number) {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("company_id", companyId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as EmployeeProfile[];
}

// 16. Approve Profile
export async function approveProfile(employeeId: number) {
  const { data, error } = await supabase
    .from("employees")
    .update({ status: "active" })
    .eq("id", employeeId)
    .select();

  if (error) throw error;
  return data[0];
}

// 17. Deny Profile
export async function denyProfile(employeeId: number) {
  const { data, error } = await supabase
    .from("employees")
    .update({ status: "denied" })
    .eq("id", employeeId)
    .select();

  if (error) throw error;
  return data[0];
}

// 18. Get Role Permissions
export async function getRolePermissions(companyId: number) {
  const { data, error } = await supabase
    .from("role_permissions")
    .select("*")
    .eq("company_id", companyId);

  if (error) throw error;
  return data;
}

// 19. Save Role Permissions
export async function saveRolePermissions(companyId: number, role: string, permissions: { [module: string]: "on" | "off" }) {
  const inserts = Object.entries(permissions).map(([module, access_level]) => ({
    company_id: companyId,
    role,
    module,
    access_level
  }));

  const { data, error } = await supabase
    .from("role_permissions")
    .upsert(inserts)
    .select();

  if (error) throw error;
  return data;
}

// 20. Notifications System functions
export interface AppNotification {
  id: number;
  company_id: number;
  user_id: string | null;
  role: "hr" | "manager" | "employee" | null;
  type: string;
  text: string;
  is_read: boolean;
  created_at: string;
}

export async function getNotifications(companyId: number, role: string, userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("company_id", companyId)
    .or(`user_id.eq.${userId},role.eq.${role}`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as AppNotification[];
}

export async function createNotification(notif: {
  company_id: number;
  role: "hr" | "manager" | "employee";
  user_id?: string;
  type: string;
  text: string;
}) {
  const { data, error } = await supabase
    .from("notifications")
    .insert([
      {
        company_id: notif.company_id,
        role: notif.role,
        user_id: notif.user_id || null,
        type: notif.type,
        text: notif.text,
        is_read: false
      }
    ])
    .select();

  if (error) throw error;
  return data[0] as AppNotification;
}

export async function markNotificationAsRead(id: number) {
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .select();

  if (error) throw error;
  return data[0] as AppNotification;
}

export async function markAllNotificationsAsRead(companyId: number, role: string, userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("company_id", companyId)
    .or(`user_id.eq.${userId},role.eq.${role}`)
    .select();

  if (error) throw error;
  return data as AppNotification[];
}


