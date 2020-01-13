require('dotenv').config();
const AWS = require("aws-sdk"); // from AWS SDK
const fs = require("fs"); // from node.js
const path = require("path"); // from node.js

// configuration
const config = {
  accessKeyId: process.env.S3_KEY,
  secretAccessKey: process.env.S3_SECRET
};

// initialize S3 client
const s3 = new AWS.S3(config);

const testResultsPath = __dirname + '/../dist';

const walkSync = (currentDirPath, callback) => {
  fs.readdirSync(currentDirPath).forEach((name) => {
    const filePath = path.join(currentDirPath, name);
    const stat = fs.statSync(filePath);
    if (stat.isFile()) {
      callback(filePath, stat);
    } else if (stat.isDirectory()) {
      walkSync(filePath, callback);
    }
  });
};

walkSync(testResultsPath, async (filePath) => {
  const file = filePath.split('/dist/').pop();
  const extn = file.split('.').pop();

  let contentType = 'application/octet-stream';
  if (extn == 'html') contentType = "text/html";
  if (extn == 'css') contentType = "text/css";
  if (extn == 'js') contentType = "application/javascript";
  if (extn == 'png' || extn == 'jpg' || extn == 'gif') contentType = "image/" + extn;

  let params = {
    Bucket: 'toccstyles',
    Key: filePath.split('/dist/').pop(),
    Body: fs.readFileSync(filePath),
    ContentType: contentType,
    ACL: 'public-read',
    CacheControl: 'public, max-age=86400'
  };
  try {
    await s3.putObject(params).promise().catch((err) => {
      console.error(err);
    });
  } catch (error) {
    console.error(error);
  }
});
