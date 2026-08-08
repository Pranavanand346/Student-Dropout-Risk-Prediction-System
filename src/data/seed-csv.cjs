const fs = require("fs");
const path = require("path");

// Expanded seed dataset with 200 detailed student records
const generateStudentDataset = () => {
  const departments = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "Business Ad"];
  const financialStatuses = ["Low Income", "Middle Income", "High Income"];
  const engagements = ["Low", "Medium", "High"];

  const firstNames = [
    "Alex", "Elena", "Marcus", "Sarah", "Carlos", "Maya", "David", "Jordan", "Amara", "Ryan",
    "Priya", "Lucas", "Aisha", "Liam", "Sophia", "Noah", "Olivia", "Ethan", "Ava", "Mason",
    "Isabella", "Jacob", "Mia", "William", "Harper", "Benjamin", "Evelyn", "James", "Abigail", "Alexander",
    "Emily", "Michael", "Ella", "Daniel", "Elizabeth", "Henry", "Camila", "Jackson", "Luna", "Sebastian",
    "Sofia", "Aiden", "Avery", "Matthew", "Mila", "Samuel", "Arya", "Joseph", "Scarlett", "John",
    "Victoria", "David", "Madison", "Wyatt", "Luna", "Carter", "Grace", "Julian", "Chloe", "Luke",
    "Penelope", "Grayson", "Layla", "Leo", "Riley", "Jayden", "Zoey", "Gabriel", "Nora", "Isaac",
    "Lily", "Oliver", "Eleanor", "Anthony", "Hannah", "Dylan", "Lillian", "Leo", "Addison", "Jaden",
    "Aubrey", "Caleb", "Ellie", "Joshua", "Stella", "Ezra", "Natalie", "Andrew", "Zoe", "Thomas"
  ];

  const lastNames = [
    "Rivera", "Rostova", "Vance", "Jenkins", "Gomez", "Lin", "Kim", "Taylor", "Diallo", "Gallagher",
    "Sharma", "Patel", "Khan", "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
    "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor",
    "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark",
    "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres",
    "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell",
    "Mitchell", "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker", "Cruz",
    "Edwards", "Collins", "Reyes", "Stewart", "Morris", "Morales", "Murphy", "Cook", "Rogers", "Gutierrez"
  ];

  const students = [];

  // Deterministic seed for reproducible dataset generation
  let seed = 42;
  const pseudoRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let i = 1; i <= 200; i++) {
    const studentNum = i.toString().padStart(4, "0");
    const studentId = `STU${studentNum}`;
    const fn = firstNames[(i - 1) % firstNames.length];
    const ln = lastNames[(i - 1) % lastNames.length];
    const name = `${fn} ${ln}`;

    const deptRaw = departments[(i - 1) % departments.length];
    let department = "Computer Science";
    if (deptRaw === "MECH") department = "Mechanical Eng";
    else if (deptRaw === "CIVIL") department = "Civil Eng";
    else if (deptRaw === "EEE") department = "Electrical Eng";
    else if (deptRaw === "CSE") department = "Computer Science";
    else if (deptRaw === "ECE") department = "Electronics Eng";
    else if (deptRaw === "IT") department = "Information Tech";
    else if (deptRaw === "Business Ad") department = "Business Ad";

    const semester = Math.floor(pseudoRandom() * 8) + 1;
    let academicYear = "Freshman";
    if (semester <= 2) academicYear = "Freshman";
    else if (semester <= 4) academicYear = "Sophomore";
    else if (semester <= 6) academicYear = "Junior";
    else academicYear = "Senior";

    // Realistic risk stratification: ~20% high risk, ~35% medium risk, ~45% low risk
    const randProfile = pseudoRandom();
    let attendance = 85;
    let internalMarks = 75;
    let cgpa = 7.5;
    let finStatus = "Middle Income";
    let engagement = "Medium";

    if (randProfile < 0.22) {
      // High risk cohort
      attendance = Math.floor(pseudoRandom() * 35) + 40; // 40 - 75%
      internalMarks = Math.floor(pseudoRandom() * 30) + 35; // 35 - 65%
      cgpa = parseFloat((pseudoRandom() * 2.8 + 3.8).toFixed(2)); // 3.8 - 6.6
      finStatus = pseudoRandom() > 0.4 ? "Low Income" : "Middle Income";
      engagement = pseudoRandom() > 0.3 ? "Low" : "Medium";
    } else if (randProfile < 0.55) {
      // Medium risk cohort
      attendance = Math.floor(pseudoRandom() * 20) + 68; // 68 - 88%
      internalMarks = Math.floor(pseudoRandom() * 25) + 55; // 55 - 80%
      cgpa = parseFloat((pseudoRandom() * 2.2 + 6.0).toFixed(2)); // 6.0 - 8.2
      finStatus = financialStatuses[Math.floor(pseudoRandom() * financialStatuses.length)];
      engagement = engagements[Math.floor(pseudoRandom() * engagements.length)];
    } else {
      // Low risk cohort
      attendance = Math.floor(pseudoRandom() * 18) + 83; // 83 - 100%
      internalMarks = Math.floor(pseudoRandom() * 25) + 75; // 75 - 100%
      cgpa = parseFloat((pseudoRandom() * 2.1 + 7.9).toFixed(2)); // 7.9 - 10.0
      finStatus = pseudoRandom() > 0.5 ? "Middle Income" : "High Income";
      engagement = pseudoRandom() > 0.25 ? "High" : "Medium";
    }

    let householdIncome = 38000;
    if (finStatus === "Low Income") householdIncome = Math.floor(pseudoRandom() * 15000) + 10000;
    else if (finStatus === "Middle Income") householdIncome = Math.floor(pseudoRandom() * 30000) + 30000;
    else householdIncome = Math.floor(pseudoRandom() * 60000) + 65000;

    let scholarship = false;
    let scholarshipHistory = "None";
    if (finStatus === "Low Income") {
      scholarship = pseudoRandom() > 0.35;
      scholarshipHistory = scholarship ? (pseudoRandom() > 0.5 ? "Need-based" : "Full Tuition") : "None";
    } else if (finStatus === "Middle Income") {
      scholarship = pseudoRandom() > 0.7;
      scholarshipHistory = scholarship ? "Partial" : "None";
    } else {
      scholarship = pseudoRandom() > 0.85;
      scholarshipHistory = scholarship ? "Partial" : "None";
    }

    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}@university.edu`;

    // Multi-factor Risk Logic
    const attendanceStress = 100 - attendance;
    const cgpaStress = Math.max(0, (10 - cgpa) * 10);
    const marksStress = 100 - internalMarks;

    let financialStress = 0;
    if (householdIncome < 15000) financialStress = scholarship ? 40 : 100;
    else if (householdIncome < 35000) financialStress = scholarship ? 20 : 70;
    else if (householdIncome < 60000) financialStress = scholarship ? 10 : 40;
    else financialStress = 0;

    let engagementStress = engagement === "Low" ? 100 : (engagement === "Medium" ? 40 : 0);

    const rawScore = (attendanceStress * 0.35) + (cgpaStress * 0.25) + (marksStress * 0.15) + (financialStress * 0.15) + (engagementStress * 0.10);
    const riskScore = Math.min(100, Math.max(0, Math.round(rawScore)));

    let riskLevel = "Low";
    let status = "Active";
    if (riskScore >= 65) {
      riskLevel = "High";
      status = "Risk of Dropout";
    } else if (riskScore >= 35) {
      riskLevel = "Medium";
      status = "Active";
    } else {
      riskLevel = "Low";
      status = "Enrolled";
    }

    const daysAgo = Math.floor(pseudoRandom() * 60) + 1;
    const createdAt = new Date(Date.now() - daysAgo * 24 * 3600 * 1000).toISOString();

    students.push({
      id: i.toString(),
      studentId,
      name,
      email,
      department,
      academicYear,
      attendance,
      internalMarks,
      cgpa,
      householdIncome,
      scholarship,
      scholarshipHistory,
      engagement,
      riskScore,
      riskLevel,
      status,
      createdAt,
      updatedAt: new Date().toISOString()
    });
  }

  return students;
};

function parseAndGenerateDb() {
  const students = generateStudentDataset();
  const DB_PATH = path.join(__dirname, "students-db.json");
  fs.writeFileSync(DB_PATH, JSON.stringify(students, null, 2), "utf8");
  console.log(`Successfully generated benchmark dataset with ${students.length} student records in students-db.json!`);
}

parseAndGenerateDb();
