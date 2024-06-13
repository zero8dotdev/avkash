const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

// Create a PostgreSQL client
const connectionString = process.env.DIRECT_URL;

// Create a PostgreSQL client using the connection string
const client = new Client({
  connectionString: connectionString,
});

client.connect();
const functionDir = "db/table";

fs.readdir(functionDir, (err, files) => {
  if (err) {
    console.error("Error reading directory:", err);
    client.end();
    return;
  }

  let queryCount = 0;

  files.forEach((file) => {
    const filePath = path.join(functionDir, file);
    fs.readFile(filePath, "utf8", (err, sql) => {
      if (err) {
        console.error(`Error reading file ${filePath}:`, err);
        return;
      }

      client.query(sql, (err, res) => {
        if (err) {
          console.error(`Error creating tables from file ${filePath}:`, err);
          return;
        }
        console.log(`Create Tables from file ${filePath} executed successfully.`);

        queryCount++;

        if (queryCount === files.length) {
          client.end();
          console.log("Your Tables are up and ready!");
          process.exit(1);
        }
      });
    });
  });
});
