const connect = require('tabsutils/utils/connect');
const clientUtils = require('tabsutils/utils/clientUtils');
const whoAmi = require('tabsutils/utils/whoAmi');
const fs = require('fs-extra');
const moment = require('moment');
const utils = require('./utils');
const basescsspath = __dirname + '/scss/';

(async function() {
  const instance = await connect();

  const me = await whoAmi(instance);

  var elementsSrcJson = JSON.parse(fs.readFileSync(
    utils.getElementsDir()
  ).toString());
  
  // Get marketing brands from client
  const marketingbrands = await clientUtils.getCollection(instance, 'MarketingBrand');
  
  for (const e in elementsSrcJson) {
    for (const i in elementsSrcJson[e]) {
      
      // Create marketing brand folders
      marketingbrands.forEach((mb, j) => {
        // Create brand variants
        utils.createScssFile(
          basescsspath,
          elementsSrcJson[e][i].createdby,
          {
            name: elementsSrcJson[e][i].name,
            description: elementsSrcJson[e][i].description,
            type: e
          },
          mb.id,
          mb.name,
          [
            '',
            '',
            '@import \'../vanilla/' + elementsSrcJson[e][i].name + '\';'
          ]
        );
      });
    }
  }
})();