// debug.js - Separate debug utility to avoid circular dependencies
function debug(label, data) {
  console.log(`\n===== DEBUG: ${label} =====`);
  console.log(data);
  console.log("===========================\n");
}

module.exports = debug;
