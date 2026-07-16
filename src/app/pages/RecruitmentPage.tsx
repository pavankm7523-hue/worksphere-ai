import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Filter, Plus, Upload, MoreHorizontal, AlertTriangle, Check, Brain, FileText, Trash } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { PageWrapper } from "../components/shared/PageWrapper";
import { Badge } from "../components/shared/Badge";
import { GradientButton } from "../components/shared/GradientButton";
import { supabase } from "../lib/supabaseClient";
import {
  getCandidates,
  createCandidate,
  updateCandidate,
  updateCandidateStage,
  Candidate
} from "../lib/queries";

export default function RecruitmentPage() {
  const navigate = useNavigate();
  const { isDark } = useAppContext();

  // Database lists and loading states
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  // Drag and Drop state
  const [dragging, setDragging] = useState<{ cardId: number; fromCol: string } | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  // Upload Resume Form State
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState("Senior Backend Engineer");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  // Active candidate detail modal state
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Job opening choices
  const jobPositions = [
    "Senior Frontend Engineer",
    "Senior Backend Engineer",
    "UX Lead",
    "Senior DevOps Engineer",
    "Product Designer"
  ];

  // Fetch candidates from Supabase
  const loadCandidatesData = async () => {
    setPageLoading(true);
    setPageError("");
    try {
      const list = await getCandidates();
      setCandidates(list);
    } catch (err: any) {
      console.error("Error loading candidates:", err);
      setPageError(err?.message || "Failed to load candidate list.");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    loadCandidatesData();
  }, []);

  // Drag and Drop handlers
  const handleDragStart = (cardId: number, fromCol: string) => {
    setDragging({ cardId, fromCol });
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOver(colId);
  };

  const handleDrop = async (e: React.DragEvent, toCol: "screening" | "interview" | "offer" | "rejected") => {
    e.preventDefault();
    setDragOver(null);
    if (!dragging || dragging.fromCol === toCol) {
      setDragging(null);
      return;
    }

    const cardId = dragging.cardId;
    setDragging(null);

    // Optimistic UI update
    const originalCandidates = [...candidates];
    setCandidates(prev => prev.map(c => c.id === cardId ? { ...c, stage: toCol } : c));

    try {
      await updateCandidateStage(cardId, toCol);
    } catch (err: any) {
      console.error("Error updating stage:", err);
      alert("Failed to update candidate stage: " + err.message);
      // Rollback to original
      setCandidates(originalCandidates);
    }
  };

  // Submit file upload and trigger AI scoring
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError("");
    setUploadSuccess("");
    setUploadStatus("");

    if (!selectedFile) {
      setUploadError("Please select a resume PDF file first.");
      return;
    }

    setUploadLoading(true);

    try {
      // 1. Upload resume to Supabase Storage bucket 'resumes'
      setUploadStatus("Uploading resume PDF file to storage bucket...");
      const fileExt = selectedFile.name.split(".").pop();
      const sanitizedName = selectedFile.name.replace(/[^a-zA-Z0-9]/g, "_");
      const filePath = `${Date.now()}_${sanitizedName}.${fileExt}`;

      const { data: storageData, error: storageError } = await supabase.storage
        .from("resumes")
        .upload(filePath, selectedFile);

      if (storageError) {
        throw new Error("Supabase Storage upload failed: " + storageError.message);
      }

      // 2. Resolve the public URL of the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from("resumes")
        .getPublicUrl(storageData.path);

      if (!publicUrl) {
        throw new Error("Failed to resolve public URL for the uploaded file.");
      }

      // 3. Create initial candidate record in public.candidates with screening stage
      setUploadStatus("Saving candidate profile in database...");
      const initialCandidate = await createCandidate({
        job_title: selectedJob,
        resume_url: publicUrl,
        stage: "screening"
      });

      // 4. Trigger OpenAI GPT-4o screening via Edge Function
      setUploadStatus("Extracting resume text and running AI fit analysis (this may take up to 10 seconds)...");
      const { data: analysis, error: functionError } = await supabase.functions
        .invoke("analyze-resume", {
          body: {
            resumeUrl: publicUrl,
            jobTitle: selectedJob,
            requirements: "Senior level experience with modern frameworks, high performance systems design, and collaboration skills."
          }
        });

      if (functionError) {
        throw new Error("AI analysis function failed: " + (functionError.message || JSON.stringify(functionError)));
      }

      if (analysis.error) {
        throw new Error("Edge Function returned an error: " + analysis.error);
      }

      // 5. Update candidates row with extracted information
      setUploadStatus("Saving fit scores and skill reports...");
      const updated = await updateCandidate(initialCandidate.id, {
        candidate_name: analysis.candidate_name || "Unknown Candidate",
        candidate_email: analysis.candidate_email || null,
        ai_score: analysis.score || 0,
        ai_summary: analysis.summary || null,
        matched_skills: analysis.matched_skills || [],
        missing_skills: analysis.missing_skills || []
      });

      // 6. Update local state
      setCandidates(prev => [updated, ...prev]);
      setUploadSuccess(`Successfully screened ${analysis.candidate_name}! Fit Score: ${analysis.score}%`);
      setSelectedFile(null);
      
      setTimeout(() => {
        setShowUploadForm(false);
        setUploadSuccess("");
        setUploadStatus("");
      }, 2500);

    } catch (err: any) {
      console.error("Resume screening failed:", err);
      setUploadError(err.message || "An unexpected error occurred during resume screening.");
    } finally {
      setUploadLoading(false);
    }
  };

  // Group candidates dynamically by stage
  const columnsList: Array<"screening" | "interview" | "offer" | "rejected"> = ["screening", "interview", "offer", "rejected"];
  
  const colColors: Record<string, string> = {
    screening: "#7c3aed",
    interview: "#22d3ee",
    offer: "#10b981",
    rejected: "#f43f5e",
  };

  const colLabels: Record<string, string> = {
    screening: "Screening",
    interview: "Interview",
    offer: "Offer",
    rejected: "Rejected",
  };

  const scoreColor = (score: number | null) => {
    if (score === null) return "text-muted-foreground";
    if (score >= 90) return "text-emerald-400";
    if (score >= 80) return "text-amber-400";
    return "text-red-400";
  };

  const dynamicStyles = {
    headerBg: isDark ? "rgba(8,8,15,0.9)" : "rgba(247,247,252,0.9)",
    headerBorder: isDark ? "border-white/[0.05]" : "border-black/[0.08]",
    uploadBorder: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    cardBg: isDark ? "bg-white/[0.03]" : "bg-black/[0.02]",
    cardBorder: isDark ? "border-white/[0.07]" : "border-black/[0.07]",
    colBg: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
    colBorder: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    dropdownBg: isDark ? "#0d0d1c" : "#ffffff",
  };

  if (pageLoading) {
    return (
      <PageWrapper className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-widest font-mono-data">Loading Pipeline...</span>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 h-16 border-b sticky top-0 z-30 backdrop-blur-2xl transition-all"
        style={{
          background: dynamicStyles.headerBg,
          borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)"
        }}
      >
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/dashboard/hr")} className="w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.03] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent">
            <ChevronLeft size={14} />
          </button>
          <div>
            <h1 className="text-lg font-display font-bold text-foreground">Recruitment Pipeline</h1>
            <p className="text-xs text-muted-foreground">{candidates.length} total candidates in screening</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <GradientButton onClick={() => setShowUploadForm(!showUploadForm)} size="sm">
            <Upload size={12} className="mr-1.5" /> Upload Resume
          </GradientButton>
        </div>
      </div>

      <div className="p-6">
        {/* Resume Upload Form */}
        <AnimatePresence>
          {showUploadForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`rounded-2xl border p-6 mb-6 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder}`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-foreground font-display flex items-center gap-2">
                  <Brain size={16} className="text-violet-400" /> AI Candidate Screening Upload
                </h3>
                <button onClick={() => setShowUploadForm(false)} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-none">Cancel</button>
              </div>

              <form onSubmit={handleFileUpload} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Target Position</label>
                    <select
                      value={selectedJob}
                      onChange={e => setSelectedJob(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-foreground focus:outline-none focus:border-violet-500/50"
                      style={{ background: dynamicStyles.dropdownBg }}
                      disabled={uploadLoading}
                    >
                      {jobPositions.map(job => (
                        <option key={job} value={job}>{job}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Select Resume File (PDF only)</label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-violet-500/50"
                      disabled={uploadLoading}
                    />
                  </div>
                </div>

                <AnimatePresence mode="popLayout">
                  {uploadStatus && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-3 rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3">
                      <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                      <span className="text-xs text-violet-300 font-medium leading-relaxed">{uploadStatus}</span>
                    </motion.div>
                  )}
                  {uploadError && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                      <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
                      <span className="text-xs text-red-300 leading-normal">{uploadError}</span>
                    </motion.div>
                  )}
                  {uploadSuccess && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                      <Check size={14} className="text-emerald-400 flex-shrink-0" />
                      <span className="text-xs text-emerald-300 font-semibold">{uploadSuccess}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <GradientButton type="submit" size="md" disabled={uploadLoading} className="w-full justify-center">
                  {uploadLoading ? "Processing Document..." : "Upload & Analyze Resume"}
                </GradientButton>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        {pageError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 mb-6">
            <AlertTriangle size={14} className="text-red-400" />
            <span className="text-xs text-red-300">{pageError}</span>
          </div>
        )}

        {/* Kanban Board */}
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 600 }}>
          {columnsList.map(colId => {
            const cards = candidates.filter(c => c.stage === colId);
            const color = colColors[colId];
            const isDragTarget = dragOver === colId;

            return (
              <div
                key={colId}
                onDragOver={e => handleDragOver(e, colId)}
                onDrop={e => handleDrop(e, colId)}
                onDragLeave={() => setDragOver(null)}
                className="flex-shrink-0 w-72 rounded-2xl border transition-all duration-200"
                style={{
                  background: isDragTarget ? `${color}10` : dynamicStyles.colBg,
                  borderColor: isDragTarget ? `${color}40` : dynamicStyles.colBorder,
                }}
              >
                {/* Column header */}
                <div className="p-4 border-b" style={{ borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground font-display">{colLabels[colId]}</span>
                    </div>
                    <span className="text-xs font-mono-data text-muted-foreground bg-white/[0.05] rounded-full px-2 py-0.5">{cards.length}</span>
                  </div>
                </div>

                {/* Cards */}
                <div className="p-3 space-y-3 max-h-[550px] overflow-y-auto">
                  {cards.map(card => (
                    <motion.div
                      key={card.id}
                      draggable
                      onDragStart={() => handleDragStart(card.id, colId)}
                      onDragEnd={() => { setDragging(null); setDragOver(null); }}
                      onClick={() => setSelectedCandidate(card)}
                      whileHover={{ y: -2, boxShadow: `0 8px 30px rgba(0,0,0,0.15)` }}
                      animate={dragging?.cardId === card.id ? { scale: 1.03, rotate: 1.5, opacity: 0.7 } : { scale: 1, rotate: 0, opacity: 1 }}
                      className={`rounded-xl border p-4 cursor-grab active:cursor-grabbing transition-all duration-200 ${dynamicStyles.cardBg} ${dynamicStyles.cardBorder} hover:border-violet-500/20`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: `linear-gradient(135deg,${color}60,${color}30)`, border: `1px solid ${color}30` }}>
                          {card.candidate_name ? card.candidate_name.split(" ").map(n => n[0]).join("") : "–"}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-xs font-bold font-mono-data ${scoreColor(card.ai_score)}`}>
                            {card.ai_score !== null ? `${card.ai_score}%` : "Scanning"}
                          </span>
                          <span className="text-[9px] text-muted-foreground">AI Score</span>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-foreground mb-0.5">{card.candidate_name || "Screening in progress..."}</p>
                      <p className="text-[10px] text-muted-foreground mb-3">{card.job_title}</p>
                      
                      {/* Skills badges */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {card.matched_skills?.slice(0, 3).map(tag => (
                          <span key={tag} className="rounded-full px-2 py-0.5 text-[9px] font-medium" style={{ background: `${color}15`, color: color, border: `1px solid ${color}25` }}>
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground font-mono-data">
                          {new Date(card.created_at).toLocaleDateString()}
                        </span>
                        <a
                          href={card.resume_url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()} // avoid opening dialog
                          className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors font-medium flex items-center gap-0.5 bg-transparent border-none cursor-pointer"
                        >
                          <FileText size={10} /> PDF
                        </a>
                      </div>
                    </motion.div>
                  ))}
                  {cards.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-8">Drag candidates here</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Candidate Profile Details Dialog */}
      <AnimatePresence>
        {selectedCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl border p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
              style={{ background: isDark ? "#08080f" : "#ffffff", borderColor: dynamicStyles.cardBorder }}
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-base font-bold"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                    {selectedCandidate.candidate_name ? selectedCandidate.candidate_name.split(" ").map(n => n[0]).join("") : "C"}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">{selectedCandidate.candidate_name || "Screening Candidate"}</h2>
                    <p className="text-xs text-muted-foreground">{selectedCandidate.candidate_email || "No email parsed"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xl font-display font-black ${scoreColor(selectedCandidate.ai_score)}`}>
                    {selectedCandidate.ai_score !== null ? `${selectedCandidate.ai_score}%` : "Pending"}
                  </span>
                  <p className="text-[10px] text-muted-foreground">AI Fit Score</p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3" style={{ borderColor: dynamicStyles.divider }}>
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Target Position</h4>
                  <p className="text-sm font-semibold text-foreground">{selectedCandidate.job_title}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">AI Screening Fit Summary</h4>
                  <p className="text-xs text-foreground leading-relaxed">
                    {selectedCandidate.ai_summary || "AI analysis details are being generated. Check back in a few seconds."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 text-emerald-400">Matched Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedCandidate.matched_skills?.map(skill => (
                        <span key={skill} className="rounded-full px-2 py-0.5 text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {skill}
                        </span>
                      )) || <span className="text-[10px] text-muted-foreground">None</span>}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 text-red-400">Missing Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedCandidate.missing_skills?.map(skill => (
                        <span key={skill} className="rounded-full px-2 py-0.5 text-[9px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                          {skill}
                        </span>
                      )) || <span className="text-[10px] text-muted-foreground">None</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t" style={{ borderColor: dynamicStyles.divider }}>
                <a
                  href={selectedCandidate.resume_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-white/[0.08] hover:bg-white/[0.04] transition-colors flex items-center gap-1.5 text-foreground cursor-pointer text-center bg-transparent decoration-none"
                >
                  <FileText size={12} /> Download PDF Resume
                </a>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer bg-violet-600 hover:bg-violet-700 transition-colors border-none"
                >
                  Close Panel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
