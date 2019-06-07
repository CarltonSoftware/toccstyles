const connect = require('tabsutils/utils/connect');
const clientUtils = require('tabsutils/utils/clientUtils');
const prompt = require('tabsutils/utils/prompt');
const whoAmi = require('tabsutils/utils/whoAmi');
const fs = require('fs-extra');
const utils = require('./utils');
const packageJson = require('../package.json');
const basecsspath = utils.getCssDir(packageJson.version);
const basescsspath = utils.getScssDir();
const getdir = utils.getdir;
const getbranddir = utils.getbranddir;
const getfilepath = utils.getfilepath;
const fsCheckExists = utils.fsCheckExists;
const fsCheckAndCreateDirExists = utils.fsCheckAndCreateDirExists;
const sass = require('node-sass');
const { exec } = require('child_process');

// Create each css for the brands
(async function() {
  const instance = await connect();

  // Get elements json
  var types = utils.getElementsJson();

  // Remove css directory and recreate
  fs.emptyDirSync(basecsspath);

  // Loop through all of the brands to create a new file
  const marketingbrands = await clientUtils.getCollection(instance, 'MarketingBrand');
  marketingbrands.push({ id: 'vanilla' })
  marketingbrands.forEach((mb) => {
    const baseCssPath = basecsspath + mb.id;
    const scssPath = basescsspath + mb.id + '.scss';

    // Start creating the main css file
    var lines = [
      '',
      ''
    ];

    var utillines = utils.getUtilLines(
      'utils'
    );
    lines = lines.concat(utillines);
    lines.push('');
    lines.push('');
    
    // Create font file for the marketing brand
    const fontPath = basecsspath + 'fonts/' + mb.id + '.css';
    fs.ensureFileSync(fontPath);

    if (fsCheckExists(fontPath)) {
      fs.unlinkSync(fontPath);
    }
    
    const scssToString = (s) => {
      return s.css.toString().replace(/\/\*[^*]*\*+([^\/][^*]*\*+)*\//, '')//.replace(/\/fonts\//g, '../../fonts/');
    };

    fs.writeFileSync(
      fontPath,
      scssToString(
        sass.renderSync({
          file: basescsspath + 'fonts/_' + mb.id + '.scss',
          sourceMap: true,
          outputStyle: 'expanded',
          includePaths: ['node_modules/']
        })
      )
    );

    // Loop through all of the different types of elements
    for (const t in types) {
      lines.push('// Include ' + t.charAt(0).toUpperCase() + t.slice(1) + 's');

      // Loop through all of the different elements in said type
      for (const c in types[t]) {
        
        const path = baseCssPath + '/' + t + '/' + types[t][c].name + '/' + types[t][c].name + '.css';
        
        // Create directory
        fs.ensureFileSync(path);

        // Create the element css file with the utilities plus the
        // included element file from the marketing brand directory
        fs.writeFileSync(
          path,
          scssToString(
            sass.renderSync({
              data: utils.getUtilLines(basescsspath + 'utils').concat(
                [
                  '@import \'' + basescsspath + t + '/' + mb.id + '/' + types[t][c].name + '\';'
                ]
              ).join('\n'),
              outputStyle: 'expanded',
              includePaths: ['node_modules/']
            })
          )
        );

        // Add element import to main css file
        lines.push('@import \'' + t + '/' + mb.id + '/' + types[t][c].name + '\';');
      }

      // Bit of padding to make it look nicer
      lines.push('');
      lines.push('');
    }

    // Remove index.scss file
    if (fsCheckExists(scssPath)) {
      fs.unlinkSync(scssPath);
    }

    // Create new index.scss file with components
    fs.writeFileSync(
      scssPath,
      lines.join('\n')
    );

    // Build new file
    const result = sass.renderSync({
      file: scssPath,
      sourceMap: true,
      outputStyle: 'expanded',
      includePaths: ['node_modules/']
    });

    // Remove index css file
    if (fsCheckExists(baseCssPath + '/index.css')) {
      fs.unlinkSync(baseCssPath + '/index.css');
    }

    fs.writeFileSync(
      baseCssPath + '/index.css',
      scssToString(result)
    );

    // Remove map file
    if (fsCheckExists(baseCssPath + '/index.css.map')) {
      fs.unlinkSync(baseCssPath + '/index.css.map');
    }

    if (result.map) {
      fs.writeFileSync(
        baseCssPath + '/index.css.map',
        JSON.stringify(result.map)
      );
    }
  });
  
  exec('cp -R ' + __dirname + '/scss/fonts ' + __dirname + '/../dist/' + packageJson.version + ' && find ' + __dirname + '/../dist/' + packageJson.version + '/fonts -name \"*.scss\" -type f -delete', (err, out) => {
    if (err) {
      console.error(err)
    } else {  
      console.log('Starting s3 upload');
      exec('node ' + __dirname + '/uploadToS3.js', (err, out) => {
        if (err) {
          console.error(err)
        } else {
          console.log(out)
        }
      });
    }
  });

})();