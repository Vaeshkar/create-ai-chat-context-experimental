const { migrateToAICF } = require("./src/aicf-migrate");

console.log("Starting migration...");

migrateToAICF()
  .then((result) => {
    console.log("✅ SUCCESS");
    console.log("Result:", JSON.stringify(result.index, null, 2));
  })
  .catch((e) => {
    console.error("❌ ERROR:", e.message);
    console.error(e.stack);
  });
