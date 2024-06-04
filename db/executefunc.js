const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Create a PostgreSQL client

const connectionString = 'postgres://postgres.iiqlttgnfgjnysnxogdj:ZS717M9lRl2Cxfeb@aws-0-ap-south-1.pooler.supabase.com:5432/postgres'; //change your database connection string

// Create a PostgreSQL client using the connection string
const client = new Client({
  connectionString: connectionString
});

client.connect();
const functionDir = 'db/functions';

fs.readdir(functionDir, (err, files) => {
  if (err) {
    console.error('Error reading directory:', err);
    client.end();
    return;
  }

  let queryCount = 0;

  files.forEach(file => {
    const filePath = path.join(functionDir, file);
    fs.readFile(filePath, 'utf8', (err, sql) => {
      if (err) {
        console.error(`Error reading file ${filePath}:`, err);
        return;
      }
      
      client.query(sql, (err, res) => {
        if (err) {
          console.error(`Error executing function from file ${filePath}:`, err);
          return;
        }
        console.log(`Function from file ${filePath} executed successfully`);

        queryCount++;

        if (queryCount === files.length) {
          client.end();
        }
      });
    });
  });
});
