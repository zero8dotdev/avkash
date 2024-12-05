const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

// Create a PostgreSQL client
const connectionString = process.env.SUPABASE_DIRECT_URL;
(async function () {
  if (!connectionString) {
    throw new Error(
      "Supabase connection URL is not specified. Please check your `.env.local file.`"
    );
    process.exit(0);
  }

  const client = new Client({
    connectionString: connectionString,
  });
  client.connect();

  const dirPath = process.argv[2];

  try {
    const sqlFiles = fs.readdirSync(dirPath, { recursive: true });

    let sqlFilesCount = sqlFiles.filter((fileName) =>
      fileName.includes(".sql")
    ).length;

    let queryCount = 0;

    sqlFiles.forEach((fileName) => {
      if (fs.lstatSync(path.join(dirPath, fileName)).isDirectory()) {
        return;
      }

      try {
        const fileContent = fs.readFileSync(
          path.join(dirPath, fileName),
          "utf8"
        );

        // run sql query
        client.query(fileContent, (error, response) => {
          if (error) {
            console.error(
              `Error executing function from file ${path.join(
                dirPath,
                fileName
              )}:`,
              error
            );
            return;
          }
          console.log(
            `Function from file ${path.join(
              dirPath,
              fileName
            )} executed successfully.`
          );

          queryCount++;

          if (queryCount === sqlFilesCount) {
            client.end();
            console.log("Your Functions are up and ready!");
            process.exit(1);
          }
        });
      } catch (error) {
        throw error;
        // throw new Error(`Not able to read ${file} file.`);
        process.exit(0);
      }
    });
  } catch (error) {
    throw error;
    // throw new Error(`Specified path ${dirPath} is not present.`);
    client.end();
    process.exit(0);
  }
})();
