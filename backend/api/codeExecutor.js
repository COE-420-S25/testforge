// backend/api/codeExecutor.js
const express = require("express");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();

const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;
const JUDGE0_API_URL =
  process.env.JUDGE0_API_URL || "https://judge0-ce.p.rapidapi.com";

const languageIdMap = {
  javascript: 63,
  python: 71,
  cpp: 54,
};

router.post("/execute-tests", async (req, res) => {
  const { code, language, testCases } = req.body;

  if (!code || !language || !testCases) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const languageId = languageIdMap[language];
  if (!languageId) {
    return res.status(400).json({
      error: "Only JavaScript, Python and C++ are supported",
    });
  }

  try {
    // Create test wrappers and prepare submissions
    const submissions = testCases.map((test) => ({
      source_code: createTestWrapper(code, language, test),
      language_id: languageId,
    }));

    // Submit batch
    const tokens = await submitBatch(submissions);

    // Get batch results
    const batchResults = await getBatchResults(tokens);

    // Process results
    const results = processResults(testCases, batchResults);
    return res.json(results);
  } catch (error) {
    console.error(`Code execution error: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

async function submitBatch(submissions) {
  try {
    const response = await axios.post(
      `${JUDGE0_API_URL}/submissions/batch`,
      { submissions },
      {
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": JUDGE0_API_KEY,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
      }
    );

    return response.data.filter((item) => item.token).map((item) => item.token);
  } catch (error) {
    throw new Error(`Failed to submit code: ${error.message}`);
  }
}

async function getBatchResults(tokens) {
  try {
    const tokenParams = tokens.join(",");
    let attempts = 0;

    while (attempts < 10) {
      const response = await axios.get(
        `${JUDGE0_API_URL}/submissions/batch?tokens=${tokenParams}`,
        {
          headers: {
            "X-RapidAPI-Key": JUDGE0_API_KEY,
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          },
        }
      );

      const submissions = response.data.submissions;

      if (submissions.every((sub) => sub.status && sub.status.id > 2)) {
        return submissions;
      }

      attempts++;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error("Timeout waiting for results");
  } catch (error) {
    throw new Error(`Failed to get results: ${error.message}`);
  }
}

function processResults(testCases, batchResults) {
  const processedTestCases = [];
  let passedCount = 0;

  testCases.forEach((test, i) => {
    const result = batchResults[i] || {};
    const passed = result.stdout?.includes("PASSED") || false;
    if (passed) passedCount++;

    processedTestCases.push({
      ...test,
      passed,
      actualOutput: result.stdout || "",
      errorMessage: result.stderr || result.compile_output || "",
    });
  });

  return {
    summary: {
      totalTests: testCases.length,
      passedTests: passedCount,
      failedTests: testCases.length - passedCount,
    },
    testCases: processedTestCases,
  };
}

function createTestWrapper(code, language, test) {
  switch (language) {
    case "javascript":
      return `
${code}

try {
  const input = ${test.input};
  const expected = ${
    test.expectedOutput === "NaN" ? "NaN" : test.expectedOutput
  };
  const funcMatches = ${JSON.stringify(
    code
  )}.match(/function\\s+(\\w+)\\s*\\(/);
  const funcName = funcMatches ? funcMatches[1] : 'solution';
  const actual = eval(funcName)(input);
  
  // Output format: "RESULT: PASSED/FAILED [actual value]"
  if (String(expected) === 'NaN') {
    console.log("RESULT: " + (isNaN(actual) ? "PASSED " : "FAILED ") + actual);
  } else {
    console.log("RESULT: " + (actual == expected ? "PASSED " : "FAILED ") + actual);
  }
} catch (error) {
  console.log("RESULT: FAILED " + error.message);
}`;

    case "python":
      return `
${code}

import re, json, math

funcs = re.findall(r'def\\s+(\\w+)', '''${code}''')
func_name = funcs[-1] if funcs else 'solution'

try:
    input_data = json.loads('${test.input}')
    expected = ${
      test.expectedOutput === "NaN" ? 'float("nan")' : test.expectedOutput
    }
    result = locals()[func_name](input_data)
    
    # Output format: "RESULT: PASSED/FAILED [actual value]"
    if '${test.expectedOutput}' == 'NaN':
        print(f"RESULT: {'PASSED' if math.isnan(result) else 'FAILED'} {result}")
    else:
        print(f"RESULT: {'PASSED' if result == expected else 'FAILED'} {result}")
except Exception as e:
    print(f"RESULT: FAILED {str(e)}")`;

    case "cpp":
      return `
#include <iostream>
#include <vector>
#include <cmath>
#include <string>

${code}

int main() {
    try {
        std::string input_str = "${test.input}";
        std::vector<double> numbers;
        
        input_str = input_str.substr(1, input_str.length() - 2);
        size_t pos = 0;
        std::string token;
        while ((pos = input_str.find(',')) != std::string::npos) {
            token = input_str.substr(0, pos);
            if (!token.empty()) numbers.push_back(std::stod(token));
            input_str.erase(0, pos + 1);
        }
        if (!input_str.empty()) numbers.push_back(std::stod(input_str));
        
        double result = maxSubArray(numbers);
        
        // Output format: "RESULT: PASSED/FAILED [actual value]"
        if ("${test.expectedOutput}" == "NaN") {
            std::cout << "RESULT: " << (std::isnan(result) ? "PASSED " : "FAILED ") << result << std::endl;
        } else {
            double expected = std::stod("${test.expectedOutput}");
            std::cout << "RESULT: " << (std::abs(result - expected) < 0.0001 ? "PASSED " : "FAILED ") << result << std::endl;
        }
    } catch (...) {
        std::cout << "RESULT: FAILED Exception caught" << std::endl;
    }
    return 0;
}`;

    default:
      return code;
  }
}

module.exports = router;
