// js/results.js
document.addEventListener("DOMContentLoaded", () => {
  // This is a placeholder implementation for now
  // In a real scenario, these would be dynamically generated based on API responses

  // Get DOM elements
  const testCases = document.querySelectorAll(".test-case");

  // Add click event to expand/collapse test details
  testCases.forEach((testCase) => {
    const testInfo = testCase.querySelector(".test-info");
    const testDetails = testCase.querySelector(".test-details");

    // Initially hide test details
    testDetails.style.display = "none";

    testInfo.addEventListener("click", () => {
      // Toggle test details visibility
      if (testDetails.style.display === "none") {
        testDetails.style.display = "block";
      } else {
        testDetails.style.display = "none";
      }
    });
  });

  // For demonstration, we'll simulate updating test stats
  updateTestStats();

  function updateTestStats() {
    const passedTests = document.querySelectorAll(".test-case.passed").length;
    const failedTests = document.querySelectorAll(".test-case.failed").length;
    const totalTests = passedTests + failedTests;

    // Update stats display
    const statElements = document.querySelectorAll(".stat-value");
    if (statElements.length >= 3) {
      statElements[0].textContent = totalTests;
      statElements[1].textContent = passedTests;
      statElements[2].textContent = failedTests;
    }
  }
});
