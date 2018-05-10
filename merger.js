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
    ['m', 'main-file=FILE', 'File to start with'],
    ['',  'ignore-cpp', 'Ignore cpp files other than main-file'],
  ])
  .bindHelp()
  .parseSystem();

var workDir = opt.options['working-dir'] ? opt.options['working-dir'] : '.';
var outputFile = opt.options['output'] ? opt.options['output'] : 'merged';
var excludeDir = opt.options['exclude-dir'] ? opt.options['exclude-dir'] : 'generated';
var mainFile = opt.options['main-file'] ? path.join(workDir, opt.options['main-file']): null;
var ignoreCpp = opt.options['ignore-cpp'] ? true : false;
var mainIsProcessed = false;
var processOnce = []; //Array holds files which had '#pragma once'

//Wipe file to start
fs.writeFileSync(outputFile, "");


if (mainFile) {
  processFile(mainFile, false);
  mainIsProcessed = true;
}

if (!ignoreCpp) {
  if (!mainFile) console.error('Must use -m with --ignore-cpp')
  processDir(workDir);
}


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
  let processedOnce = false;
  for (let i = 0; i < processOnce.length; i++) {
    if (processOnce[i] == file) {
      processedOnce = true;
      break;
    }
  }
 
  if (file === mainFile && mainIsProcessed || file == outputFile) {
    return; //Main can be processed on its own at the start
  } else if (['.hpp', '.h', ".hh", ".H", ".hxx", ".h++"].includes(path.extname(file)) && !include) {
    return;
  } else if (['.cpp', '.cc', ".C", ".cxx", ".c++"].includes(path.extname(file))) {
    console.log('Processing ' + file);
    fs.appendFileSync(outputFile, "/*-- File: " + file + " start --*/\n");
  } else if (['.hpp', '.h', ".hh", ".H", ".hxx", ".h++"].includes(path.extname(file))) {
    console.log("Including: ", file);
    fs.appendFileSync(outputFile, "/*-- #include \"" + file + "\" start --*/\n");
  } else {
    //File can be ignored
    return;
  }


  if (!processedOnce) {
    let fileContent = fs.readFileSync(file, {encoding: "utf8"});
    let lines = fileContent.split("\n");
    // ignore other source files containing main definition
    if (mainfile && file != mainFile && lines.filter(line => line.indexOf("int main(") >= 0).length > 0) {
      console.log("Ignore other main source files: " + file);
      fs.appendFileSync(outputFile, "/*-- File: " + file + " ignored --*/\n");
      return;
    }
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

  var extname = path.extname(file);
  if (['.cpp', '.cc', ".C", ".cxx", ".c++"].includes(extname)) {
    fs.appendFileSync(outputFile, "/*-- File: " + file + " end --*/\n");
  } else if (['.hpp', '.h', ".hh", ".H", ".hxx", ".h++"].includes(extname)) {
    fs.appendFileSync(outputFile, "/*-- #include \"" + file + "\" end --*/\n");
  }
}
