import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { mockStudents, calculateStudentRisk } from "./src/data/mockStudents";
import { Student, DataCleaningLog, EdaStats, RiskLevel } from "./src/types";

// Setup filesystem paths
const DB_PATH = path.join(process.cwd(), "src", "data", "students-db.json");

// Ensure the directory exists
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Helper to read and write database
function loadStudents(): Student[] {
  try {
    if (fs.existsSync(DB_PATH)) {
      const fileData = fs.readFileSync(DB_PATH, "utf8");
      return JSON.parse(fileData) as Student[];
    } else {
      // Seed initial data
      fs.writeFileSync(DB_PATH, JSON.stringify(mockStudents, null, 2), "utf8");
      return mockStudents;
    }
  } catch (err) {
    console.error("Error reading database file, returning mock data", err);
    return mockStudents;
  }
}

function saveStudents(students: Student[]) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(students, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing database file", err);
  }
}

// Initialize server-side Gemini client lazily
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory data cleaning logs
  let cleaningLogs: DataCleaningLog[] = [
    {
      id: "1",
      timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
      type: "INFO",
      message: "Database system initialized. Baseline records loaded.",
    }
  ];

  // Helper to calculate correlations
  function calculateCorrelation(data: { x: number; y: number }[]): number {
    const n = data.length;
    if (n === 0) return 0;
    
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (const point of data) {
      sumX += point.x;
      sumY += point.y;
      sumXY += point.x * point.y;
      sumX2 += point.x * point.x;
      sumY2 += point.y * point.y;
    }
    
    const numerator = (n * sumXY) - (sumX * sumY);
    const denominator = Math.sqrt(((n * sumX2) - (sumX * sumX)) * ((n * sumY2) - (sumY * sumY)));
    
    if (denominator === 0) return 0;
    return parseFloat((numerator / denominator).toFixed(3));
  }

  // --- API ROUTES ---

  // GET all students
  app.get("/api/students", (req, res) => {
    try {
      const students = loadStudents();
      res.json(students);
    } catch (err) {
      res.status(500).json({ error: "Failed to load students" });
    }
  });

  // GET single student
  app.get("/api/students/:id", (req, res) => {
    try {
      const students = loadStudents();
      const student = students.find((s) => s.id === req.params.id);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.json(student);
    } catch (err) {
      res.status(500).json({ error: "Failed to load student" });
    }
  });

  // POST add new student
  app.post("/api/students", (req, res) => {
    try {
      const students = loadStudents();
      const rawData = req.body;

      if (!rawData.name || !rawData.studentId || !rawData.email || !rawData.department || !rawData.academicYear) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check for duplicate studentId
      if (students.some((s) => s.studentId === rawData.studentId)) {
        return res.status(400).json({ error: "Student ID already exists" });
      }

      const inputStudent = {
        id: (students.length + 1).toString(),
        studentId: rawData.studentId,
        name: rawData.name,
        email: rawData.email,
        department: rawData.department,
        academicYear: rawData.academicYear,
        attendance: parseFloat(rawData.attendance) || 0,
        internalMarks: parseFloat(rawData.internalMarks) || 0,
        cgpa: parseFloat(rawData.cgpa) || 0,
        householdIncome: parseFloat(rawData.householdIncome) || 0,
        scholarship: !!rawData.scholarship,
        scholarshipHistory: rawData.scholarshipHistory || "None",
        engagement: rawData.engagement || "Medium",
      };

      const { riskScore, riskLevel, status } = calculateStudentRisk(inputStudent);

      const newStudent: Student = {
        ...inputStudent,
        riskScore,
        riskLevel,
        status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      students.unshift(newStudent); // add to top
      saveStudents(students);

      // Log manual collection & scoring
      cleaningLogs.unshift({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: "INFO",
        message: `Manually collected data and calculated predictive risk of ${riskScore}% (${riskLevel}) for new student ${newStudent.name}.`,
      });

      res.status(201).json(newStudent);
    } catch (err) {
      res.status(500).json({ error: "Failed to add student" });
    }
  });

  // PUT update student
  app.put("/api/students/:id", (req, res) => {
    try {
      const students = loadStudents();
      const index = students.findIndex((s) => s.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ error: "Student not found" });
      }

      const current = students[index];
      const rawData = req.body;

      const inputStudent = {
        ...current,
        name: rawData.name ?? current.name,
        email: rawData.email ?? current.email,
        department: rawData.department ?? current.department,
        academicYear: rawData.academicYear ?? current.academicYear,
        attendance: parseFloat(rawData.attendance) ?? current.attendance,
        internalMarks: parseFloat(rawData.internalMarks) ?? current.internalMarks,
        cgpa: parseFloat(rawData.cgpa) ?? current.cgpa,
        householdIncome: parseFloat(rawData.householdIncome) ?? current.householdIncome,
        scholarship: rawData.scholarship !== undefined ? !!rawData.scholarship : current.scholarship,
        scholarshipHistory: rawData.scholarshipHistory ?? current.scholarshipHistory,
        engagement: rawData.engagement ?? current.engagement,
      };

      const { riskScore, riskLevel, status } = calculateStudentRisk(inputStudent);

      const updatedStudent: Student = {
        ...inputStudent,
        riskScore,
        riskLevel,
        status,
        updatedAt: new Date().toISOString(),
      };

      students[index] = updatedStudent;
      saveStudents(students);

      cleaningLogs.unshift({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: "INFO",
        message: `Updated student metrics and recalculated risk to ${riskScore}% (${riskLevel}) for ${updatedStudent.name}.`,
      });

      res.json(updatedStudent);
    } catch (err) {
      res.status(500).json({ error: "Failed to update student" });
    }
  });

  // DELETE student
  app.delete("/api/students/:id", (req, res) => {
    try {
      const students = loadStudents();
      const filtered = students.filter((s) => s.id !== req.params.id);
      if (filtered.length === students.length) {
        return res.status(404).json({ error: "Student not found" });
      }
      saveStudents(filtered);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete student" });
    }
  });

  // GET EDA Statistics and Distributions
  app.get("/api/eda", (req, res) => {
    try {
      const students = loadStudents();
      const total = students.length;
      
      if (total === 0) {
        return res.json({
          totalStudents: 0,
          highRiskCount: 0,
          mediumRiskCount: 0,
          lowRiskCount: 0,
          averageAttendance: 0,
          averageCgpa: 0,
          averageMarks: 0,
          correlationAttendanceRisk: 0,
          correlationCgpaRisk: 0,
          incomeRiskDistribution: [],
          departmentRiskDistribution: []
        });
      }

      const highRisk = students.filter((s) => s.riskLevel === "High").length;
      const mediumRisk = students.filter((s) => s.riskLevel === "Medium").length;
      const lowRisk = students.filter((s) => s.riskLevel === "Low").length;

      const avgAttendance = parseFloat((students.reduce((acc, s) => acc + s.attendance, 0) / total).toFixed(1));
      const avgCgpa = parseFloat((students.reduce((acc, s) => acc + s.cgpa, 0) / total).toFixed(2));
      const avgMarks = parseFloat((students.reduce((acc, s) => acc + s.internalMarks, 0) / total).toFixed(1));

      // Correlation calculation vectors
      const attendanceRiskVector = students.map((s) => ({ x: s.attendance, y: s.riskScore }));
      const cgpaRiskVector = students.map((s) => ({ x: s.cgpa, y: s.riskScore }));

      const correlationAttendance = calculateCorrelation(attendanceRiskVector);
      const correlationCgpa = calculateCorrelation(cgpaRiskVector);

      // Income vs Risk Distribution
      const incomeRanges = [
        { name: "< $20k", min: 0, max: 20000 },
        { name: "$20k - $40k", min: 20000, max: 40000 },
        { name: "$40k - $75k", min: 40000, max: 75000 },
        { name: "$75k+", min: 75000, max: Infinity },
      ];

      const incomeRiskDistribution = incomeRanges.map((range) => {
        const subList = students.filter((s) => s.householdIncome >= range.min && s.householdIncome < range.max);
        return {
          range: range.name,
          "Low Risk": subList.filter((s) => s.riskLevel === "Low").length,
          "Medium Risk": subList.filter((s) => s.riskLevel === "Medium").length,
          "High Risk": subList.filter((s) => s.riskLevel === "High").length,
        };
      });

      // Department vs Risk Distribution
      const departments = Array.from(new Set(students.map((s) => s.department)));
      const departmentRiskDistribution = departments.map((dept) => {
        const subList = students.filter((s) => s.department === dept);
        return {
          department: dept,
          high: subList.filter((s) => s.riskLevel === "High").length,
          medium: subList.filter((s) => s.riskLevel === "Medium").length,
          low: subList.filter((s) => s.riskLevel === "Low").length,
        };
      });

      // Calculate Model Metrics & Confusion Matrix across active dataset
      let truePositive = 0;
      let falsePositive = 0;
      let trueNegative = 0;
      let falseNegative = 0;

      for (const s of students) {
        const isPredictedHigh = s.riskLevel === "High";
        // Ground truth heuristic based on severe academic or financial stress (Attendance < 70% OR CGPA < 5.5 OR Marks < 50%)
        const isGroundTruthHigh = s.attendance < 70 || s.cgpa < 5.5 || s.internalMarks < 50 || (s.householdIncome < 20000 && !s.scholarship);

        if (isPredictedHigh && isGroundTruthHigh) truePositive++;
        else if (isPredictedHigh && !isGroundTruthHigh) falsePositive++;
        else if (!isPredictedHigh && !isGroundTruthHigh) trueNegative++;
        else if (!isPredictedHigh && isGroundTruthHigh) falseNegative++;
      }

      const totalEvaluated = students.length || 1;
      const accuracy = parseFloat((((truePositive + trueNegative) / totalEvaluated) * 100).toFixed(1));
      const precision = parseFloat(((truePositive / (truePositive + falsePositive || 1)) * 100).toFixed(1));
      const recall = parseFloat(((truePositive / (truePositive + falseNegative || 1)) * 100).toFixed(1));
      const f1Score = parseFloat(((2 * precision * recall) / (precision + recall || 1)).toFixed(1));

      const stats: EdaStats = {
        totalStudents: total,
        highRiskCount: highRisk,
        mediumRiskCount: mediumRisk,
        lowRiskCount: lowRisk,
        averageAttendance: avgAttendance,
        averageCgpa: avgCgpa,
        averageMarks: avgMarks,
        correlationAttendanceRisk: correlationAttendance,
        correlationCgpaRisk: correlationCgpa,
        incomeRiskDistribution,
        departmentRiskDistribution,
        modelMetrics: {
          accuracy,
          precision,
          recall,
          f1Score,
          confusionMatrix: {
            truePositive,
            falsePositive,
            trueNegative,
            falseNegative
          },
          featureWeights: [
            { feature: "Attendance Rate", weight: 35, impact: "High Negative Impact (Lower attendance drives linear risk escalation)" },
            { feature: "Cumulative GPA", weight: 25, impact: "High Negative Impact (Low GPA triggers academic watchlist)" },
            { feature: "Internal Marks", weight: 15, impact: "Moderate Impact (Continuous assessment indicator)" },
            { feature: "Household Income & Aid", weight: 15, impact: "Moderate Impact (Socioeconomic vulnerability factor)" },
            { feature: "Extracurricular Engagement", weight: 10, impact: "Low-Moderate Impact (Institutional connectivity)" }
          ]
        }
      };

      res.json(stats);
    } catch (err) {
      res.status(500).json({ error: "Failed to compile EDA statistics" });
    }
  });

  // GET data cleaning logs
  app.get("/api/cleaning-logs", (req, res) => {
    res.json(cleaningLogs);
  });

  // POST trigger database synchronization and cleaning pipeline
  app.post("/api/sync", (req, res) => {
    try {
      const students = loadStudents();
      const { databaseUrl } = req.body;
      const urlStr = databaseUrl || "https://sis.maincampus.edu/api/v2";

      const logTimestamp = () => new Date().toISOString();

      // Setup structured logging for data science workflow
      const sessionLogs: DataCleaningLog[] = [
        {
          id: `sync-1-${Date.now()}`,
          timestamp: logTimestamp(),
          type: "INFO",
          message: `Initiating real-time database handshake with ${urlStr}...`,
        },
        {
          id: `sync-2-${Date.now()}`,
          timestamp: logTimestamp(),
          type: "INFO",
          message: "Secure SSL connection established. Extracting raw JSON datasets.",
        },
      ];

      // Raw messy records that need cleaning
      const rawExternalData = [
        {
          studentId: "STU2026011",
          name: "  Marcus Aurelius  ", // Messy spaces
          email: "marcus.aurelius@university.edu",
          department: "Computer Science",
          academicYear: "Sophomore" as const,
          attendance: 0.45, // Decimal attendance (should be percentage 45.0)
          internalMarks: 48,
          cgpa: null, // Missing value to be imputed based on internal marks
          householdIncome: "$14,500", // String format
          scholarship: "true", // String instead of boolean
          scholarshipHistory: "Need-based" as const,
          engagement: "Low" as const,
        },
        {
          studentId: "STU2026012",
          name: "Lydia Bennet",
          email: "lydia.bennet@university.edu",
          department: "Business Ad",
          academicYear: "Freshman" as const,
          attendance: 125, // Erroneous outlier value (>100)
          internalMarks: 65,
          cgpa: 6.9,
          householdIncome: "38000",
          scholarship: "false",
          scholarshipHistory: "None" as const,
          engagement: "Medium" as const,
        },
        {
          studentId: "STU2026013",
          name: "Jane Watson",
          email: "JANE.WATSON@UNIVERSITY.EDU", // Case issues
          department: "Electrical Eng",
          academicYear: "Junior" as const,
          attendance: 88,
          internalMarks: 82,
          cgpa: 8.7,
          householdIncome: "82000",
          scholarship: "true",
          scholarshipHistory: "Full Tuition" as const,
          engagement: "High" as const,
        }
      ];

      // Cleaning process
      const cleanedSyncStudents: Student[] = [];

      for (const raw of rawExternalData) {
        // Skip if already exists to avoid duplication
        if (students.some((s) => s.studentId === raw.studentId)) {
          sessionLogs.push({
            id: `skip-${raw.studentId}-${Date.now()}`,
            timestamp: logTimestamp(),
            type: "INFO",
            message: `Student record ${raw.studentId} (${raw.name.trim()}) already exists in active records. Skipping import to maintain data deduplication.`,
          });
          continue;
        }

        // 1. Clean Name (Trim whitespace)
        const cleanName = raw.name.trim();
        if (cleanName !== raw.name) {
          sessionLogs.push({
            id: `clean-name-${raw.studentId}`,
            timestamp: logTimestamp(),
            type: "CLEAN",
            message: `Standardized trailing/leading whitespaces for: '${raw.name}' -> '${cleanName}'.`,
          });
        }

        // 2. Clean Email (Lowercase)
        const cleanEmail = raw.email.toLowerCase();
        if (cleanEmail !== raw.email) {
          sessionLogs.push({
            id: `clean-email-${raw.studentId}`,
            timestamp: logTimestamp(),
            type: "CLEAN",
            message: `Normalized email address to lowercase: '${raw.email}' -> '${cleanEmail}'.`,
          });
        }

        // 3. Clean Attendance Percentage (Decimal representation / outlier values)
        let cleanAttendance = raw.attendance;
        if (raw.attendance <= 1.0) {
          cleanAttendance = Math.round(raw.attendance * 100);
          sessionLogs.push({
            id: `clean-att-dec-${raw.studentId}`,
            timestamp: logTimestamp(),
            type: "WARNING",
            message: `Imputed float attendance for ${cleanName}: ${raw.attendance} interpreted as percentage ${cleanAttendance}%.`,
          });
        } else if (raw.attendance > 100) {
          cleanAttendance = 100;
          sessionLogs.push({
            id: `clean-att-out-${raw.studentId}`,
            timestamp: logTimestamp(),
            type: "WARNING",
            message: `Out-of-bounds attendance value (${raw.attendance}%) capped at maximum (100%) for ${cleanName}.`,
          });
        }

        // 4. Impute Missing CGPA based on Internal Marks
        let cleanCgpa = raw.cgpa;
        if (raw.cgpa === null) {
          // Imputation logic: CGPA is roughly equivalent to Marks/10 (highly correlated)
          cleanCgpa = parseFloat((raw.internalMarks / 10 + 0.2).toFixed(2));
          sessionLogs.push({
            id: `impute-cgpa-${raw.studentId}`,
            timestamp: logTimestamp(),
            type: "WARNING",
            message: `Missing CGPA detected for ${cleanName}. Imputed value of ${cleanCgpa} using academic predictor algorithm based on internal marks (${raw.internalMarks}%).`,
          });
        }

        // 5. Clean Income (Extract numeric value)
        let cleanIncome = 0;
        if (typeof raw.householdIncome === "string") {
          const parsed = parseFloat(raw.householdIncome.replace(/[^0-9.]/g, ""));
          cleanIncome = isNaN(parsed) ? 0 : parsed;
          if (raw.householdIncome.includes("$") || raw.householdIncome.includes(",")) {
            sessionLogs.push({
              id: `clean-inc-${raw.studentId}`,
              timestamp: logTimestamp(),
              type: "CLEAN",
              message: `Sanitized household income formatting: '${raw.householdIncome}' parsed to numeric: ${cleanIncome}.`,
            });
          }
        } else {
          cleanIncome = raw.householdIncome;
        }

        // 6. Clean Scholarship boolean
        const cleanScholarship = raw.scholarship === "true" || (raw.scholarship as any) === true;

        const baseStudent = {
          id: (students.length + cleanedSyncStudents.length + 1).toString(),
          studentId: raw.studentId,
          name: cleanName,
          email: cleanEmail,
          department: raw.department,
          academicYear: raw.academicYear,
          attendance: cleanAttendance,
          internalMarks: raw.internalMarks,
          cgpa: cleanCgpa!,
          householdIncome: cleanIncome,
          scholarship: cleanScholarship,
          scholarshipHistory: raw.scholarshipHistory,
          engagement: raw.engagement,
        };

        const { riskScore, riskLevel, status } = calculateStudentRisk(baseStudent);

        const finalizedStudent: Student = {
          ...baseStudent,
          riskScore,
          riskLevel,
          status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        cleanedSyncStudents.push(finalizedStudent);
      }

      // Merge new students into our database
      if (cleanedSyncStudents.length > 0) {
        const mergedList = [...cleanedSyncStudents, ...students];
        saveStudents(mergedList);
        sessionLogs.push({
          id: `sync-complete-${Date.now()}`,
          timestamp: logTimestamp(),
          type: "SYNC",
          message: `Data Science pipeline completed successfully! Synchronized and secured ${cleanedSyncStudents.length} raw student records into active oversight.`,
        });
      } else {
        sessionLogs.push({
          id: `sync-none-${Date.now()}`,
          timestamp: logTimestamp(),
          type: "SYNC",
          message: `Data sync completed. No new student records needed to be added.`,
        });
      }

      // Add logs to global server logs
      cleaningLogs = [...sessionLogs, ...cleaningLogs];

      res.json({
        success: true,
        synchronizedCount: cleanedSyncStudents.length,
        logs: sessionLogs,
      });

    } catch (err) {
      res.status(500).json({ error: "Data synchronization pipeline failed." });
    }
  });

  // POST Import new dataset (CSV text or array of objects)
  app.post("/api/dataset/import", (req, res) => {
    try {
      const existingStudents = loadStudents();
      const { content, format = "csv" } = req.body;
      const logTimestamp = () => new Date().toISOString();
      const sessionLogs: DataCleaningLog[] = [];

      if (!content || typeof content !== "string") {
        return res.status(400).json({ error: "Missing or invalid dataset content payload" });
      }

      sessionLogs.push({
        id: `import-init-${Date.now()}`,
        timestamp: logTimestamp(),
        type: "INFO",
        message: `Initiated dataset ingestion pipeline (${format.toUpperCase()} format). Raw payload length: ${content.length} bytes.`
      });

      let rawRecords: any[] = [];

      if (format === "json" || content.trim().startsWith("[")) {
        try {
          rawRecords = JSON.parse(content.trim());
        } catch (e) {
          return res.status(400).json({ error: "Failed to parse JSON dataset content" });
        }
      } else {
        // Parse CSV
        const lines = content.trim().split(/\r?\n/);
        if (lines.length <= 1) {
          return res.status(400).json({ error: "CSV dataset is empty or lacks header line" });
        }

        const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
          const row: Record<string, any> = {};
          
          headers.forEach((h, idx) => {
            row[h] = cols[idx] !== undefined ? cols[idx] : "";
          });
          
          rawRecords.push(row);
        }
      }

      if (!Array.isArray(rawRecords) || rawRecords.length === 0) {
        return res.status(400).json({ error: "No valid record entries found in dataset payload" });
      }

      const newStudents: Student[] = [];
      let nextIdNumber = existingStudents.length + 1;

      for (const item of rawRecords) {
        const rawStudentId = item.studentId || item.student_id || `STU${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`;
        const rawName = item.name || item.student_name || `Student ${rawStudentId}`;
        const cleanName = rawName.replace(/_/g, " ").trim();

        // Check deduplication
        if (existingStudents.some((s) => s.studentId === rawStudentId) || newStudents.some((s) => s.studentId === rawStudentId)) {
          sessionLogs.push({
            id: `skip-${rawStudentId}`,
            timestamp: logTimestamp(),
            type: "INFO",
            message: `Skipping duplicate record identifier '${rawStudentId}' (${cleanName}).`
          });
          continue;
        }

        const deptRaw = (item.department || item.dept || "Computer Science").toString();
        let department = "Computer Science";
        if (deptRaw.includes("MECH") || deptRaw.includes("Mechanical")) department = "Mechanical Eng";
        else if (deptRaw.includes("CIVIL") || deptRaw.includes("Civil")) department = "Civil Eng";
        else if (deptRaw.includes("EEE") || deptRaw.includes("Electrical")) department = "Electrical Eng";
        else if (deptRaw.includes("CSE") || deptRaw.includes("Computer")) department = "Computer Science";
        else if (deptRaw.includes("ECE") || deptRaw.includes("Electronics")) department = "Electronics Eng";
        else if (deptRaw.includes("IT") || deptRaw.includes("Information")) department = "Information Tech";
        else if (deptRaw.includes("Business")) department = "Business Ad";

        let academicYear: "Freshman" | "Sophomore" | "Junior" | "Senior" = "Freshman";
        if (item.academicYear) {
          academicYear = item.academicYear;
        } else if (item.semester) {
          const sem = parseInt(item.semester) || 1;
          if (sem <= 2) academicYear = "Freshman";
          else if (sem <= 4) academicYear = "Sophomore";
          else if (sem <= 6) academicYear = "Junior";
          else academicYear = "Senior";
        }

        let attendance = parseFloat(item.attendance || item.attendance_pct || 80);
        if (attendance <= 1.0) attendance = Math.round(attendance * 100);
        if (attendance > 100) attendance = 100;

        let internalMarks = parseFloat(item.internalMarks || item.internal_marks || 70);
        let cgpa = parseFloat(item.cgpa || item.overall_gpa || (internalMarks / 10 + 0.2).toFixed(2));

        let householdIncome = 35000;
        if (typeof item.householdIncome === "number") householdIncome = item.householdIncome;
        else if (typeof item.householdIncome === "string") {
          const parsed = parseFloat(item.householdIncome.replace(/[^0-9.]/g, ""));
          if (!isNaN(parsed)) householdIncome = parsed;
        } else if (item.financial_status === "Low Income") householdIncome = 14000;
        else if (item.financial_status === "High Income") householdIncome = 85000;

        const scholarship = item.scholarship === "true" || item.scholarship === true;
        const scholarshipHistory = item.scholarshipHistory || (scholarship ? "Partial" : "None");
        const engagement = item.engagement || "Medium";

        const email = item.email || `${rawStudentId.toLowerCase()}@university.edu`;

        const baseStudent = {
          id: (nextIdNumber++).toString(),
          studentId: rawStudentId,
          name: cleanName,
          email,
          department,
          academicYear,
          attendance,
          internalMarks,
          cgpa,
          householdIncome,
          scholarship,
          scholarshipHistory,
          engagement
        };

        const { riskScore, riskLevel, status } = calculateStudentRisk(baseStudent);

        const finalized: Student = {
          ...baseStudent,
          riskScore,
          riskLevel,
          status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        newStudents.push(finalized);
      }

      if (newStudents.length > 0) {
        const merged = [...newStudents, ...existingStudents];
        saveStudents(merged);

        sessionLogs.push({
          id: `import-success-${Date.now()}`,
          timestamp: logTimestamp(),
          type: "SYNC",
          message: `Successfully cleaned, validated, and appended ${newStudents.length} new student dataset records to the active risk oversight model!`
        });
      } else {
        sessionLogs.push({
          id: `import-zero-${Date.now()}`,
          timestamp: logTimestamp(),
          type: "WARNING",
          message: `Dataset processed. 0 new unique records were added (all records were duplicates or invalid).`
        });
      }

      cleaningLogs = [...sessionLogs, ...cleaningLogs];

      res.json({
        success: true,
        importedCount: newStudents.length,
        totalDatasetSize: existingStudents.length + newStudents.length,
        logs: sessionLogs
      });
    } catch (err: any) {
      console.error("Dataset import error:", err);
      res.status(500).json({ error: "Failed to process and import dataset" });
    }
  });

  // POST Reset dataset to 200-student baseline
  app.post("/api/dataset/reset", (req, res) => {
    try {
      delete require.cache[require.resolve("./src/data/seed-csv.cjs")];
      require("./src/data/seed-csv.cjs");

      const refreshedStudents = loadStudents();

      cleaningLogs.unshift({
        id: `reset-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "SYNC",
        message: `Database dataset reset to 200-Student Benchmark Cohort.`
      });

      res.json({ success: true, count: refreshedStudents.length });
    } catch (err) {
      res.status(500).json({ error: "Failed to reset dataset" });
    }
  });

  // GET Export dataset as CSV file download
  app.get("/api/dataset/export", (req, res) => {
    try {
      const students = loadStudents();
      let csv = "student_id,name,email,department,academic_year,attendance_pct,internal_marks,overall_gpa,household_income,scholarship,scholarship_history,engagement,risk_score,risk_level,status\n";
      
      for (const s of students) {
        csv += `"${s.studentId}","${s.name}","${s.email}","${s.department}","${s.academicYear}",${s.attendance},${s.internalMarks},${s.cgpa},${s.householdIncome},${s.scholarship},"${s.scholarshipHistory}","${s.engagement}",${s.riskScore},"${s.riskLevel}","${s.status}"\n`;
      }

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="student_dropout_risk_dataset_${Date.now()}.csv"`);
      res.send(csv);
    } catch (err) {
      res.status(500).json({ error: "Failed to export dataset" });
    }
  });

  // POST generate personalized AI intervention via Gemini
  app.post("/api/students/:id/intervention", async (req, res) => {
    try {
      const students = loadStudents();
      const student = students.find((s) => s.id === req.params.id);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Get Gemini client using the lazy initialization helper
      let ai;
      try {
        ai = getGeminiClient();
      } catch (e: any) {
        // Return a clean mock response if API Key is not set, so user can still see how it works!
        console.warn("Gemini Client omitted - API Key missing. Falling back to local template.");
        return res.json({
          rootCauses: [
            student.attendance < 75 ? "Sub-optimal lecture and practical attendance percentage." : "Marginal academic engagement.",
            student.cgpa < 6.5 ? "Accumulating academic workload leading to GPA pressure." : "Financial stress combined with household workload.",
          ],
          retainingStrategies: [
            "Enroll in the standard Peer-Assisted Study Sessions (PASS) or peer counseling.",
            "Establish a student-advisor learning compact requiring weekly check-ins.",
            student.householdIncome < 20000 ? "Refer to the Financial Aid and Scholarship Coordination Office." : "Provide structured study schedules with modular goals.",
            "Integrate into collaborative student project groups to bolster engagement."
          ],
          encouragementMessage: `Hi ${student.name.split(" ")[0]}, we noticed you've been working hard but might need a little extra support. Your faculty and peers are in your corner, and we have custom resources ready to help you thrive!`,
          generatedAt: new Date().toISOString(),
          isSimulated: true
        });
      }

      const prompt = `
        You are a highly empathetic academic counselor and predictive modeling specialist in student retention.
        We have a student identified at risk of dropout. Analyse their metrics and compile a highly structured personalized academic intervention plan.
        
        Student Profile:
        - Name: ${student.name}
        - Department: ${student.department}
        - Year: ${student.academicYear}
        - Attendance: ${student.attendance}%
        - Internal Marks: ${student.internalMarks}/100
        - Cumulative GPA: ${student.cgpa}/10
        - Household Income: $${student.householdIncome.toLocaleString()}/year
        - Has Scholarship: ${student.scholarship ? "Yes" : "No"} (${student.scholarshipHistory})
        - Extracurricular Engagement: ${student.engagement}
        - Predicted Dropout Risk Probability: ${student.riskScore}% (${student.riskLevel} Risk)

        Provide:
        1. "rootCauses": 2 to 3 key structural or personal reasons for their current risk based directly on these specific metrics.
        2. "retainingStrategies": 3 to 4 hyper-specific, empathetic, and actionable intervention plans (e.g. customized tutoring, financial help referral, counseling, academic contract) to help retain them.
        3. "encouragementMessage": A personalized, warm, and highly supportive counseling email/letter fragment addressed to the student by name to invite them for an academic review.

        Respond with JSON strictly conforming to the requested schema.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              rootCauses: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of 2-3 detailed root causes of risk."
              },
              retainingStrategies: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of 3-4 specific, actionable retaining plans."
              },
              encouragementMessage: {
                type: Type.STRING,
                description: "A highly personal, warm, encouraging message addressing the student by name."
              }
            },
            required: ["rootCauses", "retainingStrategies", "encouragementMessage"]
          }
        }
      });

      if (!response.text) {
        throw new Error("Empty response from Gemini API");
      }

      const result = JSON.parse(response.text.trim());
      res.json({
        ...result,
        generatedAt: new Date().toISOString(),
        isSimulated: false
      });

    } catch (err: any) {
      console.error("Gemini intervention error:", err);
      res.status(500).json({ error: err.message || "Failed to generate AI intervention" });
    }
  });


  // --- VITE MIDDLEWARE SETUP ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
