import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Brain, 
  Trash2, 
  Mail, 
  Briefcase, 
  Clock, 
  AlertTriangle,
  User,
  Activity,
  DollarSign,
  Award,
  ChevronRight,
  BookOpen,
  Calendar,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Edit3,
  XCircle
} from "lucide-react";
import { Student, RiskLevel, InterventionPlan } from "../types";
import { motion, AnimatePresence } from "motion/react";
import EditStudentModal from "./EditStudentModal";

interface StudentListProps {
  students: Student[];
  onDeleteStudent: (id: string) => Promise<void>;
  onUpdateStudent: (id: string, updatedData: any) => Promise<boolean>;
  departments: string[];
}

export default function StudentList({ students, onDeleteStudent, onUpdateStudent, departments }: StudentListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRisk, setSelectedRisk] = useState<string>("All");
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Edit modal state
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // AI intervention state
  const [intervention, setIntervention] = useState<InterventionPlan | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Set initial selected student
  useEffect(() => {
    if (students.length > 0 && !selectedStudent) {
      setSelectedStudent(students[0]);
    } else if (selectedStudent) {
      const updated = students.find(s => s.id === selectedStudent.id);
      if (updated) setSelectedStudent(updated);
    }
  }, [students]);

  // Clear intervention state when student selection changes
  useEffect(() => {
    setIntervention(null);
    setAiError(null);
  }, [selectedStudent]);

  const handleFetchIntervention = async (studentId: string) => {
    setAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch(`/api/students/${studentId}/intervention`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error("Failed to communicate with AI Retention server.");
      }
      const data = await response.json();
      setIntervention(data);
    } catch (err: any) {
      setAiError(err.message || "An unexpected error occurred.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Clear all filters action
  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedRisk("All");
    setSelectedDept("All");
  };

  // Filtering Logic
  const filteredStudents = students.filter((s) => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRisk = selectedRisk === "All" || s.riskLevel === selectedRisk;
    const matchesDept = selectedDept === "All" || s.department === selectedDept;

    return matchesSearch && matchesRisk && matchesDept;
  });

  const getRiskBadgeStyle = (level: RiskLevel) => {
    if (level === "High") {
      return "bg-rose-950 text-rose-300 border border-rose-800";
    }
    if (level === "Medium") {
      return "bg-amber-950 text-amber-300 border border-amber-800";
    }
    return "bg-emerald-950 text-emerald-300 border border-emerald-800";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="student-list-root">
      
      {/* LEFT GRID: Student Directory Matrix (7 cols) */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        
        {/* Search and Filters Drawer */}
        <div className="p-4 bg-[#261912] border border-[#4F3529] backdrop-blur-xl rounded-2xl flex flex-col sm:flex-row gap-3 shadow-md">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#A89282]" />
            <input
              type="text"
              placeholder="Search student name, email, or id..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1C120C] border border-[#4F3529] rounded-xl text-xs text-[#F9F3EB] placeholder-[#A89282] focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex items-center gap-1 bg-[#1C120C] border border-[#4F3529] rounded-xl px-2">
              <Filter className="h-3 w-3 text-[#A89282]" />
              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
                className="bg-transparent text-[11px] text-[#F9F3EB] focus:outline-none border-none py-1 pr-4 cursor-pointer font-semibold"
              >
                <option value="All" className="bg-[#1C120C]">All Risks</option>
                <option value="High" className="bg-[#1C120C]">High Risk</option>
                <option value="Medium" className="bg-[#1C120C]">Medium Risk</option>
                <option value="Low" className="bg-[#1C120C]">Low Risk</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-[#1C120C] border border-[#4F3529] rounded-xl px-2">
              <Briefcase className="h-3 w-3 text-[#A89282]" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-transparent text-[11px] text-[#F9F3EB] focus:outline-none border-none py-1 pr-4 cursor-pointer font-semibold"
              >
                <option value="All" className="bg-[#1C120C]">All Depts</option>
                {departments.map(dept => (
                  <option key={dept} value={dept} className="bg-[#1C120C]">{dept}</option>
                ))}
              </select>
            </div>

            {(searchTerm || selectedRisk !== "All" || selectedDept !== "All") && (
              <button
                onClick={handleClearFilters}
                className="p-2 bg-[#34221A] hover:bg-[#422C24] text-[#D5C3B5] rounded-xl transition cursor-pointer"
                title="Clear filters"
              >
                <XCircle className="h-4 w-4 text-amber-400" />
              </button>
            )}
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-[#261912] border border-[#4F3529] backdrop-blur-xl rounded-2xl overflow-hidden flex flex-col flex-1 shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#4F3529] text-[#D5C3B5] font-bold uppercase tracking-wider bg-[#1C120C]">
                  <th className="px-5 py-3.5">Student Info</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5 text-center">CGPA</th>
                  <th className="px-4 py-3.5 text-center">Attendance</th>
                  <th className="px-4 py-3.5 text-center">Risk Score</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#4F3529] text-[#F9F3EB]">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => {
                    const isSelected = selectedStudent?.id === student.id;
                    return (
                      <tr 
                        key={student.id}
                        onClick={() => setSelectedStudent(student)}
                        className={`hover:bg-[#34221A] transition duration-150 cursor-pointer ${isSelected ? "bg-[#3D291F] border-l-4 border-l-amber-500" : ""}`}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-[#3E291F] border border-[#6A4939] text-amber-400 rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                              {student.name.split(" ").map(n => n[0]).join("")}
                            </div>
                            <div>
                              <span className="font-bold text-[#F9F3EB] block">{student.name}</span>
                              <span className="text-[10px] text-[#D5C3B5] block font-mono mt-0.5">{student.studentId}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div>
                            <span className="block text-[#F9F3EB] font-semibold">{student.department}</span>
                            <span className="text-[10px] text-[#D5C3B5] block font-mono">{student.academicYear}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-amber-400 font-mono">{student.cgpa}</td>
                        <td className="px-4 py-3.5 text-center font-semibold text-[#F9F3EB] font-mono">{student.attendance}%</td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase inline-block font-mono ${getRiskBadgeStyle(student.riskLevel)}`}>
                            {student.riskScore}%
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingStudent(student)}
                              className="p-1.5 bg-[#3E291F] hover:bg-[#4E3529] text-amber-400 border border-[#6A4939] rounded-lg transition cursor-pointer"
                              title="Edit Student Record"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteStudent(student.id)}
                              className="p-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg transition cursor-pointer"
                              title="Remove Student Record"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-[#D5C3B5] italic">
                      No matching student profiles found. Try clearing filter search constraints.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* RIGHT GRID: Student Risk Breakdown & Gemini Interventions (5 cols) */}
      <div className="lg:col-span-5">
        <AnimatePresence mode="wait">
          {selectedStudent ? (
            <motion.div
              key={selectedStudent.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="p-5 bg-[#261912] border border-[#4F3529] backdrop-blur-xl rounded-2xl flex flex-col gap-5 sticky top-6 shadow-xl"
            >
              {/* Selected Student Card Header */}
              <div className="flex items-start justify-between border-b border-[#4F3529] pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-[#3E291F] border border-[#6A4939] text-amber-400 rounded-xl flex items-center justify-center font-bold text-sm uppercase shadow-sm">
                    {selectedStudent.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#F9F3EB] text-md">{selectedStudent.name}</h3>
                    <p className="text-xs text-[#D5C3B5] font-mono mt-0.5">{selectedStudent.studentId} • {selectedStudent.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingStudent(selectedStudent)}
                    className="p-1.5 bg-[#34221A] hover:bg-[#422C24] text-amber-400 border border-[#4F3529] rounded-lg transition cursor-pointer"
                    title="Edit Record"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase font-mono ${getRiskBadgeStyle(selectedStudent.riskLevel)}`}>
                    {selectedStudent.riskLevel} Risk ({selectedStudent.riskScore}%)
                  </span>
                </div>
              </div>

              {/* Statistical Contributions Matrix */}
              <div>
                <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest block mb-3 font-mono">Academic & Socioeconomic Vector Matrix</span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  
                  {/* Attendance Factor */}
                  <div className="p-3 bg-[#1C120C] border border-[#4F3529] rounded-xl space-y-1">
                    <span className="text-[#D5C3B5] text-[11px] flex items-center gap-1 font-medium">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                      Attendance Rate
                    </span>
                    <p className="text-[#F9F3EB] font-bold text-base mt-1 font-mono">{selectedStudent.attendance}%</p>
                    <div className="h-1 bg-[#261912] rounded-full overflow-hidden border border-[#4F3529]">
                      <div 
                        className={`h-full ${selectedStudent.attendance < 75 ? "bg-rose-500" : "bg-emerald-500"}`} 
                        style={{ width: `${selectedStudent.attendance}%` }} 
                      />
                    </div>
                  </div>

                  {/* CGPA Factor */}
                  <div className="p-3 bg-[#1C120C] border border-[#4F3529] rounded-xl space-y-1">
                    <span className="text-[#D5C3B5] text-[11px] flex items-center gap-1 font-medium">
                      <BookOpen className="h-3.5 w-3.5 text-amber-500" />
                      Cumulative GPA
                    </span>
                    <p className="text-[#F9F3EB] font-bold text-base mt-1 font-mono">{selectedStudent.cgpa} / 10</p>
                    <div className="h-1 bg-[#261912] rounded-full overflow-hidden border border-[#4F3529]">
                      <div 
                        className={`h-full ${selectedStudent.cgpa < 6.0 ? "bg-rose-500" : "bg-emerald-500"}`} 
                        style={{ width: `${selectedStudent.cgpa * 10}%` }} 
                      />
                    </div>
                  </div>

                  {/* Continuous Assessments */}
                  <div className="p-3 bg-[#1C120C] border border-[#4F3529] rounded-xl space-y-1">
                    <span className="text-[#D5C3B5] text-[11px] flex items-center gap-1 font-medium">
                      <Activity className="h-3.5 w-3.5 text-amber-500" />
                      Internal Marks
                    </span>
                    <p className="text-[#F9F3EB] font-bold text-base mt-1 font-mono">{selectedStudent.internalMarks}%</p>
                    <div className="h-1 bg-[#261912] rounded-full overflow-hidden border border-[#4F3529]">
                      <div 
                        className={`h-full ${selectedStudent.internalMarks < 50 ? "bg-rose-500" : "bg-emerald-500"}`} 
                        style={{ width: `${selectedStudent.internalMarks}%` }} 
                      />
                    </div>
                  </div>

                  {/* Financial Bracket */}
                  <div className="p-3 bg-[#1C120C] border border-[#4F3529] rounded-xl space-y-1">
                    <span className="text-[#D5C3B5] text-[11px] flex items-center gap-1 font-medium">
                      <DollarSign className="h-3.5 w-3.5 text-amber-500" />
                      Household Income
                    </span>
                    <p className="text-[#F9F3EB] font-bold text-base mt-1 font-mono">${selectedStudent.householdIncome.toLocaleString()}</p>
                    <span className="text-[10px] text-[#D5C3B5] flex items-center gap-1 mt-1 font-mono">
                      <Award className="h-3 w-3 text-amber-500" />
                      {selectedStudent.scholarship ? `Grant: ${selectedStudent.scholarshipHistory}` : "No Active Grant"}
                    </span>
                  </div>

                </div>
              </div>

              {/* Gemini AI Personalized Retaining Engine */}
              <div className="border-t border-[#4F3529] pt-4">
                {!intervention ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-[#1C120C] border border-amber-500/40 rounded-xl space-y-2">
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <Brain className="h-4.5 w-4.5 text-amber-500" />
                        AI Retention Advisor Integration
                      </span>
                      <p className="text-[11px] text-[#D5C3B5] leading-relaxed">
                        Query the Gemini server-side agent to analyze this student's combined vectors (Attendance, GPA, and socioeconomics) to produce roots-cause and custom interventions.
                      </p>
                    </div>

                    <button
                      onClick={() => handleFetchIntervention(selectedStudent.id)}
                      disabled={aiLoading}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50 shadow-lg shadow-amber-500/20 cursor-pointer"
                    >
                      {aiLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Structuring AI Intervention Blueprint...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Generate Personalized AI Retention Strategy
                        </>
                      )}
                    </button>
                    {aiError && <p className="text-rose-400 text-xs mt-2 text-center font-semibold">{aiError}</p>}
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4 text-xs leading-relaxed"
                  >
                    {/* Root causes */}
                    <div>
                      <span className="text-[10px] font-extrabold text-rose-400 uppercase tracking-wider block mb-2 font-mono">Predicted Root Causes</span>
                      <ul className="space-y-1.5 list-disc pl-4 text-[#F9F3EB]">
                        {intervention.rootCauses.map((rc, idx) => (
                          <li key={idx}>{rc}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Action plans */}
                    <div>
                      <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider block mb-2 font-mono">Personalized Retaining Plans</span>
                      <ul className="space-y-1.5 list-decimal pl-4 text-[#F9F3EB] font-semibold">
                        {intervention.retainingStrategies.map((rs, idx) => (
                          <li key={idx}>{rs}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Email draft */}
                    <div className="p-3.5 bg-[#1C120C] border border-[#4F3529] rounded-xl space-y-2">
                      <div className="flex items-center justify-between border-b border-[#4F3529] pb-1.5">
                        <span className="text-[9px] font-bold text-amber-500 font-mono uppercase">Draft Student Letter</span>
                        <button
                          onClick={() => handleCopyText(intervention.encouragementMessage)}
                          className="p-1 hover:bg-[#34221A] text-[#D5C3B5] hover:text-[#F9F3EB] rounded transition flex items-center gap-1 cursor-pointer"
                          title="Copy Draft Letter"
                        >
                          {copied ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-400" />
                              <span className="text-[9px] text-emerald-400 font-bold font-mono">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span className="text-[9px] font-bold font-mono">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-[#D5C3B5] italic whitespace-pre-wrap leading-relaxed">
                        "{intervention.encouragementMessage}"
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-[9px] text-[#D5C3B5] font-mono pt-2 border-t border-[#4F3529]">
                      <span>Server: Gemini 3.5 Flash</span>
                      <span>{new Date(intervention.generatedAt).toLocaleTimeString()}</span>
                    </div>
                  </motion.div>
                )}
              </div>

            </motion.div>
          ) : (
            <div className="p-10 border border-[#4F3529] rounded-2xl bg-[#261912] text-center text-[#D5C3B5] italic text-xs shadow-md">
              Select a student record to trigger retention modeling and intervention logic.
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* EDIT STUDENT MODAL DIALOG */}
      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          onUpdateStudent={onUpdateStudent}
          onClose={() => setEditingStudent(null)}
          departments={departments}
        />
      )}

    </div>
  );
}
