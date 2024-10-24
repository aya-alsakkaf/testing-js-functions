const axios = require("axios");
const fs = require("fs");
const { argv } = require("process");
const dotenv = require("dotenv").config();
const xml2js = require("xml2js");

// Constants and configuration

const TOPIC = argv[2];
const STUDENT_GITHUB = argv[3];
const STUDENT_REPO = argv[4];
const JEST_REPORT_PATH = "./junit.xml";

// Airtable API functions
const airtableApiServer = axios.create({
  baseURL: `https://airtable-be.vercel.app/`,
});

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

const sendDataToServer = async (
  passedTests,
  failedTests,
  grade,
  studentGitHub,
  studentRepo
) => {
  try {
    await airtableApiServer
      .post("/", {
        passedTests,
        failedTests,
        grade,
        studentGitHub,
        studentRepo,
        topic: TOPIC,
      })
      .then((response) => console.log("Sent Data Successfully"));
  } catch (error) {
    console.log("error in sending data to server", error);
  }
};

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

    await sendDataToServer(
      passedTests,
      failedTests,
      grade.toFixed(2),
      STUDENT_GITHUB,
      STUDENT_REPO
    );
  } catch (error) {
    console.error("An error occurred:", error.message);
    process.exit(1);
  }
}

// Run the main function
main();
