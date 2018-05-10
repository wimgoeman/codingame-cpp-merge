# Ex 1: main-hello.cc includes hello.h,
#       which has a implementation file hello.cpp.
#       main-world.cc is ignored since it contains main definition
codingame-merge -m main-hello.cc -o merged-hello.cc

# Ex 2: main-world.cc includes world.h, a header-only library.
#       Since there is no other cpp files, --ignore-cpp can be used here.
codingame-merge -m main-world.cc --ignore-cpp -o merged-world.cc
