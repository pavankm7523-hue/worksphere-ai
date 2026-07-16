import {
  Brain, Users, BarChart3, Shield, Zap, Globe,
  Calendar, DollarSign, AlertTriangle, Target, Briefcase, Clock,
  Cpu, UserCheck, Activity
} from "lucide-react";

// --- Types ---
export interface Testimonial {
  name: string;
  title: string;
  text: string;
  avatar: string;
  company: string;
  employees: string;
}

export interface FAQ {
  q: string;
  a: string;
}

export interface Feature {
  icon: any;
  title: string;
  desc: string;
  color: string;
}

export interface AICapability {
  icon: any;
  label: string;
  value: string;
  sub: string;
  color: string;
}

export interface BriefCard {
  icon: any;
  label: string;
  value: string;
  sub: string;
  color: string;
  trend: string;
}

export interface KanbanCard {
  id: string;
  name: string;
  role: string;
  score: number;
  tags: string[];
  time: string;
}

export type KanbanState = Record<string, KanbanCard[]>;

// --- Charts Data ---
export const attendanceData = [
  { month: "Jan", present: 94, absent: 6 },
  { month: "Feb", present: 91, absent: 9 },
  { month: "Mar", present: 96, absent: 4 },
  { month: "Apr", present: 88, absent: 12 },
  { month: "May", present: 93, absent: 7 },
  { month: "Jun", present: 97, absent: 3 },
];

export const recruitmentFunnel = [
  { stage: "Applied", count: 248, fill: "#7c3aed" },
  { stage: "Screened", count: 156, fill: "#6366f1" },
  { stage: "Shortlisted", count: 84, fill: "#818cf8" },
  { stage: "Interview", count: 47, fill: "#22d3ee" },
  { stage: "Offered", count: 23, fill: "#10b981" },
  { stage: "Onboarded", count: 18, fill: "#34d399" },
];

export const deptData = [
  { name: "Engineering", value: 34, fill: "#7c3aed" },
  { name: "Sales", value: 22, fill: "#22d3ee" },
  { name: "Marketing", value: 15, fill: "#6366f1" },
  { name: "Finance", value: 12, fill: "#10b981" },
  { name: "HR", value: 8, fill: "#f59e0b" },
  { name: "Operations", value: 9, fill: "#fb7185" },
];

export const attritionData = [
  { month: "Jan", risk: 12, actual: 3 },
  { month: "Feb", risk: 18, actual: 5 },
  { month: "Mar", risk: 9, actual: 2 },
  { month: "Apr", risk: 22, actual: 7 },
  { month: "May", risk: 15, actual: 4 },
  { month: "Jun", risk: 8, actual: 2 },
];

export const performanceData = [
  { name: "Exceeds", value: 28, fill: "#10b981" },
  { name: "Meets", value: 52, fill: "#7c3aed" },
  { name: "Needs Improvement", value: 14, fill: "#f59e0b" },
  { name: "Below", value: 6, fill: "#fb7185" },
];

// --- Static Landing Pages Data ---
export const features: Feature[] = [
  { icon: Brain, title: "AI-Powered Analytics", desc: "Real-time workforce insights with predictive models that anticipate attrition, performance dips, and hiring needs before they happen.", color: "#7c3aed" },
  { icon: Users, title: "Talent Intelligence", desc: "AI-screened candidates ranked by fit score. Automate shortlisting, schedule interviews, and reduce time-to-hire by up to 60%.", color: "#6366f1" },
  { icon: BarChart3, title: "Workforce Forecasting", desc: "Headcount planning, skill gap analysis, and scenario modeling powered by 50+ workforce signals updated in real time.", color: "#22d3ee" },
  { icon: Shield, title: "Compliance Guardian", desc: "Automated policy enforcement, audit-ready reports, and proactive alerts for regulatory deadlines across 180+ jurisdictions.", color: "#10b981" },
  { icon: Zap, title: "Autonomous Workflows", desc: "End-to-end automation for onboarding, payroll triggers, leave approvals, and performance cycles — zero manual steps.", color: "#f59e0b" },
  { icon: Globe, title: "Global HR Command", desc: "Unified platform for distributed teams across 60+ countries with localized compliance, payroll, and benefits management.", color: "#fb7185" },
];

// Replaced generic/placeholder testimonials with specific feature-based reviews
export const testimonials: Testimonial[] = [
  {
    name: "Sarah Jenkins",
    title: "VP of Global Talent Acquisition",
    company: "Vanguard Group",
    text: "WorkSphere AI's resume screening and automated candidate scoring changed our hiring completely. It screens thousands of resumes in under 30 seconds, ranking them by actual role fit. Our time-to-hire dropped from 45 days to 14, and the quality of hire has never been higher.",
    avatar: "SJ",
    employees: "15,000 employees"
  },
  {
    name: "Marcus Rivera",
    title: "Chief People Officer",
    company: "CloudScale Solutions",
    text: "The attrition prediction model is incredibly accurate. Last quarter, it flagged 18 high-performing engineers at risk of leaving due to compensation gaps and stagnating promotion paths. We intervened immediately with targeted career development and salary adjustments, retaining 16 of them. That's roughly $4.2M in avoided rehiring costs.",
    avatar: "MR",
    employees: "4,500 employees"
  },
  {
    name: "Elena Rostova",
    title: "CHRO",
    company: "Zenith FinTech",
    text: "The AI HR Copilot feels like having a brilliant analyst on my team 24/7. I can ask natural language questions like 'which departments are facing burn-out risk?' or get my morning AI Briefing summarizing all critical employee events. It's transformed how I prepare for executive briefings.",
    avatar: "ER",
    employees: "8,200 employees"
  },
];

