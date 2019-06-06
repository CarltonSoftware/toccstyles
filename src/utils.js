const fs = require('fs-extra');
const moment = require('moment');

module.exports = {
  getElementsDir: () => {
    return __dirname + '/elements.json';
  },
  getElementsJson: () => {
    var elementsFile = fs.readFileSync(
      module.exports.getElementsDir()
    ).toString();
    var json = JSON.parse(elementsFile.length > 0 ? elementsFile : '{}');
    
    if (!json) {
      json = {};
    }
    
    return json;
  },
  getScssDir: () => {
    return __dirname + '/scss/';
  },
  getCssDir: (version) => {
    return __dirname + '/../dist/' + version + '/';
  },
  getdir: (type, component) => { 
    return type + '/' + component;
  },
  getbranddir: (type, component, brand) => {
    return module.exports.getdir(type, component) + '/' + brand;
  },
  getcssfilepath: (type, component, brand) => {
    return module.exports.getbranddir(type, component, brand) + '/_' + component + '.scss';
  },
  fsCheckExists: (path) => {
    return fs.existsSync(path);
  },
  fsCheckAndCreateDirExists: (path) => { 
    if (!module.exports.fsCheckExists(path)) {
      fs.mkdirSync(path);
    }
  },
  getUtilLines: (path) => {
    var lines = [];

    // Include utility scss files
    lines.push('// Include Utilities');
    lines.push('@import \'' + path + '/index\';');
    
    return lines;
  },
  createScssFile: (basescsspath, author, responses, brand, brandname, additional) => {
    const cssFile = basescsspath + responses.type + '/' + brand + '/_' + responses.name + '.scss';
    fs.ensureFileSync(cssFile);
    var utillines = module.exports.getUtilLines(
      '../../utils'
    );
    
    fs.ensureFileSync(basescsspath + '/variables/_' +  brand + '.scss');
    
    // Write fonts file
    const fontsPath = basescsspath + '/fonts/_' +  brand + '.scss';
    if (!fs.existsSync(fontsPath)) {
      fs.ensureFileSync(fontsPath);
      fs.writeFileSync(
        fontsPath, [
          '@import \'vanilla\';',
          '@import \'../variables/' + brand + '\';'
        ].join('\n')
      );
    }

    utillines.push('');
    utillines.push('// Include global variables');
    utillines.push('@import \'../../variables/' + brand + '\';');
    
    if (fs.existsSync(cssFile)) {
      fs.unlinkSync(cssFile);
    }
    
    fs.writeFileSync(
      cssFile, [
        '/**',
        ' * TOCC Style Guide Element',
        ' * ',
        ' * @filename ' + '_' + responses.name + '.scss',
        ' * @brand    ' + brandname,
        ' * @name     ' + responses.name,
        ' * @author   ' + author,
        ' * @date     ' + moment().format('YYYY-MM-DD'),
        ' */'
      ].concat(utillines).concat(additional).join('\n')
    );
  }
};