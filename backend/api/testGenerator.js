// backend/api/testGenerator.js
const express = require("express");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-3-7-sonnet-20250219";
const SUPPORTED_LANGUAGES = ["javascript", "python", "cpp"];

router.post("/generate-tests", async (req, res) => {
  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: "Code and language are required" });
  }

  if (!SUPPORTED_LANGUAGES.includes(language)) {
    return res.status(400).json({
      error: "Only JavaScript, Python and C++ are supported",
    });
  }

  try {
    const testResults = await generateTests(code, language);
    return res.json(testResults);
  } catch (error) {
    console.error(`Test generation error: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

async function generateTests(code, language) {
  const prompt = `
Generate 5 test cases for this ${language} code. Return ONLY a JSON object with this structure:
{
  "summary": {
    "totalTests": 5,
    "passedTests": 0,
    "failedTests": 0,
    "codeDescription": "Brief description"
  },
  "testCases": [
    {
      "id": "test-1",
      "name": "Test Name",
      "input": "input value",
      "expectedOutput": "expected value",
      "passed": null
    }
  ]
}

CODE:
\`\`\`${language}
${code}
\`\`\`

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
    console.error(`Claude API error: ${error.message}`);
    throw new Error("Failed to generate tests");
  }
}

module.exports = router;
