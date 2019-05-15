'use strict';

const clearConsole = require('react-dev-utils/clearConsole');
const path = require('path');
const fse = require('fs-extra');
const chalk = require('chalk');
let tempJson = {};
let clientJsonPath = null;
let checked = false;
let resultPaths = null;

const packageJsonVarName = 'createReactAppCustomConfig';

// Configurables structure
const configurables = {
  appPath: '',
  appBuild: '',
  appPublic: '',
  appHtml: '',
  appIndexJs: '',
  appTsConfig: '',
  appJsConfig: '',
  webpackFile: '',
  preCompileScript: '',
  postCompileScript: '',
};

// Chalk for alert, normal, warn, info and ok messages
const a = chalk.red;
const n = chalk.reset;
const w = chalk.yellow;
const i = chalk.cyan;
const o = chalk.green;

class CustomConfig {
  constructor() {
    this.givenPaths = {};
    this.clientJsonData = {};
    this.customConfigData = {};
    this.resultPaths = {};
    this.needsDelete = false;
    this.needsCreate = false;
    this.needsRepair = false;
    this.proceedAsUsual = false;
  }

  // INIT POINT
  customizedPaths(givenPaths) {
    if (!resultPaths) {
      clearConsole();
      this.givenPaths = givenPaths;
      this.checkForCustomOptions();
      this.checkForCustomConfig();
    }
    return this.proceedAsUsual ? givenPaths : resultPaths;
  }

  checkForCustomOptions() {
    this.needsDelete = this.hasOption('deleteCustomConfiguration');
    this.needsCreate = this.hasOption('createCustomConfiguration');
    this.needsRepair = this.hasOption('repairCustomConfiguration');
  }

  checkForCustomConfig() {
    const jsonPath = this.givenPaths.appPackageJson;
    printAction('Checking for package.json...');
    if (!fse.pathExistsSync(jsonPath)) {
      printWithPrevSpacesAndIndent(
        [a(`No package.json detected`), a(`${jsonPath}`)],
        1
      );
      bottomMessage();
      process.exit(1);
    }

    printOkMessage('Package.json detected.');
    this.clientJsonData = fse.readJsonSync(jsonPath);

    printAction('Checking for Custom Configuration Data...');
    if (!this.clientJsonData[packageJsonVarName]) {
      if (this.needsCreate) {
        printOkMessage('No custom data detected, creating it.');
        this.createCustomConfig();
      }

      printWithPrevSpacesAndIndent([
        i(`No custom data detected, proceeding as usual.`),
        '',
        '',
      ]);
      this.proceedAsUsual = true;
      return;
    }

    if (this.needsDelete) {
      printOkMessage('Custom Configuration detected, deleting it.');
      this.deleteCustomConfig();
    }

    if (this.needsRepair) {
      this.repairCustomConfig();
    }

    printOkMessage('Custom configuration detected.');
    this.customConfigData = this.clientJsonData[packageJsonVarName];
    this.validateCustomConfiguration();
  }

  validateCustomConfiguration() {
    if (
      Object.keys(this.customConfigData).length !==
      Object.keys(configurables).length
    ) {
      printWithPrevSpacesAndIndent(
        [
          a(`Custom configuration is not properly formatted, please try`),
          '',
          'Using npm:',
          i('npm start --repairCustomConfiguration'),
          '',
          'Using yarn:',
          i('yarn start --repairCustomConfiguration'),
        ],
        1
      );
      bottomMessage();
      process.exit(1);
    }

    const invalidFiles = [];
    const validPaths = {};
    const appPath = this.givenPaths.appPath;

    Object.keys(this.customConfigData).forEach(k => {
      const filePath = this.customConfigData[k];
      const elemPath = path.resolve(appPath, filePath);

      if (filePath !== '' && fse.pathExistsSync(elemPath)) {
        validPaths[k] = elemPath;
      } else if (filePath !== '') {
        invalidFiles.push(elemPath);
      }
    });

    if (invalidFiles.length > 0) {
      printWithPrevSpacesAndIndent(
        [
          a(`Custom configuration has invalid paths:`),
          ...[invalidFiles],
          '',
          i('Please review or leave those properties empty, then try again.'),
        ],
        1
      );
      bottomMessage();
      process.exit(1);
    }

    printOkMessage('Valid configuration detected.');
    resultPaths = Object.assign({}, this.givenPaths, validPaths);
    console.log('');
    console.log('');
  }

  hasOption(optionName) {
    const arg = JSON.parse(process.env.npm_config_argv);
    return (
      arg.cooked.indexOf(`--${optionName}`) > -1 ||
      arg.original.indexOf(`--${optionName}`) > -1
    );
  }

  deleteCustomConfig() {
    printAction('Deleting Custom Configuration...');
    delete this.clientJsonData[packageJsonVarName];
    fse.writeJSONSync(this.givenPaths.appPackageJson, this.clientJsonData, {
      spaces: 4,
    });
    printOkMessage('Custom Configuration Deleted.');
    bottomMessage();
    process.exit(0);
  }

  createCustomConfig() {
    printAction('Creating Custom Configuration...');
    this.clientJsonData[packageJsonVarName] = configurables;
    fse.writeJSONSync(this.givenPaths.appPackageJson, this.clientJsonData, {
      spaces: 4,
    });
    printOkMessage('Custom Configuration Created.');
    bottomMessage();
    process.exit(0);
  }

  repairCustomConfig() {
    printAction('Deleting Custom Configuration...');
    delete this.clientJsonData[packageJsonVarName];
    fse.writeJSONSync(this.givenPaths.appPackageJson, this.clientJsonData, {
      spaces: 4,
    });
    printOkMessage('Custom Configuration Deleted.');
    process.exit(1);
  }
}

// M E S S A G I N G
function printAction(message) {
  printWithPrevSpacesAndIndent([w(message)], 1, '');
}

function printOkMessage(message) {
  printWithPrevSpacesAndIndent([o(`✅   ${message}`)]);
}

function printWithPrevSpacesAndIndent(
  messages,
  prevSpaces,
  indentation = '    '
) {
  if (prevSpaces) {
    for (let j = 0; j < prevSpaces; j++) {
      messages = [''].concat(messages);
    }
  }
  messages.forEach(function(m) {
    console.log(`${indentation}${m}`);
  });
}

function bottomMessage() {
  printWithPrevSpacesAndIndent(
    [
      '---------------------------CUSTOM CONFIGURATION-------------------------',
      '',
      '',
    ],
    2
  );
}

module.exports = new CustomConfig();
