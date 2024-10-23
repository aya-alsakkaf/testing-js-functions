const axios = require("axios");
const fs = require("fs");
const dotenv = require("dotenv").config();
const xml2js = require("xml2js");

// Constants and configuration
// const {
//   AIRTABLE_API_KEY,
//   AIRTABLE_BASE_ID,
//   AIRTABLE_TABLE_NAME,
//   AIRTABLE_STUDENTS_TABLE_NAME,
// } = process.env;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || argv[2];
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || argv[3];
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || argv[4];
const AIRTABLE_STUDENTS_TABLE_NAME =
  process.env.AIRTABLE_STUDENTS_TABLE_NAME || argv[5];
const STUDENT_GITHUB = process.argv[6] || "aya-alsakkaf";
const STUDENT_REPO =
  process.argv[7] || "https://github.com/aya-alsakkaf/testing-js-functions";
const JEST_REPORT_PATH = "./junit.xml";

// Airtable API functions
const airtableApi = axios.create({
  baseURL: `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`,
  headers: {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    "Content-Type": "application/json",
  },
});

async function fetchRecords(tableName) {
  try {
    const response = await airtableApi.get(`/${tableName}`);
    return response.data.records;
  } catch (error) {
    console.error(`Error fetching records from ${tableName}:`, error.message);
    throw error;
  }
}

async function createOrUpdateTaskRecord(studentId, grade, notes, repo) {
  try {
    const existingTask = await checkStudentTask(repo);
    if (existingTask) {
      await updateTaskRecord(existingTask.id, grade, notes);
    } else {
      await createTaskRecord(studentId, grade, notes, repo);
    }
    console.log("Airtable updated successfully!");
  } catch (error) {
    console.error("Error updating Airtable:", error.message);
    throw error;
  }
}

async function createTaskRecord(studentId, grade, notes, repo) {
  await airtableApi.post(`/${AIRTABLE_TABLE_NAME}`, {
    fields: { Students: [studentId], Grade: grade, Notes: notes, Repo: repo },
  });
}

async function updateTaskRecord(recordId, grade, notes) {
  await airtableApi.patch(`/${AIRTABLE_TABLE_NAME}/${recordId}`, {
    fields: { Grade: grade, Notes: notes },
  });
}

async function checkStudentTask(repo) {
  const tasks = await fetchRecords(AIRTABLE_TABLE_NAME);
  return tasks.find((task) => task.fields["Repo"].includes(repo));
}

// Jest report parsing
function parseJestReport(xmlContent) {
  return new Promise((resolve, reject) => {
    xml2js.parseString(xmlContent, (err, result) => {
      if (err) {
        reject(err);
      } else {
        const testsuites = result.testsuites;
        const totalTests = parseInt(testsuites.$.tests);
        const failedTests = parseInt(testsuites.$.failures);
        const passedTests = totalTests - failedTests;
        const grade = (passedTests / totalTests) * 100;

        resolve({ totalTests, passedTests, failedTests, grade });
      }
    });
  });
}

// Main function
async function main() {
  try {
    const jestResults = fs.readFileSync(JEST_REPORT_PATH, "utf8");
    const { totalTests, passedTests, failedTests, grade } =
      await parseJestReport(jestResults);

    console.log(`Total tests: ${totalTests}`);
    console.log(`Passed tests: ${passedTests}`);
    console.log(`Failed tests: ${failedTests}`);
    console.log(`Grade: ${grade.toFixed(2)}%`);

    const students = await fetchRecords(AIRTABLE_STUDENTS_TABLE_NAME);
    const student = students.find(
      (s) => s.fields["GitHub Username"] === STUDENT_GITHUB
    );

    if (!student) {
      throw new Error(
        `Student with GitHub username ${STUDENT_GITHUB} not found`
      );
    }

    await createOrUpdateTaskRecord(
      student.id,
      grade / 100,
      `Passed Tests ${passedTests}, Failed Tests ${failedTests}`,
      STUDENT_REPO
    );
  } catch (error) {
    console.error("An error occurred:", error.message);
    process.exit(1);
  }
}

// Run the main function
main();
