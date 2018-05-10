/*-- File: main.cc start --*/
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
/*-- File: main.cc end --*/
/*-- File: hello.cpp start --*/
/*-- #include "hello.h" start --*/
/*-- #include "hello.h" end --*/

std::string hello() {
  return "hello";
}
/*-- File: hello.cpp end --*/
/*-- File: main2.cc start --*/
/*-- File: main2.cc ignored --*/
