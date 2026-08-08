import React, { useState } from "react";
import { X, Plus, Save, RotateCcw, AlertCircle } from "lucide-react";

interface StudentFormProps {
  onAddStudent: (studentData: any) => Promise<boolean>;
  onClose: () => void;
  departments: string[];
}

export default function StudentForm({ onAddStudent, onClose, departments }: StudentFormProps) {
  const [formData, setFormData] = useState({
    studentId: "",
    name: "",
    email: "",
    department: departments[0] || "Computer Science",
    academicYear: "Freshman",
    attendance: "",
    internalMarks: "",
    cgpa: "",
    householdIncome: "",
    scholarship: false,
    scholarshipHistory: "None",
    engagement: "Medium",
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
        scholarshipHistory: checked ? "Partial" : "None",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleReset = () => {
    setFormData({
      studentId: "",
      name: "",
      email: "",
      department: departments[0] || "Computer Science",
      academicYear: "Freshman",
      attendance: "",
      internalMarks: "",
      cgpa: "",
      householdIncome: "",
      scholarship: false,
      scholarshipHistory: "None",
      engagement: "Medium",
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const attNum = parseFloat(formData.attendance);
    const marksNum = parseFloat(formData.internalMarks);
    const cgpaNum = parseFloat(formData.cgpa);
    const incomeNum = parseFloat(formData.householdIncome);

    if (!formData.studentId.trim() || !formData.name.trim() || !formData.email.trim()) {
      setError("Please complete all required fields (Student ID, Name, Email).");
      setLoading(false);
      return;
    }

    if (isNaN(attNum) || attNum < 0 || attNum > 100) {
      setError("Attendance percentage must be a valid number between 0% and 100%.");
      setLoading(false);
      return;
    }

    if (isNaN(marksNum) || marksNum < 0 || marksNum > 100) {
      setError("Internal marks must be a valid percentage between 0% and 100%.");
      setLoading(false);
      return;
    }

    if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
      setError("CGPA must be a valid GPA scale between 0.0 and 10.0.");
      setLoading(false);
      return;
    }

    if (isNaN(incomeNum) || incomeNum < 0) {
      setError("Annual household income must be a positive numeric value.");
      setLoading(false);
      return;
    }

    const success = await onAddStudent({
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
      setError("Failed to register student. Ensure Student ID is unique.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-[#261912] border border-[#4F3529] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-[#F9F3EB]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#4F3529] flex items-center justify-between bg-[#1C120C]">
          <div>
            <h3 className="text-lg font-bold text-[#F9F3EB] flex items-center gap-2">
              <Plus className="h-5 w-5 text-amber-500" />
              Collect New Student Metrics
            </h3>
            <p className="text-xs text-[#D5C3B5] mt-0.5 font-mono">Scoring calculations and predictive risk will be computed instantly.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-[#3E291F] text-[#D5C3B5] hover:text-white rounded-lg transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-600/40 text-rose-200 rounded-xl flex items-start gap-2 text-xs">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1 */}
          <div>
            <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest block mb-3 font-mono">1. Student Identification</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#D5C3B5] font-semibold mb-1">Student ID (Unique) <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  placeholder="e.g. STU2026115"
                  className="w-full px-3 py-2 bg-[#1C120C] border border-[#4F3529] rounded-xl text-[#F9F3EB] placeholder-[#A89282] focus:outline-none focus:border-amber-500 text-xs transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-[#D5C3B5] font-semibold mb-1">Full Name <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Maria Lopez"
                  className="w-full px-3 py-2 bg-[#1C120C] border border-[#4F3529] rounded-xl text-[#F9F3EB] placeholder-[#A89282] focus:outline-none focus:border-amber-500 text-xs transition-all"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-[#D5C3B5] font-semibold mb-1">Email Address <span className="text-rose-400">*</span></label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. maria.lopez@university.edu"
                  className="w-full px-3 py-2 bg-[#1C120C] border border-[#4F3529] rounded-xl text-[#F9F3EB] placeholder-[#A89282] focus:outline-none focus:border-amber-500 text-xs transition-all"
                  required
                />
              </div>
            </div>
          </div>

          <hr className="border-[#4F3529]" />

          {/* Section 2 */}
          <div>
            <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest block mb-3 font-mono">2. Academic Metrics & Engagement</span>
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
                  <option value="Low" className="bg-[#1C120C]">Low / Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#D5C3B5] font-semibold mb-1">Attendance Rate (%)</label>
                <input
                  type="number"
                  name="attendance"
                  value={formData.attendance}
                  onChange={handleChange}
                  placeholder="e.g. 85"
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-3 py-2 bg-[#1C120C] border border-[#4F3529] rounded-xl text-[#F9F3EB] placeholder-[#A89282] focus:outline-none focus:border-amber-500 text-xs transition-all"
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
                  placeholder="e.g. 72"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 bg-[#1C120C] border border-[#4F3529] rounded-xl text-[#F9F3EB] placeholder-[#A89282] focus:outline-none focus:border-amber-500 text-xs transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-[#D5C3B5] font-semibold mb-1">Overall CGPA (0.0 - 10.0)</label>
                <input
                  type="number"
                  name="cgpa"
                  value={formData.cgpa}
                  onChange={handleChange}
                  placeholder="e.g. 7.5"
                  min="0"
                  max="10"
                  step="0.01"
                  className="w-full px-3 py-2 bg-[#1C120C] border border-[#4F3529] rounded-xl text-[#F9F3EB] placeholder-[#A89282] focus:outline-none focus:border-amber-500 text-xs transition-all"
                  required
                />
              </div>
            </div>
          </div>

          <hr className="border-[#4F3529]" />

          {/* Section 3 */}
          <div>
            <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest block mb-3 font-mono">3. Socioeconomic & Financial Factors</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#D5C3B5] font-semibold mb-1">Annual Household Income ($ USD)</label>
                <input
                  type="number"
                  name="householdIncome"
                  value={formData.householdIncome}
                  onChange={handleChange}
                  placeholder="e.g. 24000"
                  min="0"
                  className="w-full px-3 py-2 bg-[#1C120C] border border-[#4F3529] rounded-xl text-[#F9F3EB] placeholder-[#A89282] focus:outline-none focus:border-amber-500 text-xs transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-[#D5C3B5] font-semibold mb-1">Scholarship Coverage</label>
                {formData.scholarship ? (
                  <select
                    name="scholarshipHistory"
                    value={formData.scholarshipHistory}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-[#1C120C] border border-[#4F3529] rounded-xl text-[#F9F3EB] focus:outline-none focus:border-amber-500 text-xs transition-all cursor-pointer"
                  >
                    <option value="Full Tuition" className="bg-[#1C120C]">Full Tuition Waiver</option>
                    <option value="Partial" className="bg-[#1C120C]">Partial Waiver</option>
                    <option value="Need-based" className="bg-[#1C120C]">Need-Based Assistance</option>
                  </select>
                ) : (
                  <div className="w-full px-3 py-2 bg-[#1C120C]/60 border border-[#4F3529] text-[#A89282] rounded-xl text-xs flex items-center select-none font-mono">
                    Unassigned (Check box to enable)
                  </div>
                )}
              </div>
              <div className="sm:col-span-2 flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  id="scholarship"
                  name="scholarship"
                  checked={formData.scholarship}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-[#4F3529] bg-[#1C120C] text-amber-500 focus:ring-amber-500/50 cursor-pointer"
                />
                <label htmlFor="scholarship" className="text-xs text-[#F9F3EB] font-semibold cursor-pointer select-none">
                  Currently holds a school-sponsored scholarship, grant, or tuition subsidy.
                </label>
              </div>
            </div>
          </div>

          <hr className="border-[#4F3529]" />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 bg-[#261912]">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-xs font-semibold text-[#D5C3B5] hover:text-white bg-[#34221A] hover:bg-[#422C24] border border-[#4F3529] rounded-xl transition duration-200 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Inputs
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-stone-950 bg-amber-500 hover:bg-amber-600 rounded-xl transition duration-200 flex items-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              {loading ? "Processing..." : "Calculate Risk & Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
