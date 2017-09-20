#! /usr/bin/env node
"use strict"
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const opt = require('node-getopt').create([
    ['h', 'help', 'Display this help'],
    ['o', 'output=FILE', 'File to write merged output to.'],
    ['w', 'working-dir=DIR', 'Directory holding the cpp files.'],
    ['e', 'exclude-dir=DIR', 'Directory in the working dir to exclude from the merge.'],
    ['m', 'main-file=FILE', 'File to start with']
  ])
  .bindHelp()
  .parseSystem();

var workDir = opt.options['working-dir'] ? opt.options['working-dir'] : '.';
var outputFile = opt.options['output'] ? opt.options['output'] : 'merged';
var excludeDir = opt.options['exclude-dir'] ? opt.options['exclude-dir'] : 'generated';
var mainFile = opt.options['main-file'] ? path.join(workDir, opt.options['main-file']): null;
var mainIsProcessed = false;
var processOnce = []; //Array holds files which had '#pragma once'

//Wipe file to start
fs.writeFileSync(outputFile, "");


if (mainFile) {
  processFile(mainFile, false);
  mainIsProcessed = true;
}

processDir(workDir);


function processDir(dir)
{
  let nodes = fs.readdirSync(dir);
  for (let i = 0; i < nodes.length; i++)
  {
    let node = nodes[i];
    let fullPath = path.join(dir, node);
    let stat = fs.statSync(fullPath);
    if (stat.isDirectory() && path.basename(fullPath) != excludeDir) {
      processDir(fullPath);
    } else if (stat.isFile()) {
      processFile(fullPath, false);
    }
  }
}

function processFile(file, include) {
  if (file === mainFile && mainIsProcessed) {
    return; //Main can be processed on its own at the start
  } else if (path.extname(file) == ".hpp" && !include) {
    return;
  } else if (path.extname(file) == ".cpp") {
    console.log('Processing ' + file);
    fs.appendFileSync(outputFile, "/*-- File: " + file + " start --*/\n");
  } else if (path.extname(file) == ".hpp" || path.extname(file) == ".h") {
    console.log("Including: ", file);
    fs.appendFileSync(outputFile, "/*-- #include \"" + file + "\" start --*/\n");
  } else {
    //File can be ignored
    return;
  }

  let processedOnce = false;
  for (let i = 0; i < processOnce.length; i++) {
    if (processOnce[i] == file) {
      processedOnce = true;
      break;
    }
  }

  if (!processedOnce) {
    let fileContent = fs.readFileSync(file, {encoding: "utf8"});
    let lines = fileContent.split("\n");
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (line.indexOf("#include \"") >= 0) {
        let includedFile = line.substring(line.indexOf("\"") + 1, line.lastIndexOf("\""));
        includedFile = path.join(path.dirname(file), includedFile);
        processFile(includedFile, true);
      } else if (line.indexOf("#pragma once") >= 0) {
        processOnce.push(file);
      } else {
        fs.appendFileSync(outputFile, line + "\n");
      }
    }
  }

  if (path.extname(file) == ".cpp") {
    fs.appendFileSync(outputFile, "/*-- File: " + file + " end --*/\n");
  } else if (path.extname(file) == ".hpp") {
    fs.appendFileSync(outputFile, "/*-- #include \"" + file + "\" end --*/\n");
  }
}
