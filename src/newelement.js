const connect = require('tabsutils/utils/connect');
const clientUtils = require('tabsutils/utils/clientUtils');
const prompt = require('tabsutils/utils/prompt');
const whoAmi = require('tabsutils/utils/whoAmi');
const fs = require('fs-extra');
const moment = require('moment');
const utils = require('./utils');
const { exec } = require('child_process');

(async function() {
  const instance = await connect();

  const responses = await prompt.getResponses([{
    type: 'select',
    name: 'type',
    message: 'What type of element do want to create?',
    choices: [
      { title: 'Element', value: 'element' },
      { title: 'Component', value: 'component' },
      { title: 'Trump', value: 'trump' }
    ]
  }, {
    type: 'text',
    name: 'name',
    message: 'Enter the element name you want to create.',
    validate: (value) => {
      if ((/^[a-z_-]+$/.test(value))) {
        return true;
      } else {
        return 'Only lower case letters with no additional formatting is allowed.';
      }
    }
  }, {
    type: 'text',
    name: 'description',
    message: 'Describe your element:'
  }]);

  const me = await whoAmi(instance);

  // Get elements file and add new element into it.
  var elementsSrcJson = utils.getElementsJson();

  if (!elementsSrcJson[responses.type]) {
    elementsSrcJson[responses.type] = [];
  }
  
  var testExists = elementsSrcJson[responses.type].filter((e) => {
    return e.name === responses.name;
  });
  if (testExists.length > 0) {
    throw new Error(responses.name + ' already exists');
  }

  elementsSrcJson[responses.type].push({
    name: responses.name,
    description: responses.description,
    createdby: me.getFullName()
  });

  fs.writeFileSync(
    utils.getElementsDir(),
    JSON.stringify(elementsSrcJson)
  );

  // Create vanilla type
  utils.createScssFile(
    utils.getScssDir(),
    me,
    responses,
    'vanilla',
    'Vanilla',
    []
  );
  
  exec('node ' + __dirname + '/createelements.js', (err, out) => {
    if (err) {
      console.error(err)
    }
    else {
      console.log(out)
    }
  });
})();