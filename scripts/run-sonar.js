/* eslint-disable @typescript-eslint/no-require-imports */
const { spawn } = require('child_process');
const path = require('path');

const proj = process.cwd();
const jar = path.join(proj, 'node_modules', 'sonar-scanner', 'lib', 'sonar-scanner-cli-3.1.0.1141.jar');
const scannerHome = path.join(proj, 'node_modules', 'sonar-scanner');

const args = [
  '-Djava.awt.headless=true',
  '-cp',
  jar,
  `-Dscanner.home=${scannerHome}`,
  `-Dproject.home=${proj}`,
  'org.sonarsource.scanner.cli.Main',
  '-Dsonar.javascript.lcov.reportPaths=coverage/lcov.info'
];

const java = spawn('java', args, { stdio: 'inherit' });

java.on('close', (code) => {
  process.exit(code);
});

java.on('error', (err) => {
  console.error('Failed to start java:', err);
  process.exit(1);
});
