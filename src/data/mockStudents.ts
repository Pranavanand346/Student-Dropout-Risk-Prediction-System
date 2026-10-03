import { Student, RiskLevel, EnrollmentStatus } from "../types";

export function calculateStudentRisk(student: Omit<Student, "riskScore" | "riskLevel" | "status" | "createdAt" | "updatedAt">): { riskScore: number; riskLevel: RiskLevel; status: EnrollmentStatus } {
  // 1. CGPA Stress (40% weight - Highest Priority Academic Driver)
  // Healthy boundary >= 7.5. Below 7.5, risk scales up to 100.
  const cgpaStress = student.cgpa < 7.5 
    ? Math.min(100, Math.max(0, ((7.5 - student.cgpa) / 7.5) * 100 * 1.5))
    : 0;

  // 2. Attendance Stress (20% weight - Attendance penalty threshold at 80%)
  // Healthy boundary >= 80%. Below 80%, risk scales up to 100.
  const attendanceStress = student.attendance < 80 
    ? Math.min(100, (80 - student.attendance) * 2.5) 
    : 0;

  // 3. Internal Marks Stress (20% weight - Assessment penalty threshold at 70%)
  // Healthy boundary >= 70%. Below 70%, risk scales up to 100.
  const marksStress = student.internalMarks < 70 
    ? Math.min(100, ((70 - student.internalMarks) / 70) * 100 * 1.4) 
    : 0;

  // 4. Financial Stress (10% weight - Household income & grant support)
  // Healthy boundary >= $45,000 or active scholarship grant.
  let financialStress = 0;
  if (student.householdIncome < 15000) {
    financialStress = student.scholarship ? 35 : 100;
  } else if (student.householdIncome < 30000) {
    financialStress = student.scholarship ? 20 : 70;
  } else if (student.householdIncome < 45000) {
    financialStress = student.scholarship ? 5 : 40;
  } else {
    financialStress = 0;
  }

  // 5. Engagement Stress (10% weight - Co-curricular campus activity)
  // Healthy boundary = High or Medium engagement.
  let engagementStress = 0;
  if (student.engagement === "Low") {
    engagementStress = 100;
  } else {
    engagementStress = 0;
  }

  // Calculate Weighted Risk Score based on parameter importance:
  // CGPA: 40%, Attendance: 20%, Internal Marks: 20%, Household Income: 10%, Engagement: 10%
  const rawScore = 
    (cgpaStress * 0.40) + 
    (attendanceStress * 0.20) + 
    (marksStress * 0.20) + 
    (financialStress * 0.10) + 
    (engagementStress * 0.10);

  const riskScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Calibrated Risk Level Classifications
  let riskLevel: RiskLevel = "Low";
  let status: EnrollmentStatus = "Enrolled";

  if (riskScore >= 45) {
    riskLevel = "High";
    status = "Risk of Dropout";
  } else if (riskScore >= 25) {
    riskLevel = "Medium";
    status = "Active";
  } else {
    riskLevel = "Low";
    status = "Enrolled";
  }

  return { riskScore, riskLevel, status };
}

export interface StudentRiskFactor {
  name: string;
  key: "attendance" | "cgpa" | "marks" | "financial" | "engagement";
  inputValue: string;
  isRiskFactor: boolean; // true ONLY if feature value increases risk
  riskContribution: number; // 0 if healthy, >0 if contributing to risk
  percentageShare: number; // Share of total active risk contribution
  statusLabel: "Healthy" | "Risk Factor";
  driverLabel: string;
  barBlocks: string;
}

export interface StudentRiskAnalysis {
  riskScore: number;
  riskLevel: RiskLevel;
  status: EnrollmentStatus;
  stateCategory: "LOW RISK" | "MODERATE RISK" | "HIGH RISK";
  title: string; // "No significant risk drivers identified." | "Potential risk factors identified." | "Significant contributing risk factors identified."
  primaryDriver: string; // e.g. "Low Attendance (55%)" or "No significant risk drivers identified."
  activeRiskDrivers: StudentRiskFactor[];
  allFactors: StudentRiskFactor[];
}

