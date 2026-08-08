import React, { useState, useEffect } from "react";
import { X, Edit3, Save, RotateCcw, AlertCircle } from "lucide-react";
import { Student } from "../types";

interface EditStudentModalProps {
  student: Student;
  onUpdateStudent: (id: string, updatedData: any) => Promise<boolean>;
  onClose: () => void;
  departments: string[];
}

export default function EditStudentModal({ student, onUpdateStudent, onClose, departments }: EditStudentModalProps) {
  const [formData, setFormData] = useState({
    name: student.name,
    email: student.email,
    department: student.department,
    academicYear: student.academicYear,
    attendance: student.attendance.toString(),
    internalMarks: student.internalMarks.toString(),
    cgpa: student.cgpa.toString(),
    householdIncome: student.householdIncome.toString(),
    scholarship: student.scholarship,
    scholarshipHistory: student.scholarshipHistory,
    engagement: student.engagement,
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData({
      name: student.name,
      email: student.email,
      department: student.department,
      academicYear: student.academicYear,
      attendance: student.attendance.toString(),
      internalMarks: student.internalMarks.toString(),
      cgpa: student.cgpa.toString(),
      householdIncome: student.householdIncome.toString(),
      scholarship: student.scholarship,
      scholarshipHistory: student.scholarshipHistory,
      engagement: student.engagement,
    });
  }, [student]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
        scholarshipHistory: checked ? (prev.scholarshipHistory === "None" ? "Partial" : prev.scholarshipHistory) : "None",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const attNum = parseFloat(formData.attendance);
    const marksNum = parseFloat(formData.internalMarks);
    const cgpaNum = parseFloat(formData.cgpa);
    const incomeNum = parseFloat(formData.householdIncome);

    if (!formData.name.trim() || !formData.email.trim()) {
      setError("Name and Email address are required.");
      setLoading(false);
      return;
    }

    if (isNaN(attNum) || attNum < 0 || attNum > 100) {
      setError("Attendance percentage must be between 0% and 100%.");
      setLoading(false);
      return;
    }

    if (isNaN(marksNum) || marksNum < 0 || marksNum > 100) {
      setError("Internal marks must be between 0% and 100%.");
      setLoading(false);
      return;
    }

    if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
      setError("CGPA must be on a scale from 0.0 to 10.0.");
      setLoading(false);
      return;
    }

    if (isNaN(incomeNum) || incomeNum < 0) {
      setError("Household income must be a non-negative number.");
      setLoading(false);
      return;
    }

    const success = await onUpdateStudent(student.id, {
      ...formData,
      attendance: attNum,
      internalMarks: marksNum,
      cgpa: cgpaNum,
      householdIncome: incomeNum,
    });

    setLoading(false);
    if (success) {
      onClose();
    } else {
      setError("Failed to save student updates. Please check server connection.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-[#261912] border border-[#4F3529] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-[#F9F3EB]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#4F3529] flex items-center justify-between bg-[#1C120C]">
          <div>
            <h3 className="text-lg font-bold text-[#F9F3EB] flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-amber-500" />
              Update Record • {student.name}
            </h3>
            <p className="text-xs text-[#D5C3B5] mt-0.5 font-mono">ID: {student.studentId} • Risk Score will be automatically recalculated.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-[#3E291F] text-[#D5C3B5] hover:text-white rounded-lg transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-600/40 text-rose-200 rounded-xl flex items-start gap-2 text-xs">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Core Info */}
          <div>
            <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest block mb-3 font-mono">1. Basic Identification</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#D5C3B5] font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#1C120C] border border-[#4F3529] rounded-xl text-[#F9F3EB] focus:outline-none focus:border-amber-500 text-xs transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-[#D5C3B5] font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#1C120C] border border-[#4F3529] rounded-xl text-[#F9F3EB] focus:outline-none focus:border-amber-500 text-xs transition-all"
                  required
                />
              </div>
            </div>
          </div>

          <hr className="border-[#4F3529]" />

          {/* Academic Vectors */}
          <div>
            <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest block mb-3 font-mono">2. Academic & Engagement Vectors</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-[#D5C3B5] font-semibold mb-1">Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#1C120C] border border-[#4F3529] rounded-xl text-[#F9F3EB] focus:outline-none focus:border-amber-500 text-xs transition-all cursor-pointer"
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept} className="bg-[#1C120C]">{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#D5C3B5] font-semibold mb-1">Academic Year</label>
                <select
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#1C120C] border border-[#4F3529] rounded-xl text-[#F9F3EB] focus:outline-none focus:border-amber-500 text-xs transition-all cursor-pointer"
                >
                  <option value="Freshman" className="bg-[#1C120C]">Freshman</option>
                  <option value="Sophomore" className="bg-[#1C120C]">Sophomore</option>
                  <option value="Junior" className="bg-[#1C120C]">Junior</option>
                  <option value="Senior" className="bg-[#1C120C]">Senior</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#D5C3B5] font-semibold mb-1">Engagement Level</label>
                <select
                  name="engagement"
                  value={formData.engagement}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#1C120C] border border-[#4F3529] rounded-xl text-[#F9F3EB] focus:outline-none focus:border-amber-500 text-xs transition-all cursor-pointer"
                >
                  <option value="High" className="bg-[#1C120C]">High Involvement</option>
                  <option value="Medium" className="bg-[#1C120C]">Medium Involvement</option>
                  <option value="Low" className="bg-[#1C120C]">Low / At Risk</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#D5C3B5] font-semibold mb-1">Attendance Rate (%)</label>
                <input
                  type="number"
                  name="attendance"
                  value={formData.attendance}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-3 py-2 bg-[#1C120C] border border-[#4F3529] rounded-xl text-[#F9F3EB] focus:outline-none focus:border-amber-500 text-xs transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-[#D5C3B5] font-semibold mb-1">Internal Marks (%)</label>
                <input
                  type="number"
                  name="internalMarks"
                  value={formData.internalMarks}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 bg-[#1C120C] border border-[#4F3529] rounded-xl text-[#F9F3EB] focus:outline-none focus:border-amber-500 text-xs transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-[#D5C3B5] font-semibold mb-1">CGPA (0.0 - 10.0)</label>
                <input
                  type="number"
                  name="cgpa"
                  value={formData.cgpa}
                  onChange={handleChange}
                  min="0"
                  max="10"
                  step="0.01"
                  className="w-full px-3 py-2 bg-[#1C120C] border border-[#4F3529] rounded-xl text-[#F9F3EB] focus:outline-none focus:border-amber-500 text-xs transition-all"
                  required
                />
              </div>
            </div>
          </div>

          <hr className="border-[#4F3529]" />

          {/* Socioeconomic */}
          <div>
            <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest block mb-3 font-mono">3. Financial & Grant Support</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#D5C3B5] font-semibold mb-1">Household Income ($ USD)</label>
                <input
                  type="number"
                  name="householdIncome"
                  value={formData.householdIncome}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 bg-[#1C120C] border border-[#4F3529] rounded-xl text-[#F9F3EB] focus:outline-none focus:border-amber-500 text-xs transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-[#D5C3B5] font-semibold mb-1">Scholarship Type</label>
                <select
                  name="scholarshipHistory"
                  value={formData.scholarshipHistory}
                  onChange={handleChange}
                  disabled={!formData.scholarship}
                  className="w-full px-3 py-2 bg-[#1C120C] border border-[#4F3529] rounded-xl text-[#F9F3EB] focus:outline-none focus:border-amber-500 text-xs transition-all cursor-pointer disabled:opacity-40"
                >
                  <option value="Full Tuition" className="bg-[#1C120C]">Full Tuition Waiver</option>
                  <option value="Partial" className="bg-[#1C120C]">Partial Waiver</option>
                  <option value="Need-based" className="bg-[#1C120C]">Need-Based Assistance</option>
                  <option value="None" className="bg-[#1C120C]">None</option>
                </select>
              </div>
              <div className="sm:col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-scholarship"
                  name="scholarship"
                  checked={formData.scholarship}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-[#4F3529] bg-[#1C120C] text-amber-500 focus:ring-amber-500/50 cursor-pointer"
                />
                <label htmlFor="edit-scholarship" className="text-xs text-[#F9F3EB] font-semibold cursor-pointer select-none">
                  Currently holds a school-sponsored scholarship or tuition subsidy.
                </label>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#4F3529]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#D5C3B5] hover:text-white bg-[#34221A] hover:bg-[#422C24] border border-[#4F3529] rounded-xl transition duration-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-stone-950 bg-amber-500 hover:bg-amber-600 rounded-xl transition duration-200 flex items-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              {loading ? "Recalculating..." : "Save Record & Recalculate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
