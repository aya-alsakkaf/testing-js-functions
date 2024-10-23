const axios = require("axios");
const fs = require("fs");
const { argv } = require("process");
const { json } = require("stream/consumers");
const dotenv = require("dotenv").config();
const xml2js = require("xml2js");

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || argv[2];
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || argv[3];
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || argv[4];
const AIRTABLE_STUDENTS_TABLE_NAME =
  process.env.AIRTABLE_STUDENTS_TABLE_NAME || argv[5];
const STUDENT_GITHUB = argv[6];
const STUDENT_REPO = argv[7];
const jestReportPath = "./junit.xml"; // Adjust the path as needed
const jestResults = fs.readFileSync(jestReportPath, "utf8");

const fetchStudents = async () => {
  try {
    const response = await axios.get(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_STUDENTS_TABLE_NAME}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.records;
  } catch (error) {
    console.error("Error Retrieving Airtable:", error);
  }
};

const createTaskRecord = async (studentId, grade, notes, repo) => {
  try {
    await axios
      .post(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`,
        {
          fields: {
            Students: [studentId], // Replace with the actual student name
            Grade: grade / 100,
            Notes: notes,
            Repo: repo,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      )
      .then((response) => console.log("Airtable updated successfully!"));
  } catch (error) {
    console.error("Error updating Airtable:", error);
  }
};

// Parse XML
xml2js.parseString(jestResults, async (err, result) => {
  if (err) {
    console.error("Error parsing XML:", err);
    return;
  }

  const testsuites = result.testsuites;
  const totalTests = parseInt(testsuites.$.tests);
  const failedTests = parseInt(testsuites.$.failures);
  const passedTests = totalTests - failedTests;

  console.log(`Total tests: ${totalTests}`);
  console.log(`Passed tests: ${passedTests}`);
  console.log(`Failed tests: ${failedTests}`);

  const grade = (passedTests / totalTests) * 100;

  console.log(`Grade: ${grade.toFixed(2) / 100}%`);

  let students = await fetchStudents();

  // find Student based on their github username
  const oneStudent = students.find(
    (student) => student.fields["GitHub Username"] === STUDENT_GITHUB
  );

  //   Uncomment the following code to update Airtable
  // TODO: Before creating a record, check if the user already has a record in the table

  await createTaskRecord(
    oneStudent.id,
    grade.toFixed(2) / 100,
    `Passed Tests ${passedTests}, Failed Tested ${failedTests}`,
    STUDENT_REPO
  );
});
