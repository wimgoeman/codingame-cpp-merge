#! /usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const opt = require('node-getopt')
  .create([
    ['h', 'help', 'Display this help'],
    ['o', 'output=FILE', 'File to write merged output to.'],
    ['w', 'working-dir=DIR', 'Directory holding the cpp files.'],
    [
      'e',
      'exclude-dir=DIR',
      'Directory in the working dir to exclude from the merge.',
    ],
    ['m', 'main-file=FILE', 'File to start with'],
  ])
  .bindHelp()
  .parseSystem();

const setWithDefault = (value, defaultValue) => (value ? value : defaultValue);

var workDir = setWithDefault(opt.options['working-dir'], '.');
var outputFile = setWithDefault(opt.options['output'], 'merged');
var excludeDir = setWithDefault(opt.options['exclude-dir'], 'generated');
var mainFile = opt.options['main-file']
  ? path.join(workDir, opt.options['main-file'])
  : undefined;
var mainIsProcessed = false;

// Array holds files which had '#pragma once'
var processOnce = [];

// Wipe file to start
fs.writeFileSync(outputFile, '');

if (mainFile) {
  processFile(mainFile);
  mainIsProcessed = true;
}

processDir(workDir);

function processDir(dir) {
  const nodes = fs.readdirSync(dir);
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const fullPath = path.join(dir, node);
    let stat = fs.statSync(fullPath);
    if (stat.isDirectory() && path.basename(fullPath) != excludeDir) {
      processDir(fullPath);
    } else if (stat.isFile()) {
      processFile(fullPath);
    }
  }
}

function processFile(file) {
  const fileExt = path.extname(file);
  const fileIsSource = fileExt === '.cpp' || fileExt === '.c';
  const fileIsHeader = fileExt === '.hpp' || fileExt === '.h';
  if (
    processOnce.includes(file) ||
    (file === mainFile && mainIsProcessed) ||
    file === outputFile ||
    !(fileIsHeader || fileIsSource)
  )
    return;

  if (fileIsSource) {
    console.log(`Processing ${file}`);
    fs.appendFileSync(outputFile, `/*-- File: ${file} start --*/\n`);
  } else {
    console.log('Including: ', file);
    fs.appendFileSync(outputFile, `/*-- #include "${file}" start --*/\n`);
  }

  let fileContent = fs.readFileSync(file, { encoding: 'utf8' });
  fileContent.split('\n').forEach((line) => {
    const matchInclude = line.match(/#include \"([^"]+)\"/);
    if (matchInclude) {
      matchInclude[1] = path.join(path.dirname(file), matchInclude[1]);
      processFile(matchInclude[1], true);
      return;
    }
    const matchPragma = line.match(/#pragma once/);
    if (matchPragma) {
      processOnce.push(file);
      return;
    }
    fs.appendFileSync(outputFile, line + '\n');
  });

  if (fileIsSource) {
    fs.appendFileSync(outputFile, `/*-- File: ${file} end --*/\n`);
  } else {
    fs.appendFileSync(outputFile, `/*-- #include ${file} end --*/\n`);
  }
}