// Replaced generic FAQs with real WorkSphere feature-based FAQs
export const faqs: FAQ[] = [
  {
    q: "How does the AI Resume Screening and Candidate Scoring work?",
    a: "Our AI model analyzes uploaded resumes (PDF, DOCX) and automatically extracts key skills, experience, and achievements. It then maps these details against your job description requirements, scoring and ranking candidates based on role fit. The system processes each resume in under 30 seconds and outputs an explainable AI score with specific alignment signals."
  },
  {
    q: "How does the Attrition Risk Prediction model identify flight risks?",
    a: "The model runs continuous analysis on over 50+ workforce signals, including time since last promotion, compensation relative to market benchmarks, calendar activity patterns, and role tenure. It assigns a clear risk percentage and surfaces the primary factors behind the flag so HR business partners can take proactive, data-driven actions."
  },
  {
    q: "What can I ask the AI HR Copilot?",
    a: "You can ask the Copilot anything about your workforce in natural language. Examples include: 'Summarize today's attrition risks in Engineering', 'Draft an onboarding plan for a new frontend developer', or 'Show me the leave approval status for Sales'. The Copilot uses secure, role-based access to pull real-time data from your unified dashboard."
  },
  {
    q: "How does WorkSphere AI guarantee compliance across different countries?",
    a: "WorkSphere AI includes a dynamic compliance library tracking employment laws, localized tax regulations, and statutory benefit rules across 60+ countries. It automatically audits your contracts, onboarding steps, and payroll runs, flagging any anomalies or upcoming changes in local labor laws before they cause compliance infractions."
  },
  {
    q: "Can we integrate our existing HRIS tools with WorkSphere AI?",
    a: "Yes. WorkSphere AI features pre-built integrations with major platforms including Workday, SAP SuccessFactors, BambooHR, and ADP. We synchronize employee profiles, payroll databases, and application pipelines automatically, usually completing setup within 48 hours with zero manual data mapping."
  },
];

// --- AI Capabilities Grid ---
export const caps: AICapability[] = [
  { icon: Cpu, label: "Attrition Prediction", value: "87%", sub: "model accuracy", color: "#7c3aed" },
  { icon: UserCheck, label: "Resume Screening", value: "<30s", sub: "per candidate", color: "#22d3ee" },
  { icon: Activity, label: "Anomaly Detection", value: "Real-time", sub: "workforce signals", color: "#6366f1" },
  { icon: Globe, label: "Jurisdictions", value: "60+", sub: "compliance support", color: "#10b981" },
];

// --- Briefing Page Cards ---
export const briefCards: BriefCard[] = [
  { icon: Calendar, label: "Leave Requests", value: "12 Pending", sub: "3 urgent · 4 new today", color: "#7c3aed", trend: "+4 from yesterday" },
  { icon: DollarSign, label: "Payroll", value: "$2.84M", sub: "Processing in 3 days", color: "#22d3ee", trend: "On schedule" },
  { icon: AlertTriangle, label: "Attrition Risk", value: "3 Flagged", sub: "Engineering · Sales", color: "#f43f5e", trend: "↑ 1 from last week" },
  { icon: Target, label: "Performance Reviews", value: "47 Due", sub: "Deadline in 6 days", color: "#10b981", trend: "62% completed" },
  { icon: Users, label: "Open Positions", value: "23 Active", sub: "8 in final stages", color: "#f59e0b", trend: "↑ 3 this week" },
];

// --- Kanban Recruitment Columns ---
export const kanbanColumns: KanbanState = {
  applied: [
    { id: "c1", name: "Aria Patel", role: "Sr. Frontend Engineer", score: 92, tags: ["React", "TypeScript"], time: "2h ago" },
    { id: "c2", name: "Devon Clark", role: "Product Designer", score: 88, tags: ["Figma", "UX Research"], time: "4h ago" },
    { id: "c3", name: "Yuna Kim", role: "Data Scientist", score: 95, tags: ["Python", "ML"], time: "6h ago" },
  ],
  screening: [
    { id: "c4", name: "Ravi Nair", role: "Backend Engineer", score: 91, tags: ["Go", "Postgres"], time: "1d ago" },
    { id: "c5", name: "Sofia Escobar", role: "Sales Engineer", score: 84, tags: ["Salesforce", "SaaS"], time: "1d ago" },
  ],
  shortlisted: [
    { id: "c6", name: "James Wu", role: "DevOps Engineer", score: 93, tags: ["Kubernetes", "AWS"], time: "2d ago" },
    { id: "c7", name: "Nadia Al-Hassan", role: "PM", score: 89, tags: ["Agile", "B2B"], time: "2d ago" },
  ],
  interview: [
    { id: "c8", name: "Tom Brennan", role: "Sr. Backend Engineer", score: 96, tags: ["Rust", "Distributed"], time: "3d ago" },
    { id: "c9", name: "Mia Torres", role: "UX Lead", score: 90, tags: ["Strategy", "Design System"], time: "3d ago" },
  ],
  selected: [
    { id: "c10", name: "Luke Chen", role: "Full-stack Engineer", score: 94, tags: ["Next.js", "Node"], time: "5d ago" },
  ],
  onboarded: [
    { id: "c11", name: "Priya Gupta", role: "Marketing Manager", score: 91, tags: ["Growth", "Analytics"], time: "1w ago" },
  ],
};

export const KANBAN_LABELS: Record<string, string> = {
  applied: "Applied",
  screening: "AI Screening",
  shortlisted: "Shortlisted",
  interview: "Interview",
  selected: "Selected",
  onboarded: "Onboarded",
};
