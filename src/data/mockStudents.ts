import { Student, RiskLevel, EnrollmentStatus } from "../types";

export function calculateStudentRisk(student: Omit<Student, "riskScore" | "riskLevel" | "status" | "createdAt" | "updatedAt">): { riskScore: number; riskLevel: RiskLevel; status: EnrollmentStatus } {
  // 1. Attendance Stress (35% weight)
  const attendanceStress = 100 - student.attendance;

  // 2. CGPA Stress (25% weight) - Scale CGPA (0-10) to (0-100) stress
  const cgpaStress = Math.max(0, (10 - student.cgpa) * 10);

  // 3. Internal Marks Stress (15% weight)
  const marksStress = 100 - student.internalMarks;

  // 4. Financial Stress (15% weight)
  let financialStress = 0;
  if (student.householdIncome < 15000) {
    financialStress = student.scholarship ? 40 : 100;
  } else if (student.householdIncome < 35000) {
    financialStress = student.scholarship ? 20 : 70;
  } else if (student.householdIncome < 60000) {
    financialStress = student.scholarship ? 10 : 40;
  } else {
    financialStress = 0;
  }

  // 5. Engagement Stress (10% weight)
  let engagementStress = 0;
  if (student.engagement === "Low") {
    engagementStress = 100;
  } else if (student.engagement === "Medium") {
    engagementStress = 40;
  } else {
    engagementStress = 0;
  }

  // Calculate Weighted Risk Score
  const rawScore = 
    (attendanceStress * 0.35) + 
    (cgpaStress * 0.25) + 
    (marksStress * 0.15) + 
    (financialStress * 0.15) + 
    (engagementStress * 0.10);

  const riskScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Risk Level Classifications
  let riskLevel: RiskLevel = "Low";
  let status: EnrollmentStatus = "Active";

  if (riskScore >= 65) {
    riskLevel = "High";
    status = "Risk of Dropout";
  } else if (riskScore >= 35) {
    riskLevel = "Medium";
    status = "Active"; // Or Enrolled
  } else {
    riskLevel = "Low";
    status = "Enrolled";
  }

  return { riskScore, riskLevel, status };
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
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(), // 30 days ago
    updatedAt: new Date().toISOString(),
  };
});
