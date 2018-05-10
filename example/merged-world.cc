/*-- File: main-world.cc start --*/
#include <iostream>
/*-- #include "world.h" start --*/
#include <string>
std::string world() {
  return "world";
}
/*-- #include "world.h" end --*/

using namespace std;

int main() {
  cout << world() << endl;
  return 0;
}
/*-- File: main-world.cc end --*/
