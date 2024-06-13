const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
require('dotenv').config({ path: '.env.local' });

// Create a PostgreSQL client using the connection string
const connectionString = process.env.DIRECT_URL;
const client = new Client({
  connectionString: connectionString,
});

client.connect();
const functionDir = "db/policies";

function readFilesRecursive(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      readFilesRecursive(filePath, fileList);
    } else if (path.extname(file) === ".sql") {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const sqlFiles = readFilesRecursive(functionDir);
let queryCount = 0;

if (sqlFiles.length === 0) {
  console.log("No SQL files found.");
  client.end();
  process.exit(1);
}

sqlFiles.forEach((filePath) => {
  fs.readFile(filePath, "utf8", (err, sql) => {
    if (err) {
      console.error(`Error reading file ${filePath}:`, err);
      return;
    }

    client.query(sql, (err, res) => {
      if (err) {
        console.error(`Error executing policy from file ${filePath}:`, err);
        return;
      }
      console.log(`Policy from file ${filePath} executed successfully.`);

      queryCount++;

      if (queryCount === sqlFiles.length) {
        client.end();
        console.log("Your RLS policies are up and ready!");
        process.exit(1);
      }
    });
  });
});
