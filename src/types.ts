export type RiskLevel = "Low" | "Medium" | "High";

export type EngagementLevel = "Low" | "Medium" | "High";

export type EnrollmentStatus = "Active" | "Enrolled" | "On Leave" | "Risk of Dropout";

export interface Student {
  id: string;
  studentId: string;
  name: string;
  email: string;
  department: string;
  academicYear: "Freshman" | "Sophomore" | "Junior" | "Senior";
  attendance: number;       // Percentage (0 - 100)
  internalMarks: number;    // Marks percentage (0 - 100)
  cgpa: number;             // 0.0 to 10.0
  householdIncome: number;  // Annual in USD
  scholarship: boolean;
  scholarshipHistory: "Full Tuition" | "Partial" | "Need-based" | "None";
  engagement: EngagementLevel;
  riskScore: number;        // Percentage probability (0 - 100)
  riskLevel: RiskLevel;
  status: EnrollmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DataCleaningLog {
  id: string;
  timestamp: string;
  type: "INFO" | "WARNING" | "CLEAN" | "SYNC";
  message: string;
}

export interface CorrelationPoint {
  x: number; // e.g. Attendance or CGPA
  y: number; // Risk Score
  name: string;
  level: RiskLevel;
}

export interface IncomeDistributionPoint {
  range: string;
  "Low Risk": number;
  "Medium Risk": number;
  "High Risk": number;
}

export interface ConfusionMatrix {
  truePositive: number;
  falsePositive: number;
  trueNegative: number;
  falseNegative: number;
}

export interface FeatureWeight {
  feature: string;
  weight: number;
  impact: string;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: ConfusionMatrix;
  featureWeights: FeatureWeight[];
}

export interface EdaStats {
  totalStudents: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  averageAttendance: number;
  averageCgpa: number;
  averageMarks: number;
  correlationAttendanceRisk: number;
  correlationCgpaRisk: number;
  incomeRiskDistribution: IncomeDistributionPoint[];
  departmentRiskDistribution: { department: string; high: number; medium: number; low: number }[];
  modelMetrics: ModelMetrics;
}

export interface InterventionPlan {
  rootCauses: string[];
  retainingStrategies: string[];
  encouragementMessage: string;
  generatedAt: string;
}

export interface DatabaseSyncState {
  isSyncing: boolean;
  lastSyncedAt: string | null;
  syncSource: string;
  autoSyncEnabled: boolean;
  connected: boolean;
}
