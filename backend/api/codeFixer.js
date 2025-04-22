// backend/api/codeFixer.js
const express = require("express");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-3-7-sonnet-20250219";
const SUPPORTED_LANGUAGES = ["javascript", "python", "cpp"];

router.post("/generate-fixes", async (req, res) => {
  const { code, language, testCases, testResults } = req.body;

  if (!code || !language || !testCases || !testResults) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!SUPPORTED_LANGUAGES.includes(language)) {
    return res.status(400).json({
      error: "Only JavaScript, Python and C++ are supported",
    });
  }

  try {
    const fixedCode = await generateFixes(
      code,
      language,
      testCases,
      testResults
    );
    return res.json(fixedCode);
  } catch (error) {
    console.error(`Code fixer error: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

async function generateFixes(code, language, testCases, testResults) {
  const failingTests = testResults.testCases.filter((test) => !test.passed);

  const prompt = `
Fix this ${language} code that has ${failingTests.length} failing tests.

ORIGINAL CODE:
\`\`\`${language}
${code}
\`\`\`

FAILED TESTS:
${failingTests
  .map(
    (test) =>
      `Test: ${test.name}
Input: ${test.input}
Expected: ${test.expectedOutput}
Actual: ${test.actualOutput || "Error"}
${test.errorMessage || ""}`
  )
  .join("\n\n")}

Return ONLY a JSON object:
{
  "analysis": "Brief problem analysis",
  "requiresChanges": boolean,
  "fixedCode": "fixed code if needed, null otherwise"
}

Return ONLY the JSON, no other text or code blocks.`;

  try {
    const response = await axios.post(
      CLAUDE_API_URL,
      {
        model: CLAUDE_MODEL,
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": CLAUDE_API_KEY,
          "anthropic-version": "2023-06-01",
        },
      }
    );

    const claudeResponse = response.data.content[0].text;
    let jsonString = claudeResponse.replace(/```json\n|```\n|```/g, "").trim();

    const jsonMatch = jsonString.match(/{[\s\S]*}/);
    if (jsonMatch) jsonString = jsonMatch[0];

    return JSON.parse(jsonString);
  } catch (error) {
    throw new Error(`Failed to fix code: ${error.message}`);
  }
}

module.exports = router;
