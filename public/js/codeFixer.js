// js/codeFixer.js
document.addEventListener("DOMContentLoaded", () => {
  const fixCodeBtn = document.getElementById("fix-code-btn");
  const codeFixesSection = document.getElementById("code-fixes-section");
  const analysisDetails = document.getElementById("analysis-details");
  const codeComparison = document.getElementById("code-comparison");
  const fixedCodeEditor = document.getElementById("fixed-code-editor");
  const testFixedCodeBtn = document.getElementById("test-fixed-code-btn");

  let currentTestResults = null;
  let currentCode = null;
  let currentLanguage = null;
  let storedTestCases = null;

  // Store test results for code fixer
  window.storeTestResults = function (testCases, results) {
    currentTestResults = results;
    currentCode = document.getElementById("code-editor").value;
    currentLanguage = document.getElementById("language-select").value;
    storedTestCases = testCases; // Save the test cases

    // Show fix button if there are failed tests
    const failedTests = results.testCases.filter((test) => !test.passed);
    fixCodeBtn.style.display = failedTests.length > 0 ? "inline-block" : "none";
  };

  fixCodeBtn.addEventListener("click", async () => {
    if (!currentTestResults || !currentCode) return;

    fixCodeBtn.disabled = true;
    fixCodeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fixing...';
    codeFixesSection.classList.remove("hidden");

    try {
      const response = await fetch("/api/code-fixer/generate-fixes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: currentCode,
          language: currentLanguage,
          testCases: currentTestResults.testCases,
          testResults: currentTestResults,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate fixes");
      }

      const fixData = await response.json();

      // Display analysis
      analysisDetails.textContent = fixData.analysis;

      // Show fixed code if changes needed
      if (fixData.requiresChanges && fixData.fixedCode) {
        codeComparison.classList.remove("hidden");
        fixedCodeEditor.value = fixData.fixedCode;
      } else {
        codeComparison.classList.add("hidden");
      }
    } catch (error) {
      console.error("Error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      fixCodeBtn.disabled = false;
      fixCodeBtn.innerHTML = '<i class="fas fa-wrench"></i> Fix My Code';
    }
  });

  testFixedCodeBtn.addEventListener("click", async () => {
    const fixedCode = fixedCodeEditor.value;
    if (!fixedCode || !storedTestCases || !currentLanguage) return;

    testFixedCodeBtn.disabled = true;
    testFixedCodeBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Testing...';

    try {
      const executeResponse = await fetch("/api/execute-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: fixedCode,
          language: currentLanguage,
          testCases: storedTestCases,
        }),
      });

      if (!executeResponse.ok) {
        const errorData = await executeResponse.json();
        throw new Error(errorData.error || "Failed to execute tests");
      }

      const executionResults = await executeResponse.json();

      // Update the main code editor with fixed code
      document.getElementById("code-editor").value = fixedCode;

      // Display the new results
      if (window.displayTestResults) {
        window.displayTestResults(executionResults);
      }

      // Update the stored results
      window.storeTestResults(storedTestCases, executionResults);

      // Scroll to results
      document
        .getElementById("results-section")
        .scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      testFixedCodeBtn.disabled = false;
      testFixedCodeBtn.innerHTML =
        '<i class="fas fa-play"></i> Test Fixed Code';
    }
  });
});
