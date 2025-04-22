// server.js
const express = require("express");
const cors = require("cors");
const path = require("path"); // Added path module
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/proposal", express.static("proposal")); // Added static route for proposal folder

// Request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Load route modules
const testGenerator = require("./backend/api/testGenerator");
const codeExecutor = require("./backend/api/codeExecutor");
const codeFixer = require("./backend/api/codeFixer");

// Define routes
app.use("/api", testGenerator);
app.use("/api", codeExecutor);
app.use("/api/code-fixer", codeFixer);

// Error handling
app.use((err, req, res, next) => {
  console.error(`ERROR: ${req.path} - ${err.message}`);
  res.status(500).json({ error: "Server error", message: err.message });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(
    `Claude API Key: ${process.env.CLAUDE_API_KEY ? "Set" : "Missing"}`
  );
  console.log(
    `Judge0 API Key: ${process.env.JUDGE0_API_KEY ? "Set" : "Missing"}`
  );
});

// Simple debug function for others to use
function debug(label, data) {
  if (process.env.DEBUG === "true") console.log(`DEBUG ${label}:`, data);
}
module.exports = { debug };