export function getStudentRiskAnalysis(student: Omit<Student, "riskScore" | "riskLevel" | "status" | "createdAt" | "updatedAt">): StudentRiskAnalysis {
  // Compute overall risk score using calibrated multi-factor model
  const { riskScore, riskLevel, status } = calculateStudentRisk(student);

  // Calculate individual feature risk contribution (0 if healthy, >0 if contributing to risk)
  
  // 1. Attendance: Healthy boundary >= 80%
  const attVal = student.attendance;
  const attRiskContrib = attVal < 80 ? (80 - attVal) * 2.5 : 0;
  
  // 2. CGPA: Healthy boundary >= 7.5
  const cgpaVal = student.cgpa;
  const cgpaRiskContrib = cgpaVal < 7.5 ? ((7.5 - cgpaVal) / 7.5) * 100 * 1.5 : 0;

  // 3. Internal Marks: Healthy boundary >= 70%
  const marksVal = student.internalMarks;
  const marksRiskContrib = marksVal < 70 ? ((70 - marksVal) / 70) * 100 * 1.4 : 0;

  // 4. Household Income: Healthy boundary >= $45,000 or active scholarship
  const incomeVal = student.householdIncome;
  let incomeRiskContrib = 0;
  if (incomeVal < 15000) {
    incomeRiskContrib = student.scholarship ? 35 : 100;
  } else if (incomeVal < 30000) {
    incomeRiskContrib = student.scholarship ? 20 : 70;
  } else if (incomeVal < 45000) {
    incomeRiskContrib = student.scholarship ? 5 : 40;
  }

  // 5. Engagement: Healthy boundary = High or Medium
  const engVal = student.engagement;
  const engRiskContrib = engVal === "Low" ? 50 : 0;

  const rawFactors = [
    {
      name: "Attendance Percentage",
      key: "attendance" as const,
      inputValue: `${attVal}%`,
      isRiskFactor: attRiskContrib > 0,
      riskContribution: attRiskContrib,
      statusLabel: (attRiskContrib > 0 ? "Risk Factor" : "Healthy") as "Healthy" | "Risk Factor",
      driverLabel: `Low Attendance (${attVal}%)`,
    },
    {
      name: "Overall CGPA",
      key: "cgpa" as const,
      inputValue: `${cgpaVal} / 10`,
      isRiskFactor: cgpaRiskContrib > 0,
      riskContribution: cgpaRiskContrib,
      statusLabel: (cgpaRiskContrib > 0 ? "Risk Factor" : "Healthy") as "Healthy" | "Risk Factor",
      driverLabel: `Low Overall CGPA (${cgpaVal}/10)`,
    },
    {
      name: "Internal Marks",
      key: "marks" as const,
      inputValue: `${marksVal}%`,
      isRiskFactor: marksRiskContrib > 0,
      riskContribution: marksRiskContrib,
      statusLabel: (marksRiskContrib > 0 ? "Risk Factor" : "Healthy") as "Healthy" | "Risk Factor",
      driverLabel: `Low Internal Marks (${marksVal}%)`,
    },
    {
      name: "Household Income",
      key: "financial" as const,
      inputValue: `$${incomeVal.toLocaleString()}`,
      isRiskFactor: incomeRiskContrib > 0,
      riskContribution: incomeRiskContrib,
      statusLabel: (incomeRiskContrib > 0 ? "Risk Factor" : "Healthy") as "Healthy" | "Risk Factor",
      driverLabel: `Financial Stress ($${incomeVal.toLocaleString()})`,
    },
    {
      name: "Campus Engagement",
      key: "engagement" as const,
      inputValue: engVal,
      isRiskFactor: engRiskContrib > 0,
      riskContribution: engRiskContrib,
      statusLabel: (engRiskContrib > 0 ? "Risk Factor" : "Healthy") as "Healthy" | "Risk Factor",
      driverLabel: `Low Campus Engagement (${engVal})`,
    }
  ];

  const activeRiskDrivers = rawFactors.filter(f => f.isRiskFactor);
  const totalActiveContrib = activeRiskDrivers.reduce((acc, f) => acc + f.riskContribution, 0);

  const maxBlocks = 24;
  const allFactors: StudentRiskFactor[] = rawFactors.map(f => {
    const share = (f.isRiskFactor && totalActiveContrib > 0)
      ? Math.round((f.riskContribution / totalActiveContrib) * 100)
      : 0;
    
    const numBlocks = Math.max(0, Math.round((share / 100) * maxBlocks));
    const barBlocks = f.isRiskFactor ? "█".repeat(numBlocks) : "";

    return {
      name: f.name,
      key: f.key,
      inputValue: f.inputValue,
      isRiskFactor: f.isRiskFactor,
      riskContribution: f.riskContribution,
      percentageShare: share,
      statusLabel: f.statusLabel,
      driverLabel: f.driverLabel,
      barBlocks
    };
  });

  // Sort active risk drivers by highest risk contribution
  activeRiskDrivers.sort((a, b) => b.riskContribution - a.riskContribution);

  let title = "No significant risk drivers identified.";
  let stateCategory: "LOW RISK" | "MODERATE RISK" | "HIGH RISK" = "LOW RISK";
  let primaryDriver = "No significant risk drivers identified.";

  if (riskLevel === "High" || (riskScore >= 45 && activeRiskDrivers.length > 0)) {
    stateCategory = "HIGH RISK";
    title = "Significant contributing risk factors identified.";
    primaryDriver = activeRiskDrivers.length > 0 ? activeRiskDrivers[0].driverLabel : "High Overall Risk Score";
  } else if (riskLevel === "Medium" || activeRiskDrivers.length > 0) {
    stateCategory = "MODERATE RISK";
    title = "Potential risk factors identified.";
    primaryDriver = activeRiskDrivers.length > 0 ? activeRiskDrivers[0].driverLabel : "Moderate Operational Watchlist";
  } else {
    stateCategory = "LOW RISK";
    title = "No significant risk drivers identified.";
    primaryDriver = "No significant risk drivers identified.";
  }

  return {
    riskScore,
    riskLevel,
    status,
    stateCategory,
    title,
    primaryDriver,
    activeRiskDrivers: activeRiskDrivers.map(f => {
      const share = totalActiveContrib > 0 ? Math.round((f.riskContribution / totalActiveContrib) * 100) : 0;
      const numBlocks = Math.max(1, Math.round((share / 100) * maxBlocks));
      return { 
        ...f, 
        percentageShare: share,
        barBlocks: "█".repeat(numBlocks)
      } as StudentRiskFactor;
    }),
    allFactors
  };
}

