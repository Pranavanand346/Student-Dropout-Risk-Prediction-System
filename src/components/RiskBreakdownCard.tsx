import React from "react";
import { Student } from "../types";
import { HelpCircle, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";
import { getStudentRiskAnalysis } from "../data/mockStudents";

interface RiskBreakdownCardProps {
  student: Student;
  className?: string;
}

export default function RiskBreakdownCard({ student, className = "" }: RiskBreakdownCardProps) {
  const analysis = getStudentRiskAnalysis(student);

  return (
    <div className={`p-5 bg-gradient-to-br from-[#2B1D13] via-[#24170E] to-[#1C120C] border border-amber-500/40 rounded-2xl shadow-[0_8px_30px_rgba(245,158,11,0.12)] text-[#F9F3EB] relative overflow-hidden font-sans ${className}`}>
      
      {/* Background Glow Accents */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none select-none" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-yellow-600/10 rounded-full blur-2xl pointer-events-none select-none" />

      {/* Header Badge & Title */}
      <div className="flex items-center justify-between border-b border-amber-500/30 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/20 border border-amber-400/50 rounded-xl text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <HelpCircle className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-extrabold tracking-tight text-amber-300 flex items-center gap-2 font-sans">
              <span>Why is this student at risk?</span>
            </h3>
            <p className="text-[10px] text-[#D5C3B5] font-mono font-semibold">
              {analysis.title}
            </p>
          </div>
        </div>

        {/* Overall Risk Score Badge */}
        <div className="px-3 py-1 bg-amber-500/15 border border-amber-400/50 rounded-xl text-amber-300 font-mono text-xs font-extrabold flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
          <span>{analysis.riskLevel} Risk — {analysis.riskScore}%</span>
        </div>
      </div>

      {/* Risk Factors Matrix */}
      <div className="space-y-3.5 my-4 font-mono">
        {analysis.allFactors.map((factor) => (
          <div key={factor.key} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1.5 group">
            
            {/* Parameter Name & Input Value */}
            <div className="w-full sm:w-52 flex items-center justify-between sm:justify-start gap-2">
              <span className="text-[#F5E6D3] font-semibold text-xs truncate">
                {factor.name}
              </span>
              <span className="text-[10px] text-[#A89282] font-semibold bg-[#1C120C] px-1.5 py-0.5 rounded border border-[#4F3529]">
                {factor.inputValue}
              </span>
            </div>

            {/* Block Progress Bar or Healthy Badge */}
            <div className="flex-1 flex items-center gap-3">
              <div className="flex-1 bg-[#150D08] border border-amber-900/40 rounded-md px-2 py-1 flex items-center overflow-hidden h-7">
                {factor.isRiskFactor ? (
                  <span 
                    className="text-amber-400 text-xs font-bold tracking-tighter transition-all duration-300 select-none"
                    style={{ textShadow: "0 0 10px rgba(245,158,11,0.5)" }}
                  >
                    {factor.barBlocks}
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-emerald-400/90 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    Healthy / Within Safe Operational Range
                  </span>
                )}
              </div>

              {/* Share Percentage Badge */}
              <div className="w-12 text-right">
                {factor.isRiskFactor ? (
                  <span className="text-amber-300 font-extrabold text-xs">
                    {factor.percentageShare}%
                  </span>
                ) : (
                  <span className="text-emerald-400/70 font-semibold text-[10px]">
                    0%
                  </span>
                )}
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Primary Risk Driver Callout (Golden Footer) */}
      <div className="mt-5 pt-3.5 border-t border-amber-500/30">
        <div className="p-3 bg-amber-500/10 border border-amber-400/40 rounded-xl flex items-center gap-2.5 shadow-inner">
          <Sparkles className="h-4 w-4 text-amber-400 shrink-0 animate-spin" style={{ animationDuration: '6s' }} />
          <div className="text-xs font-mono">
            <span className="text-[#D5C3B5]">Primary Risk Driver: </span>
            <span className={`font-extrabold underline underline-offset-4 ${analysis.activeRiskDrivers.length > 0 ? "text-amber-300 decoration-amber-500/50" : "text-emerald-300 decoration-emerald-500/50"}`}>
              {analysis.primaryDriver}.
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
