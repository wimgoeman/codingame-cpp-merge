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
    ['c', 'comment', 'Adds comments that trace how the code was merged.']
  ])
  .bindHelp()
  .parseSystem();

var workDir = opt.options['working-dir'] ? opt.options['working-dir'] : '.';
var outputFile = opt.options['output'] ? opt.options['output'] : 'merged';
var excludeDir = opt.options['exclude-dir'] ? opt.options['exclude-dir'].split(/[;,]/) : ['generated'];
var mainFile = opt.options['main-file'] ? path.join(workDir, opt.options['main-file']): null;
var trace = !!opt.options['comment'];
var mainIsProcessed = false;
var processOnce = []; //Array holds files which had '#pragma once'
var libraryIncludes = new Set(); // Array holds the names of libraries that have already been included.
var sections = [];

//Wipe file to start
fs.writeFileSync(outputFile, "");


if (mainFile) {
  processFile(mainFile, false);
  mainIsProcessed = true;
}

processDir(workDir);

const contents = sections.join('\n\n');
fs.writeFileSync(outputFile, contents + '\n');


function processDir(dir)
{
  let nodes = fs.readdirSync(dir);
  for (let i = 0; i < nodes.length; i++)
  {
    let node = nodes[i];
    let fullPath = path.join(dir, node);
    let stat = fs.statSync(fullPath);
    if (stat.isDirectory() && excludeDir.indexOf(path.basename(fullPath)) === -1) {
      processDir(fullPath);
    } else if (stat.isFile()) {
      processFile(fullPath, false);
    }
  }
}

function processFile(file, include) {
    let section = '';
    let starterSection = false;

    if (
        !(
            file === mainFile && mainIsProcessed ||
            file == outputFile
        ) &&
        processOnce.indexOf(file) === -1 && (
            isCode(file) ||
            isHeader(file) && include
        )
    ) {
        if (isCode(file)) {
            console.log('Processing ' + file);
            if (trace) {
                addLine("/*-- File: " + file + " start --*/", true);
            }
        } else {
            console.log("Including: ", file);
            if (trace) {
                addLine("/*-- #include \"" + file + "\" start --*/", true);
            }
        }

        let lines = fs.readFileSync(file, { encoding: "utf8" })
            .split("\n");
        for (let line of lines) {
            let includeMatches;
            line = line.trimRight();
            if (!line) {
                if (!starterSection) {
                    finishSection();
                }
            } else if (!!(includeMatches = line.match(/#include (["<])([^">]+)[">]/))) {
                if (includeMatches[1] === '<') {
                    let includedFile = includeMatches[2];
                    if (!libraryIncludes.has(includedFile)) {
                        libraryIncludes.add(includedFile);
                        addLine(line);
                    }
                } else {
                    let includedFile = path.join(path.dirname(file), includeMatches[2]);
                    finishSection();
                    processFile(includedFile, true);
                }
            } else if (line.indexOf("#pragma once") >= 0) {
                processOnce.push(file);
            } else {
                addLine(line);
            }
        }

        if (trace) {
            if (isCode(file)) {
                addLine("/*-- File: " + file + " end --*/");
            } else {
                addLine("/*-- #include \"" + file + "\" end --*/");
            }
        }

        finishSection();
    }

    function addLine(line, starter) {
        starterSection = starter;
        if (section) {
            section += '\n' + line;
        } else {
            section = line;
        }
    }

    function finishSection() {
        starterSection = false;
        if (section) {
            sections.push(section);
            section = '';
        }
    }

    function isCode(file) {
        const extension = path.extname(file);
        return extension === ".cpp" || extension === ".c";
    }

    function isHeader(file) {
        const extension = path.extname(file);
        return extension === ".hpp" || extension === ".h";
    }
}