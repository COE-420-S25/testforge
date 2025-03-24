const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from /public
app.use(express.static(path.join(__dirname, "public")));

// Serve proposal folder statically at /proposal
app.use("/proposal", express.static(path.join(__dirname, "proposal")));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
