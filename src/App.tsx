import React, { useState, useEffect } from "react";
import { 
  Users, 
  Plus, 
  Database, 
  Terminal, 
  GraduationCap, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle2, 
  LineChart, 
  Settings,
  HelpCircle,
  Sparkles,
  X
} from "lucide-react";
import { Student, EdaStats, DataCleaningLog } from "./types";
import DashboardStats from "./components/DashboardStats";
import StudentList from "./components/StudentList";
import DataScienceWorkbench from "./components/DataScienceWorkbench";
import StudentForm from "./components/StudentForm";
import { motion, AnimatePresence } from "motion/react";
import ascendraLogo from "./assets/ascendra-logo.png";

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<EdaStats | null>(null);
  const [logs, setLogs] = useState<DataCleaningLog[]>([]);
  
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Core data fetchers
  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, statsRes, logsRes] = await Promise.all([
        fetch("/api/students"),
        fetch("/api/eda"),
        fetch("/api/cleaning-logs")
      ]);

      if (studentsRes.ok && statsRes.ok && logsRes.ok) {
        const studentsData = await studentsRes.json();
        const statsData = await statsRes.json();
        const logsData = await logsRes.json();

        setStudents(studentsData);
        setStats(statsData);
        setLogs(logsData);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard intelligence vectors", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddStudent = async (studentData: any): Promise<boolean> => {
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentData),
      });

      if (res.ok) {
        await fetchData(); // refresh stats and list
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to post new student metrics", err);
      return false;
    }
  };

  const handleUpdateStudent = async (id: string, updatedData: any): Promise<boolean> => {
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (res.ok) {
        await fetchData();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to update student record", err);
      return false;
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student record from active risk monitoring?")) {
      return;
    }
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error("Failed to delete student record", err);
    }
  };

  const handleTriggerSync = async (databaseUrl: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ databaseUrl }),
      });

      if (res.ok) {
        await fetchData(); // Refresh state with synchronized data
        return true;
      }
      return false;
    } catch (err) {
      console.error("Sync handshake failed", err);
      return false;
    }
  };

  const handleImportDataset = async (content: string, format: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/dataset/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, format }),
      });

      if (res.ok) {
        await fetchData();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Dataset import failed", err);
      return false;
    }
  };

  const handleResetDataset = async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/dataset/reset", { method: "POST" });
      if (res.ok) {
        await fetchData();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Dataset reset failed", err);
      return false;
    }
  };

  const departments = [
    "Computer Science",
    "Electrical Eng",
    "Mechanical Eng",
    "Business Ad",
    "Civil Eng",
    "Electronics Eng",
    "Information Tech"
  ];

  return (
    <div className="min-h-screen bg-[#1C120C] text-[#F9F3EB] flex flex-col font-sans relative overflow-x-hidden" id="app-root">
      
      {/* BACKGROUND GLOW DECORATIONS (Deep Cocoa & Warm Amber Glow) */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-[160px] pointer-events-none select-none" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-amber-900/15 rounded-full blur-[160px] pointer-events-none select-none" />

      {/* TOP HEADER */}
      <header className="border-b border-[#4F3529] bg-[#261912]/90 backdrop-blur-xl sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          
          {/* Logo & Title */}
          <div 
            onClick={() => setIsLogoModalOpen(true)}
            className="flex items-center gap-3 cursor-pointer group select-none"
            title="Click to view full Ascendra Brand Logo"
          >
            <div className="relative overflow-hidden rounded-xl p-1 bg-white shadow-[0_0_20px_rgba(245,158,11,0.25)] border border-amber-500/30 transition-all duration-200 group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(245,158,11,0.45)]">
              <img 
                src={ascendraLogo} 
                alt="Ascendra Logo" 
                className="h-9 w-auto object-contain rounded"
              />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-[#F9F3EB] flex items-center gap-2">
                <span>Ascendra</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/30">
                  Retention AI
                </span>
              </h1>
              <p className="text-[10px] text-[#D5C3B5] font-medium font-mono">Student Dropout Risk Prediction System</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex bg-[#1C120C] p-1 rounded-xl border border-[#4F3529] text-xs shadow-inner">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-1.5 font-bold rounded-lg transition-all duration-150 cursor-pointer ${activeTab === "dashboard" ? "bg-amber-500 text-stone-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]" : "text-[#D5C3B5] hover:text-[#F9F3EB] hover:bg-[#34221A]"}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("students")}
              className={`px-4 py-1.5 font-bold rounded-lg transition-all duration-150 cursor-pointer ${activeTab === "students" ? "bg-amber-500 text-stone-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]" : "text-[#D5C3B5] hover:text-[#F9F3EB] hover:bg-[#34221A]"}`}
            >
              Risk Directory
            </button>
            <button
              onClick={() => setActiveTab("workbench")}
              className={`px-4 py-1.5 font-bold rounded-lg transition-all duration-150 cursor-pointer ${activeTab === "workbench" ? "bg-amber-500 text-stone-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]" : "text-[#D5C3B5] hover:text-[#F9F3EB] hover:bg-[#34221A]"}`}
            >
              EDA & Data Clean
            </button>
          </nav>

          {/* Quick Actions & Profile */}
          <div className="flex items-center gap-5">
            <button
              onClick={() => setIsFormOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-stone-950 px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Collect Student
            </button>

            <div className="hidden md:flex items-center gap-3 border-l border-[#4F3529] pl-5">
              <div className="text-right">
                <p className="text-xs font-bold text-[#F9F3EB]">Dr. Aris Thorne</p>
                <p className="text-[10px] text-[#D5C3B5]">Senior Faculty Oversight</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#3E291F] border border-[#6A4939] flex items-center justify-center font-bold text-xs text-amber-400 shadow-sm">
                AT
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT WRAPPER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 space-y-4"
            >
              <div className="h-10 w-10 border-4 border-[#4F3529] border-t-amber-500 rounded-full animate-spin" />
              <p className="text-xs font-medium text-[#D5C3B5] font-mono">Loading predictive retention models...</p>
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === "dashboard" && stats && (
                <DashboardStats stats={stats} onNavigateToTab={setActiveTab} students={students} />
              )}

              {activeTab === "students" && (
                <StudentList 
                  students={students} 
                  onDeleteStudent={handleDeleteStudent}
                  onUpdateStudent={handleUpdateStudent}
                  departments={departments}
                />
              )}

              {activeTab === "workbench" && stats && (
                <DataScienceWorkbench 
                  stats={stats} 
                  students={students} 
                  logs={logs}
                  onTriggerSync={handleTriggerSync}
                  onImportDataset={handleImportDataset}
                  onResetDataset={handleResetDataset}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#4F3529] py-5 bg-[#261912]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[#D5C3B5] text-[10px] font-mono">
            <div className="bg-white p-0.5 rounded border border-amber-500/20">
              <img src={ascendraLogo} alt="Ascendra" className="h-5 w-auto object-contain" />
            </div>
            <span>Ascendra Core • Pearson Correlation (r) & Multi-Factor Logistic Engine</span>
          </div>
          <div className="text-[#D5C3B5] text-[10px] flex items-center gap-1.5 font-semibold font-mono">
            <span>Engine: Gemini Retention Core & Node Backend</span>
            <span className="h-2 w-2 bg-amber-500 rounded-full animate-ping" />
          </div>
        </div>
      </footer>

      {/* LOGO VIEW MODAL */}
      <AnimatePresence>
        {isLogoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#261912] border border-[#4F3529] rounded-2xl p-6 max-w-sm w-full shadow-2xl relative text-center space-y-4"
            >
              <button 
                onClick={() => setIsLogoModalOpen(false)}
                className="absolute top-3 right-3 p-1.5 text-[#D5C3B5] hover:text-white rounded-lg hover:bg-[#3E291F] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="inline-block p-4 bg-white rounded-2xl shadow-xl border border-amber-500/30">
                <img src={ascendraLogo} alt="Ascendra Full Logo" className="w-56 h-auto mx-auto object-contain" />
              </div>

              <div>
                <h2 className="text-lg font-extrabold text-[#F9F3EB]">Ascendra Brand Identity</h2>
                <p className="text-xs text-[#D5C3B5] mt-1 font-mono">
                  Official Logo for Student Dropout Risk Prediction System
                </p>
              </div>

              <button
                onClick={() => setIsLogoModalOpen(false)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD STUDENT MODAL FORM */}
      {isFormOpen && (
        <StudentForm 
          onAddStudent={handleAddStudent} 
          onClose={() => setIsFormOpen(false)}
          departments={departments}
        />
      )}
    </div>
  );
}
