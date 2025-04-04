// js/upload.js
document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  const codeEditor = document.getElementById("code-editor");
  const languageSelect = document.getElementById("language-select");
  const uploadFileBtn = document.getElementById("upload-file-btn");
  const codeFileInput = document.getElementById("code-file-input");
  const clearEditorBtn = document.getElementById("clear-editor-btn");
  const submitCodeBtn = document.getElementById("submit-code-btn");
  const resultsSection = document.getElementById("results-section");

  // Handle file upload button click
  uploadFileBtn.addEventListener("click", () => {
    codeFileInput.click();
  });

  // Handle file selection
  codeFileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (limit to 1MB)
    if (file.size > 1024 * 1024) {
      alert("File size exceeds 1MB limit. Please choose a smaller file.");
      return;
    }

    // Automatically set language based on file extension
    const fileExtension = file.name.split(".").pop().toLowerCase();
    setLanguageFromExtension(fileExtension);

    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      codeEditor.value = e.target.result;
    };
    reader.readAsText(file);
  });

  // Clear editor content
  clearEditorBtn.addEventListener("click", () => {
    codeEditor.value = "";
    codeEditor.focus();
  });

  // Submit code for testing (currently just shows the results section)
  submitCodeBtn.addEventListener("click", () => {
    if (!validateCodeSubmission()) {
      return;
    }

    // For now, we're just displaying the static results section
    resultsSection.classList.remove("hidden");

    // Scroll to results section
    resultsSection.scrollIntoView({ behavior: "smooth" });
  });

  // Validate code submission
  function validateCodeSubmission() {
    const code = codeEditor.value.trim();
    const language = languageSelect.value;

    if (!code) {
      alert("Please enter or upload some code first.");
      codeEditor.focus();
      return false;
    }

    if (!language) {
      alert("Please select a programming language.");
      languageSelect.focus();
      return false;
    }

    return true;
  }

  // Set language dropdown based on file extension
  function setLanguageFromExtension(extension) {
    const extensionToLanguage = {
      js: "javascript",
      py: "python",
      java: "java",
      cpp: "cpp",
      c: "cpp",
      cs: "csharp",
      php: "php",
    };

    const language = extensionToLanguage[extension];
    if (language && hasLanguageOption(language)) {
      languageSelect.value = language;
    }
  }

  // Check if language is in the dropdown options
  function hasLanguageOption(language) {
    return [...languageSelect.options].some(
      (option) => option.value === language
    );
  }
});
