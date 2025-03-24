// server.js
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (CSS, JS, images) from public folder
app.use(express.static(path.join(__dirname, "public")));

// Serve the proposal page
app.use("/proposal", express.static(path.join(__dirname, "proposal")));

// Default route
app.get("/", (req, res) => {
  res.send("Welcome to TestForge!");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
