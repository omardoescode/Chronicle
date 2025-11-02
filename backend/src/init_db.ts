import fs from "fs";
import pool from "@/pool";
import path from "path";

const dir = path.resolve("./migrations");
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

for (const file of files) {
  console.log(`Processing file: ${file}`);
  const sql = fs.readFileSync(path.join(dir, file), "utf-8");
  await pool.query(sql);
  console.log(`Ended Processing file: ${file}`);
}

console.log("All migrations ran successfully");
process.exit(0);
