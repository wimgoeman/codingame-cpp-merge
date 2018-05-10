/*-- File: main-hello.cc start --*/
#include <iostream>
/*-- #include "hello.h" start --*/
#include <string>
std::string hello();
/*-- #include "hello.h" end --*/

using namespace std;

int main() {
  cout << hello() << endl;
  return 0;
}
/*-- File: main-hello.cc end --*/
/*-- File: hello.cpp start --*/
/*-- #include "hello.h" start --*/
/*-- #include "hello.h" end --*/

std::string hello() {
  return "hello";
}
/*-- File: hello.cpp end --*/
/*-- File: main-world.cc start --*/
/*-- File: main-world.cc ignored --*/
/*-- File: merged-world.cc start --*/
/*-- File: merged-world.cc ignored --*/
/*-- File: test-hello.cpp start --*/
// this is an usused large cpp file,
// or a file which needs not to be merged (e.g. file for unit test)

void unusedFunction() {
  /*






  */
}

/*-- File: test-hello.cpp end --*/
