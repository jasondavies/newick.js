const test = require("node:test");
const assert = require("node:assert/strict");
const parse = require("../src/newick").parse;

test("parses a tree with names and branch lengths", () => {
  const tree = parse("(A: 0.1,B: 0.2,(C:0.3,D:0.4)E:0.5)F;");

  assert.equal(tree.name, "F");
  assert.equal(tree.branchset.length, 3);
  assert.deepEqual(tree.branchset[0], { name: "A", length: 0.1 });
  assert.deepEqual(tree.branchset[1], { name: "B", length: 0.2 });
  assert.deepEqual(tree.branchset[2], {
    name: "E",
    length: 0.5,
    branchset: [
      { name: "C", length: 0.3 },
      { name: "D", length: 0.4 }
    ]
  });
});

test("parses a root-only tree name", () => {
  const tree = parse("A;");
  assert.equal(tree.name, "A");
});