// Backwards compatibility helper
export function getParameterStressAnalysis(student: Omit<Student, "riskScore" | "riskLevel" | "status" | "createdAt" | "updatedAt">) {
  const analysis = getStudentRiskAnalysis(student);
  return {
    factors: analysis.allFactors,
    primaryDriver: {
      name: analysis.primaryDriver,
      weightPct: 40,
      weightedScore: 0,
      rawValue: analysis.primaryDriver
    },
    cgpaWeighted: 0,
    attendanceWeighted: 0,
    marksWeighted: 0,
    financialWeighted: 0,
    engagementWeighted: 0
  };
}

export function getUniqueStudentSuggestions(student: Omit<Student, "riskScore" | "riskLevel" | "status" | "createdAt" | "updatedAt">) {
  const analysis = getStudentRiskAnalysis(student);
  const suggestions: string[] = [];

  // Generate recommendations STRICTLY from actual identified risk factors
  analysis.activeRiskDrivers.forEach(factor => {
    if (factor.key === "attendance") {
      suggestions.push(`Attendance Monitoring & Mentoring: Establish an academic check-in agreement to address attendance barriers and elevate attendance from ${student.attendance}% toward target 80%+.`);
    } else if (factor.key === "cgpa") {
      suggestions.push(`Remedial Subject Coaching: Enroll ${student.name.split(" ")[0]} in 1-on-1 subject tutoring to improve Cumulative GPA from ${student.cgpa} toward target 7.5+.`);
    } else if (factor.key === "marks") {
      suggestions.push(`Assessment Remediation: Provide continuous assessment workshops for internal marks (${student.internalMarks}%).`);
    } else if (factor.key === "financial") {
      suggestions.push(`Financial Aid & Grant Referral: Refer for institutional tuition grant or emergency stipend ($${student.householdIncome.toLocaleString()} annual household income).`);
    } else if (factor.key === "engagement") {
      suggestions.push(`Peer Engagement Mentoring: Connect with senior peer mentor and department student chapter to raise low campus engagement.`);
    }
  });

  // If NO risk factors exist, display no intervention required
  if (suggestions.length === 0) {
    suggestions.push("No immediate intervention required. Continue regular monitoring.");
  }

  return {
    primaryDriver: analysis.primaryDriver,
    suggestions,
    analysis
  };
}

