// js/upload.js
document.addEventListener("DOMContentLoaded", () => {
  const codeEditor = document.getElementById("code-editor");
  const languageSelect = document.getElementById("language-select");
  const uploadFileBtn = document.getElementById("upload-file-btn");
  const codeFileInput = document.getElementById("code-file-input");
  const submitCodeBtn = document.getElementById("submit-code-btn");
  const resultsSection = document.getElementById("results-section");

  // File upload
  uploadFileBtn.addEventListener("click", () => codeFileInput.click());

  codeFileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      codeEditor.value = e.target.result;

      // Auto-detect language from file extension
      const extension = file.name.split(".").pop().toLowerCase();
      const extensionMap = {
        js: "javascript",
        py: "python",
        cpp: "cpp",
        c: "cpp",
      };

      if (extensionMap[extension]) {
        languageSelect.value = extensionMap[extension];
      }
    };
    reader.readAsText(file);
  });

  // Submit code
  submitCodeBtn.addEventListener("click", async () => {
    const code = codeEditor.value.trim();
    const language = languageSelect.value;

    if (!code || !language) {
      alert("Code and language required");
      return;
    }

    submitCodeBtn.disabled = true;
    submitCodeBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Running...';

    try {
      // Generate tests
      const testResponse = await fetch("/api/generate-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });

      if (!testResponse.ok) {
        const errorData = await testResponse.json();
        throw new Error(errorData.error || "Failed to generate tests");
      }

      const testResults = await testResponse.json();

      // Execute tests
      const executeResponse = await fetch("/api/execute-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language,
          testCases: testResults.testCases,
        }),
      });

      if (!executeResponse.ok) {
        const executeErrorData = await executeResponse.json();
        throw new Error(executeErrorData.error || "Failed to execute tests");
      }

      const executionResults = await executeResponse.json();

      // Store results for code fixer
      if (window.storeTestResults) {
        window.storeTestResults(testResults.testCases, executionResults);
      }

      displayTestResults(executionResults);
      resultsSection.classList.remove("hidden");
      resultsSection.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      submitCodeBtn.disabled = false;
      submitCodeBtn.innerHTML = '<i class="fas fa-play"></i> Run Tests';
    }
  });

  function displayTestResults(results) {
    // Update stats
    const stats = document.querySelectorAll(".stat-value");
    stats[0].textContent = results.summary.totalTests;
    stats[1].textContent = results.summary.passedTests;
    stats[2].textContent = results.summary.failedTests;

    // Display test cases
    const container = document.querySelector(".test-cases");
    container.innerHTML = "";

    results.testCases.forEach((test) => {
      const element = document.createElement("div");
      element.className = `test-case ${test.passed ? "passed" : "failed"}`;
      element.innerHTML = `
        <div class="test-info">
          <span class="test-icon">
            <i class="fas fa-${
              test.passed ? "check-circle" : "times-circle"
            }"></i>
          </span>
          <span class="test-name">${test.name}</span>
        </div>
        <div class="test-details" style="display: none;">
          <p>Input: ${test.input}</p>
          <p>Expected: ${test.expectedOutput}</p>
          ${test.actualOutput ? `<p>Actual: ${test.actualOutput}</p>` : ""}
          ${test.errorMessage ? `<p>Error: ${test.errorMessage}</p>` : ""}
        </div>
      `;

      // Toggle details on click
      const info = element.querySelector(".test-info");
      const details = element.querySelector(".test-details");
      info.addEventListener("click", () => {
        details.style.display =
          details.style.display === "none" ? "block" : "none";
      });

      container.appendChild(element);
    });
  }

  // Make it available globally
  window.displayTestResults = displayTestResults;
});
