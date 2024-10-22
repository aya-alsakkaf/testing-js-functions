const axios = require("axios");
const fs = require("fs");
const { json } = require("stream/consumers");
const dotenv = require("dotenv").config();
const xml2js = require("xml2js");

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_API_KEY.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_API_KEY.AIRTABLE_TABLE_NAME;

const jestReportPath = "./junit.xml"; // Adjust the path as needed
const jestResults = fs.readFileSync(jestReportPath, "utf8");

const fetchStudents = async () => {
  try {
    const response = await axios.get(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${process.env.AIRTABLE_API_KEY.AIRTABLE_STUDENTS_TABLE_NAME}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.records;
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

  const oneStudent = students.find(
    (student) => student.fields["GitHub Username"] === process.argv[2]
  );

  //   Uncomment the following code to update Airtable
  axios
    .post(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`,
      {
        fields: {
          Students: [oneStudent.id], // Replace with the actual student name
          Grade: grade / 100,
          Notes: `Passed Tests ${passedTests}, Failed Tested ${failedTests}`,
          Repo: process.argv[3],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    )
    .then((response) => console.log("Airtable updated successfully!"))
    .catch((error) => console.error("Error updating Airtable:", error));
});
