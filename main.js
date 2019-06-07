const packageJson = require('./package.json');
const elements = require('./src/elements.json');
module.exports = {
  version: packageJson.version,
  elements: elements
};