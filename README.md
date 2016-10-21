# Automatic merger for C/C++ in the CodinGame IDE

## Install
### Prerequisites

* Node.js
* npm (part of node)

### Installation
* Clone this repo
* issue npm link
```
git clone https://github.com/wimgoeman/codingame-cpp-merge.git
cd codingame-cpp-merge
npm link
```

## Usage
This tool will scan the working dir for cpp files recursively and append them
all to a single file. While doing this, includes are processed similar to what
the preprocessor would do.

* Create a directory tree with cpp and hpp files
* Do not use other extensions than hpp and cpp (more extension support later)
* Use #include <> for libraries
* Use #include "" for local files
* Set up include guards in your hpp files, or use '#pragma once'
* Prefer pragma once over include guards to limit output size