// Generate high quality mock students
const rawMockStudentsData = [
  {
    id: "1",
    studentId: "STU2026001",
    name: "Alex Rivera",
    email: "alex.rivera@university.edu",
    department: "Computer Science",
    academicYear: "Sophomore" as const,
    attendance: 58,
    internalMarks: 42,
    cgpa: 5.2,
    householdIncome: 12000,
    scholarship: false,
    scholarshipHistory: "None" as const,
    engagement: "Low" as const,
  },
  {
    id: "2",
    studentId: "STU2026002",
    name: "Elena Rostova",
    email: "elena.rostova@university.edu",
    department: "Electrical Eng",
    academicYear: "Freshman" as const,
    attendance: 94,
    internalMarks: 88,
    cgpa: 9.1,
    householdIncome: 75000,
    scholarship: true,
    scholarshipHistory: "Full Tuition" as const,
    engagement: "High" as const,
  },
  {
    id: "3",
    studentId: "STU2026003",
    name: "Marcus Vance",
    email: "marcus.vance@university.edu",
    department: "Mechanical Eng",
    academicYear: "Junior" as const,
    attendance: 72,
    internalMarks: 58,
    cgpa: 6.8,
    householdIncome: 28000,
    scholarship: true,
    scholarshipHistory: "Partial" as const,
    engagement: "Medium" as const,
  },
  {
    id: "4",
    studentId: "STU2026004",
    name: "Sarah Jenkins",
    email: "sarah.jenkins@university.edu",
    department: "Computer Science",
    academicYear: "Senior" as const,
    attendance: 85,
    internalMarks: 76,
    cgpa: 7.9,
    householdIncome: 45000,
    scholarship: false,
    scholarshipHistory: "None" as const,
    engagement: "High" as const,
  },
  {
    id: "5",
    studentId: "STU2026005",
    name: "Carlos Gomez",
    email: "carlos.gomez@university.edu",
    department: "Business Ad",
    academicYear: "Sophomore" as const,
    attendance: 48,
    internalMarks: 51,
    cgpa: 4.8,
    householdIncome: 18000,
    scholarship: true,
    scholarshipHistory: "Need-based" as const,
    engagement: "Low" as const,
  },
  {
    id: "6",
    studentId: "STU2026006",
    name: "Maya Lin",
    email: "maya.lin@university.edu",
    department: "Computer Science",
    academicYear: "Freshman" as const,
    attendance: 98,
    internalMarks: 95,
    cgpa: 9.6,
    householdIncome: 110000,
    scholarship: false,
    scholarshipHistory: "None" as const,
    engagement: "High" as const,
  },
  {
    id: "7",
    studentId: "STU2026007",
    name: "David Kim",
    email: "david.kim@university.edu",
    department: "Electrical Eng",
    academicYear: "Sophomore" as const,
    attendance: 79,
    internalMarks: 65,
    cgpa: 7.1,
    householdIncome: 32000,
    scholarship: false,
    scholarshipHistory: "None" as const,
    engagement: "Medium" as const,
  },
  {
    id: "8",
    studentId: "STU2026008",
    name: "Jordan Taylor",
    email: "jordan.taylor@university.edu",
    department: "Business Ad",
    academicYear: "Junior" as const,
    attendance: 62,
    internalMarks: 45,
    cgpa: 5.9,
    householdIncome: 14000,
    scholarship: false,
    scholarshipHistory: "None" as const,
    engagement: "Low" as const,
  },
  {
    id: "9",
    studentId: "STU2026009",
    name: "Amara Diallo",
    email: "amara.diallo@university.edu",
    department: "Mechanical Eng",
    academicYear: "Senior" as const,
    attendance: 91,
    internalMarks: 82,
    cgpa: 8.4,
    householdIncome: 55000,
    scholarship: true,
    scholarshipHistory: "Partial" as const,
    engagement: "Medium" as const,
  },
  {
    id: "10",
    studentId: "STU2026010",
    name: "Ryan Gallagher",
    email: "ryan.gallagher@university.edu",
    department: "Business Ad",
    academicYear: "Freshman" as const,
    attendance: 70,
    internalMarks: 60,
    cgpa: 6.2,
    householdIncome: 24000,
    scholarship: true,
    scholarshipHistory: "Partial" as const,
    engagement: "Low" as const,
  }
];

export const mockStudents: Student[] = rawMockStudentsData.map((data) => {
  const { riskScore, riskLevel, status } = calculateStudentRisk(data);
  return {
    ...data,
    riskScore,
    riskLevel,
    status,
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };
});
