import React from "react";
import { 
  Users, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  BookOpen, 
  TrendingUp, 
  GraduationCap,
  ArrowRight,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { EdaStats, Student } from "../types";
import { motion } from "motion/react";

interface DashboardStatsProps {
  stats: EdaStats;
  onNavigateToTab: (tab: string) => void;
  students?: Student[];
}

export default function DashboardStats({ stats, onNavigateToTab, students = [] }: DashboardStatsProps) {
  const pieData = [
    { name: "Low Risk", value: stats.lowRiskCount },
    { name: "Medium Risk", value: stats.mediumRiskCount },
    { name: "High Risk", value: stats.highRiskCount },
  ].filter(d => d.value > 0);

  const topHighRiskStudents = students
    .filter(s => s.riskLevel === "High")
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 4);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
      id="dashboard-stats-root"
    >
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-[#261912] border border-[#4F3529] backdrop-blur-xl rounded-2xl shadow-xl">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#F9F3EB] flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-amber-500" />
            Faculty Oversight & Dropout Risk Dashboard
          </h2>
          <p className="text-[#D5C3B5] text-xs mt-1">
            Predictive modeling and automated academic interventions for student retention.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => onNavigateToTab("students")}
            className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl transition duration-200 shadow-md shadow-amber-500/20 cursor-pointer"
          >
            Review Students
          </button>
          <button 
            onClick={() => onNavigateToTab("workbench")}
            className="px-4 py-2 text-xs font-semibold bg-[#34221A] hover:bg-[#422C24] text-[#F9F3EB] border border-[#4F3529] rounded-xl transition duration-200 cursor-pointer"
          >
            Data Pipeline
          </button>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <motion.div 
          variants={itemVariants}
          className="p-5 bg-[#261912] border border-[#4F3529] rounded-2xl hover:border-amber-500 hover:shadow-lg transition-all duration-300 relative overflow-hidden group shadow-md"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-25 group-hover:scale-110 transition-all duration-300">
            <Users className="h-16 w-16 text-amber-500" />
          </div>
          <p className="text-amber-500 text-xs font-bold uppercase tracking-widest font-mono">Active Cohort</p>
          <p className="text-3xl font-extrabold text-[#F9F3EB] mt-2 leading-none">{stats.totalStudents}</p>
          <div className="flex items-center gap-1.5 mt-3 text-xs text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-lg w-max border border-amber-800/60 font-semibold font-mono">
            <TrendingUp className="h-3.5 w-3.5" />
            Active Enrollment
          </div>
        </motion.div>

        {/* High Risk Count */}
        <motion.div 
          variants={itemVariants}
          className="p-5 bg-[#261912] border border-rose-900/60 rounded-2xl hover:border-rose-600 hover:shadow-lg transition-all duration-300 relative overflow-hidden group shadow-md"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-25 group-hover:scale-110 transition-all duration-300">
            <ShieldAlert className="h-16 w-16 text-rose-500" />
          </div>
          <p className="text-rose-400 text-xs font-bold uppercase tracking-widest font-mono">High Risk Score</p>
          <p className="text-3xl font-extrabold text-[#F9F3EB] mt-2 leading-none">{stats.highRiskCount}</p>
          <div className="flex items-center gap-1.5 mt-3 text-xs text-rose-300 bg-rose-950/80 px-2.5 py-1 rounded-lg w-max border border-rose-800/80 font-semibold font-mono">
            <AlertTriangle className="h-3.5 w-3.5" />
            Needs Intervention
          </div>
        </motion.div>

        {/* Medium Risk Count */}
        <motion.div 
          variants={itemVariants}
          className="p-5 bg-[#261912] border border-amber-900/60 rounded-2xl hover:border-amber-500 hover:shadow-lg transition-all duration-300 relative overflow-hidden group shadow-md"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-25 group-hover:scale-110 transition-all duration-300">
            <AlertTriangle className="h-16 w-16 text-amber-500" />
          </div>
          <p className="text-amber-400 text-xs font-bold uppercase tracking-widest font-mono">Moderate Risk</p>
          <p className="text-3xl font-extrabold text-[#F9F3EB] mt-2 leading-none">{stats.mediumRiskCount}</p>
          <div className="flex items-center gap-1.5 mt-3 text-xs text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-lg w-max border border-amber-800/80 font-semibold font-mono">
            <AlertTriangle className="h-3.5 w-3.5" />
            Watchlist Active
          </div>
        </motion.div>

        {/* Average Attendance */}
        <motion.div 
          variants={itemVariants}
          className="p-5 bg-[#261912] border border-emerald-900/60 rounded-2xl hover:border-emerald-600 hover:shadow-lg transition-all duration-300 relative overflow-hidden group shadow-md"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-25 group-hover:scale-110 transition-all duration-300">
            <BookOpen className="h-16 w-16 text-emerald-500" />
          </div>
          <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest font-mono">Avg Attendance</p>
          <p className="text-3xl font-extrabold text-[#F9F3EB] mt-2 leading-none">{stats.averageAttendance}%</p>
          <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-lg w-max border border-emerald-800/80 font-semibold font-mono">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Cohorts Enrolled
          </div>
        </motion.div>
      </div>

      {/* Primary Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Risk Distribution Chart */}
        <motion.div 
          variants={itemVariants}
          className="lg:col-span-4 p-5 bg-[#261912] border border-[#4F3529] rounded-2xl flex flex-col justify-between shadow-md"
        >
          <div>
            <h3 className="text-md font-bold text-[#F9F3EB]">Cohort Risk Proportions</h3>
            <p className="text-xs text-[#D5C3B5] mt-1">Breakdown of the overall student cohort risk index.</p>
          </div>
          <div className="h-56 mt-4 flex items-center justify-center relative">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => {
                      let color = "#10b981"; // Low (Emerald)
                      if (entry.name === "Medium Risk") color = "#f59e0b"; // Medium (Golden Yellow)
                      if (entry.name === "High Risk") color = "#f43f5e"; // High (Rose)
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#2E1E17", 
                      borderColor: "#5A3C2F",
                      borderRadius: "12px",
                      color: "#F9F3EB",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.5)"
                    }} 
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-[#F9F3EB] font-bold">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-[#D5C3B5] text-sm">No student records compiled.</p>
            )}
          </div>
        </motion.div>

        {/* Department Breakdown Chart */}
        <motion.div 
          variants={itemVariants}
          className="lg:col-span-8 p-5 bg-[#261912] border border-[#4F3529] rounded-2xl flex flex-col justify-between shadow-md"
        >
          <div>
            <h3 className="text-md font-bold text-[#F9F3EB]">Risk Projections by Academic Department</h3>
            <p className="text-xs text-[#D5C3B5] mt-1">Distribution of risk profiles grouped by student major.</p>
          </div>
          <div className="h-56 mt-4">
            {stats.departmentRiskDistribution && stats.departmentRiskDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.departmentRiskDistribution}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#4F3529" />
                  <XAxis 
                    dataKey="department" 
                    stroke="#D5C3B5" 
                    fontSize={11} 
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#D5C3B5" 
                    fontSize={11} 
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: "#2E1E17", 
                      borderColor: "#5A3C2F",
                      borderRadius: "12px",
                      color: "#F9F3EB",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.5)"
                    }}
                  />
                  <Legend 
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-[#F9F3EB] font-bold capitalize">{value}</span>}
                  />
                  <Bar dataKey="low" name="Low Risk" stackId="a" fill="#10b981" />
                  <Bar dataKey="medium" name="Medium Risk" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="high" name="High Risk" stackId="a" fill="#f43f5e" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-[#D5C3B5] text-sm">No student records compiled.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Immediate Intervention Watchlist */}
      {topHighRiskStudents.length > 0 && (
        <motion.div variants={itemVariants} className="p-5 bg-[#261912] border border-[#4F3529] rounded-2xl shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-500" />
              <h3 className="text-sm font-bold text-[#F9F3EB]">Critical Action Watchlist (High Risk Students)</h3>
            </div>
            <button
              onClick={() => onNavigateToTab("students")}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              View Full Risk Directory
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {topHighRiskStudents.map(student => (
              <div 
                key={student.id}
                onClick={() => onNavigateToTab("students")}
                className="p-3.5 bg-[#1C120C] border border-rose-900/40 hover:border-rose-500 rounded-xl transition cursor-pointer group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F9F3EB] group-hover:text-amber-400 transition">{student.name}</span>
                  <span className="px-2 py-0.5 bg-rose-950 text-rose-400 border border-rose-800 rounded text-[9px] font-bold font-mono">
                    {student.riskScore}% Risk
                  </span>
                </div>
                <p className="text-[10px] text-[#D5C3B5] font-mono">{student.department} • CGPA {student.cgpa}</p>
                <div className="text-[10px] text-amber-500 flex items-center gap-1 font-semibold pt-1 border-t border-[#4F3529]">
                  <Sparkles className="h-3 w-3" />
                  Generate AI Retention Blueprint
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Secondary Metrics / Sub-Oversight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          variants={itemVariants}
          className="p-5 bg-[#261912] border border-[#4F3529] rounded-2xl shadow-md"
        >
          <h4 className="text-sm font-bold text-[#F9F3EB]">Predictive Factor Weighting</h4>
          <p className="text-xs text-[#D5C3B5] mt-0.5">How risk components accumulate:</p>
          <div className="space-y-3 mt-4">
            <div>
              <div className="flex justify-between text-xs text-[#F9F3EB] font-semibold mb-1">
                <span>Attendance Weight</span>
                <span className="text-amber-400 font-bold font-mono">35%</span>
              </div>
              <div className="h-1.5 bg-[#1C120C] rounded-full overflow-hidden border border-[#4F3529]">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "35%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-[#F9F3EB] font-semibold mb-1">
                <span>Cumulative GPA</span>
                <span className="text-amber-400 font-bold font-mono">25%</span>
              </div>
              <div className="h-1.5 bg-[#1C120C] rounded-full overflow-hidden border border-[#4F3529]">
                <div className="h-full bg-amber-500 rounded-full animate-pulse" style={{ width: "25%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-[#F9F3EB] font-semibold mb-1">
                <span>Internal Marks / Continuous Assessments</span>
                <span className="text-amber-400 font-bold font-mono">15%</span>
              </div>
              <div className="h-1.5 bg-[#1C120C] rounded-full overflow-hidden border border-[#4F3529]">
                <div className="h-full bg-amber-600 rounded-full" style={{ width: "15%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-[#F9F3EB] font-semibold mb-1">
                <span>Household Income & Financial Stress</span>
                <span className="text-amber-400 font-bold font-mono">15%</span>
              </div>
              <div className="h-1.5 bg-[#1C120C] rounded-full overflow-hidden border border-[#4F3529]">
                <div className="h-full bg-amber-700 rounded-full" style={{ width: "15%" }} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Key Retaining Suggestions */}
        <motion.div 
          variants={itemVariants}
          className="md:col-span-2 p-5 bg-[#261912] border border-[#4F3529] rounded-2xl flex flex-col justify-between shadow-md"
        >
          <div>
            <h4 className="text-sm font-bold text-amber-400">Active Retaining Protocols</h4>
            <p className="text-xs text-[#D5C3B5] mt-0.5">Academic interventions recommended for high risk factors:</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="p-3 bg-[#1C120C] rounded-xl border border-[#4F3529] hover:border-amber-500 transition-all duration-200">
                <span className="text-xs font-bold text-amber-400">Attendance Interventions</span>
                <p className="text-[11px] text-[#D5C3B5] mt-1">Automatic alert triggers when lectures drop under 75% thresholds.</p>
              </div>
              <div className="p-3 bg-[#1C120C] rounded-xl border border-[#4F3529] hover:border-amber-500 transition-all duration-200">
                <span className="text-xs font-bold text-amber-400">Financial Aid Referrals</span>
                <p className="text-[11px] text-[#D5C3B5] mt-1">Direct linkage to scholarship committees for students below $20k annual income.</p>
              </div>
              <div className="p-3 bg-[#1C120C] rounded-xl border border-[#4F3529] hover:border-amber-500 transition-all duration-200">
                <span className="text-xs font-bold text-amber-400">Tutoring & PASS Enrolments</span>
                <p className="text-[11px] text-[#D5C3B5] mt-1">Assigned peer study coordinators for students with GPAs under 6.0 thresholds.</p>
              </div>
              <div className="p-3 bg-[#1C120C] rounded-xl border border-[#4F3529] hover:border-amber-500 transition-all duration-200">
                <span className="text-xs font-bold text-amber-400">Personalized AI Action Plans</span>
                <p className="text-[11px] text-[#D5C3B5] mt-1">Real-time customized root cause evaluations powered by Gemini LLM server-side.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
