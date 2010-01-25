/**
 * TO DO: Add more tests!
 */
var parse = require('../src/newick').parse;
var print = require('sys').print;

var x = parse('(A: 0.1,B: 0.2,(C:0.3,D:0.4)E:0.5)F;');
var assert = function(x) {
  if (x) {
    print(".");
  } else {
    print("F");
  }
};
assert(x.name == 'F');
assert(x.branchset.length == 3);
assert(x.branchset[0].name == 'A');
print('\n');
