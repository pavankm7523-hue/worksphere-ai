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
  role: "hr" | "employee";
  created_at: string;
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
export async function getLeaveRequests(employeeId: number) {
  const { data, error } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as LeaveRequest[];
}

// 3. Submit a new leave request
export async function createLeaveRequest(leaveData: {
  employee_id: number;
  type: "Annual Leave" | "Sick Leave" | "Personal Days";
  start_date: string;
  end_date: string;
}) {
  const { data, error } = await supabase
    .from("leave_requests")
    .insert([
      {
        ...leaveData,
        status: "pending",
      },
    ])
    .select();

  if (error) throw error;
  return data[0] as LeaveRequest;
}

// 4. Fetch attendance records for specific employee
export async function getAttendanceLogs(employeeId: number) {
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("employee_id", employeeId)
    .order("date", { ascending: false });

  if (error) throw error;
  return data as Attendance[];
}

// 5. Check in for today (create row)
export async function checkIn(employeeId: number) {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("attendance")
    .insert([
      {
        employee_id: employeeId,
        date: today,
        check_in: new Date().toISOString(),
        status: "present",
      },
    ])
    .select();

  if (error) throw error;
  return data[0] as Attendance;
}

// 6. Check out for today (update check_out field)
export async function checkOut(employeeId: number) {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("attendance")
    .update({
      check_out: new Date().toISOString(),
    })
    .eq("employee_id", employeeId)
    .eq("date", today)
    .select();

  if (error) throw error;
  return data[0] as Attendance;
}

// --- HR Role Functions (Unfiltered queries showing all employees data) ---

// 7. Get leave requests for all employees (joined with employee full name)
export async function getAllLeaveRequests() {
  const { data, error } = await supabase
    .from("leave_requests")
    .select("*, employees(full_name)")
    .order("created_at", { ascending: false });

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
  return data[0] as LeaveRequest;
}

// 9. Get attendance records for all employees
export async function getAllAttendanceLogs() {
  const { data, error } = await supabase
    .from("attendance")
    .select("*, employees(full_name)")
    .order("date", { ascending: false });

  if (error) throw error;
  return data as Attendance[];
}

// 10. Get all employees profiles
export async function getAllEmployees() {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("full_name", { ascending: true });

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
  created_at: string;
}

// 11. Fetch all candidates
export async function getCandidates() {
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Candidate[];
}

// 12. Create a candidate row with initial stage
export async function createCandidate(candidate: {
  job_title: string;
  resume_url: string;
  stage?: "screening" | "interview" | "offer" | "rejected";
}) {
  const { data, error } = await supabase
    .from("candidates")
    .insert([
      {
        ...candidate,
        stage: candidate.stage || "screening"
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

