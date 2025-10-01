import { promises as fs } from "fs";
import db from "./db";
import path from "path";

export default function init(): Promise<void> {
  const filename = "scripts/init.sql";
  const dir = path.join(process.cwd(), filename);
  return fs
    .readFile(dir, "utf8")
    .catch((err) => {
      console.error(`file ${dir} doesn't exist`, err);
      throw err;
    })
    .then((sql) => {
      return db.query(sql);
    })
    .then(() => {
      console.log("Database has been initialized!");
    })
    .catch((err) => {
      console.error("Error initializing database:", err);
      throw err;
    });
}
